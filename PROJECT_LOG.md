# BetterSystems.ai - Project Log

## Current Focus: Admin Panel CRM & Cold Outreach Automation

---

## VISION: Fully Autonomous Cold Email System

### The Goal
Build a fully autonomous cold email outreach system that:
1. **Verifies emails** before sending (ZeroBounce) to maintain domain reputation
2. **Sends personalized cold emails** via Gmail MCP (so they appear in Sent folder)
3. **Auto-follows up** with 3-email sequences (configurable timing)
4. **Uses AI (Claude)** to:
   - Classify incoming replies (interested, not interested, question, etc.)
   - Generate contextual follow-up responses
   - Auto-label leads based on engagement
5. **Tracks costs** (ZeroBounce credits, Claude API usage)
6. **Monitors domain health** (bounce rate, spam complaints)
7. **Shows everything in a spreadsheet-style dashboard** in admin panel

### Pipeline Stages
| Stage | Description |
|-------|-------------|
| Cold Lead | New lead, not yet verified |
| Verified | Email verified as valid |
| Contacted | Initial email sent |
| Warm Lead | Engaged (opened/clicked) |
| Interested | Replied with positive intent |
| Booked Call | Scheduled discovery call |
| Converted | Became a paying client |
| Not Interested | Declined or unsubscribed |
| Bounced | Invalid email address |

### Cost Tracking
- **ZeroBounce**: 100 free credits/month, then $0.008/verification
- **Claude Haiku**: ~$0.00025/1k tokens (for classification)
- **Claude Sonnet**: ~$0.003/1k tokens (for response generation)
- Dashboard shows estimated costs per campaign

---

## January 15, 2026 - Session Updates

### Cold Outreach System Built
**Location**: `../Cold Outreach System/automation/`

**Components Created:**
| File | Purpose |
|------|---------|
| `cold-email-automation.js` | Main automation script |
| `verify-all-leads.js` | Standalone email verification |
| `ai-responder.js` | Claude AI for reply handling |
| `daily-runner.js` | Generates daily status reports |
| `send-admin-report.js` | Emails report to admin |
| `.env` | API keys (ZeroBounce, Anthropic) |

**Database Columns Added to `clients` Table:**
```sql
email_verified BOOLEAN DEFAULT FALSE
email_verification_result TEXT
email_sequence_step INTEGER DEFAULT 0
last_email_sent TIMESTAMP
next_followup_date DATE
ai_handling BOOLEAN DEFAULT FALSE
last_reply_at TIMESTAMP
```

**Verification Results (60 leads):**
- 22 Valid
- 2 Catch-all (safe to send)
- 31 Do Not Mail (role-based emails)
- 5 Invalid
- **24 safe to send total**

### Admin Panel Updates

**New API Endpoints:**
```
GET  /api/admin/cold-outreach/leads    - All cold outreach leads
GET  /api/admin/cold-outreach/metrics  - Health metrics + costs
GET  /api/admin/cold-outreach/report   - Daily activity report
PUT  /api/admin/cold-outreach/leads/:id - Update lead status
POST /api/admin/cold-outreach/leads/:id/toggle-automation - Pause/resume
POST /api/admin/cold-outreach/bulk-update - Bulk update leads
```

**Files Modified:**
- `server/controllers/coldOutreach.ts` - NEW: Cold outreach controller with cost tracking
- `server/controllers/campaigns.ts` - Email sequence controller
- `server/routes.ts` - Added cold outreach + campaign routes
- `client/src/pages/admin/CampaignsPage.tsx` - Campaign management UI
- `client/src/pages/admin/ClientsPage.tsx` - Compact spreadsheet view
- `client/src/App.tsx` - VoiceWidget only on homepage
- `.env` - Added ANTHROPIC_API_KEY

**Vercel Environment Variables Added:**
- `ANTHROPIC_API_KEY` - For Claude AI integration

### UI Polish
- Clients page now compact spreadsheet-style
- Label dropdowns cleaned up (transparent, minimal)
- VoiceWidget removed from admin pages (homepage only)

---

## Next Steps (Campaigns Page Redesign)

### Requirements from Rodo:
1. **Spreadsheet-style view** - See all cold outreach leads at a glance
2. **Pipeline status tracking** - Visual stages (cold → warm → interested → booked)
3. **Email verification status** - Show verification result per lead
4. **Health metrics card** - Bounce rate, domain health, costs
5. **Follow-up automation controls** - Pause/resume per lead or globally
6. **Success metrics** - Candidates to book, booked calls, conversions
7. **Cost display** - ZeroBounce and Claude costs

### Pending Implementation:
- [ ] Build new CampaignsPage with spreadsheet view
- [ ] Add health metrics card with expandable details
- [ ] Add pipeline stage selector (dropdown per row)
- [ ] Add bulk actions (pause all, resume all, mark as X)
- [ ] Test deployment login (was having issues)
- [ ] Deploy to Vercel production

---

## Architecture Overview

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + TypeScript, Vite |
| Backend | Express.js, Node.js |
| Database | PostgreSQL + Drizzle ORM |
| Email Sending | Gmail MCP (rodolfo@bettersystems.ai) |
| Email Verification | ZeroBounce API |
| AI Classification | Claude Haiku |
| AI Responses | Claude Sonnet |
| Transactional Email | Resend API |
| Styling | TailwindCSS + Radix UI |
| Hosting | Vercel |

## Key Admin Routes

| Route | Page |
|-------|------|
| `/admin/dashboard` | Main dashboard |
| `/admin/clients` | Contact CRM |
| `/admin/deals` | Deal pipeline |
| `/admin/campaigns` | Email campaigns + cold outreach |
| `/admin/billing` | Stripe integration |
| `/admin/emails` | Email logs |
| `/admin/tickets` | Support tickets |

---

## Database Schema

### email_sequences (existing)
```sql
CREATE TABLE email_sequences (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  campaign_name TEXT NOT NULL DEFAULT 'default',
  product_focus TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  max_steps INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'active',
  last_email_sent_at TIMESTAMP,
  next_email_due_at TIMESTAMP,
  days_between_emails INTEGER NOT NULL DEFAULT 1,
  response_detected_at TIMESTAMP,
  gmail_thread_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, campaign_name)
);
```

### clients table cold outreach columns
```sql
ALTER TABLE clients ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN email_verification_result TEXT;
ALTER TABLE clients ADD COLUMN email_sequence_step INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN last_email_sent TIMESTAMP;
ALTER TABLE clients ADD COLUMN next_followup_date DATE;
ALTER TABLE clients ADD COLUMN ai_handling BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN last_reply_at TIMESTAMP;
```

---

*Last Updated: January 15, 2026*
