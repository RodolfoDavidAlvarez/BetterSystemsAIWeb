#!/usr/bin/env node
/**
 * Smart Alerts — Proactive Notification Engine
 *
 * Event-driven triggers that monitor business state and alert via SMS/email.
 * SMS-first: reply YES to approve drafted follow-ups, SKIP to ignore.
 *
 * Usage:
 *   node scripts/smart-alerts.js              # Full scan (all triggers)
 *   node scripts/smart-alerts.js --overdue    # Just overdue alerts
 *   node scripts/smart-alerts.js --emails     # Just unanswered email check
 *   node scripts/smart-alerts.js --payments   # Just payment monitoring
 *   node scripts/smart-alerts.js --upcoming   # Just upcoming due dates
 *   node scripts/smart-alerts.js --recordings # Just new recording digest
 *   node scripts/smart-alerts.js --cleanup    # Auto-dismiss stale items + promote needs_review
 *   node scripts/smart-alerts.js --task-review # Process Plaud recordings for task updates
 *   node scripts/smart-alerts.js --test       # Dry run — log but don't send
 *
 * Runs via launchd every hour (com.bettersystems.smart-alerts)
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test');
const runAll = args.length === 0 || (args.length === 1 && TEST_MODE);

// ─── Config ──────────────────────────────────────────────────────────────────
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
const RODO_PHONE = process.env.RODO_PHONE_NUMBER;
const RESEND_KEY = process.env.RESEND_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

// Cooldown: 10 hours allows both morning (7 AM) and evening (8 PM) digests to each send once
const ALERT_COOLDOWN_HOURS = 10;

// ─── SSW Delegation & Priority Framework ─────────────────────────────────────
// Priority: 1) Sales/Revenue  2) Operations (delegated)
// Only alert Rodo for sales/client/payment items. Ops tasks route to team.
const SSW_DELEGATION = {
  kerry:     { name: 'Kerry', scope: ['logistics', 'supplier', 'ingredient', 'procurement', 'shipping', 'delivery', 'schedule', 'transport', 'hay', 'soak', 'fencing', 'inventory'] },
  gabriela:  { name: 'Gabriela', scope: ['design', 'signage', 'amazon', 'listing', 'image', 'tiktok', 'graphic', 'label design'] },
  jonathan:  { name: 'Jonathan', scope: ['packaging', 'label', 'pack', 'bag', 'product prep', 'printed label'] },
  luis:      { name: 'Luis', scope: ['waste', 'operator', 'site work', 'equipment', 'machinery'] },
  sabrina:   { name: 'Sabrina', scope: ['phoenix', 'local delivery', 'ufe', 'conference', 'hiwassee'] },
};
const SALES_KEYWORDS = ['sale', 'revenue', 'invoice', 'payment', 'collect', 'client', 'proposal', 'pricing', 'price', 'quote', 'deal', 'contract', 'partnership', 'opportunity', 'prospect', 'follow up', 'follow-up', 'meeting', 'call with', 'email to', 'send email', 'reply to'];

function classifyTask(title, project, description) {
  const text = `${title} ${project || ''} ${description || ''}`.toLowerCase();
  // Check if it's a sales/revenue task (Rodo's domain)
  if (SALES_KEYWORDS.some(kw => text.includes(kw))) return { owner: 'rodo', type: 'sales' };
  // Check delegation
  for (const [key, del] of Object.entries(SSW_DELEGATION)) {
    if (del.scope.some(kw => text.includes(kw))) return { owner: key, type: 'operations', delegate: del.name };
  }
  return { owner: 'rodo', type: 'general' };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendSMS(body) {
  if (TEST_MODE) {
    console.log(`[SMS DRY RUN] ${body}`);
    return 'test-sid';
  }
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
    body: new URLSearchParams({ To: RODO_PHONE, From: TWILIO_FROM, Body: body }),
  });
  const json = await res.json();
  if (json.error_code) {
    console.error(`[SMS ERROR] ${json.error_code}: ${json.message}`);
    return null;
  }
  await logNotification('sms', RODO_PHONE, null, body, 'alert', json.sid);
  return json.sid;
}

async function sendAlertEmail(subject, body, { items = [], sections = [] } = {}) {
  if (TEST_MODE) {
    console.log(`[EMAIL DRY RUN] ${subject}\n${body}`);
    return 'test-id';
  }

  // Build clean HTML email
  const html = buildAlertHTML(subject, body, items, sections);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'BSA Alerts <developer@bettersystems.ai>',
      to: 'rodolfo@bettersystems.ai',
      subject,
      html,
      text: body,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`[EMAIL ERROR] ${JSON.stringify(json)}`);
    return null;
  }
  await logNotification('email', null, 'rodolfo@bettersystems.ai', `${subject}: ${body.substring(0, 200)}`, 'alert', null);
  return json.id;
}

function buildAlertHTML(title, fallbackText, items = [], sections = []) {
  const row = (label, value, color) =>
    `<tr><td style="padding:6px 12px;color:#8a8a8a;font-size:13px;white-space:nowrap">${label}</td><td style="padding:6px 12px;color:${color || '#e0e0e0'};font-size:14px;font-weight:500">${value}</td></tr>`;

  const itemRow = (item) => {
    const badge = item.company === 'BSA'
      ? '<span style="background:#1a3a5c;color:#5bb8f5;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">BSA</span>'
      : '<span style="background:#1a3c2a;color:#52c97a;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">SSW</span>';
    const urgencyColor = (item.days_overdue || 0) >= 7 ? '#e04848' : (item.days_overdue || 0) >= 3 ? '#e0a030' : '#8a8a8a';
    const urgencyText = item.days_overdue ? `<span style="color:${urgencyColor};font-size:12px;font-weight:600">${item.days_overdue}d overdue</span>` :
      item.days_until !== undefined ? `<span style="color:#1ec9a8;font-size:12px">${item.days_until === 0 ? 'TODAY' : item.days_until === 1 ? 'TOMORROW' : 'in ' + item.days_until + 'd'}</span>` :
      item.days_old ? `<span style="color:#e0a030;font-size:12px">${item.days_old}d waiting</span>` : '';

    return `<tr style="border-bottom:1px solid #1a2a3a">
      <td style="padding:10px 12px;vertical-align:top">${badge}</td>
      <td style="padding:10px 12px">
        <div style="color:#e0e0e0;font-size:14px;font-weight:500">${item.title}</div>
        ${item.project ? `<div style="color:#6a8a8a;font-size:12px;margin-top:2px">${item.project}</div>` : ''}
        ${item.context ? `<div style="color:#5a7a7a;font-size:12px;margin-top:4px;font-style:italic">${item.context}</div>` : ''}
      </td>
      <td style="padding:10px 12px;text-align:right;vertical-align:top;white-space:nowrap">${urgencyText}</td>
      <td style="padding:10px 12px;color:#4a6a6a;font-size:12px;vertical-align:top;text-align:right">#${item.id}</td>
    </tr>`;
  };

  const sectionBlock = (sec) => `
    <div style="margin-top:24px">
      <div style="color:#1ec9a8;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;border-bottom:1px solid #1a2a3a;margin-bottom:4px">${sec.title}</div>
      ${sec.count !== undefined ? `<div style="color:#e0e0e0;font-size:28px;font-weight:700;margin:8px 0">${sec.count}</div>` : ''}
      <table style="width:100%;border-collapse:collapse">${(sec.items || []).map(itemRow).join('')}</table>
    </div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#060c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px">
  <!-- Header -->
  <div style="padding:20px 0;border-bottom:2px solid #1ec9a8;margin-bottom:20px">
    <div style="color:#1ec9a8;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase">BSA ALERT SYSTEM</div>
    <div style="color:#e0e0e0;font-size:20px;font-weight:700;margin-top:8px">${title.replace(/^[^\s]+\s/, '')}</div>
    <div style="color:#5a7a7a;font-size:12px;margin-top:4px">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Phoenix' })} &middot; ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Phoenix' })}</div>
  </div>

  ${sections.length > 0 ? sections.map(sectionBlock).join('') : ''}

  ${items.length > 0 && sections.length === 0 ? `<table style="width:100%;border-collapse:collapse">${items.map(itemRow).join('')}</table>` : ''}

  <!-- Footer -->
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1a2a3a;color:#3a5a5a;font-size:11px">
    Automated by BSA Context Engine &middot; Reply YES to SMS to approve drafts
  </div>
</div>
</body></html>`;
}

async function logNotification(channel, toNumber, toEmail, message, type, sid) {
  await sql`INSERT INTO notifications_log (channel, to_number, to_email, message, type, twilio_message_sid, status)
    VALUES (${channel}, ${toNumber}, ${toEmail}, ${message}, ${type}, ${sid}, 'sent')`;
}

async function wasAlertedRecently(alertKey) {
  const [recent] = await sql`
    SELECT id FROM notifications_log
    WHERE message LIKE ${'%' + alertKey + '%'}
      AND created_at > NOW() - INTERVAL '${sql.unsafe(ALERT_COOLDOWN_HOURS + '')} hours'
    LIMIT 1
  `;
  return !!recent;
}

async function gemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
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

// ─── 1. OVERDUE ALERTS ──────────────────────────────────────────────────────
async function checkOverdue() {
  console.log('[OVERDUE] Checking...');

  const overdue = await sql`
    SELECT id, title, company, project, priority, due_date,
      EXTRACT(DAY FROM NOW() - due_date)::int as days_overdue
    FROM action_items
    WHERE status = 'pending'
      AND due_date IS NOT NULL
      AND due_date < NOW()
    ORDER BY due_date ASC
    LIMIT 20
  `;

  if (overdue.length === 0) {
    console.log('[OVERDUE] Nothing overdue');
    return;
  }

  // Classify each item — sales vs operations vs delegatable
  const classified = overdue.map(a => {
    const cls = a.company === 'SSW' ? classifyTask(a.title, a.project, '') : { owner: 'rodo', type: 'general' };
    return { ...a, cls };
  });

  const rodoItems = classified.filter(a => a.cls.owner === 'rodo');
  const salesItems = classified.filter(a => a.cls.type === 'sales');
  const delegated = classified.filter(a => a.cls.owner !== 'rodo');
  const bsa = rodoItems.filter(a => a.company === 'BSA');
  const sswRodo = rodoItems.filter(a => a.company === 'SSW');

  // SMS only for Rodo's items (sales-critical 7+ days)
  const critical = rodoItems.filter(a => a.days_overdue >= 7);
  if (critical.length > 0) {
    const alertKey = `OVERDUE-CRITICAL-${new Date().toISOString().split('T')[0]}`;
    if (!(await wasAlertedRecently(alertKey))) {
      let msg = `⚠️ ${critical.length} items 7+ days overdue (YOUR action needed):\n\n`;
      for (const a of critical.slice(0, 5)) {
        msg += `• ${a.title} [${a.company}] — ${a.days_overdue}d\n`;
      }
      if (critical.length > 5) msg += `+ ${critical.length - 5} more\n`;
      msg += `\n${alertKey}`;
      await sendSMS(msg);
      console.log(`[OVERDUE] SMS sent — ${critical.length} critical items`);
    }
  }

  // Email summary — Sales first, then Rodo ops, then delegated (collapsed)
  const alertKey = `OVERDUE-SUMMARY-${new Date().toISOString().split('T')[0]}`;
  if (!(await wasAlertedRecently(alertKey))) {
    let body = `Overdue: ${overdue.length} total (Rodo: ${rodoItems.length}, Delegated: ${delegated.length})\n`;
    for (const a of rodoItems) body += `[${a.days_overdue}d] #${a.id} ${a.title} [${a.company}]\n`;
    if (delegated.length > 0) body += `\n--- Delegated (${delegated.length}) ---\n`;
    for (const a of delegated) body += `[→${a.cls.delegate}] #${a.id} ${a.title}\n`;
    body += `\n${alertKey}`;

    const toItems = (list) => list
      .sort((a, b) => b.days_overdue - a.days_overdue)
      .map(a => ({ id: a.id, title: a.title, company: a.company, project: a.project, days_overdue: a.days_overdue, context: a.cls.delegate ? `→ ${a.cls.delegate}` : undefined }));

    const sections = [];

    // Sales items FIRST (highest priority)
    if (salesItems.length > 0) {
      sections.push({ title: `🔴 Sales & Revenue (${salesItems.length})`, items: toItems(salesItems) });
    }

    // BSA items (Rodo direct)
    const bsaNonSales = bsa.filter(a => a.cls.type !== 'sales');
    if (bsaNonSales.length > 0) {
      sections.push({ title: `BSA — Better Systems AI (${bsaNonSales.length})`, items: toItems(bsaNonSales) });
    }

    // SSW Rodo items (non-sales, non-delegated)
    const sswRodoNonSales = sswRodo.filter(a => a.cls.type !== 'sales');
    if (sswRodoNonSales.length > 0) {
      sections.push({ title: `SSW — Rodo Action Required (${sswRodoNonSales.length})`, items: toItems(sswRodoNonSales) });
    }

    // Delegated items (info only — grouped by delegate)
    if (delegated.length > 0) {
      const byDelegate = {};
      for (const a of delegated) {
        const d = a.cls.delegate || 'Unassigned';
        if (!byDelegate[d]) byDelegate[d] = [];
        byDelegate[d].push(a);
      }
      for (const [name, items] of Object.entries(byDelegate)) {
        sections.push({ title: `→ ${name} (${items.length} delegated)`, items: toItems(items) });
      }
    }

    const subj = salesItems.length > 0
      ? `🔴 ${salesItems.length} Sales + ${rodoItems.length - salesItems.length} Ops Overdue`
      : `⚠️ ${rodoItems.length} Overdue (${delegated.length} delegated)`;
    await sendAlertEmail(subj, body, { sections });
    console.log(`[OVERDUE] Email sent — ${rodoItems.length} Rodo, ${delegated.length} delegated`);
  }
}

// ─── 2. UNANSWERED CLIENT EMAILS ────────────────────────────────────────────
async function checkUnansweredEmails() {
  console.log('[EMAILS] Checking unanswered client threads...');

  // Check BSA Gmail for unanswered inbound (last 5 days)
  // We search for emails FROM known client contacts that don't have a reply
  const knownClients = [
    { name: 'Micah (Desert Moon)', email: 'micah@independentsolar.com' },
    { name: 'Brian Mitchell', email: 'brian.mitchell38@gmail.com' },
    { name: 'Linda Johnson', email: 'lj419johnson@gmail.com' },
    { name: 'Victoria (Agave)', email: 'victoria.rosales@agave-inc.com' },
    { name: 'Barbara (CGCC)', email: 'barbara.gonzalez@cgc.edu' },
    { name: 'Theresa (CGCC)', email: 'theresa.whitney@cgc.edu' },
    { name: 'Chris Snow (USCC)', email: 'csnow@compostingcouncil.org' },
    { name: 'Hector (FOTG)', email: 'flowerofthegodsaz@gmail.com' },
    { name: 'Mehwish (Astroid X)', email: 'mehwish@asteroidx.ca' },
    { name: 'Deb Ford', email: 'deb.ford@worldcentric.com' },
    { name: 'Kerry (SSW)', email: 'kcooper@soilseedandwater.com' },
  ];

  // Build advisory email with draft replies
  const unanswered = [];

  // Check action items that are email-type and pending
  const emailActions = await sql`
    SELECT id, title, description, company, project, created_at,
      EXTRACT(DAY FROM NOW() - created_at)::int as days_old
    FROM action_items
    WHERE status = 'pending'
      AND action_type = 'email'
      AND created_at > NOW() - INTERVAL '7 days'
    ORDER BY priority, created_at ASC
    LIMIT 10
  `;

  if (emailActions.length === 0) {
    console.log('[EMAILS] No pending email actions');
    return;
  }

  const alertKey = `UNANSWERED-${new Date().toISOString().split('T')[0]}`;
  if (await wasAlertedRecently(alertKey)) return;

  // SMS for items > 3 days
  const stale = emailActions.filter(a => a.days_old >= 3);
  if (stale.length > 0) {
    let msg = `📧 ${stale.length} emails need response (3+ days):\n\n`;
    for (const a of stale.slice(0, 4)) {
      msg += `• ${a.title} [${a.company}] — ${a.days_old}d\n`;
    }
    msg += `\nReply YES to auto-draft replies.\n${alertKey}`;
    await sendSMS(msg);
    console.log(`[EMAILS] SMS sent — ${stale.length} stale email actions`);
  }

  // Email with full list as line items
  if (emailActions.length > 0) {
    let body = `${emailActions.length} pending email actions\n`;
    for (const a of emailActions) body += `#${a.id} [${a.days_old}d] ${a.title} [${a.company}]\n`;
    body += `\n${alertKey}`;

    const items = emailActions.map(a => ({
      id: a.id,
      title: a.title,
      company: a.company,
      project: a.project,
      days_old: a.days_old,
      context: a.description ? a.description.substring(0, 120) : null,
    }));

    await sendAlertEmail(`📧 ${emailActions.length} Emails Need Your Attention`, body, {
      sections: [{ title: `Pending Email Actions (${emailActions.length})`, items }],
    });
  }
}

// ─── 3. UPCOMING DUE DATES ──────────────────────────────────────────────────
async function checkUpcoming() {
  console.log('[UPCOMING] Checking items due in next 2 days...');

  const upcoming = await sql`
    SELECT id, title, company, project, priority, due_date,
      EXTRACT(DAY FROM due_date - NOW())::int as days_until
    FROM action_items
    WHERE status = 'pending'
      AND due_date IS NOT NULL
      AND due_date > NOW()
      AND due_date <= NOW() + INTERVAL '2 days'
    ORDER BY due_date ASC
    LIMIT 10
  `;

  if (upcoming.length === 0) {
    console.log('[UPCOMING] Nothing due in next 2 days');
    return;
  }

  // Date + AM/PM so morning and evening can each send once
  const isAM = new Date().getHours() < 12;
  const alertKey = `UPCOMING-${new Date().toISOString().split('T')[0]}-${isAM ? 'AM' : 'PM'}`;
  if (await wasAlertedRecently(alertKey)) return;

  let msg = `📅 ${upcoming.length} items due in next 2 days:\n\n`;
  for (const a of upcoming) {
    const when = a.days_until === 0 ? 'TODAY' : a.days_until === 1 ? 'TOMORROW' : `in ${a.days_until}d`;
    msg += `• ${a.title} [${a.company}] — ${when}\n`;
  }
  msg += `\n${alertKey}`;
  await sendSMS(msg);
  console.log(`[UPCOMING] SMS sent — ${upcoming.length} items`);
}

// ─── 4. PAYMENT MONITORING (Stripe) ─────────────────────────────────────────
async function checkPayments() {
  console.log('[PAYMENTS] Checking recent Stripe activity...');

  if (!STRIPE_KEY) {
    console.log('[PAYMENTS] No Stripe key — skipping');
    return;
  }

  // Check for successful charges in last 2 hours
  const since = Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000);

  try {
    const res = await fetch(`https://api.stripe.com/v1/charges?created[gte]=${since}&limit=10`, {
      headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
    });
    const json = await res.json();
    const successful = (json.data || []).filter(c => c.status === 'succeeded' && c.paid);

    for (const charge of successful) {
      const amt = (charge.amount / 100).toFixed(2);
      const name = charge.billing_details?.name || charge.customer || 'Unknown';
      const alertKey = `PAYMENT-${charge.id}`;

      if (await wasAlertedRecently(alertKey)) continue;

      const msg = `💰 Payment received!\n$${amt} from ${name}\n${charge.description || ''}\n\n${alertKey}`;
      await sendSMS(msg);
      console.log(`[PAYMENTS] SMS sent — $${amt} from ${name}`);
    }

    if (successful.length === 0) {
      console.log('[PAYMENTS] No new payments');
    }
  } catch (e) {
    console.error(`[PAYMENTS ERROR] ${e.message}`);
  }
}

// ─── 5. NEW RECORDINGS DIGEST ───────────────────────────────────────────────
async function checkNewRecordings() {
  console.log('[RECORDINGS] Checking for new recordings...');

  // 13-hour window covers the gap between morning (7 AM) and evening (8 PM) digests
  const [stats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE recorded_at > NOW() - INTERVAL '13 hours') as new_recordings,
      COUNT(*) FILTER (WHERE r.id IN (
        SELECT DISTINCT recording_id FROM action_items
        WHERE created_at > NOW() - INTERVAL '13 hours' AND recording_id IS NOT NULL
      )) as recordings_with_actions
    FROM recordings r
    WHERE transcription_status = 'completed'
  `;

  const newActions = await sql`
    SELECT COUNT(*) as count FROM action_items
    WHERE created_at > NOW() - INTERVAL '13 hours'
      AND source = 'recording'
  `;

  if (parseInt(stats.new_recordings) === 0) {
    console.log('[RECORDINGS] No new recordings in last 13 hours');
    return;
  }

  // AM/PM cooldown — fires once per half-day, not once per hour
  const isAM = new Date().getHours() < 12;
  const alertKey = `RECORDINGS-${new Date().toISOString().split('T')[0]}-${isAM ? 'AM' : 'PM'}`;
  if (await wasAlertedRecently(alertKey)) return;

  const recs = await sql`
    SELECT title, recorded_at, duration_seconds
    FROM recordings
    WHERE transcription_status = 'completed'
      AND recorded_at > NOW() - INTERVAL '13 hours'
    ORDER BY recorded_at DESC
    LIMIT 5
  `;

  let body = `🎙️ New Recordings Processed\n${'='.repeat(40)}\n\n`;
  body += `${stats.new_recordings} recording(s) | ${newActions[0].count} action items extracted\n\n`;
  for (const r of recs) {
    const dur = Math.round(r.duration_seconds / 60);
    body += `• ${r.title} (${dur}m)\n`;
  }
  body += `\n${alertKey}`;
  await sendAlertEmail(`🎙️ ${stats.new_recordings} New Recordings — ${newActions[0].count} Actions Extracted`, body);
  console.log(`[RECORDINGS] Email sent — ${stats.new_recordings} recordings, ${newActions[0].count} actions`);
}

// ─── 6. AUTO-CLEANUP ────────────────────────────────────────────────────────
async function autoCleanup() {
  console.log('[CLEANUP] Running maintenance...');

  // Auto-promote needs_review → pending after 3 days
  const promoted = await sql`
    UPDATE action_items
    SET status = 'pending', updated_at = NOW()
    WHERE status = 'needs_review'
      AND created_at < NOW() - INTERVAL '3 days'
    RETURNING id
  `;
  if (promoted.length > 0) {
    console.log(`[CLEANUP] Promoted ${promoted.length} items: needs_review → pending`);
  }

  // Auto-dismiss overdue >14 days (non-urgent/high)
  const dismissed = await sql`
    UPDATE action_items
    SET status = 'dismissed', updated_at = NOW()
    WHERE status = 'pending'
      AND priority NOT IN ('urgent', 'high')
      AND due_date IS NOT NULL
      AND due_date < NOW() - INTERVAL '14 days'
    RETURNING id, title
  `;
  if (dismissed.length > 0) {
    console.log(`[CLEANUP] Auto-dismissed ${dismissed.length} stale items (14+ days overdue, low/medium priority)`);
    for (const d of dismissed.slice(0, 5)) {
      console.log(`  ✕ #${d.id} ${d.title}`);
    }
  }

  // Count duplicates (same title + company, both pending)
  const dupes = await sql`
    SELECT title, company, COUNT(*) as cnt
    FROM action_items
    WHERE status = 'pending'
    GROUP BY title, company
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 10
  `;
  if (dupes.length > 0) {
    console.log(`[CLEANUP] Found ${dupes.length} duplicate groups:`);
    for (const d of dupes) {
      console.log(`  ${d.cnt}x "${d.title}" [${d.company}]`);
    }
  }

  // Weekly summary (only on Mondays)
  const day = new Date().getDay();
  if (day === 1) { // Monday
    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'completed' AND updated_at > NOW() - INTERVAL '7 days') as completed_week,
        COUNT(*) FILTER (WHERE status = 'dismissed' AND updated_at > NOW() - INTERVAL '7 days') as dismissed_week,
        COUNT(*) FILTER (WHERE status = 'needs_review') as review
      FROM action_items
    `;

    const alertKey = `WEEKLY-CLEANUP-${new Date().toISOString().split('T')[0]}`;
    if (!(await wasAlertedRecently(alertKey))) {
      let body = `📊 Weekly Context Cleanup Summary\n${'='.repeat(40)}\n\n`;
      body += `Pending: ${counts.pending}\n`;
      body += `Completed this week: ${counts.completed_week}\n`;
      body += `Dismissed this week: ${counts.dismissed_week}\n`;
      body += `Needs review: ${counts.review}\n`;
      body += `Promoted today: ${promoted.length}\n`;
      body += `Auto-dismissed today: ${dismissed.length}\n`;
      if (dupes.length > 0) body += `Duplicate groups: ${dupes.length} (run dedup-pending.js)\n`;
      body += `\n${alertKey}`;
      await sendAlertEmail(`📊 Weekly Cleanup: ${counts.pending} pending, ${counts.completed_week} done this week`, body);
    }
  }
}

// ─── 7. TASK REVIEW — Process Plaud recordings with task updates ────────────
async function processTaskReviews() {
  console.log('[TASK-REVIEW] Checking for new recordings with task updates...');

  // Find recent recordings that have transcripts but haven't been processed for task updates
  const recordings = await sql`
    SELECT id, title, transcript, recorded_at, duration_seconds
    FROM recordings
    WHERE transcription_status = 'completed'
      AND transcript IS NOT NULL
      AND recorded_at > NOW() - INTERVAL '4 hours'
      AND (metadata IS NULL OR NOT (metadata ? 'task_review_processed'))
    ORDER BY recorded_at DESC
    LIMIT 5
  `;

  if (recordings.length === 0) {
    console.log('[TASK-REVIEW] No new unprocessed recordings');
    return;
  }

  const allTaskReviewResults = []; // Accumulate across all recordings for ONE batch SMS

  // Get current pending items for context
  const pending = await sql`
    SELECT id, title, company, project, status, priority, due_date
    FROM action_items
    WHERE status IN ('pending', 'needs_review')
    ORDER BY due_date ASC NULLS LAST
    LIMIT 100
  `;
  const pendingList = pending.map(a =>
    `#${a.id} "${a.title}" [${a.company}] ${a.project || ''} ${a.due_date ? 'due ' + new Date(a.due_date).toLocaleDateString() : ''}`
  ).join('\n');

  for (const rec of recordings) {
    console.log(`[TASK-REVIEW] Processing recording #${rec.id}: ${rec.title || 'Untitled'}`);

    // Check if transcript has task-review language (broad match — natural speech)
    const taskKeywords = /\b(dismiss|done|complete|finished|skip|cancel|push|reschedule|move|postpone|delete|remove|eliminate|already (did|done|happened|sent|delivered)|delegat|not (my|important|needed|relevant)|not (going to )?focus|overdue|alert|pending|task|action item|BSA|SSW|\d{3,})\b/i;
    if (!taskKeywords.test(rec.transcript)) {
      // Mark as processed (no task content) so we don't re-check
      await sql`UPDATE recordings SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"task_review_processed": true, "task_review_result": "no_task_content"}'::jsonb WHERE id = ${rec.id}`;
      console.log(`[TASK-REVIEW] #${rec.id} — no task update language found, skipping`);
      continue;
    }

    // Use Gemini to extract task actions from the transcript
    const prompt = `You are parsing a voice recording where Rodo Alvarez (CEO of Soil Seed & Water and Better Systems AI) is reviewing his task list and giving updates. Extract ALL task actions from his natural speech.

PRIORITY FRAMEWORK:
- Rodo focuses on: SALES, revenue, clients, collections, pricing, proposals, partnerships
- Operations are DELEGATED to the team:
  • Kerry = logistics, suppliers, ingredients, procurement, shipping, scheduling
  • Gabriela = design, signage, Amazon listings/images
  • Jonathan = packaging, labeling, product prep
  • Luis = waste operations, site work
  • Sabrina = Phoenix operations, local delivery
- When Rodo says "that's delegated to [name]" or "that's [name]'s job" → action: "delegate"
- When he says "already did that", "already happened", "already sent" → action: "complete"
- When he says "eliminate", "not important", "not my deal", "not relevant to me" → action: "dismiss"

CURRENT PENDING TASKS:
${pendingList}

TRANSCRIPT:
${rec.transcript.substring(0, 3000)}

Extract task actions as a JSON array. Each action:
- "action": "complete" | "dismiss" | "reschedule" | "delegate" | "note"
- "id": the task # ID if they mention one (number only, no #)
- "title_match": partial title text if they describe the task by name instead of ID (for fuzzy matching)
- "delegate_to": name of person if delegating (Kerry, Gabriela, Jonathan, Luis, Sabrina)
- "new_due": ISO date string if rescheduling (e.g. "2026-03-08"), or relative like "+7d"
- "note": any additional context they said about this task

Rules:
- Extract EVERY task update he mentions, even subtle ones like "I already did that"
- "done", "finished", "completed", "already did", "already happened", "already sent" → action: "complete"
- "dismiss", "skip", "cancel", "eliminate", "not important", "not my deal", "not needed" → action: "dismiss"
- "delegated to X", "that's X's job", "X is handling", "route to X" → action: "delegate"
- "push", "move", "reschedule", "next week", "postpone", "Monday" → action: "reschedule"
- If they comment on a task with context but don't change status → action: "note"
- Match task IDs from the pending list. Whisper may transcribe numbers phonetically ("nine twenty four" = 924)
- The speaker often refers to tasks by topic rather than ID — match aggressively by keywords

Return ONLY valid JSON array, no markdown, no explanation. If no task updates found, return [].`;

    let actions;
    try {
      const result = await gemini(prompt);
      // Strip markdown code fences if present
      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      actions = JSON.parse(cleaned);
    } catch (e) {
      console.error(`[TASK-REVIEW] Gemini parse error for #${rec.id}: ${e.message}`);
      await sql`UPDATE recordings SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"task_review_processed": true, "task_review_result": "parse_error"}'::jsonb WHERE id = ${rec.id}`;
      continue;
    }

    if (!Array.isArray(actions) || actions.length === 0) {
      await sql`UPDATE recordings SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"task_review_processed": true, "task_review_result": "no_actions"}'::jsonb WHERE id = ${rec.id}`;
      console.log(`[TASK-REVIEW] #${rec.id} — Gemini found no task actions`);
      continue;
    }

    // Execute each action
    const results = [];
    for (const act of actions) {
      let targetId = act.id ? parseInt(act.id) : null;

      // Fuzzy match by title if no ID
      if (!targetId && act.title_match) {
        const match = pending.find(p =>
          p.title.toLowerCase().includes(act.title_match.toLowerCase()) ||
          act.title_match.toLowerCase().includes(p.title.toLowerCase().substring(0, 20))
        );
        if (match) targetId = match.id;
      }

      if (!targetId) {
        console.log(`[TASK-REVIEW]   ⚠ Could not match: "${act.title_match || 'no id/title'}"`);
        results.push({ action: act.action, status: 'no_match', detail: act.title_match || act.note });
        continue;
      }

      const target = pending.find(p => p.id === targetId);
      if (!target) {
        console.log(`[TASK-REVIEW]   ⚠ ID #${targetId} not in pending list`);
        results.push({ action: act.action, id: targetId, status: 'not_found' });
        continue;
      }

      if (act.action === 'complete') {
        await sql`UPDATE action_items SET status = 'completed', updated_at = NOW() WHERE id = ${targetId}`;
        console.log(`[TASK-REVIEW]   ✅ #${targetId} → completed: ${target.title}`);
        results.push({ action: 'complete', id: targetId, title: target.title, status: 'ok' });

      } else if (act.action === 'dismiss') {
        await sql`UPDATE action_items SET status = 'dismissed', updated_at = NOW() WHERE id = ${targetId}`;
        console.log(`[TASK-REVIEW]   ✕ #${targetId} → dismissed: ${target.title}`);
        results.push({ action: 'dismiss', id: targetId, title: target.title, status: 'ok' });

      } else if (act.action === 'reschedule') {
        let newDate = null;
        if (act.new_due) {
          if (act.new_due.startsWith('+')) {
            const days = parseInt(act.new_due.replace('+', '').replace('d', ''));
            newDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
          } else if (act.new_due === 'next week') {
            newDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
          } else {
            newDate = act.new_due;
          }
        } else {
          // Default: push 7 days
          newDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        }
        await sql`UPDATE action_items SET due_date = ${newDate}::date, updated_at = NOW() WHERE id = ${targetId}`;
        console.log(`[TASK-REVIEW]   📅 #${targetId} → rescheduled to ${newDate}: ${target.title}`);
        results.push({ action: 'reschedule', id: targetId, title: target.title, new_due: newDate, status: 'ok' });

      } else if (act.action === 'delegate') {
        const delegateTo = act.delegate_to || 'team';
        const noteText = `\n[${new Date().toLocaleDateString()}] Delegated to ${delegateTo}`;
        await sql`UPDATE action_items SET description = COALESCE(description, '') || ${noteText}, updated_at = NOW() WHERE id = ${targetId}`;
        console.log(`[TASK-REVIEW]   👤 #${targetId} → delegated to ${delegateTo}: ${target.title}`);
        results.push({ action: 'delegate', id: targetId, title: target.title, delegate_to: delegateTo, status: 'ok' });

      } else if (act.action === 'note') {
        // Add note to description
        const noteText = `\n[${new Date().toLocaleDateString()}] ${act.note}`;
        await sql`UPDATE action_items SET description = COALESCE(description, '') || ${noteText}, updated_at = NOW() WHERE id = ${targetId}`;
        console.log(`[TASK-REVIEW]   📝 #${targetId} → note added: ${act.note}`);
        results.push({ action: 'note', id: targetId, title: target.title, note: act.note, status: 'ok' });
      }
    }

    // Mark recording as processed
    const reviewMeta = JSON.stringify({ task_review_processed: true, task_review_result: 'processed', task_review_actions: results.length, task_review_at: new Date().toISOString() });
    await sql`UPDATE recordings SET metadata = COALESCE(metadata, '{}'::jsonb) || ${reviewMeta}::jsonb WHERE id = ${rec.id}`;

    // Accumulate results across all recordings — send ONE batch SMS/email at end
    allTaskReviewResults.push({ recId: rec.id, recTitle: rec.title, results });
    console.log(`[TASK-REVIEW] #${rec.id} — ${results.filter(r => r.status === 'ok').length} actions executed`);
  }

  // Send ONE combined SMS + email for all recordings processed this run
  const allResults = allTaskReviewResults.flatMap(r => r.results);
  const okResults = allResults.filter(r => r.status === 'ok');
  if (okResults.length === 0) return;

  const completed = okResults.filter(r => r.action === 'complete');
  const dismissed = okResults.filter(r => r.action === 'dismiss');
  const rescheduled = okResults.filter(r => r.action === 'reschedule');
  const delegatedActions = okResults.filter(r => r.action === 'delegate');
  const failed = allResults.filter(r => r.status !== 'ok');

  let sms = `✅ Task review (${allTaskReviewResults.length} recording${allTaskReviewResults.length > 1 ? 's' : ''}):\n`;
  if (completed.length) sms += `✓ ${completed.length} completed\n`;
  if (dismissed.length) sms += `✕ ${dismissed.length} dismissed\n`;
  if (delegatedActions.length) sms += `👤 ${delegatedActions.length} delegated\n`;
  if (rescheduled.length) sms += `📅 ${rescheduled.length} rescheduled\n`;
  if (failed.length) sms += `⚠ ${failed.length} couldn't match\n`;
  for (const r of [...completed, ...dismissed, ...delegatedActions, ...rescheduled].slice(0, 6)) {
    const icon = r.action === 'complete' ? '✓' : r.action === 'dismiss' ? '✕' : r.action === 'delegate' ? '👤' : '📅';
    const suffix = r.new_due ? ` → ${r.new_due}` : r.delegate_to ? ` → ${r.delegate_to}` : '';
    sms += `${icon} #${r.id} ${(r.title || '').substring(0, 28)}${suffix}\n`;
  }
  await sendSMS(sms.trim());
  console.log(`[TASK-REVIEW] Batch SMS sent — ${okResults.length} total actions across ${allTaskReviewResults.length} recordings`);
}

// ─── 8. CHECK YES/APPROVE REPLIES ───────────────────────────────────────────
async function checkApprovalReplies() {
  console.log('[APPROVALS] Checking for SMS replies...');

  if (!TWILIO_SID || !TWILIO_TOKEN) return;

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString().split('T')[0];
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

      if (body === 'YES' || body === 'Y' || body === 'APPROVE') {
        // Check if there are pending email drafts that need approval
        const pending = await sql`
          SELECT id FROM email_queue
          WHERE status = 'pending_approval' AND scheduled_send_at > NOW()
          LIMIT 1
        `;
        if (pending.length > 0) {
          // Fast-track: send all pending emails now
          const fastTracked = await sql`
            UPDATE email_queue
            SET scheduled_send_at = NOW(), updated_at = NOW()
            WHERE status = 'pending_approval'
            RETURNING id
          `;
          console.log(`[APPROVALS] YES received — fast-tracked ${fastTracked.length} emails`);
          await sendSMS(`✅ Approved! Sending ${fastTracked.length} email(s) now.`);
        } else {
          // Trigger email drafting for pending email-type actions
          console.log('[APPROVALS] YES received — triggering draft for pending email actions');
          // This will be picked up by the next action-runner cycle
        }
      } else if (body === 'SKIP' || body === 'NO' || body === 'N') {
        console.log('[APPROVALS] SKIP received — no action taken');
      }
    }
  } catch (e) {
    console.error(`[APPROVALS ERROR] ${e.message}`);
  }
}

// ─── OUTREACH REPLY DETECTION ────────────────────────────────────────────────
async function checkOutreachReplies() {
  console.log('[OUTREACH] Checking for prospect replies in BSA Gmail...');

  // Get all lead emails that haven't been marked as replied
  const leads = await sql`
    SELECT id, email, first_name, last_name, company
    FROM leads
    WHERE status NOT IN ('replied', 'bounced', 'unsubscribed', 'client')
      AND outreach_step > 0
      AND email IS NOT NULL
  `;

  if (leads.length === 0) {
    console.log('[OUTREACH] No active outreach leads to check');
    return;
  }

  // Build a map for quick lookup
  const leadMap = {};
  for (const lead of leads) {
    leadMap[lead.email.toLowerCase()] = lead;
  }

  // Search BSA Gmail for recent inbound emails from lead domains
  // We use the gmail MCP tools indirectly — read recent emails via the helper
  // Instead, query directly: check if any emails in the last 3 days are FROM a lead email
  let recentEmails = [];
  try {
    const { execSync } = await import('child_process');
    // Use Gmail MCP search via CLI — search for emails from lead email addresses
    // Build Gmail search query for recent inbound from lead emails
    const leadEmails = leads.map(l => l.email).slice(0, 50); // Limit to 50 for query size
    const searchQuery = leadEmails.map(e => `from:${e}`).join(' OR ');

    // Query Gmail via the BSA gmail helper (googleapis)
    const gmailHelper = '/Users/rodolfoalvarez/.gmail-mcp/gmail-api.js';
    const result = execSync(
      `node ${gmailHelper} search "${searchQuery.replace(/"/g, '\\"')}" 20 2>/dev/null`,
      { timeout: 30000, encoding: 'utf8', cwd: '/Users/rodolfoalvarez/.gmail-mcp' }
    ).trim();

    if (result) {
      // Parse the output — each line is a message summary
      const lines = result.split('\n').filter(l => l.trim());
      for (const line of lines) {
        // Extract email address from the line
        const emailMatch = line.match(/from:\s*([^\s<]+@[^\s>]+)/i) || line.match(/([^\s<]+@[^\s>]+)/);
        if (emailMatch) {
          const fromEmail = emailMatch[1].toLowerCase();
          if (leadMap[fromEmail]) {
            recentEmails.push({ email: fromEmail, lead: leadMap[fromEmail], line });
          }
        }
      }
    }
  } catch (e) {
    // Fallback: check via Supabase notification log if we've already detected this
    console.log(`[OUTREACH] Gmail search failed (${e.message}), skipping`);
    return;
  }

  if (recentEmails.length === 0) {
    console.log('[OUTREACH] No prospect replies detected');
    return;
  }

  // Keywords that indicate an unsubscribe / not interested (auto-opt-out)
  const OPTOUT_PATTERNS = [
    /\bunsubscribe\b/i, /\bremove me\b/i, /\bstop emailing\b/i, /\btake me off\b/i,
    /\bnot interested\b/i, /\bno thanks\b/i, /\bno thank you\b/i, /\bdon'?t contact\b/i,
    /\bopt.?out\b/i, /\bplease remove\b/i, /\bwrong person\b/i, /\bdo not email\b/i,
    /\bleave me alone\b/i, /\bstop\b.*\bsending\b/i, /\bno longer\b/i
  ];

  function isOptOut(text) {
    if (!text) return false;
    return OPTOUT_PATTERNS.some(p => p.test(text));
  }

  // Deduplicate by email
  const seen = new Set();
  const hotReplies = [];   // Replies that need Rodo's attention
  const optOutReplies = []; // Auto-unsubscribed
  for (const r of recentEmails) {
    if (seen.has(r.email)) continue;
    seen.add(r.email);

    // Check if we already alerted for this
    const alertKey = `OUTREACH-REPLY-${r.lead.id}`;
    if (await wasAlertedRecently(alertKey)) continue;

    // Try to read the reply body to classify it
    let replyBody = r.line || '';
    try {
      // Attempt to read the full email for opt-out classification
      const { execSync } = await import('child_process');
      const gmailHelper = '/Users/rodolfoalvarez/.gmail-mcp/gmail-api.js';
      // Extract message ID if available from the search line
      const idMatch = r.line.match(/^(\S+)/);
      if (idMatch) {
        const msgContent = execSync(
          `node ${gmailHelper} read ${idMatch[1]} 2>/dev/null`,
          { timeout: 10000, encoding: 'utf8', cwd: '/Users/rodolfoalvarez/.gmail-mcp' }
        ).trim();
        if (msgContent) replyBody = msgContent;
      }
    } catch (e) {
      // Fall back to search line text for classification
    }

    if (isOptOut(replyBody)) {
      // Auto-mark as unsubscribed, no SMS needed
      await sql`UPDATE leads SET status = 'unsubscribed', updated_at = NOW() WHERE id = ${r.lead.id}`;
      optOutReplies.push(r);
      console.log(`[OUTREACH] Auto opt-out: ${r.lead.first_name} ${r.lead.last_name} (${r.email})`);
    } else {
      // Real reply — needs Rodo's attention, pause sequence
      await sql`UPDATE leads SET status = 'replied', updated_at = NOW() WHERE id = ${r.lead.id}`;
      hotReplies.push(r);
      console.log(`[OUTREACH] HOT reply from ${r.lead.first_name} ${r.lead.last_name} (${r.email})`);
    }
  }

  if (hotReplies.length === 0 && optOutReplies.length === 0) {
    console.log('[OUTREACH] All replies already processed');
    return;
  }

  if (optOutReplies.length > 0) {
    console.log(`[OUTREACH] ${optOutReplies.length} auto opt-out(s) processed silently`);
  }

  // SMS alert only for hot replies (not opt-outs)
  if (hotReplies.length > 0) {
    let sms = `${hotReplies.length} OUTREACH ${hotReplies.length === 1 ? 'REPLY' : 'REPLIES'}!\n\n`;
    for (const r of hotReplies.slice(0, 5)) {
      const name = `${r.lead.first_name || ''} ${r.lead.last_name || ''}`.trim();
      sms += `- ${name} (${r.lead.company || 'Unknown'})\n`;
    }
    sms += `\nCheck BSA Gmail NOW`;
    await sendSMS(sms);
    console.log(`[OUTREACH] SMS sent — ${hotReplies.length} hot reply(s)`);
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
try {
  if (TEST_MODE) console.log('🧪 TEST MODE — no SMS/emails will actually send\n');

  console.log(`=== Smart Alerts — ${new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })} ===\n`);

  if (args.includes('--overdue') || runAll) await checkOverdue();
  if (args.includes('--emails') || runAll) await checkUnansweredEmails();
  if (args.includes('--upcoming') || runAll) await checkUpcoming();
  if (args.includes('--payments') || runAll) await checkPayments();
  if (args.includes('--recordings') || runAll) await checkNewRecordings();
  if (args.includes('--cleanup') || runAll) await autoCleanup();
  if (args.includes('--task-review') || runAll) await processTaskReviews();
  if (args.includes('--outreach-replies') || runAll) await checkOutreachReplies();
  if (runAll) await checkApprovalReplies();

  console.log('\n=== Done ===');
} catch (e) {
  console.error('FATAL:', e.message);
  console.error(e.stack);
} finally {
  await sql.end();
}
