#!/usr/bin/env node
/**
 * Recording Indexer — Speaker ID, Auto-Tagging, Semantic Embeddings
 *
 * Processes completed recordings to:
 * 1. Identify speakers using Gemini (Speaker ID)
 * 2. Auto-tag with company, project, topics, people
 * 3. Chunk transcripts and generate embeddings for semantic search
 *
 * Usage:
 *   node scripts/index-recordings.js                  # Index unindexed recordings
 *   node scripts/index-recordings.js --all            # Re-index everything
 *   node scripts/index-recordings.js --id 210         # Index specific recording
 *   node scripts/index-recordings.js --search "query" # Semantic search
 *   node scripts/index-recordings.js --ask "question" # Ask a question across all recordings
 *   node scripts/index-recordings.js --stats          # Show indexing stats
 */

import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
if (!GEMINI_KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(1); }

const sql = postgres(DATABASE_URL);

// ─── Known People (for speaker identification) ───────────────────────

const KNOWN_PEOPLE = {
  'Rodo': { hints: 'Device owner, closest to microphone. Speaks English and Spanish. CEO of BSA and SSW.' },
  'Mike': { hints: 'Mike McMahon. Older male, advisor. Talks about farming, worms, pistachio, wine, equipment. Says "you know what I mean" often.' },
  'Oscar': { hints: 'Oscar Rodriguez. Speaks Spanish and English. Talks about trucking, Vanguard, waste diversion, operations.' },
  'Frank': { hints: 'Frank Seratch. Vanguard Renewables. Business tone, discusses pricing, dog food, waste loads, Nestle.' },
  'Kerry': { hints: 'Female. SSW team. Logistics, suppliers, ingredients, shipping, procurement. Often transcribed as "Carrie", "carry", or "Carey" by dictation.' },
  'Victoria': { hints: 'Female. SSW cash flow and accounting.' },
  'Karen': { hints: 'Female. Trucking coordinator. Discusses routes, drivers, loads, California regulations.' },
  'Simon': { hints: 'Blending expert. Discusses soil blends, gypsum, worm beds, watering schedules.' },
  'Jack': { hints: 'Jack Mendoza / 3LAG. Discusses pet food, dog food buying, waste material purchasing.' },
  'Ashley': { hints: 'Ashley Haight. Vanguard Renewables. Organics Market Manager West, Phoenix-based. PetSmart.' },
  'Jasmine': { hints: 'Jasmine Megnia. Vanguard M&A. Depackaging partnership, land opportunities.' },
  'Coy': { hints: 'Coy Cooper. SSW delivery driver, runs loads to Wilcox. Often transcribed as "Koi" or "Coi" by dictation.' },
  'Sean': { hints: 'Pistachio farm client in Wilcox AZ. May be transcribed as "Shawn".' },
  'Joe': { hints: 'Joe Roselle. UFE (Urban Farming Education). Film festival, nonprofit events.' },
  'Danny': { hints: 'Danny. Agave Fleet BSA client.' },
  'Fernando': { hints: 'Fernando. BSA prospect/demo.' },
  'Brian': { hints: 'Brian Mitchell. New Build Watch BSA client.' },
  'Juan': { hints: 'Juan. SSW client, farm/orchard work, Wilcox area.' },
  'Guy': { hints: 'Guy Quattrocchi. Soil consultant, blending expert, has Mexico worm farming contact.' },
};

// ─── Gemini API Helpers ──────────────────────────────────────────────

async function geminiChat(prompt, { temperature = 0.2, maxTokens = 8192, model = 'gemini-2.5-flash' } = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function geminiEmbed(texts) {
  // Gemini embedding API — free, 768 dimensions
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${GEMINI_KEY}`;
  const requests = texts.map(text => ({
    model: 'models/gemini-embedding-001',
    content: { parts: [{ text }] },
    taskType: 'RETRIEVAL_DOCUMENT',
    outputDimensionality: 768,
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  });
  if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.embeddings.map(e => e.values);
}

async function geminiEmbedQuery(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768,
    }),
  });
  if (!res.ok) throw new Error(`Gemini embed ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.embedding.values;
}

// ─── Speaker Identification + Auto-Tagging ───────────────────────────

const SPEAKER_TAG_PROMPT = `You are analyzing a transcription from Rodo Alvarez's Plaud recording device.

KNOWN PEOPLE (identify by voice hints and context clues):
${Object.entries(KNOWN_PEOPLE).map(([name, info]) => `- ${name}: ${info.hints}`).join('\n')}

TASK: Analyze this transcript and return JSON with:

1. **speakers**: Array of speaker objects. For each unique speaker:
   - "label": Their name if identified (from known list above), or "Unknown Speaker 1" etc.
   - "confidence": "high" (name mentioned directly), "medium" (strong context clues), "low" (guessing)

2. **diarized_segments**: Array of up to 30 key segments showing speaker turns. Each: {"speaker": "Name", "text": "what they said (1-3 sentences max)"}. Do NOT include the entire transcript. Pick the most important/actionable segments.

3. **tags**: Object with:
   - "companies": Array of companies mentioned (use "BSA" or "SSW" or full company names for external)
   - "projects": Array of project names (use canonical: "Waste Diversion Program", "Vanguard Renewables", "Wilcox Pistachio Orchard", "Amazon Account", "Cold Outreach", etc.)
   - "topics": Array of 3-8 specific topics discussed (e.g., "dog food pricing", "trucking costs", "worm farming")
   - "people": Array of all people mentioned by name
   - "urgency": "action-needed" (commitments made, deadlines), "informational" (updates, status), "casual" (social, personal)
   - "key_decisions": Array of any decisions/commitments made (1 sentence each)
   - "key_numbers": Array of any dollar amounts, quantities, dates mentioned with context (e.g., "$20/ton processing fee", "3 loads per day", "week of Jan 12")

4. **summary**: 2-3 sentence summary of what was discussed.

Return ONLY valid JSON. No markdown code blocks.`;

async function analyzeRecording(recording, profiles = []) {
  let transcript = recording.transcript;
  if (!transcript || transcript.length < 50) return null;

  // Truncate for Gemini context
  if (transcript.length > 25000) {
    transcript = transcript.substring(0, 25000) + '\n[... truncated ...]';
  }

  // Build learned speaker profiles section
  let profileContext = '';
  if (profiles.length > 0) {
    profileContext = '\n\nLEARNED SPEAKER PROFILES (from previous recordings — use these to identify speakers):\n';
    for (const p of profiles) {
      const topTopics = (p.topics || []).slice(0, 8).join(', ');
      const contacts = (p.frequent_contacts || []).slice(0, 5).join(', ');
      const style = p.speaking_style || '';
      profileContext += `- ${p.name} (${p.recording_count} recordings): Topics: ${topTopics}. Talks with: ${contacts}. ${style}\n`;
    }
  }

  const prompt = SPEAKER_TAG_PROMPT + profileContext + `\n\nRecording: "${recording.title}"
Date: ${recording.recorded_at}
Duration: ${Math.round(recording.duration_seconds / 60)} minutes

TRANSCRIPT:
${transcript}`;

  const raw = await geminiChat(prompt, { temperature: 0.1, maxTokens: 16384 });

  // Parse JSON (handle markdown wrapping, trailing commas, etc.)
  let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  // Remove trailing commas before ] or }
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to extract JSON from response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      let extracted = match[0].replace(/,\s*([\]}])/g, '$1');
      try { return JSON.parse(extracted); } catch {}
    }
    console.error(`  Failed to parse analysis for #${recording.id}:`, e.message);
    console.error(`  First 500 chars:`, cleaned.substring(0, 500));
    return null;
  }
}

// ─── Chunking for Embeddings ─────────────────────────────────────────

function chunkTranscript(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    i += chunkSize - overlap;
  }

  return chunks;
}

function chunkDiarizedTranscript(diarizedText) {
  // Split by speaker turns, then group into chunks of ~500 words
  const lines = diarizedText.split('\n').filter(l => l.trim());
  const chunks = [];
  let currentChunk = [];
  let currentWords = 0;
  let currentSpeaker = null;

  for (const line of lines) {
    const speakerMatch = line.match(/^\[([^\]]+)\]:/);
    if (speakerMatch) currentSpeaker = speakerMatch[1];

    const wordCount = line.split(/\s+/).length;

    if (currentWords + wordCount > 500 && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join('\n'),
        speaker: currentSpeaker,
      });
      currentChunk = [];
      currentWords = 0;
    }

    currentChunk.push(line);
    currentWords += wordCount;
  }

  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join('\n'),
      speaker: currentSpeaker,
    });
  }

  return chunks;
}

// ─── Index a Single Recording ────────────────────────────────────────

async function indexRecording(recording) {
  console.log(`\n📋 #${recording.id}: "${recording.title}" (${Math.round(recording.duration_seconds / 60)}min)`);

  // Step 1: Load speaker profiles for better identification
  const profiles = await sql`SELECT name, topics, vocabulary, speaking_style, frequent_contacts, companies_discussed, recording_count FROM speaker_profiles WHERE recording_count >= 2 ORDER BY recording_count DESC LIMIT 20`;

  // Step 2: Speaker ID + Auto-Tag with Gemini
  console.log(`  🧠 Analyzing speakers & tags...`);
  const analysis = await analyzeRecording(recording, profiles);
  if (!analysis) {
    console.log(`  ⏭️  Skipped (no analysis)`);
    return;
  }

  const speakers = (analysis.speakers || []).map(s => s.label).filter(Boolean);
  const tags = analysis.tags || {};
  const companies = tags.companies || [];
  const projects = tags.projects || [];
  const topics = tags.topics || [];
  const people = tags.people || [];
  const decisions = tags.key_decisions || [];
  const numbers = tags.key_numbers || [];

  console.log(`  👥 Speakers: ${speakers.join(', ')}`);
  console.log(`  🏢 Companies: ${companies.join(', ')}`);
  console.log(`  📁 Projects: ${projects.join(', ')}`);
  console.log(`  🏷️  Topics: ${topics.join(', ')}`);
  console.log(`  👤 People: ${people.join(', ')}`);
  if (decisions.length) console.log(`  ✅ Decisions: ${decisions.length}`);
  if (numbers.length) console.log(`  🔢 Numbers: ${numbers.length}`);

  // Build speaker-labeled transcript
  // Replace [Speaker N]: with [ActualName]: in the raw transcript
  const diarizedSegments = analysis.diarized_segments || [];
  let labeledTranscript = recording.transcript || '';
  const speakerMap = {};
  for (const s of (analysis.speakers || [])) {
    if (s.original_label && s.label) speakerMap[s.original_label] = s.label;
  }
  // Replace [Speaker 1]: → [Rodo]:, [Speaker 2]: → [Kerry]:, etc.
  for (const [orig, real] of Object.entries(speakerMap)) {
    labeledTranscript = labeledTranscript.replace(
      new RegExp(`\\[${orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'),
      `[${real}]`
    );
  }
  // Also handle common patterns: if transcript has unlabeled lines and we have diarized segments,
  // try to label them by matching text snippets
  if (diarizedSegments.length > 0 && !labeledTranscript.includes('[Speaker ')) {
    // Build a simple labeled version from diarized segments
    const segLines = diarizedSegments.map(seg => {
      const ts = seg.timestamp ? `[${seg.timestamp}] ` : '';
      return `${ts}[${seg.speaker}]: ${seg.text}`;
    });
    if (segLines.length > 0) {
      labeledTranscript = segLines.join('\n');
    }
  }

  // Step 2: Update recording with tags
  // Note: metadata may be array (legacy Plaud format) — overwrite with clean object
  const newMeta = {
    indexed: true,
    indexed_at: new Date().toISOString(),
    speaker_count: speakers.length,
    urgency: tags.urgency || 'informational',
    key_decisions: decisions,
    key_numbers: numbers,
    summary: analysis.summary || '',
    diarized: diarizedSegments.length > 0,
    diarized_segments: diarizedSegments.length > 0 ? diarizedSegments : undefined,
    labeled_transcript: labeledTranscript !== recording.transcript ? labeledTranscript : undefined,
  };

  await sql`
    UPDATE recordings SET
      speakers = ${speakers},
      topics = ${topics},
      people = ${people},
      companies = ${companies},
      projects = ${projects},
      metadata = ${sql.json(newMeta)}
    WHERE id = ${recording.id}
  `;
  if (diarizedSegments.length) console.log(`  💬 Stored ${diarizedSegments.length} diarized segments`);

  // Step 3: Update speaker profiles
  for (const speakerName of speakers) {
    if (!speakerName || speakerName.startsWith('Unknown') || speakerName === 'Background Singer') continue;
    try {
      const existing = await sql`SELECT * FROM speaker_profiles WHERE name = ${speakerName}`;
      if (existing.length === 0) {
        // Create new profile
        await sql`
          INSERT INTO speaker_profiles (name, topics, frequent_contacts, companies_discussed, recording_count, total_minutes, first_seen, last_seen)
          VALUES (${speakerName}, ${topics}, ${speakers.filter(s => s !== speakerName)}, ${companies}, 1, ${Math.round(recording.duration_seconds / 60)}, ${recording.recorded_at}, ${recording.recorded_at})
        `;
      } else {
        // Merge into existing profile
        const p = existing[0];
        const mergedTopics = [...new Set([...(p.topics || []), ...topics])].slice(0, 50);
        const mergedContacts = [...new Set([...(p.frequent_contacts || []), ...speakers.filter(s => s !== speakerName)])].slice(0, 30);
        const mergedCompanies = [...new Set([...(p.companies_discussed || []), ...companies])].slice(0, 20);
        const newLastSeen = new Date(recording.recorded_at) > new Date(p.last_seen) ? recording.recorded_at : p.last_seen;
        await sql`
          UPDATE speaker_profiles SET
            topics = ${mergedTopics},
            frequent_contacts = ${mergedContacts},
            companies_discussed = ${mergedCompanies},
            recording_count = recording_count + 1,
            total_minutes = total_minutes + ${Math.round(recording.duration_seconds / 60)},
            last_seen = ${newLastSeen},
            confidence_score = LEAST(1.0, confidence_score + 0.05),
            updated_at = NOW()
          WHERE name = ${speakerName}
        `;
      }
    } catch (e) {
      // Ignore profile update errors, don't break indexing
    }
  }
  console.log(`  👤 Updated ${speakers.filter(s => !s.startsWith('Unknown')).length} speaker profiles`);

  // Step 4: Chunk and embed
  console.log(`  📐 Chunking transcript...`);
  // Use plain transcript for chunking (diarized segments are just highlights)
  const rawChunks = chunkTranscript(recording.transcript).map(text => ({ text, speaker: null }));

  if (rawChunks.length === 0) {
    console.log(`  ⏭️  No chunks to embed`);
    return;
  }

  // Delete old chunks for this recording
  await sql`DELETE FROM recording_chunks WHERE recording_id = ${recording.id}`;

  // Embed in batches of 20 (Gemini limit)
  const BATCH_SIZE = 20;
  let totalChunks = 0;

  for (let i = 0; i < rawChunks.length; i += BATCH_SIZE) {
    const batch = rawChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map(c => {
      // Prefix with context for better retrieval
      const prefix = `Recording: ${recording.title} (${new Date(recording.recorded_at).toISOString().split('T')[0]}). `;
      return prefix + c.text;
    });

    console.log(`  🔢 Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rawChunks.length / BATCH_SIZE)} (${batch.length} chunks)...`);

    const embeddings = await geminiEmbed(texts);

    // Insert chunks with embeddings
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const embedding = embeddings[j];
      const vecStr = `[${embedding.join(',')}]`;

      await sql`
        INSERT INTO recording_chunks (recording_id, chunk_index, content, speaker, topics, company, project, people, embedding, metadata)
        VALUES (
          ${recording.id},
          ${i + j},
          ${chunk.text},
          ${chunk.speaker},
          ${topics},
          ${companies[0] || null},
          ${projects[0] || null},
          ${people},
          ${vecStr}::vector,
          ${JSON.stringify({
            urgency: tags.urgency,
            recorded_at: recording.recorded_at,
            title: recording.title,
          })}
        )
      `;
      totalChunks++;
    }

    // Rate limit: small pause between batches
    if (i + BATCH_SIZE < rawChunks.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`  ✅ Indexed: ${totalChunks} chunks, ${speakers.length} speakers, ${topics.length} topics`);
}

// ─── Semantic Search ─────────────────────────────────────────────────

async function semanticSearch(query, { limit = 10, company = null, speaker = null, project = null } = {}) {
  console.log(`\n🔍 Searching: "${query}"\n`);

  const queryEmbedding = await geminiEmbedQuery(query);
  const vecStr = `[${queryEmbedding.join(',')}]`;

  let results;
  if (company || speaker || project) {
    results = await sql`
      SELECT rc.*, r.title as recording_title, r.recorded_at,
        1 - (rc.embedding <=> ${vecStr}::vector) as similarity
      FROM recording_chunks rc
      JOIN recordings r ON r.id = rc.recording_id
      WHERE (${company}::text IS NULL OR rc.company = ${company})
        AND (${speaker}::text IS NULL OR rc.speaker = ${speaker})
        AND (${project}::text IS NULL OR rc.project = ${project})
      ORDER BY rc.embedding <=> ${vecStr}::vector
      LIMIT ${limit}
    `;
  } else {
    results = await sql`
      SELECT rc.*, r.title as recording_title, r.recorded_at,
        1 - (rc.embedding <=> ${vecStr}::vector) as similarity
      FROM recording_chunks rc
      JOIN recordings r ON r.id = rc.recording_id
      ORDER BY rc.embedding <=> ${vecStr}::vector
      LIMIT ${limit}
    `;
  }

  if (results.length === 0) {
    console.log('No results found.');
    return [];
  }

  for (const r of results) {
    const date = new Date(r.recorded_at).toLocaleDateString('en-US', { timeZone: 'America/Phoenix' });
    const sim = (r.similarity * 100).toFixed(1);
    console.log(`━━━ ${sim}% match │ #${r.recording_id} │ ${date} │ ${r.recording_title}`);
    if (r.speaker) console.log(`    Speaker: ${r.speaker}`);
    // Show content, truncated
    const content = r.content.substring(0, 300).replace(/\n/g, '\n    ');
    console.log(`    ${content}${r.content.length > 300 ? '...' : ''}`);
    console.log();
  }

  return results;
}

// ─── Ask a Question (RAG) ────────────────────────────────────────────

async function askQuestion(question, { limit = 8 } = {}) {
  console.log(`\n💬 Question: "${question}"\n`);

  // Get relevant chunks
  const queryEmbedding = await geminiEmbedQuery(question);
  const vecStr = `[${queryEmbedding.join(',')}]`;

  const results = await sql`
    SELECT rc.content, rc.speaker, rc.topics, r.title as recording_title, r.recorded_at,
      1 - (rc.embedding <=> ${vecStr}::vector) as similarity
    FROM recording_chunks rc
    JOIN recordings r ON r.id = rc.recording_id
    ORDER BY rc.embedding <=> ${vecStr}::vector
    LIMIT ${limit}
  `;

  if (results.length === 0) {
    console.log('No relevant recordings found.');
    return;
  }

  // Build context for Gemini
  const context = results.map((r, i) => {
    const date = new Date(r.recorded_at).toLocaleDateString('en-US', { timeZone: 'America/Phoenix' });
    return `--- Source ${i + 1}: ${r.recording_title} (${date}) [${(r.similarity * 100).toFixed(0)}% match] ---
${r.speaker ? `Speaker: ${r.speaker}` : ''}
${r.content}`;
  }).join('\n\n');

  const prompt = `You are Rodo Alvarez's AI assistant. Answer this question using ONLY the recording excerpts below. Be specific, cite which recording/date the info comes from. If the answer isn't in the sources, say so.

QUESTION: ${question}

RECORDING EXCERPTS:
${context}

Answer concisely with specific facts, names, numbers, and dates from the sources:`;

  const answer = await geminiChat(prompt, { temperature: 0.1, maxTokens: 2048 });
  console.log(answer);
  return answer;
}

// ─── Stats ───────────────────────────────────────────────────────────

async function showStats() {
  const [counts] = await sql`
    SELECT
      (SELECT count(*) FROM recordings WHERE transcription_status = 'completed') as total_recordings,
      (SELECT count(*) FROM recordings WHERE metadata->>'indexed' = 'true') as indexed_recordings,
      (SELECT count(*) FROM recording_chunks) as total_chunks,
      (SELECT count(DISTINCT recording_id) FROM recording_chunks) as recordings_with_chunks,
      (SELECT count(DISTINCT speaker) FROM recording_chunks WHERE speaker IS NOT NULL) as unique_speakers
  `;

  const topSpeakers = await sql`
    SELECT speaker, count(*) as chunks FROM recording_chunks
    WHERE speaker IS NOT NULL
    GROUP BY speaker ORDER BY chunks DESC LIMIT 10
  `;

  const topTopics = await sql`
    SELECT unnest(topics) as topic, count(*) as mentions FROM recording_chunks
    WHERE topics IS NOT NULL
    GROUP BY topic ORDER BY mentions DESC LIMIT 15
  `;

  console.log('\n📊 Indexing Stats\n');
  console.log(`Recordings: ${counts.indexed_recordings}/${counts.total_recordings} indexed`);
  console.log(`Chunks: ${counts.total_chunks} total`);
  console.log(`Unique speakers: ${counts.unique_speakers}`);

  if (topSpeakers.length) {
    console.log('\n👥 Top Speakers:');
    topSpeakers.forEach(s => console.log(`  ${s.speaker}: ${s.chunks} chunks`));
  }

  if (topTopics.length) {
    console.log('\n🏷️  Top Topics:');
    topTopics.forEach(t => console.log(`  ${t.topic}: ${t.mentions} mentions`));
  }
}

// ─── Main ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--search')) {
  const query = args[args.indexOf('--search') + 1];
  const company = args.includes('--company') ? args[args.indexOf('--company') + 1] : null;
  const speaker = args.includes('--speaker') ? args[args.indexOf('--speaker') + 1] : null;
  const project = args.includes('--project') ? args[args.indexOf('--project') + 1] : null;
  await semanticSearch(query, { company, speaker, project });
  await sql.end();
  process.exit(0);
}

if (args.includes('--ask')) {
  const question = args[args.indexOf('--ask') + 1];
  await askQuestion(question);
  await sql.end();
  process.exit(0);
}

if (args.includes('--stats')) {
  await showStats();
  await sql.end();
  process.exit(0);
}

// Index mode
const specificId = args.includes('--id') ? parseInt(args[args.indexOf('--id') + 1]) : null;
const indexAll = args.includes('--all');
const limitIdx = args.indexOf('--limit');
const maxRecordings = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : null;

let recordings;
if (specificId) {
  recordings = await sql`
    SELECT id, title, transcript, recorded_at, duration_seconds
    FROM recordings WHERE id = ${specificId} AND transcription_status = 'completed'
  `;
} else if (indexAll) {
  recordings = await sql`
    SELECT id, title, transcript, recorded_at, duration_seconds
    FROM recordings WHERE transcription_status = 'completed'
    AND transcript IS NOT NULL AND length(transcript) > 100
    ORDER BY id ASC
    ${maxRecordings ? sql`LIMIT ${maxRecordings}` : sql``}
  `;
} else {
  // Only unindexed
  recordings = await sql`
    SELECT id, title, transcript, recorded_at, duration_seconds
    FROM recordings WHERE transcription_status = 'completed'
    AND transcript IS NOT NULL AND length(transcript) > 100
    AND (metadata IS NULL OR metadata->>'indexed' IS NULL OR metadata->>'indexed' != 'true')
    ORDER BY id ASC
    ${maxRecordings ? sql`LIMIT ${maxRecordings}` : sql``}
  `;
}

console.log(`\n🚀 Indexing ${recordings.length} recording(s)...\n`);

let success = 0, failed = 0;
for (const rec of recordings) {
  try {
    await indexRecording(rec);
    success++;
    // Rate limit between recordings
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {
    console.error(`  ❌ Failed #${rec.id}: ${e.message}`);
    failed++;
  }
}

console.log(`\n━━━ Done: ${success} indexed, ${failed} failed ━━━`);
await sql.end();
