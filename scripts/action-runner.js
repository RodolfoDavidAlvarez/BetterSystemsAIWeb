#!/usr/bin/env node
/**
 * Action Runner — Autonomous AI Assistant for Better Systems AI
 *
 * Runs every 30 min (cron). Scans pending action items and:
 * 1. Classifies items by type (email, call, calendar, research, manual)
 * 2. Creates Google Calendar events for items with due dates
 * 3. Drafts emails for email-type actions
 * 4. Sends Twilio SMS notifications before any external send
 * 5. Sends/cancels queued emails after 15-min approval window
 *
 * Usage:
 *   node scripts/action-runner.js              # Full run (classify + calendar + draft + send)
 *   node scripts/action-runner.js --classify   # Just classify action items
 *   node scripts/action-runner.js --calendar   # Just sync calendar events
 *   node scripts/action-runner.js --draft      # Just draft emails
 *   node scripts/action-runner.js --send       # Just process email queue (send after 15 min)
 *   node scripts/action-runner.js --digest     # Send daily digest SMS
 *   node scripts/action-runner.js --test       # Test mode: use developer@bettersystems.ai
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test');
const TEST_EMAIL = 'developer@bettersystems.ai';

// ─── Config ──────────────────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
const RODO_PHONE = process.env.RODO_PHONE_NUMBER;
const RESEND_KEY = process.env.RESEND_API_KEY;
const APPROVAL_WINDOW_MIN = 15;

// ─── Gemini AI ───────────────────────────────────────────────────────────────
async function gemini(prompt, model = 'gemini-2.5-flash') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.candidates[0].content.parts[0].text;
}

// ─── Twilio SMS ──────────────────────────────────────────────────────────────
async function sendSMS(to, body) {
  if (!TWILIO_SID || !TWILIO_TOKEN) {
    console.log('[SMS SKIP] No Twilio credentials');
    return null;
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }),
  });
  const json = await res.json();
  if (json.error_code) {
    console.error(`[SMS ERROR] ${json.error_code}: ${json.message}`);
    return null;
  }
  // Log to notifications_log
  await sql`INSERT INTO notifications_log (channel, to_number, message, type, twilio_message_sid, status)
    VALUES ('sms', ${to}, ${body}, 'alert', ${json.sid || null}, 'sent')`;
  return json.sid;
}

// ─── Resend Email ────────────────────────────────────────────────────────────
async function sendEmail(to, subject, body, htmlBody) {
  const from = 'Better Systems AI <developer@bettersystems.ai>';
  const payload = { from, to, subject, text: body };
  if (htmlBody) payload.html = htmlBody;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`[EMAIL ERROR] ${JSON.stringify(json)}`);
    return null;
  }
  return json.id;
}

// ─── 1. CLASSIFY ACTION ITEMS ───────────────────────────────────────────────
async function classifyItems() {
  const unclassified = await sql`
    SELECT id, title, description, company, project
    FROM action_items
    WHERE status = 'pending' AND action_type IS NULL
    ORDER BY id ASC
    LIMIT 50
  `;

  if (unclassified.length === 0) {
    console.log('[CLASSIFY] All items already classified');
    return;
  }

  const itemsList = unclassified.map(a =>
    `#${a.id}: "${a.title}" ${a.description ? '— ' + a.description : ''} [${a.company}${a.project ? '/' + a.project : ''}]`
  ).join('\n');

  const result = await gemini(`You are a task classifier for a business AI assistant.

Classify each action item into ONE type:
- "email" = needs to send/draft/forward an email
- "call" = needs to make a phone call
- "calendar" = needs a meeting/appointment scheduled
- "research" = needs investigation/lookup/analysis
- "purchase" = needs to buy/order something
- "delivery" = needs physical transport/delivery
- "manual" = requires physical/in-person action that can't be automated

Return ONLY a JSON array like: [{"id": 123, "type": "email"}, ...]
No explanation, just the JSON array.

Items to classify:
${itemsList}`);

  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const classifications = JSON.parse(cleaned);

    for (const c of classifications) {
      await sql`UPDATE action_items SET action_type = ${c.type}, updated_at = NOW() WHERE id = ${c.id}`;
    }
    console.log(`[CLASSIFY] Classified ${classifications.length} items`);

    // Summary
    const types = {};
    for (const c of classifications) {
      types[c.type] = (types[c.type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(types)) {
      console.log(`  ${type}: ${count}`);
    }
  } catch (e) {
    console.error('[CLASSIFY ERROR] Failed to parse Gemini response:', e.message);
  }
}

// ─── 2. CALENDAR SYNC ───────────────────────────────────────────────────────
async function syncCalendar() {
  const items = await sql`
    SELECT id, title, company, project, priority, due_date, description
    FROM action_items
    WHERE status = 'pending'
      AND due_date IS NOT NULL
      AND calendar_event_id IS NULL
    ORDER BY due_date ASC
    LIMIT 20
  `;

  if (items.length === 0) {
    console.log('[CALENDAR] No items need calendar events');
    return;
  }

  console.log(`[CALENDAR] Creating ${items.length} calendar events...`);

  // Use Calendar MCP tokens (have calendar write scope)
  const tokensPath = process.env.HOME + '/.config/google-calendar-mcp/tokens.json';
  let tokens;
  try {
    const { readFileSync } = await import('fs');
    const raw = JSON.parse(readFileSync(tokensPath, 'utf-8'));
    tokens = raw.normal || raw;
  } catch {
    console.log('[CALENDAR] No Calendar MCP tokens found. Skipped.');
    return;
  }

  if (!tokens.access_token) {
    console.log('[CALENDAR] No access token. Run Calendar MCP to re-auth.');
    return;
  }

  // Check if token expired
  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    console.log('[CALENDAR] Token expired. Use Calendar MCP to refresh.');
    return;
  }

  let created = 0;
  for (const item of items) {
    const dueDate = new Date(item.due_date);
    const summary = `${item.priority === 'urgent' ? '🔴 ' : item.priority === 'high' ? '🟠 ' : ''}${item.title}`;
    const description = [
      item.description || '',
      `Company: ${item.company || 'N/A'}`,
      item.project ? `Project: ${item.project}` : '',
      `Action Item #${item.id}`,
    ].filter(Boolean).join('\n');

    const dateStr = dueDate.toISOString().split('T')[0];
    const nextDay = new Date(dueDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endStr = nextDay.toISOString().split('T')[0];

    const event = {
      summary,
      description,
      start: { date: dateStr },
      end: { date: endStr },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 480 }] },
    };

    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (res.ok) {
        const created_event = await res.json();
        await sql`UPDATE action_items SET calendar_event_id = ${created_event.id}, updated_at = NOW() WHERE id = ${item.id}`;
        console.log(`  [CAL] #${item.id} "${item.title}" → ${dateStr}`);
        created++;
      } else {
        const err = await res.text();
        console.error(`  [CAL ERROR] #${item.id}: ${res.status}`);
        if (created === 0) { console.error(err.substring(0, 200)); break; }
      }
    } catch (e) {
      console.error(`  [CAL ERROR] #${item.id}: ${e.message}`);
    }
  }

  console.log(`[CALENDAR] Created ${created}/${items.length} events`);
}

// ─── 3. DRAFT EMAILS ────────────────────────────────────────────────────────
async function draftEmails() {
  // Find email-type actions that don't have a queue entry yet
  const emailItems = await sql`
    SELECT ai.id, ai.title, ai.description, ai.company, ai.project, ai.priority
    FROM action_items ai
    LEFT JOIN email_queue eq ON eq.action_item_id = ai.id AND eq.status NOT IN ('cancelled', 'failed')
    WHERE ai.status = 'pending'
      AND ai.action_type = 'email'
      AND eq.id IS NULL
    ORDER BY CASE ai.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END
    LIMIT 5
  `;

  if (emailItems.length === 0) {
    console.log('[DRAFT] No email actions to draft');
    return;
  }

  console.log(`[DRAFT] Drafting ${emailItems.length} emails...`);

  for (const item of emailItems) {
    // Get context from knowledge base
    const context = await sql`
      SELECT title, content FROM knowledge_base
      WHERE (project = ${item.project} OR company = ${item.company})
        AND status = 'published'
      ORDER BY updated_at DESC
      LIMIT 3
    `;

    const contextText = context.map(k => `${k.title}: ${(k.content || '').substring(0, 300)}`).join('\n');

    const prompt = `You are Rodo Alvarez's email assistant at Better Systems AI.

Draft a SHORT professional email for this action item:
- Action: "${item.title}"
- Description: ${item.description || 'None'}
- Company: ${item.company || 'N/A'}
- Project: ${item.project || 'N/A'}
- Priority: ${item.priority}

Context:
${contextText || 'No additional context available.'}

Rules:
- Plain text, conversational, short
- Sign as "Rodo Alvarez"
- Be direct and professional
- If you can't determine the recipient, use [RECIPIENT] as placeholder
- Return JSON: {"to_name": "Name", "to_email": "[RECIPIENT]", "subject": "...", "body": "..."}
- Only return the JSON, nothing else`;

    try {
      const result = await gemini(prompt);
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const draft = JSON.parse(cleaned);

      const toEmail = TEST_MODE ? TEST_EMAIL : (draft.to_email || '[RECIPIENT]');
      const scheduledAt = new Date(Date.now() + APPROVAL_WINDOW_MIN * 60 * 1000);

      await sql`
        INSERT INTO email_queue (action_item_id, to_email, to_name, subject, body, status, scheduled_send_at, company)
        VALUES (${item.id}, ${toEmail}, ${draft.to_name || null}, ${draft.subject}, ${draft.body},
          ${toEmail.includes('[RECIPIENT]') ? 'needs_recipient' : 'pending_approval'},
          ${toEmail.includes('[RECIPIENT]') ? null : scheduledAt},
          ${item.company || 'bsa'})
      `;

      console.log(`  [DRAFT] #${item.id} "${item.title}" → "${draft.subject}" to ${toEmail}`);
    } catch (e) {
      console.error(`  [DRAFT ERROR] #${item.id}: ${e.message}`);
    }
  }
}

// ─── 4. SEND APPROVED EMAILS ────────────────────────────────────────────────
async function processEmailQueue() {
  // Find emails past their approval window that haven't been cancelled
  const ready = await sql`
    SELECT id, action_item_id, to_email, to_name, subject, body, html_body
    FROM email_queue
    WHERE status = 'pending_approval'
      AND scheduled_send_at <= NOW()
    ORDER BY scheduled_send_at ASC
    LIMIT 10
  `;

  if (ready.length === 0) {
    console.log('[SEND] No emails ready to send');
    return;
  }

  console.log(`[SEND] Processing ${ready.length} approved emails...`);

  for (const email of ready) {
    const emailId = await sendEmail(email.to_email, email.subject, email.body, email.html_body);

    if (emailId) {
      await sql`UPDATE email_queue SET status = 'sent', actually_sent_at = NOW(), updated_at = NOW() WHERE id = ${email.id}`;
      if (email.action_item_id) {
        await sql`UPDATE action_items SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = ${email.action_item_id}`;
      }
      console.log(`  [SENT] "${email.subject}" → ${email.to_email}`);
    } else {
      await sql`UPDATE email_queue SET status = 'failed', updated_at = NOW() WHERE id = ${email.id}`;
      console.error(`  [FAIL] "${email.subject}" → ${email.to_email}`);
    }
  }
}

// ─── 5. NOTIFY VIA TWILIO ───────────────────────────────────────────────────
async function notifyPendingEmails() {
  // Find newly drafted emails that haven't been notified yet
  const pending = await sql`
    SELECT id, to_email, to_name, subject, action_item_id
    FROM email_queue
    WHERE status = 'pending_approval'
      AND twilio_notified_at IS NULL
    ORDER BY created_at ASC
    LIMIT 10
  `;

  if (pending.length === 0) return;

  let msg = `📧 BSA Action Runner\n${pending.length} email(s) queued:\n\n`;
  for (const e of pending) {
    msg += `• "${e.subject}" → ${e.to_name || e.to_email}\n`;
  }
  msg += `\nSending in ${APPROVAL_WINDOW_MIN} min.\nReply STOP to cancel all.\nReply CANCEL #ID to cancel one.`;

  const sid = await sendSMS(RODO_PHONE, msg);

  if (sid) {
    const ids = pending.map(e => e.id);
    await sql`UPDATE email_queue SET twilio_notified_at = NOW(), twilio_message_sid = ${sid}, updated_at = NOW() WHERE id = ANY(${ids})`;
    console.log(`[NOTIFY] SMS sent for ${pending.length} emails`);
  }
}

// ─── 6. CHECK FOR STOP/CANCEL REPLIES ────────────────────────────────────────
async function checkCancelReplies() {
  // Check recent incoming SMS from Rodo's number
  if (!TWILIO_SID || !TWILIO_TOKEN) return;

  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString().split('T')[0];
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json?To=${TWILIO_FROM}&From=${encodeURIComponent(RODO_PHONE)}&DateSent>=${since}&PageSize=20`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
      },
    });
    const json = await res.json();
    const messages = json.messages || [];

    for (const msg of messages) {
      const body = (msg.body || '').toUpperCase().trim();

      if (body === 'STOP' || body === 'STOP ALL' || body === 'CANCEL ALL') {
        // Cancel ALL pending emails
        const cancelled = await sql`
          UPDATE email_queue SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'SMS STOP', updated_at = NOW()
          WHERE status = 'pending_approval'
          RETURNING id
        `;
        if (cancelled.length > 0) {
          console.log(`[CANCEL] Cancelled ${cancelled.length} emails via STOP`);
          await sendSMS(RODO_PHONE, `✅ Cancelled ${cancelled.length} queued email(s).`);
        }
      } else if (body.startsWith('CANCEL #')) {
        const itemId = parseInt(body.replace('CANCEL #', ''));
        if (!isNaN(itemId)) {
          const cancelled = await sql`
            UPDATE email_queue SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'SMS CANCEL', updated_at = NOW()
            WHERE action_item_id = ${itemId} AND status = 'pending_approval'
            RETURNING id
          `;
          if (cancelled.length > 0) {
            console.log(`[CANCEL] Cancelled email for action #${itemId}`);
          }
        }
      }
    }
  } catch (e) {
    console.error('[CANCEL CHECK ERROR]', e.message);
  }
}

// ─── 7. DAILY DIGEST ────────────────────────────────────────────────────────
async function dailyDigest() {
  const [counts] = await sql`
    SELECT
      count(*) FILTER (WHERE status = 'pending') as pending,
      count(*) FILTER (WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < NOW()) as overdue,
      count(*) FILTER (WHERE status = 'pending' AND due_date::date = CURRENT_DATE) as due_today,
      count(*) FILTER (WHERE status = 'pending' AND action_type = 'email') as emails,
      count(*) FILTER (WHERE status = 'pending' AND action_type = 'call') as calls,
      count(*) FILTER (WHERE status = 'needs_review') as review
    FROM action_items
  `;

  const [emailQ] = await sql`
    SELECT
      count(*) FILTER (WHERE status = 'pending_approval') as queued,
      count(*) FILTER (WHERE status = 'sent' AND actually_sent_at > NOW() - INTERVAL '24 hours') as sent_24h
    FROM email_queue
  `;

  let msg = `☀️ BSA Daily Digest\n`;
  msg += `📋 ${counts.pending} pending`;
  if (counts.overdue > 0) msg += ` | ⚠️ ${counts.overdue} overdue`;
  if (counts.due_today > 0) msg += ` | 📅 ${counts.due_today} due today`;
  msg += '\n';
  if (counts.emails > 0) msg += `📧 ${counts.emails} emails to send\n`;
  if (counts.calls > 0) msg += `📞 ${counts.calls} calls to make\n`;
  if (counts.review > 0) msg += `🔍 ${counts.review} needs review\n`;
  if (emailQ.queued > 0) msg += `⏳ ${emailQ.queued} emails queued\n`;
  if (emailQ.sent_24h > 0) msg += `✅ ${emailQ.sent_24h} emails sent (24h)\n`;

  // Top 3 urgent items
  const urgent = await sql`
    SELECT title, company FROM action_items
    WHERE status = 'pending' AND priority IN ('urgent', 'high')
    ORDER BY CASE priority WHEN 'urgent' THEN 0 ELSE 1 END, due_date ASC NULLS LAST
    LIMIT 3
  `;
  if (urgent.length > 0) {
    msg += '\nTop priority:\n';
    for (const a of urgent) {
      msg += `• ${a.title} [${a.company}]\n`;
    }
  }

  await sendSMS(RODO_PHONE, msg);
  console.log('[DIGEST] Daily digest sent');
  console.log(msg);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
try {
  if (TEST_MODE) console.log('🧪 TEST MODE — emails go to developer@bettersystems.ai\n');

  if (args.includes('--classify')) {
    await classifyItems();
  } else if (args.includes('--calendar')) {
    await syncCalendar();
  } else if (args.includes('--draft')) {
    await draftEmails();
  } else if (args.includes('--send')) {
    await checkCancelReplies();
    await processEmailQueue();
  } else if (args.includes('--digest')) {
    await dailyDigest();
  } else {
    // Full run
    console.log('=== Action Runner — Full Run ===\n');
    console.log('Step 1: Classify items...');
    await classifyItems();
    console.log('\nStep 2: Sync calendar...');
    await syncCalendar();
    console.log('\nStep 3: Draft emails...');
    await draftEmails();
    console.log('\nStep 4: Notify via SMS...');
    await notifyPendingEmails();
    console.log('\nStep 5: Check for cancel replies...');
    await checkCancelReplies();
    console.log('\nStep 6: Send approved emails...');
    await processEmailQueue();
    console.log('\n=== Done ===');
  }
} catch (e) {
  console.error('FATAL:', e.message);
} finally {
  await sql.end();
}
