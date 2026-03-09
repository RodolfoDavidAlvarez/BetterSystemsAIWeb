#!/usr/bin/env node

/**
 * Outreach Engine — Automated Lead Contact System (Multi-Campaign)
 *
 * Pulls leads from Supabase `leads` table, sends personalized cold emails
 * via Resend, tracks sequence progress. Supports multiple campaigns.
 *
 * Usage:
 *   node scripts/outreach-engine.js                                  # Dry run (contractor-crm)
 *   node scripts/outreach-engine.js --send                           # Send (contractor-crm)
 *   node scripts/outreach-engine.js --send --campaign weight-ticket  # Send (weight-ticket)
 *   node scripts/outreach-engine.js --status                         # Status (contractor-crm)
 *   node scripts/outreach-engine.js --status --campaign weight-ticket
 *   node scripts/outreach-engine.js --warmup                         # Warmup batch
 *   node scripts/outreach-engine.js --load /path.json                # Load leads
 *   node scripts/outreach-engine.js --load /path.json --campaign weight-ticket
 *
 * Campaigns:
 *   contractor-crm   — CRM for contractors (sends from rodo@learnbetterai.com)
 *   weight-ticket    — Weight ticket system for haulers (sends from rodo@weightticket.com)
 *
 * Warm-up schedule (per campaign, independent):
 *   Days 0-3: 2-4 emails/day
 *   Days 4-7: 5-6 emails/day
 *   Days 8-14: 10 emails/day
 *   Days 15+: 20 emails/day
 *
 * Sends Mon-Fri only, staggered 3-8s between emails.
 *
 * Sequence:
 *   Email 1: Introduction (Day 0)
 *   Email 2: Follow-up (Day 3)
 *   Email 3: Breakup (Day 7)
 */

import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

// ============================================================================
// PARSE --campaign FLAG
// ============================================================================

const args = process.argv.slice(2);
const campaignIdx = args.indexOf('--campaign');
const CAMPAIGN = campaignIdx !== -1 ? args[campaignIdx + 1] : 'contractor-crm';

if (!['contractor-crm', 'weight-ticket'].includes(CAMPAIGN)) {
  console.error(`Unknown campaign: ${CAMPAIGN}. Use 'contractor-crm' or 'weight-ticket'.`);
  process.exit(1);
}

// ============================================================================
// CONFIG (per campaign)
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REPLY_TO = 'rodolfo@bettersystems.ai';
const FROM_NAME = 'Rodo Alvarez';

const CAMPAIGN_CONFIG = {
  'contractor-crm': {
    fromEmail: 'rodo@learnbetterai.com',
    label: 'Contractor CRM',
  },
  'weight-ticket': {
    fromEmail: 'rodo@weightticket.com',
    label: 'Weight Ticket',
  },
};

const FROM_EMAIL = CAMPAIGN_CONFIG[CAMPAIGN].fromEmail;
const CAMPAIGN_LABEL = CAMPAIGN_CONFIG[CAMPAIGN].label;

// Warm-up: days since first send → max emails/day (independent per campaign)
const WARMUP_SCHEDULE = [
  { daysMin: 0, daysMax: 2, maxPerDay: 4 },
  { daysMin: 3, daysMax: 7, maxPerDay: 6 },
  { daysMin: 8, daysMax: 14, maxPerDay: 10 },
  { daysMin: 15, daysMax: Infinity, maxPerDay: 20 },
];

// Blacklisted domains (never email these)
const BLACKLIST = [
  'independentsolar.com', 'desertmoonlightingaz.com', 'agave-inc.com',
  'bettersystems.ai', 'soilseedandwater.com', 'nssaz.com',
  'weightticket.com', 'learnbetterai.com'
];

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const CRM_TEMPLATES = {
  email1: {
    subject: (lead) => `${lead.company} — quick question`,
    body: (lead) => `Hey ${lead.first_name},

My name is Rodo. I help contractors like ${lead.company} stay ahead with technology so you're not falling behind.

One of the systems I built for a lighting contractor here in Phoenix lets his crew build proposals, collect signatures, and take payment right from their phones on the job site. No paperwork, no chasing people down.

Would something like that be useful for your crew?

Rodo Alvarez
(602) 637-0032`
  },

  email2: {
    subject: (lead) => `Re: ${lead.company} — quick question`,
    body: (lead) => `Hey ${lead.first_name},

Quick follow-up on my last email. The contractor I mentioned said the biggest win was that customers sign and pay from their phone on the spot. His close rate went up because deals stopped going cold overnight.

Here's a walkthrough if you're curious: bettersystems.ai/contractors

Happy to show you how it works if it's relevant for ${lead.company}. If not, no worries at all.

Rodo
(602) 637-0032`
  },

  email3: {
    subject: (lead) => `Re: ${lead.company} — quick question`,
    body: (lead) => `Hey ${lead.first_name},

Last one from me, didn't want to keep bugging you. If the timing's not right, totally understand.

If you ever want to streamline proposals and payments for ${lead.company}, I'm around: bettersystems.ai/contractors

Rodo
(602) 637-0032`
  }
};

const WEIGHT_TICKET_TEMPLATES = {
  email1: {
    subject: (lead) => `${lead.company} — quick question`,
    body: (lead) => `Hey ${lead.first_name},

My name is Rodo. I built a system for a hauling company here in Phoenix that lets their drivers log weight tickets right from their phone. AI reads the ticket, fills in all the details, and the office sends invoices in minutes instead of hours.

If you're running multiple trucks, I'm guessing documentation and invoicing takes up a lot of your team's time. Would cutting that down to a few clicks be useful for ${lead.company}?

Rodo Alvarez
(602) 637-0032`
  },

  email2: {
    subject: (lead) => `Re: ${lead.company} — quick question`,
    body: (lead) => `Hey ${lead.first_name},

Following up on my last note. The hauling company I mentioned went from spending 2-3 hours a day on ticket data entry to about 15 minutes. The system connects to QuickBooks and Stripe so invoices go out the same day.

Here's a quick look if you're curious: weightticket.com

Happy to walk you through it if that's relevant for ${lead.company}. If not, no worries.

Rodo
(602) 637-0032`
  },

  email3: {
    subject: (lead) => `Re: ${lead.company} — quick question`,
    body: (lead) => `Hey ${lead.first_name},

Last one from me. If you ever want to simplify weight ticket management and invoicing for ${lead.company}, I'm around.

Rodo
(602) 637-0032`
  }
};

const TEMPLATES_MAP = {
  'contractor-crm': CRM_TEMPLATES,
  'weight-ticket': WEIGHT_TICKET_TEMPLATES,
};

const TEMPLATES = TEMPLATES_MAP[CAMPAIGN];

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

async function getStatus() {
  const stats = await sql`
    SELECT
      status,
      outreach_step,
      COUNT(*) as count
    FROM leads
    WHERE campaign = ${CAMPAIGN}
    GROUP BY status, outreach_step
    ORDER BY status, outreach_step
  `;

  const total = await sql`SELECT COUNT(*) as count FROM leads WHERE campaign = ${CAMPAIGN}`;
  const withEmail = await sql`SELECT COUNT(*) as count FROM leads WHERE email IS NOT NULL AND email != '' AND campaign = ${CAMPAIGN}`;
  const sentToday = await sql`
    SELECT COUNT(*) as count FROM leads
    WHERE last_email_sent::date = CURRENT_DATE AND campaign = ${CAMPAIGN}
  `;

  console.log(`\n=== OUTREACH PIPELINE STATUS [${CAMPAIGN_LABEL}] ===\n`);
  console.log(`Total leads:     ${total[0].count}`);
  console.log(`With email:      ${withEmail[0].count}`);
  console.log(`Sent today:      ${sentToday[0].count}`);
  console.log('\nBreakdown:');

  for (const row of stats) {
    console.log(`  ${row.status} (step ${row.outreach_step}): ${row.count}`);
  }

  // Show warm-up phase
  const firstSend = await sql`
    SELECT MIN(last_email_sent) as first FROM leads WHERE last_email_sent IS NOT NULL AND campaign = ${CAMPAIGN}
  `;

  if (firstSend[0].first) {
    const daysSinceFirst = Math.floor((Date.now() - new Date(firstSend[0].first).getTime()) / 86400000);
    const phase = WARMUP_SCHEDULE.find(w => daysSinceFirst >= w.daysMin && daysSinceFirst <= w.daysMax);
    console.log(`\nWarm-up day: ${daysSinceFirst} → Max ${phase?.maxPerDay || 20} emails/day`);
  } else {
    console.log('\nWarm-up: Not started yet (0 emails sent)');
  }
}

async function getDailyLimit() {
  const firstSend = await sql`
    SELECT MIN(last_email_sent) as first FROM leads WHERE last_email_sent IS NOT NULL AND campaign = ${CAMPAIGN}
  `;

  if (!firstSend[0].first) return WARMUP_SCHEDULE[0].maxPerDay;

  const daysSinceFirst = Math.floor((Date.now() - new Date(firstSend[0].first).getTime()) / 86400000);
  const phase = WARMUP_SCHEDULE.find(w => daysSinceFirst >= w.daysMin && daysSinceFirst <= w.daysMax);
  return phase?.maxPerDay || 20;
}

async function getLeadsToEmail() {
  const dailyLimit = await getDailyLimit();

  // Count already sent today (per campaign)
  const sentToday = await sql`
    SELECT COUNT(*)::int as count FROM leads
    WHERE last_email_sent::date = CURRENT_DATE AND campaign = ${CAMPAIGN}
  `;

  const remaining = dailyLimit - sentToday[0].count;
  if (remaining <= 0) {
    console.log(`Daily limit reached (${dailyLimit}/day for ${CAMPAIGN_LABEL}). Try again tomorrow.`);
    return [];
  }

  // Get leads ready for next email (filtered by campaign)
  const leads = await sql`
    SELECT * FROM leads
    WHERE email IS NOT NULL AND email != ''
      AND campaign = ${CAMPAIGN}
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
    LIMIT ${remaining}
  `;

  return leads;
}

async function sendEmail(lead, step) {
  const template = step === 0 ? TEMPLATES.email1 : step === 1 ? TEMPLATES.email2 : TEMPLATES.email3;
  const subject = template.subject(lead);
  const body = template.body(lead);

  // Check blacklist
  const domain = lead.email.split('@')[1]?.toLowerCase();
  if (BLACKLIST.some(b => domain?.includes(b))) {
    console.log(`  SKIPPED (blacklisted): ${lead.email}`);
    return false;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [lead.email],
      reply_to: REPLY_TO,
      subject,
      text: body
    })
  });

  const result = await res.json();

  if (result.id) {
    // Update lead in DB (store Resend message ID for webhook matching)
    await sql`
      UPDATE leads SET
        outreach_step = ${step + 1},
        status = 'contacted',
        last_email_sent = NOW(),
        resend_message_id = ${result.id},
        updated_at = NOW()
      WHERE id = ${lead.id}
    `;
    return true;
  } else {
    console.log(`  ERROR: ${JSON.stringify(result)}`);
    if (result.statusCode === 422 || result.message?.includes('bounce')) {
      await sql`UPDATE leads SET status = 'bounced', updated_at = NOW() WHERE id = ${lead.id}`;
    }
    return false;
  }
}

async function runOutreach(dryRun = true) {
  // Skip weekends — business emails Mon-Fri only
  const day = new Date().getDay();
  if (day === 0 || day === 6) {
    console.log('Weekend — skipping sends. Business emails sent Mon-Fri.');
    return;
  }

  const leads = await getLeadsToEmail();

  if (leads.length === 0) {
    console.log(`No leads ready to email right now [${CAMPAIGN_LABEL}].`);
    return;
  }

  console.log(`\n${dryRun ? '=== DRY RUN ===' : '=== SENDING ==='} [${CAMPAIGN_LABEL}]`);
  console.log(`${leads.length} leads ready:\n`);

  let sent = 0;
  for (const lead of leads) {
    const step = lead.outreach_step;
    const templateName = step === 0 ? 'Email 1 (Intro)' : step === 1 ? 'Email 2 (Follow-up)' : 'Email 3 (Breakup)';

    console.log(`  ${lead.first_name} ${lead.last_name} | ${lead.company} | ${lead.email} → ${templateName}`);

    if (!dryRun) {
      const success = await sendEmail(lead, step);
      if (success) {
        sent++;
        console.log(`    ✓ Sent`);
      }
      // Staggered sending: random 3-8 second delay between emails
      const delay = 3000 + Math.random() * 5000;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  if (dryRun) {
    console.log(`\nDry run complete. Run with --send to actually send ${leads.length} emails.`);
  } else {
    console.log(`\nSent ${sent}/${leads.length} emails.`);
  }
}

async function loadFromFile(filePath) {
  const { readFileSync } = await import('fs');
  const leads = JSON.parse(readFileSync(filePath, 'utf8'));

  let inserted = 0;
  let skipped = 0;

  for (const lead of leads) {
    if (!lead.email) { skipped++; continue; }

    const domain = lead.email.split('@')[1]?.toLowerCase();
    if (BLACKLIST.some(b => domain?.includes(b))) { skipped++; continue; }

    const tagValue = CAMPAIGN === 'weight-ticket' ? '{weight_ticket,batch_1}' : '{contractor_crm,batch_2}';

    try {
      await sql`
        INSERT INTO leads (apollo_id, first_name, last_name, email, phone, title, company, company_website, industry, city, state, employee_count, source, status, tags, campaign)
        VALUES (
          ${lead.apollo_id}, ${lead.first_name}, ${lead.last_name}, ${lead.email},
          ${lead.phone || null}, ${lead.title}, ${lead.company}, ${lead.website || null},
          ${lead.industry || null}, ${lead.city}, ${lead.state}, ${lead.employees || null},
          'apollo', 'new', ${tagValue}, ${CAMPAIGN}
        )
        ON CONFLICT (apollo_id) DO NOTHING
      `;
      inserted++;
    } catch(e) {
      skipped++;
    }
  }

  console.log(`Loaded [${CAMPAIGN_LABEL}]: ${inserted} inserted, ${skipped} skipped`);
}

// ============================================================================
// CLI
// ============================================================================

if (args.includes('--status')) {
  await getStatus();
} else if (args.includes('--send')) {
  await runOutreach(false);
} else if (args.includes('--warmup')) {
  // Same as --send but explicitly limited
  await runOutreach(false);
} else if (args.includes('--load')) {
  const filePath = args[args.indexOf('--load') + 1];
  if (!filePath) {
    console.log('Usage: --load /path/to/leads.json');
  } else {
    await loadFromFile(filePath);
  }
} else {
  // Default: dry run
  await runOutreach(true);
}

await sql.end();
