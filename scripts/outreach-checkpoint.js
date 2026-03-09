#!/usr/bin/env node

/**
 * Outreach Checkpoint — Daily Status Email (Multi-Campaign)
 *
 * Deterministic (NO AI) daily checkpoint that emails Rodo a quick
 * status update on all cold outreach campaigns.
 *
 * Usage:
 *   node scripts/outreach-checkpoint.js             # Send email
 *   node scripts/outreach-checkpoint.js --dry-run    # Print email instead
 *
 * Runs via launchd daily at 6 PM.
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'rodo@learnbetterai.com';
const TO_EMAIL = 'rodolfo@bettersystems.ai';
const DRY_RUN = process.argv.includes('--dry-run');

// Warm-up schedule (started Mar 6 for CRM, weight-ticket starts independently)
const WARMUP_START_CRM = new Date('2026-03-06');
const WARMUP_SCHEDULE = [
  { daysMin: 0, daysMax: 3, maxPerDay: 2, target: 'Day 4' },
  { daysMin: 4, daysMax: 7, maxPerDay: 5, target: 'Day 8' },
  { daysMin: 8, daysMax: 14, maxPerDay: 10, target: 'Day 15' },
  { daysMin: 15, daysMax: Infinity, maxPerDay: 20, target: 'steady state' },
];

function formatDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function getCampaignStats(campaign, label) {
  const total = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE campaign = ${campaign}`;
  const contacted = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'contacted' AND campaign = ${campaign}`;
  const replied = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'replied' AND campaign = ${campaign}`;
  const bounced = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'bounced' AND campaign = ${campaign}`;
  const queue = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE status = 'new' AND campaign = ${campaign}`;

  const sentToday = await sql`
    SELECT COUNT(*)::int AS count FROM leads
    WHERE last_email_sent::date = CURRENT_DATE AND campaign = ${campaign}
  `;

  const nextUp = await sql`
    SELECT first_name, last_name, company FROM leads
    WHERE email IS NOT NULL AND email != ''
      AND campaign = ${campaign}
      AND status NOT IN ('replied', 'bounced', 'unsubscribed', 'client')
      AND (
        (outreach_step = 0)
        OR (outreach_step = 1 AND last_email_sent < NOW() - INTERVAL '3 days')
        OR (outreach_step = 2 AND last_email_sent < NOW() - INTERVAL '4 days')
      )
    ORDER BY
      outreach_step ASC,
      CASE WHEN state = 'AZ' THEN 0 ELSE 1 END ASC,
      employee_count ASC NULLS LAST,
      created_at ASC
    LIMIT 2
  `;

  const replies = await sql`
    SELECT first_name, last_name, company FROM leads
    WHERE status = 'replied' AND campaign = ${campaign}
    ORDER BY updated_at DESC
    LIMIT 5
  `;

  // Warm-up info (per campaign, based on first send date)
  const firstSend = await sql`
    SELECT MIN(last_email_sent) as first FROM leads WHERE last_email_sent IS NOT NULL AND campaign = ${campaign}
  `;

  let warmupText = '';
  if (firstSend[0].first) {
    const daysSinceFirst = Math.floor((Date.now() - new Date(firstSend[0].first).getTime()) / 86400000);
    const phase = WARMUP_SCHEDULE.find(w => daysSinceFirst >= w.daysMin && daysSinceFirst <= w.daysMax);
    const nextPhase = WARMUP_SCHEDULE.find(w => daysSinceFirst < w.daysMin);
    warmupText += `- Day ${daysSinceFirst} of warm-up (${phase?.maxPerDay || 20}/day limit)\n`;
    if (nextPhase) {
      warmupText += `- Next: ${nextPhase.maxPerDay}/day at ${nextPhase.target}\n`;
    } else {
      warmupText += '- At full capacity (20/day)\n';
    }
  } else {
    warmupText += '- Not started yet (0 emails sent)\n';
  }

  // Sequence progress
  const step1 = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE outreach_step >= 1 AND campaign = ${campaign}`;
  const step2Due = await sql`
    SELECT COUNT(*)::int AS count FROM leads
    WHERE outreach_step = 1 AND last_email_sent < NOW() - INTERVAL '3 days'
      AND status NOT IN ('replied', 'bounced', 'unsubscribed', 'client')
      AND campaign = ${campaign}
  `;
  const step2Sent = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE outreach_step >= 2 AND campaign = ${campaign}`;
  const step3Due = await sql`
    SELECT COUNT(*)::int AS count FROM leads
    WHERE outreach_step = 2 AND last_email_sent < NOW() - INTERVAL '4 days'
      AND status NOT IN ('replied', 'bounced', 'unsubscribed', 'client')
      AND campaign = ${campaign}
  `;
  const complete = await sql`SELECT COUNT(*)::int AS count FROM leads WHERE outreach_step >= 3 AND campaign = ${campaign}`;

  let body = '';
  body += `--- ${label.toUpperCase()} ---\n\n`;

  body += 'Pipeline\n';
  body += `- ${total[0].count} total leads\n`;
  body += `- ${contacted[0].count} contacted (Email 1+)\n`;
  body += `- ${replied[0].count} replied\n`;
  body += `- ${bounced[0].count} bounced\n`;
  body += `- ${queue[0].count} still in queue\n`;

  body += '\nToday\n';
  body += `- Sent ${sentToday[0].count} emails\n`;
  if (nextUp.length > 0) {
    const names = nextUp.map(l => `${l.first_name} ${l.last_name} (${l.company})`).join(', ');
    body += `- Next up: ${names}\n`;
  } else {
    body += '- No leads ready right now\n';
  }

  body += '\nReplies (needs your attention)\n';
  if (replies.length > 0) {
    for (const r of replies) {
      body += `- ${r.first_name} ${r.last_name} (${r.company})\n`;
    }
  } else {
    body += '- None yet\n';
  }

  body += '\nWarm-up\n';
  body += warmupText;

  body += '\nSequence\n';
  body += `- Email 1 sent: ${step1[0].count}\n`;
  body += `- Email 2 due: ${step2Due[0].count}\n`;
  body += `- Email 2 sent: ${step2Sent[0].count}\n`;
  body += `- Email 3 due: ${step3Due[0].count}\n`;
  body += `- Sequence complete: ${complete[0].count}\n`;

  return body;
}

async function checkLowLeads() {
  const alerts = [];
  for (const [campaign, label] of [['contractor-crm', 'Contractor CRM'], ['weight-ticket', 'Weight Ticket']]) {
    const queue = await sql`
      SELECT COUNT(*)::int AS count FROM leads
      WHERE campaign = ${campaign}
        AND status NOT IN ('replied', 'bounced', 'unsubscribed', 'client')
        AND outreach_step < 3
    `;
    if (queue[0].count <= 10) {
      alerts.push(`*** ${label}: Only ${queue[0].count} leads left in queue. Time to load more from Apollo. ***`);
    }
  }
  return alerts;
}

async function buildEmail() {
  const today = new Date();

  // Check if leads are running low
  const lowLeadAlerts = await checkLowLeads();
  let urgent = '';
  if (lowLeadAlerts.length > 0) {
    urgent = lowLeadAlerts.join('\n') + '\n\n';
  }

  const subject = lowLeadAlerts.length > 0
    ? `[ACTION] Outreach — Low leads! — ${formatDate(today)}`
    : `Outreach Daily Update — ${formatDate(today)}`;

  let body = '';
  if (urgent) body += urgent;
  body += await getCampaignStats('contractor-crm', 'Contractor CRM');
  body += '\n';
  body += await getCampaignStats('weight-ticket', 'Weight Ticket');

  return { subject, body };
}

async function sendEmail(subject, body) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `Outreach Bot <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject,
      text: body
    })
  });

  const result = await res.json();
  if (result.id) {
    console.log(`Email sent: ${result.id}`);
  } else {
    console.error('Send failed:', JSON.stringify(result));
    process.exit(1);
  }
}

// --- Main ---
try {
  const { subject, body } = await buildEmail();

  if (DRY_RUN) {
    console.log('=== DRY RUN (not sending) ===\n');
    console.log(`From: ${FROM_EMAIL}`);
    console.log(`To: ${TO_EMAIL}`);
    console.log(`Subject: ${subject}\n`);
    console.log(body);
  } else {
    await sendEmail(subject, body);
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
