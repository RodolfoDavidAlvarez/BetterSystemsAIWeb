#!/usr/bin/env node
/**
 * Fetch Context Briefing — Called on Claude Code / OpenClaw startup
 *
 * Queries the local database directly (no API needed when running locally)
 * and outputs a markdown context briefing to stdout.
 *
 * Usage:
 *   node scripts/fetch-context.js                # Full briefing
 *   node scripts/fetch-context.js --project "Desert Moon CRM"  # Project-specific
 *   node scripts/fetch-context.js --actions      # Just pending action items
 *   node scripts/fetch-context.js --compact      # One-page summary
 *   node scripts/fetch-context.js --write        # Pull latest briefing and write to CONTEXT_BRIEFING.md
 */

import 'dotenv/config';
import postgres from 'postgres';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }

const sql = postgres(DATABASE_URL);
const args = process.argv.slice(2);

async function fullBriefing() {
  // Get latest snapshot
  const [snapshot] = await sql`
    SELECT briefing, generated_at FROM context_snapshots
    ORDER BY generated_at DESC LIMIT 1
  `;

  if (snapshot?.briefing) {
    const age = Date.now() - new Date(snapshot.generated_at).getTime();
    const hoursOld = Math.round(age / (1000 * 60 * 60));

    if (hoursOld < 24) {
      console.log(snapshot.briefing);
      return;
    }
    console.log(`⚠️ Briefing is ${hoursOld}h old. Run 'node scripts/context-generator.js --briefing' to refresh.\n`);
  }

  // Generate live briefing
  const pendingActions = await sql`
    SELECT id, title, company, project, priority, due_date
    FROM action_items WHERE status = 'pending'
    ORDER BY CASE WHEN due_date IS NOT NULL AND due_date < NOW() THEN 0 ELSE 1 END,
    CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    due_date ASC NULLS LAST
  `;

  const reviewItems = await sql`
    SELECT id, title, company, project, priority, due_date
    FROM action_items WHERE status = 'needs_review'
    ORDER BY created_at DESC
  `;

  const recentRecordings = await sql`
    SELECT id, title, recorded_at, duration_seconds, metadata
    FROM recordings WHERE transcription_status = 'completed'
    ORDER BY recorded_at DESC LIMIT 5
  `;

  console.log(`# Live Context — ${new Date().toISOString().split('T')[0]}\n`);

  // Show overdue first
  const overdue = pendingActions.filter(a => a.due_date && new Date(a.due_date) < new Date());
  if (overdue.length > 0) {
    console.log(`## ⚠️ Overdue (${overdue.length})\n`);
    for (const a of overdue) {
      const due = new Date(a.due_date).toISOString().split('T')[0];
      const proj = a.project ? ` [${a.project}]` : '';
      console.log(`- [${a.priority.toUpperCase()}] ${a.title}${proj} — was due ${due} (${a.company})`);
    }
    console.log('');
  }

  const active = pendingActions.filter(a => !a.due_date || new Date(a.due_date) >= new Date());
  if (active.length > 0) {
    console.log(`## Pending Actions (${active.length})\n`);
    for (const a of active) {
      const due = a.due_date ? ` — due ${new Date(a.due_date).toISOString().split('T')[0]}` : '';
      const proj = a.project ? ` [${a.project}]` : '';
      console.log(`- [${a.priority.toUpperCase()}] ${a.title}${proj}${due} (${a.company})`);
    }
    console.log('');
  }

  if (reviewItems.length > 0) {
    console.log(`## Needs Review (${reviewItems.length} new items from recordings)\n`);
    for (const a of reviewItems) {
      const proj = a.project ? ` [${a.project}]` : '';
      console.log(`- ${a.title}${proj} (${a.company})`);
    }
    console.log('');
  }

  if (recentRecordings.length > 0) {
    console.log(`## Recent Recordings\n`);
    for (const r of recentRecordings) {
      const date = new Date(r.recorded_at).toISOString().split('T')[0];
      const src = r.metadata?.source === 'google-meet' ? ' [Google Meet]' : '';
      console.log(`- ${date}: ${r.title} (${Math.round(r.duration_seconds / 60)}min)${src}`);
    }
  }
}

async function projectContext(projectName) {
  const kb = await sql`
    SELECT title, content, content_type, category, updated_at
    FROM knowledge_base WHERE project = ${projectName} AND status = 'published'
    ORDER BY pinned DESC, updated_at DESC
  `;

  const actions = await sql`
    SELECT id, title, status, priority, due_date
    FROM action_items WHERE project = ${projectName}
    ORDER BY status ASC, CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
  `;

  console.log(`# Project Context: ${projectName}\n`);

  if (actions.length > 0) {
    console.log(`## Action Items\n`);
    for (const a of actions) {
      const check = a.status === 'completed' ? 'x' : ' ';
      const due = a.due_date ? ` (due ${new Date(a.due_date).toISOString().split('T')[0]})` : '';
      console.log(`- [${check}] [${a.priority}] ${a.title}${due}`);
    }
    console.log('');
  }

  if (kb.length > 0) {
    console.log(`## Knowledge Base (${kb.length} entries)\n`);
    for (const k of kb) {
      console.log(`### ${k.title} (${k.content_type})`);
      // Show first 500 chars of content
      const preview = k.content?.substring(0, 500) || '';
      console.log(preview);
      if (k.content?.length > 500) console.log('...\n');
      else console.log('');
    }
  }
}

async function actionsOnly() {
  const today = new Date().toISOString().split('T')[0];

  // Deduplicated pending items — DISTINCT ON prevents showing dupes
  const actions = await sql`
    SELECT DISTINCT ON (LOWER(title)) id, title, company, project, priority, due_date, assigned_to, status
    FROM action_items WHERE status IN ('pending', 'needs_review')
    ORDER BY LOWER(title),
    CASE status WHEN 'pending' THEN 0 WHEN 'needs_review' THEN 1 END,
    id DESC
  `;

  // Re-sort by priority after dedup
  const sorted = actions.sort((a, b) => {
    // Status: pending first
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    // Overdue first
    const aOverdue = a.due_date && new Date(a.due_date) < new Date() ? 0 : 1;
    const bOverdue = b.due_date && new Date(b.due_date) < new Date() ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    // Priority
    const pMap = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (pMap[a.priority] !== pMap[b.priority]) return (pMap[a.priority] || 3) - (pMap[b.priority] || 3);
    // Due date
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
    return a.due_date ? -1 : 1;
  });

  const pending = sorted.filter(a => a.status !== 'needs_review');
  const review = sorted.filter(a => a.status === 'needs_review');

  console.log(`# Action Items — ${today} — ${pending.length} pending, ${review.length} needs review\n`);

  // Show overdue section first
  const overdue = pending.filter(a => a.due_date && new Date(a.due_date) < new Date());
  if (overdue.length > 0) {
    console.log(`## ⚠️ Overdue (${overdue.length})\n`);
    for (const a of overdue) {
      const due = new Date(a.due_date).toISOString().split('T')[0];
      const daysLate = Math.round((Date.now() - new Date(a.due_date).getTime()) / 86400000);
      const proj = a.project ? ` [${a.project}]` : '';
      console.log(`- [${a.priority.toUpperCase()}] ${a.title}${proj} — ${daysLate}d late (was due ${due})`);
    }
    console.log('');
  }

  // Group non-overdue pending by company
  const active = pending.filter(a => !a.due_date || new Date(a.due_date) >= new Date());
  const byCompany = {};
  for (const a of active) {
    const key = a.company || 'Other';
    if (!byCompany[key]) byCompany[key] = [];
    byCompany[key].push(a);
  }

  for (const [company, items] of Object.entries(byCompany)) {
    console.log(`## ${company}\n`);
    for (const a of items) {
      const due = a.due_date ? ` — due ${new Date(a.due_date).toISOString().split('T')[0]}` : '';
      const proj = a.project ? ` [${a.project}]` : '';
      console.log(`- [${a.priority.toUpperCase()}] ${a.title}${proj}${due}`);
    }
    console.log('');
  }

  if (review.length > 0) {
    console.log(`## Needs Review (${review.length} — from recent recordings)\n`);
    for (const a of review.slice(0, 20)) {
      const proj = a.project ? ` [${a.project}]` : '';
      console.log(`- ${a.title}${proj} (${a.company})`);
    }
    if (review.length > 20) console.log(`  ... and ${review.length - 20} more`);
    console.log('');
  }
}

async function compactBriefing() {
  const today = new Date().toISOString().split('T')[0];

  const urgentActions = await sql`
    SELECT DISTINCT ON (LOWER(title)) title, company, project, due_date FROM action_items
    WHERE status = 'pending' AND (priority = 'urgent' OR priority = 'high')
    ORDER BY LOWER(title), id DESC
    LIMIT 15
  `;

  const [counts] = await sql`
    SELECT
      (SELECT COUNT(DISTINCT LOWER(title)) FROM action_items WHERE status = 'pending') as pending,
      (SELECT COUNT(*) FROM recordings WHERE recorded_at > NOW() - INTERVAL '3 days') as recent_recs,
      (SELECT COUNT(*) FROM action_items WHERE status = 'pending' AND due_date < NOW()) as overdue
  `;

  console.log(`📋 ${today} | ${counts.pending} pending | ${counts.overdue} overdue | ${counts.recent_recs} recordings (3d)`);
  if (urgentActions.length > 0) {
    console.log(`\n🔴 Priority:`);
    for (const a of urgentActions) {
      const overdue = a.due_date && new Date(a.due_date) < new Date() ? ' ⚠️' : '';
      console.log(`  → ${a.title} [${a.company}${a.project ? '/' + a.project : ''}]${overdue}`);
    }
  }
}

async function writeBriefing() {
  const [snapshot] = await sql`
    SELECT briefing, generated_at FROM context_snapshots
    ORDER BY generated_at DESC LIMIT 1
  `;

  if (!snapshot?.briefing) {
    console.log('No briefing found in DB');
    return;
  }

  const homeDir = process.env.HOME || '/Users/rodolfoalvarez';
  const dir = join(homeDir, '.claude', 'projects', '-Users-rodolfoalvarez', 'memory');
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, 'CONTEXT_BRIEFING.md');
  await writeFile(filePath, snapshot.briefing, 'utf-8');

  const age = Math.round((Date.now() - new Date(snapshot.generated_at).getTime()) / 60000);
  console.log(`Briefing written (${age}m old) → ${filePath}`);
}

try {
  if (args.includes('--write')) {
    await writeBriefing();
  } else if (args.includes('--project')) {
    const idx = args.indexOf('--project');
    await projectContext(args[idx + 1]);
  } else if (args.includes('--actions')) {
    await actionsOnly();
  } else if (args.includes('--compact')) {
    await compactBriefing();
  } else {
    await fullBriefing();
  }
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await sql.end();
}
