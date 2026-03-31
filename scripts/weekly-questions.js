#!/usr/bin/env node
/**
 * Weekly Questions — Monday Plaud Recording Guide
 *
 * Sends an SMS every Monday at 7 AM with 5-7 personalized questions
 * for Rodo to answer during a Plaud recording session (walk/drive).
 * Questions are generated from: overdue items, calendar, unanswered threads,
 * revenue targets vs. actual, and current project state.
 *
 * Usage:
 *   node scripts/weekly-questions.js           # Generate and send
 *   node scripts/weekly-questions.js --test    # Preview without sending
 *   node scripts/weekly-questions.js --email   # Send as email instead of SMS
 *
 * Runs via launchd: Monday 7:00 AM Phoenix time
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test');
const EMAIL_MODE = args.includes('--email');

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
const RODO_PHONE = process.env.RODO_PHONE_NUMBER;
const RESEND_KEY = process.env.RESEND_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendSMS(body) {
  if (TEST_MODE) { console.log(`[SMS PREVIEW]\n${body}`); return; }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: RODO_PHONE, From: TWILIO_FROM, Body: body }),
  });
  const json = await res.json();
  if (json.error_code) console.error(`[SMS ERROR] ${json.error_code}: ${json.message}`);
  else console.log(`[SMS] Sent (${json.sid})`);

  await sql`INSERT INTO notifications_log (channel, to_number, message, type, twilio_message_sid, status)
    VALUES ('sms', ${RODO_PHONE}, ${body}, 'weekly_questions', ${json.sid || null}, 'sent')`;
}

async function sendEmail(subject, body) {
  if (TEST_MODE) { console.log(`[EMAIL PREVIEW] ${subject}\n${body}`); return; }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'BSA Weekly <developer@bettersystems.ai>',
      to: 'rodolfo@bettersystems.ai',
      subject,
      text: body,
    }),
  });
}

async function gemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = await res.json();
  return json.candidates[0].content.parts[0].text;
}

// ─── Gather Context ──────────────────────────────────────────────────────────

async function gatherContext() {
  // 1. Overdue items
  const overdue = await sql`
    SELECT title, company, project, due_date,
      EXTRACT(DAY FROM NOW() - due_date)::int as days_overdue
    FROM action_items
    WHERE status = 'pending' AND due_date < NOW()
    ORDER BY due_date ASC LIMIT 10
  `;

  // 2. This week's items
  const thisWeek = await sql`
    SELECT title, company, project, due_date
    FROM action_items
    WHERE status = 'pending'
      AND due_date >= NOW()
      AND due_date <= NOW() + INTERVAL '7 days'
    ORDER BY due_date ASC LIMIT 10
  `;

  // 3. Pending email actions (unanswered threads)
  const emailActions = await sql`
    SELECT title, company, project,
      EXTRACT(DAY FROM NOW() - created_at)::int as days_old
    FROM action_items
    WHERE status = 'pending' AND action_type = 'email'
    ORDER BY created_at ASC LIMIT 5
  `;

  // 4. Stats
  const [counts] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as total_pending,
      COUNT(*) FILTER (WHERE status = 'pending' AND company = 'BSA') as bsa_pending,
      COUNT(*) FILTER (WHERE status = 'pending' AND company = 'SSW') as ssw_pending,
      COUNT(*) FILTER (WHERE status = 'completed' AND updated_at > NOW() - INTERVAL '7 days') as completed_week
    FROM action_items
  `;

  // 5. Recent recordings (last 7 days) — what was discussed
  const recentTopics = await sql`
    SELECT title FROM recordings
    WHERE transcription_status = 'completed'
      AND recorded_at > NOW() - INTERVAL '7 days'
    ORDER BY recorded_at DESC LIMIT 10
  `;

  // 6. Revenue context (from knowledge base)
  const revenueContext = await sql`
    SELECT title, content FROM knowledge_base
    WHERE (category = 'decision' OR category = 'context')
      AND updated_at > NOW() - INTERVAL '14 days'
    ORDER BY updated_at DESC LIMIT 5
  `;

  return { overdue, thisWeek, emailActions, counts, recentTopics, revenueContext };
}

// ─── Generate Questions ──────────────────────────────────────────────────────

async function generateQuestions(context) {
  const { overdue, thisWeek, emailActions, counts, recentTopics, revenueContext } = context;

  const overdueText = overdue.map(a => `- ${a.title} [${a.company}] ${a.days_overdue}d overdue`).join('\n');
  const weekText = thisWeek.map(a => `- ${a.title} [${a.company}] due ${new Date(a.due_date).toLocaleDateString()}`).join('\n');
  const emailText = emailActions.map(a => `- ${a.title} [${a.company}] ${a.days_old}d old`).join('\n');
  const topicsText = recentTopics.map(r => `- ${r.title}`).join('\n');
  const kbText = revenueContext.map(k => `- ${k.title}: ${(k.content || '').substring(0, 100)}`).join('\n');

  const prompt = `You are Rodo Alvarez's AI business advisor. Generate 7 SHORT questions for his Monday morning Plaud recording session. He answers while walking or driving — conversational and SPECIFIC.

PRIORITY FRAMEWORK (this is how Rodo operates):
1. SALES & REVENUE — his #1 focus. Closing deals, collections, pricing, new opportunities.
2. OPERATIONS — delegated to team. He only needs to know if something is blocked.
   • Kerry = logistics, suppliers, procurement, shipping
   • Gabriela = design, signage, Amazon
   • Jonathan = packaging, labeling
   • Luis = waste operations
   • Sabrina = Phoenix operations
3. Questions should push him toward REVENUE-GENERATING actions, not ops busywork.

Current state:
- ${counts.total_pending} pending items (${counts.bsa_pending} BSA, ${counts.ssw_pending} SSW)
- ${counts.completed_week} completed last week
- BSA target: $20K/mo ARR (currently ~$0/mo collected in 2026)
- SSW target: $50K/mo (active revenue from Vanguard, Amazon, clients)
- SSW outstanding: ~$34K collectible (FOTG $20K, Vanguard $11K, 3LAG $3K)

Overdue items:
${overdueText || 'None'}

This week's due:
${weekText || 'Nothing specific'}

Unanswered emails:
${emailText || 'None'}

Recent recordings (what was discussed):
${topicsText || 'None'}

Recent decisions:
${kbText || 'None'}

Rules:
- Questions must be SPECIFIC to his actual situation (reference real client names, real numbers)
- Mix: 3 sales/revenue/collection questions, 1 delegation check ("is Kerry blocked on anything?"), 1 strategic, 1 new opportunity, 1 wildcard
- NEVER ask generic questions like "what are your goals" or "how do you feel about progress"
- Each question max 20 words
- Number them 1-7
- No preamble, just the numbered list`;

  const result = await gemini(prompt);
  return result.trim();
}

// ─── Main ────────────────────────────────────────────────────────────────────

try {
  console.log(`=== Weekly Questions — ${new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })} ===\n`);

  const context = await gatherContext();
  console.log(`Context: ${context.counts.total_pending} pending, ${context.overdue.length} overdue, ${context.thisWeek.length} this week\n`);

  const questions = await generateQuestions(context);
  console.log('Generated questions:\n');
  console.log(questions);

  // Build message
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/Phoenix' });
  let smsMsg = `🎙️ Weekly Priorities — ${today}\n\nHit record and answer these:\n\n${questions}`;

  // SMS is 1600 char max (Twilio). If over, split or send email
  if (smsMsg.length > 1500 || EMAIL_MODE) {
    const emailBody = `Weekly Priority Questions — ${today}\n${'='.repeat(50)}\n\n`;
    const fullBody = emailBody +
      `Record your answers on Plaud. The system will auto-extract action items.\n\n` +
      questions + '\n\n' +
      `--- Context ---\n` +
      `Pending: ${context.counts.total_pending} (BSA: ${context.counts.bsa_pending}, SSW: ${context.counts.ssw_pending})\n` +
      `Completed last week: ${context.counts.completed_week}\n` +
      `Overdue: ${context.overdue.length}\n` +
      `This week: ${context.thisWeek.length}\n`;

    await sendEmail(`🎙️ Weekly Priorities — ${today}`, fullBody);

    // Still send short SMS
    smsMsg = `🎙️ Weekly Priorities sent to email.\n${context.overdue.length} overdue, ${context.thisWeek.length} due this week.\nHit record!`;
    await sendSMS(smsMsg);
  } else {
    await sendSMS(smsMsg);
  }

  console.log('\n=== Done ===');
} catch (e) {
  console.error('FATAL:', e.message);
  console.error(e.stack);
} finally {
  await sql.end();
}
