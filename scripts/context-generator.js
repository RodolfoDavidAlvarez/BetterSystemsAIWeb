#!/usr/bin/env node
/**
 * Context Generator — Context Engineering System
 *
 * Generates context snapshots from recordings, KB entries, and action items.
 * Extracts action items from transcripts using OpenAI.
 * Produces startup briefings for Claude Code / OpenClaw.
 *
 * Usage:
 *   node scripts/context-generator.js                # Generate daily briefing
 *   node scripts/context-generator.js --extract      # Extract action items from new transcripts
 *   node scripts/context-generator.js --full         # Extract + generate briefing
 *   node scripts/context-generator.js --seed-logs    # Import PROJECT_LOG.md files into KB
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFile, readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const BUSINESS_ROOT = join(PROJECT_ROOT, '..');
const SSW_ROOT = join(BUSINESS_ROOT, '..', 'Soil Seed and Water');

const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!DATABASE_URL) { console.error('Missing DATABASE_URL in .env'); process.exit(1); }
if (!GEMINI_KEY) { console.error('Missing GEMINI_API_KEY in .env'); process.exit(1); }

const sql = postgres(DATABASE_URL);

// ─── Project Canon (alias → canonical name mapping) ─────────────────

const PROJECT_CANON = {
  // BSA Projects
  "Bubba's New Home Guide": { aliases: ["bubba", "brian mitchell", "new build watch", "mitch's map", "new home guide"], company: 'BSA' },
  "Desert Moon CRM": { aliases: ["desert moon", "crm", "micah", "desert moon lighting", "independent solar"], company: 'BSA' },
  "Agave Fleet Management": { aliases: ["agave fleet", "agavefleet", "fleet management", "alexandra rosales"], company: 'BSA' },
  "Better Systems AI Website": { aliases: ["bettersystems", "bsa website", "better systems website"], company: 'BSA' },
  "CompostDeveloper SaaS": { aliases: ["compostdeveloper", "compost developer", "composting saas"], company: 'BSA' },
  "Cold Outreach": { aliases: ["cold outreach", "cold email", "learnbetterai", "apollo"], company: 'BSA' },
  "USCC National Database": { aliases: ["uscc", "national database", "composting council", "chris snow"], company: 'BSA' },
  "Personal Branding": { aliases: ["itsrodo", "personal branding", "rodo alvarez brand"], company: 'BSA' },
  "Context Engineering": { aliases: ["context engine", "context system", "plaud", "recording pipeline", "action hub"], company: 'BSA' },
  "Desert Moon Water Solutions": { aliases: ["water solutions", "linda johnson", "desert moon water"], company: 'BSA' },
  // SSW Projects
  "Justtap Wholesale Platform": { aliases: ["justtap", "wholesale platform", "wholesale website"], company: 'SSW' },
  "Wilcox Pistachio Orchard": { aliases: ["pistachio", "wilcox", "shawn", "pistachios", "pistachio orchard"], company: 'SSW' },
  "Vanguard Renewables": { aliases: ["vanguard", "casey", "congress", "vanguard renewables"], company: 'SSW' },
  "Jack Mendoza - 3LAG": { aliases: ["jack", "3lag", "mendoza", "jack mendoza"], company: 'SSW' },
  "Willcox Vineyard": { aliases: ["vineyard", "willcox vineyard"], company: 'SSW' },
  "Waste Diversion Program": { aliases: ["waste diversion", "waste program", "tipping fee"], company: 'SSW' },
  "AZCC": { aliases: ["azcc", "composting council az", "arizona composting council"], company: 'SSW' },
  "Organic Soil Wholesale": { aliases: ["wholesale", "organic soil", "soil wholesale", "garden soil"], company: 'SSW' },
  "UFE Partnership": { aliases: ["ufe", "urban farming", "stewardship"], company: 'SSW' },
  "Comdata Management": { aliases: ["comdata", "fuel card", "comdata card"], company: 'SSW' },
  "Northbound Logistics": { aliases: ["backhaul", "brad", "trucking", "northbound"], company: 'SSW' },
  "Gypsum Blending": { aliases: ["gypsum", "gypsum blending", "calcium sulfate"], company: 'SSW' },
  "Potting Soil Production": { aliases: ["potting soil", "potting mix", "soil production"], company: 'SSW' },
  "Extractor Application": { aliases: ["extractor", "extract", "compost extract", "alfalfa extract"], company: 'SSW' },
  "Amazon Account": { aliases: ["amazon", "astroid", "simon's gold", "amazon listings"], company: 'SSW' },
  "Parker Dairy Signage": { aliases: ["signage", "parker dairy", "loading zone sign"], company: 'SSW' },
};

/**
 * Normalize a project name using the canon.
 * Returns { project, company } or null if no match.
 */
function normalizeProject(rawProject) {
  if (!rawProject) return null;
  const lower = rawProject.toLowerCase().trim();

  // Direct match on canonical name
  if (PROJECT_CANON[rawProject]) {
    return { project: rawProject, company: PROJECT_CANON[rawProject].company };
  }

  // Search aliases
  for (const [canonical, config] of Object.entries(PROJECT_CANON)) {
    if (canonical.toLowerCase() === lower) return { project: canonical, company: config.company };
    for (const alias of config.aliases) {
      if (alias === lower || lower.includes(alias) || alias.includes(lower)) {
        return { project: canonical, company: config.company };
      }
    }
  }
  return null;
}

// ─── Word Overlap Dedup (from Action Hub's build-data.cjs) ──────────

/**
 * Calculate word overlap between two strings.
 * Returns a ratio 0-1 of how many words overlap.
 */
function wordOverlap(a, b) {
  if (!a || !b) return 0;
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const wordsA = new Set(normalize(a));
  const wordsB = new Set(normalize(b));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) { if (wordsB.has(w)) overlap++; }
  return overlap / Math.min(wordsA.size, wordsB.size);
}

const DEDUP_WORD_OVERLAP_THRESHOLD = 0.6; // Lowered from 0.78 — catches more near-dupes like "Provide credit card" vs "Give credit card"

// ─── Recording Metadata Indexing ────────────────────────────────────

const KNOWN_CONTACTS = [
  'Kerry', 'Mike', 'Micah', 'Brian', 'Tyler', 'Shawn', 'Juan', 'Alexandra',
  'Victoria', 'Casey', 'Jack', 'Linda', 'Chris', 'Brad', 'Simon', 'Kevin',
  'Don', 'Dani', 'Gabriela', 'Iván', 'Ivan', 'Astroid',
];

/**
 * Infer recording metadata from title and transcript.
 * Returns { contact, call_type, company, topics }.
 */
function inferRecordingMetadata(title, transcript) {
  const meta = { contact: null, call_type: 'Discussion', company: 'BSA', topics: [] };

  // Infer contact from title
  const titleLower = (title || '').toLowerCase();
  const withMatch = title?.match(/(?:Call|Meeting|Conversation|Discussion)\s+with\s+(\w+)/i);
  if (withMatch) {
    meta.contact = withMatch[1];
  } else {
    // Check known contacts in title
    for (const name of KNOWN_CONTACTS) {
      if (titleLower.includes(name.toLowerCase())) {
        meta.contact = name;
        break;
      }
    }
  }

  // Infer call type
  if (/solo\s*notes/i.test(title)) meta.call_type = 'Solo Notes';
  else if (/meeting/i.test(title)) meta.call_type = 'Meeting';
  else if (/call\s+with/i.test(title)) meta.call_type = 'Call';
  else if (/conversation/i.test(title)) meta.call_type = 'Conversation';
  else if (/brainstorm/i.test(title)) meta.call_type = 'Brainstorm';
  else if (/personal/i.test(title)) meta.call_type = 'Personal';

  // Infer company from keywords in title + first 2000 chars of transcript
  const searchText = (title || '') + ' ' + (transcript || '').substring(0, 2000);
  const sswKeywords = ['soil', 'compost', 'orchard', 'pistachio', 'gypsum', 'vineyard', 'mulch', 'extract', 'garden', 'tote', 'potting', 'signage', 'parker dairy', 'trucking', 'backhaul', 'waste diversion', 'vanguard', 'kerry', 'juan', 'alfalfa', 'worm casting'];
  const bsaKeywords = ['website', 'crm', 'invoice', 'stripe', 'vercel', 'database', 'api', 'software', 'dev', 'code', 'deploy', 'fleet', 'agave', 'desert moon', 'brian', 'bubba'];

  let sswScore = 0, bsaScore = 0;
  const searchLower = searchText.toLowerCase();
  for (const kw of sswKeywords) { if (searchLower.includes(kw)) sswScore++; }
  for (const kw of bsaKeywords) { if (searchLower.includes(kw)) bsaScore++; }
  if (sswScore > bsaScore) meta.company = 'SSW';
  else if (bsaScore > sswScore) meta.company = 'BSA';
  if (/personal/i.test(title)) meta.company = 'Personal';

  return meta;
}

// ─── Gemini Chat Completion (free tier) ──────────────────────────────

async function chatCompletion(systemPrompt, userMessage, model = 'gemini-2.5-flash') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt + "\n\n" + userMessage }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.candidates[0].content.parts[0].text;
}

// ─── Action Item Extraction ─────────────────────────────────────────

const EXTRACT_SYSTEM_PROMPT = `You are a highly selective action item extractor for Rodo Alvarez, who runs two companies:
- BSA (Better Systems AI) — AI automation, custom software development
- SSW (Soil Seed & Water) — organic soil products, agriculture, waste diversion

YOUR #1 RULE: Be extremely selective. Most recordings produce ZERO action items. That's fine.

Only extract an action item if it meets ALL of these criteria:
1. It is a CONCRETE commitment — someone agreed to do something specific
2. It has a CLEAR next step — "send X", "build Y", "invoice Z", "call W", "schedule meeting with..."
3. It is BUSINESS-RELEVANT — directly relates to BSA clients, SSW operations, revenue, deliverables, or partnerships
4. It was EXPLICITLY stated — not implied, not a vague intention, not "I should probably..."

DO NOT extract:
- Personal/household tasks (cleaning, errands, family logistics)
- Vague intentions ("we should look into...", "maybe we could...")
- Self-improvement reminders ("stop doing X", "be better at Y")
- Things that have already been done in the conversation
- Observations or opinions stated as facts
- Anything from casual/social conversation
- Tech troubleshooting steps (testing audio, debugging devices)

For valid items, identify:
1. title: Brief imperative action (e.g., "Send invoice to Mike")
2. description: Context from the conversation
3. assigned_to: Who should do it (Rodo, or the person's name)
4. company: "BSA" or "SSW"
5. project: Specific project name if mentioned
6. priority: "urgent" (deadline this week), "high" (deadline soon or money involved), "medium" (standard), "low" (nice-to-have)
7. due_date: ISO date if mentioned, null otherwise

Also generate a short descriptive title for the recording (3-8 words). Format examples:
- "Call with Kerry — Orchard Logistics"
- "Meeting with Mike — CRM Demo"
- "Solo Notes — Invoice Follow-ups"
- "Personal — Household Planning"
If personal/non-business, prefix with "Personal —".

Return JSON:
{
  "suggested_title": "Call with Kerry — Orchard Logistics",
  "action_items": [],
  "decisions": [
    { "title": "...", "description": "..." }
  ],
  "topics_discussed": ["topic1", "topic2"],
  "people_mentioned": ["name1", "name2"]
}

IMPORTANT: An empty action_items array is the CORRECT response for most recordings. Only include items that Rodo would actually put on his to-do list and follow up on.
HARD LIMIT: Return a MAXIMUM of 5 action items per recording. If you find more than 5, keep only the 5 most important/urgent ones. Quality over quantity — 2 clear items beats 10 vague ones.
If the transcript is in Spanish, still extract items in English.`;

async function extractActionItems(recordingId) {
  const [recording] = await sql`
    SELECT id, title, transcript, summary, duration_seconds, recorded_at
    FROM recordings WHERE id = ${recordingId} AND transcript IS NOT NULL
  `;
  if (!recording) {
    console.log(`  ⏭️  Recording ${recordingId} has no transcript, skipping`);
    return null;
  }

  // Skip personal recordings — still generate title but no action items
  const isPersonal = /personal\s*—/i.test(recording.title);
  if (isPersonal) {
    console.log(`  ⏭️  Skipping personal recording: "${recording.title}"`);
    // Still auto-title if needed, but skip extraction
    const isTimestampTitle = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(recording.title);
    await sql`
      UPDATE recordings SET metadata = CASE WHEN jsonb_typeof(COALESCE(metadata, '{}'::jsonb)) = 'object' THEN COALESCE(metadata, '{}'::jsonb) ELSE '{}'::jsonb END || ${JSON.stringify({
        extraction_done: true,
        extraction_date: new Date().toISOString(),
        action_items_count: 0,
        decisions_count: 0,
        skipped_reason: 'personal',
      })}::jsonb
      WHERE id = ${recordingId}
    `;
    return null;
  }

  // Truncate very long transcripts to fit in context window
  let transcript = recording.transcript;
  if (transcript.length > 30000) {
    transcript = transcript.substring(0, 30000) + '\n\n[... transcript truncated for processing ...]';
  }

  // Fetch existing items (pending + recently completed/dismissed) for dedup
  const existingItems = await sql`
    SELECT title, status FROM action_items
    WHERE (status IN ('pending', 'in_progress')
       OR (status IN ('completed', 'dismissed') AND updated_at > NOW() - INTERVAL '30 days'))
    ORDER BY id DESC LIMIT 500
  `;
  const existingList = existingItems.map(i => i.title).join(', ');

  const userMsg = `Recording: "${recording.title}"
Date: ${recording.recorded_at}
Duration: ${Math.round(recording.duration_seconds / 60)} minutes

Transcript:
${transcript}

${recording.summary ? `Summary from Plaud:\n${recording.summary}` : ''}

EXISTING ACTION ITEMS (do NOT create duplicates of these):
${existingList || 'None'}`;

  console.log(`  🧠 Extracting from "${recording.title}" (${Math.round(recording.duration_seconds / 60)}min)...`);

  const raw = await chatCompletion(EXTRACT_SYSTEM_PROMPT, userMsg);

  // Parse JSON from response (handle markdown code blocks)
  let parsed;
  try {
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.log(`  ⚠️  Failed to parse extraction for recording ${recordingId}`);
    return null;
  }

  // Insert action items (with word-overlap dedup + project normalization)
  // Hard cap: max 5 items per recording
  const actionItems = (parsed.action_items || []).slice(0, 5);
  let inserted = 0;
  for (const item of actionItems) {
    // Skip personal items entirely
    if ((item.company || '').toLowerCase() === 'personal') continue;

    // Normalize project name via canon
    const normalized = normalizeProject(item.project);
    const projectName = normalized?.project || item.project || null;
    const company = normalized?.company || item.company || 'BSA';

    // Word-overlap dedup: check against ALL existing items (pending + recently closed)
    let isDuplicate = false;
    for (const ex of existingItems) {
      const overlap = wordOverlap(item.title, ex.title);
      if (overlap >= DEDUP_WORD_OVERLAP_THRESHOLD) {
        console.log(`  ⏭️  Skipping duplicate (${Math.round(overlap * 100)}% overlap): "${item.title}" ≈ "${ex.title}"`);
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) continue;

    // Also check exact case-insensitive match
    const exactMatch = await sql`
      SELECT id FROM action_items
      WHERE status IN ('pending', 'in_progress')
      AND LOWER(title) = LOWER(${item.title})
      LIMIT 1
    `;
    if (exactMatch.length > 0) {
      console.log(`  ⏭️  Skipping exact duplicate: "${item.title}"`);
      continue;
    }

    await sql`
      INSERT INTO action_items (title, description, assigned_to, company, project, priority, due_date, recording_id, source, status, created_at, updated_at)
      VALUES (
        ${item.title},
        ${item.description || ''},
        ${item.assigned_to || 'Rodo'},
        ${company},
        ${projectName},
        ${item.priority || 'medium'},
        ${item.due_date || null},
        ${recordingId},
        'recording-extraction',
        'needs_review',
        NOW(), NOW()
      )
    `;
    inserted++;
  }

  // Insert decisions as KB entries
  for (const decision of (parsed.decisions || [])) {
    await sql`
      INSERT INTO knowledge_base (title, content, content_type, company, category, recording_id, source, status, tags, created_at, updated_at)
      VALUES (
        ${decision.title},
        ${decision.description || ''},
        'decision',
        'BSA',
        'decisions',
        ${recordingId},
        'recording-extraction',
        'published',
        ${parsed.topics_discussed || []},
        NOW(), NOW()
      )
    `;
  }

  // Auto-title: if recording has a timestamp-only title, update with generated title
  const isTimestampTitle = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(recording.title);
  if (parsed.suggested_title && isTimestampTitle) {
    const date = recording.recorded_at
      ? new Date(recording.recorded_at).toISOString().split('T')[0]
      : recording.title.substring(0, 10);
    const newTitle = `${date} — ${parsed.suggested_title}`;
    await sql`UPDATE recordings SET title = ${newTitle} WHERE id = ${recordingId}`;
    console.log(`  📝 Titled: "${newTitle}"`);
  }

  // Index recording metadata (contact, call_type, company, topics)
  const recMeta = inferRecordingMetadata(
    parsed.suggested_title || recording.title,
    recording.transcript
  );

  // Mark recording as having been processed for extraction + indexed
  await sql`
    UPDATE recordings SET metadata = CASE WHEN jsonb_typeof(COALESCE(metadata, '{}'::jsonb)) = 'object' THEN COALESCE(metadata, '{}'::jsonb) ELSE '{}'::jsonb END || ${JSON.stringify({
      extraction_done: true,
      extraction_date: new Date().toISOString(),
      action_items_count: parsed.action_items?.length || 0,
      decisions_count: parsed.decisions?.length || 0,
      topics: parsed.topics_discussed || [],
      people: parsed.people_mentioned || [],
      contact: recMeta.contact,
      call_type: recMeta.call_type,
      company: recMeta.company,
    })}::jsonb
    WHERE id = ${recordingId}
  `;

  console.log(`  ✅ ${inserted} action items, ${parsed.decisions?.length || 0} decisions extracted`);
  return parsed;
}

// ─── Auto-Cleanup: dismiss stale + auto-promote reviewed items ──────

async function cleanupActionItems() {
  console.log('\n🧹 Cleaning up action items...');

  // 1. Auto-dismiss: pending items overdue by 14+ days
  const dismissed = await sql`
    UPDATE action_items SET status = 'dismissed', updated_at = NOW()
    WHERE status = 'pending'
    AND due_date < NOW() - INTERVAL '14 days'
    RETURNING id, title
  `;
  if (dismissed.length > 0) {
    console.log(`  🗑️  Auto-dismissed ${dismissed.length} stale items (overdue >14 days):`);
    for (const d of dismissed) console.log(`     - ${d.title}`);
  }

  // 2. Auto-promote: needs_review items older than 3 days become pending
  //    (gives you time to review, then auto-promotes if you haven't dismissed them)
  const promoted = await sql`
    UPDATE action_items SET status = 'pending', updated_at = NOW()
    WHERE status = 'needs_review'
    AND created_at < NOW() - INTERVAL '3 days'
    RETURNING id, title
  `;
  if (promoted.length > 0) {
    console.log(`  ⬆️  Auto-promoted ${promoted.length} reviewed items to pending`);
  }

  // 3. Stats
  const [stats] = await sql`
    SELECT
      count(*) FILTER (WHERE status = 'needs_review') as review,
      count(*) FILTER (WHERE status = 'pending') as pending,
      count(*) FILTER (WHERE status = 'pending' AND due_date < NOW()) as overdue
    FROM action_items
  `;
  console.log(`  📊 Status: ${stats.review} needs review, ${stats.pending} pending (${stats.overdue} overdue)\n`);
}

async function cleanupActionItems() {
  // 1. Auto-dismiss pending items older than 7 days (if not done by now, they're dead)
  const stale = await sql`
    UPDATE action_items SET status = 'dismissed', updated_at = NOW()
    WHERE status = 'pending' AND created_at < NOW() - INTERVAL '7 days'
    RETURNING id
  `;
  if (stale.length > 0) console.log(`  🧹 Auto-dismissed ${stale.length} stale items (>7 days old)`);

  // 2. Auto-dismiss needs_review items older than 3 days (unconfirmed AI extractions)
  const unreviewed = await sql`
    UPDATE action_items SET status = 'dismissed', updated_at = NOW()
    WHERE status = 'needs_review' AND created_at < NOW() - INTERVAL '3 days'
    RETURNING id
  `;
  if (unreviewed.length > 0) console.log(`  🧹 Auto-dismissed ${unreviewed.length} unreviewed items (>3 days old)`);

  // 3. Promote needs_review to pending after 1 day (auto-confirm)
  const promoted = await sql`
    UPDATE action_items SET status = 'pending', updated_at = NOW()
    WHERE status = 'needs_review' AND created_at < NOW() - INTERVAL '1 day'
    RETURNING id
  `;
  if (promoted.length > 0) console.log(`  📋 Auto-promoted ${promoted.length} items to pending`);
}

async function extractAllPending() {
  // Run cleanup before extraction
  await cleanupActionItems();

  console.log('\n🧠 Extracting action items from unprocessed transcripts...');

  const recordings = await sql`
    SELECT id, title FROM recordings
    WHERE transcript IS NOT NULL
    AND transcription_status = 'completed'
    AND (metadata IS NULL OR metadata->>'extraction_done' IS NULL)
    ORDER BY recorded_at DESC
  `;

  console.log(`Found ${recordings.length} recordings to process.`);

  for (const rec of recordings) {
    try {
      await extractActionItems(rec.id);
    } catch (e) {
      console.log(`  ❌ Error processing recording ${rec.id}: ${e.message}`);
    }
  }

  console.log('✅ Extraction complete.\n');
}

// ─── Recording Title Generator ───────────────────────────────────────

const TITLE_SYSTEM_PROMPT = `Generate a short descriptive title (3-8 words) for an audio recording based on its transcript.

Format examples:
- "Call with Kerry — Orchard Logistics"
- "Meeting with Mike — CRM Demo"
- "Team Standup — Sprint Planning"
- "Solo Notes — Invoice Follow-ups"
- "Call with Tyler — QB Payments"
- "Personal — Household Planning"

Rules:
- If people are mentioned, include the primary person's first name
- Use "Call with [Name]" for phone/video calls, "Meeting with [Name]" for in-person
- If solo recording (monologue/notes), use "Solo Notes — [Topic]"
- Keep it concise — the date will be prepended separately
- If personal/non-business, prefix with "Personal —"

Return ONLY the title text, nothing else.`;

async function generateTitle(recordingId) {
  const [recording] = await sql`
    SELECT id, title, transcript, summary, duration_seconds, recorded_at
    FROM recordings WHERE id = ${recordingId} AND transcript IS NOT NULL
  `;
  if (!recording) return null;

  // Use first 3000 chars of transcript (enough for title generation)
  const snippet = (recording.transcript || '').substring(0, 3000);
  if (!snippet.trim()) return null;

  const userMsg = `Duration: ${Math.round(recording.duration_seconds / 60)} minutes\n\nTranscript excerpt:\n${snippet}`;
  const title = await chatCompletion(TITLE_SYSTEM_PROMPT, userMsg);
  return title.replace(/^["']|["']$/g, '').trim();
}

async function retitleAll() {
  console.log('\n📝 Retitling recordings with timestamp-only names...');

  const recordings = await sql`
    SELECT id, title, recorded_at FROM recordings
    WHERE transcript IS NOT NULL
    AND title ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
    AND title NOT LIKE '%—%'
    ORDER BY recorded_at DESC
  `;

  console.log(`Found ${recordings.length} recordings to retitle.\n`);

  for (const rec of recordings) {
    try {
      const suggestedTitle = await generateTitle(rec.id);
      if (!suggestedTitle) {
        console.log(`  ⏭️  #${rec.id} — no transcript, skipping`);
        continue;
      }
      const date = rec.recorded_at
        ? new Date(rec.recorded_at).toISOString().split('T')[0]
        : rec.title.substring(0, 10);
      const newTitle = `${date} — ${suggestedTitle}`;
      await sql`UPDATE recordings SET title = ${newTitle} WHERE id = ${rec.id}`;
      console.log(`  ✅ #${rec.id}: "${newTitle}"`);
    } catch (e) {
      console.log(`  ❌ #${rec.id}: ${e.message}`);
    }
  }

  console.log('\n✅ Retitling complete.\n');
}

// ─── Context Briefing Generator ─────────────────────────────────────

async function generateBriefing() {
  console.log('\n📋 Generating context briefing...');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // ── Gather data (compact queries) ──

  const pendingActions = await sql`
    SELECT title, company, project, priority, due_date
    FROM action_items
    WHERE status IN ('pending', 'in_progress')
    AND company != 'Personal'
    ORDER BY
      CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      due_date ASC NULLS LAST
    LIMIT 60
  `;

  const recentRecordings = await sql`
    SELECT title, recorded_at, duration_seconds, metadata
    FROM recordings
    WHERE transcription_status = 'completed'
    AND recorded_at > NOW() - INTERVAL '7 days'
    ORDER BY recorded_at DESC LIMIT 10
  `;

  const recentDecisions = await sql`
    SELECT title, content, company, project
    FROM knowledge_base
    WHERE content_type = 'decision' AND status = 'published'
    AND created_at > NOW() - INTERVAL '14 days'
    ORDER BY created_at DESC LIMIT 10
  `;

  // ── Build compact briefing ──

  let briefing = `# Context Briefing — ${dateStr}\n\n`;
  briefing += `> Auto-generated every 15 min. ${pendingActions.length} active tasks across BSA & SSW.\n\n`;

  // Urgent/High — one line each, no descriptions
  const urgent = pendingActions.filter(a => a.priority === 'urgent' || a.priority === 'high');
  if (urgent.length > 0) {
    briefing += `## Priority Tasks\n\n`;
    for (const a of urgent) {
      const due = a.due_date ? ` — due ${new Date(a.due_date).toISOString().split('T')[0]}` : '';
      const proj = a.project ? ` (${a.project})` : '';
      briefing += `- **${a.company}**: ${a.title}${proj}${due}\n`;
    }
    briefing += '\n';
  }

  // Remaining tasks — grouped by company, one line each
  const medium = pendingActions.filter(a => a.priority === 'medium' || a.priority === 'low');
  if (medium.length > 0) {
    briefing += `## Other Tasks\n\n`;
    const byCompany = {};
    for (const a of medium) {
      const key = a.company || 'Other';
      if (!byCompany[key]) byCompany[key] = [];
      byCompany[key].push(a);
    }
    for (const [company, items] of Object.entries(byCompany)) {
      briefing += `**${company}**: `;
      briefing += items.map(a => a.title).join(' · ');
      briefing += '\n\n';
    }
  }

  // Recent decisions — compact
  if (recentDecisions.length > 0) {
    briefing += `## Recent Decisions\n\n`;
    for (const d of recentDecisions) {
      briefing += `- ${d.title}: ${(d.content || '').substring(0, 120)}\n`;
    }
    briefing += '\n';
  }

  // Recent recordings — enriched with indexed metadata
  if (recentRecordings.length > 0) {
    briefing += `## Recent Recordings (last 7 days)\n\n`;
    for (const r of recentRecordings) {
      const date = r.recorded_at ? new Date(r.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '?';
      const dur = `${Math.round(r.duration_seconds / 60)}m`;
      const callType = r.metadata?.call_type || '';
      const contact = r.metadata?.contact || '';
      const company = r.metadata?.company || '';
      const topics = (r.metadata?.topics || []).slice(0, 3).join(', ');
      const extra = [callType, contact ? `with ${contact}` : '', company, topics].filter(Boolean).join(' · ');
      briefing += `- ${date} — ${r.title || 'Untitled'} (${dur})${extra ? ' [' + extra + ']' : ''}\n`;
    }
    briefing += '\n';
  }

  // Store the snapshot
  await sql`
    INSERT INTO context_snapshots (title, briefing, snapshot_type, metadata, generated_at, created_at)
    VALUES (
      ${'Daily Briefing — ' + dateStr},
      ${briefing},
      'daily',
      ${JSON.stringify({ action_count: pendingActions.length, recording_count: recentRecordings.length })}::jsonb,
      NOW(), NOW()
    )
  `;

  // Also write to file for Claude Code auto-loading (skip on VPS)
  const homeDir = process.env.HOME || '/Users/rodolfoalvarez';
  const contextFile = join(homeDir, '.claude', 'projects', '-Users-rodolfoalvarez', 'memory', 'CONTEXT_BRIEFING.md');
  try {
    await writeFile(contextFile, briefing, 'utf-8');
    console.log(`📄 Written to: ${contextFile}`);
  } catch {
    // On VPS the path doesn't exist — DB storage is sufficient
  }

  console.log(`✅ Briefing generated: ${pendingActions.length} actions, ${recentDecisions.length} decisions`);
  console.log(`💾 Stored in context_snapshots table\n`);

  return briefing;
}

// ─── Project Log Importer ───────────────────────────────────────────

async function seedProjectLogs() {
  console.log('\n📂 Scanning for PROJECT_LOG.md files...');

  const projectDirs = [
    // ── BSA Projects ──
    { root: 'BSA', path: 'Brian Mitchell - New Build Watch', company: 'BSA', project: "Bubba's New Home Guide", client: 'Brian Mitchell' },
    { root: 'BSA', path: 'Proposal CRM System', company: 'BSA', project: 'Desert Moon CRM', client: 'Desert Moon Lighting' },
    { root: 'BSA', path: 'Agavefleet.com', company: 'BSA', project: 'Agave Fleet Management', client: 'Agave Environmental' },
    { root: 'BSA', path: 'www.BetterSystems.ai', company: 'BSA', project: 'Better Systems AI Website', client: null },
    { root: 'BSA', path: 'www.CompostDeveloper.com', company: 'BSA', project: 'CompostDeveloper SaaS', client: null },
    { root: 'BSA', path: 'Justtap.net', company: 'SSW', project: 'Justtap Wholesale Platform', client: null },
    { root: 'BSA', path: 'Cold Outreach System', company: 'BSA', project: 'Cold Outreach', client: null },
    { root: 'BSA', path: 'USCC National Database', company: 'BSA', project: 'USCC National Database', client: 'USCC' },
    { root: 'BSA', path: 'Personal Branding - itsRodo Alvarez', company: 'BSA', project: 'Personal Branding', client: null },
    { root: 'BSA', path: 'Chandler-Gilbert Community College', company: 'BSA', project: 'Chandler-Gilbert CC', client: null },
    // ── SSW Client Projects ──
    { root: 'SSW', path: 'Clients/Shawn - Wilcox Pistachio Project', company: 'SSW', project: 'Wilcox Pistachio Orchard', client: 'Shawn' },
    { root: 'SSW', path: 'Clients/Vanguard Renewables', company: 'SSW', project: 'Vanguard Renewables', client: 'Vanguard Renewables' },
    { root: 'SSW', path: 'Clients/Jack Mendoza - 3LAG', company: 'SSW', project: 'Jack Mendoza - 3LAG', client: 'Jack Mendoza' },
    { root: 'SSW', path: 'Clients/Willcox Vineyard Project', company: 'SSW', project: 'Willcox Vineyard', client: null },
    { root: 'SSW', path: 'Clients/Flower of the Gods', company: 'SSW', project: 'Flower of the Gods', client: null },
    // ── SSW Operations ──
    { root: 'SSW', path: 'Waste diversion Project', company: 'SSW', project: 'Waste Diversion Program', client: null },
    { root: 'SSW', path: 'AZCC', company: 'SSW', project: 'AZCC', client: null },
    { root: 'SSW', path: 'Organic Soil Wholesale', company: 'SSW', project: 'Organic Soil Wholesale', client: null },
    { root: 'SSW', path: 'UFE Partnership', company: 'SSW', project: 'UFE Partnership', client: null },
    { root: 'SSW', path: 'Parker Dairy Signage Dev', company: 'SSW', project: 'Parker Dairy Signage', client: null },
    { root: 'SSW', path: 'Vineyard Project', company: 'SSW', project: 'Vineyard Project', client: null },
    { root: 'SSW', path: 'Orchards Project Visulizer', company: 'SSW', project: 'Orchard Visualizer', client: null },
  ];

  let imported = 0;

  const resolveRoot = (dir) => dir.root === 'SSW' ? SSW_ROOT : BUSINESS_ROOT;

  for (const dir of projectDirs) {
    const logPath = join(resolveRoot(dir), dir.path, 'PROJECT_LOG.md');
    try {
      const content = await readFile(logPath, 'utf-8');
      if (!content.trim()) continue;

      // Check if already imported
      const existing = await sql`
        SELECT id FROM knowledge_base WHERE source = 'project-log' AND project = ${dir.project} LIMIT 1
      `;
      if (existing.length > 0) {
        console.log(`  ⏭️  ${dir.project} — already imported`);
        continue;
      }

      await sql`
        INSERT INTO knowledge_base (title, content, content_type, company, project, category, source, status, pinned, created_at, updated_at)
        VALUES (
          ${dir.project + ' — Project Log'},
          ${content},
          'project-log',
          ${dir.company},
          ${dir.project},
          'project-logs',
          'project-log',
          'published',
          true,
          NOW(), NOW()
        )
      `;
      console.log(`  ✅ Imported ${dir.project} (${Math.round(content.length / 1024)}KB)`);
      imported++;
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.log(`  ⏭️  ${dir.project} — no PROJECT_LOG.md found`);
      } else {
        console.log(`  ❌ ${dir.project}: ${e.message}`);
      }
    }
  }

  // Also scan for LOG.md (some projects use LOG.md instead of PROJECT_LOG.md)
  for (const dir of projectDirs) {
    const logPath = join(resolveRoot(dir), dir.path, 'LOG.md');
    try {
      const content = await readFile(logPath, 'utf-8');
      if (!content.trim()) continue;

      const existing = await sql`
        SELECT id FROM knowledge_base WHERE source = 'project-log' AND project = ${dir.project} LIMIT 1
      `;
      if (existing.length > 0) continue; // Already imported via PROJECT_LOG.md or LOG.md

      await sql`
        INSERT INTO knowledge_base (title, content, content_type, company, project, category, source, status, pinned, created_at, updated_at)
        VALUES (
          ${dir.project + ' — Project Log'},
          ${content},
          'project-log',
          ${dir.company},
          ${dir.project},
          'project-logs',
          'project-log',
          'published',
          true,
          NOW(), NOW()
        )
      `;
      console.log(`  ✅ Imported ${dir.project} LOG.md (${Math.round(content.length / 1024)}KB)`);
      imported++;
    } catch (e) {
      if (e.code !== 'ENOENT') console.log(`  ❌ ${dir.project} LOG.md: ${e.message}`);
    }
  }

  // Also scan for CLIENT_LOG.md files
  for (const dir of projectDirs) {
    if (!dir.client) continue;
    const logPath = join(resolveRoot(dir), dir.path, 'CLIENT_LOG.md');
    try {
      const content = await readFile(logPath, 'utf-8');
      if (!content.trim()) continue;

      const existing = await sql`
        SELECT id FROM knowledge_base WHERE source = 'client-log' AND project = ${dir.project} LIMIT 1
      `;
      if (existing.length > 0) {
        console.log(`  ⏭️  ${dir.project} Client Log — already imported`);
        continue;
      }

      await sql`
        INSERT INTO knowledge_base (title, content, content_type, company, project, category, source, status, pinned, created_at, updated_at)
        VALUES (
          ${dir.client + ' — Client Interaction Log'},
          ${content},
          'client-log',
          ${dir.company},
          ${dir.project},
          'client-logs',
          'client-log',
          'published',
          true,
          NOW(), NOW()
        )
      `;
      console.log(`  ✅ Imported ${dir.client} client log (${Math.round(content.length / 1024)}KB)`);
      imported++;
    } catch (e) {
      if (e.code !== 'ENOENT') console.log(`  ❌ ${dir.project} client log: ${e.message}`);
    }
  }

  // Import _CONTEXT.md files
  for (const dir of projectDirs) {
    const ctxPath = join(resolveRoot(dir), dir.path, '_CONTEXT.md');
    try {
      const content = await readFile(ctxPath, 'utf-8');
      if (!content.trim()) continue;

      const existing = await sql`
        SELECT id FROM knowledge_base WHERE source = 'context-file' AND project = ${dir.project} LIMIT 1
      `;
      if (existing.length > 0) continue;

      await sql`
        INSERT INTO knowledge_base (title, content, content_type, company, project, category, source, status, pinned, created_at, updated_at)
        VALUES (
          ${dir.project + ' — Current Context'},
          ${content},
          'context',
          ${dir.company},
          ${dir.project},
          'project-context',
          'context-file',
          'published',
          true,
          NOW(), NOW()
        )
      `;
      console.log(`  ✅ Imported ${dir.project} context (${Math.round(content.length / 1024)}KB)`);
      imported++;
    } catch (e) {
      if (e.code !== 'ENOENT') console.log(`  ❌ ${dir.project} context: ${e.message}`);
    }
  }

  console.log(`\n✅ Imported ${imported} project files into knowledge_base.\n`);
}

// ─── Main ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args[0] || '--full';

try {
  if (mode === '--extract') {
    await extractAllPending();
  } else if (mode === '--briefing') {
    await generateBriefing();
  } else if (mode === '--retitle') {
    await retitleAll();
  } else if (mode === '--seed-logs') {
    await seedProjectLogs();
  } else if (mode === '--cleanup') {
    await cleanupActionItems();
  } else if (mode === '--full') {
    await extractAllPending();
    await generateBriefing();
  } else {
    console.log('Usage:');
    console.log('  node scripts/context-generator.js              # Extract + generate briefing');
    console.log('  node scripts/context-generator.js --extract    # Extract action items only');
    console.log('  node scripts/context-generator.js --briefing   # Generate briefing only');
    console.log('  node scripts/context-generator.js --cleanup    # Dismiss stale + promote reviewed items');
    console.log('  node scripts/context-generator.js --retitle    # Generate titles for timestamp-only recordings');
    console.log('  node scripts/context-generator.js --seed-logs  # Import PROJECT_LOG.md files');
  }
} catch (e) {
  console.error('Fatal error:', e);
} finally {
  await sql.end();
}
