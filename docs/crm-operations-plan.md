# CRM Control Hub Plan

## How to view the new UI
- Run the client (`npm run dev` from `client` or `npm run dev` from repo root) and open `http://localhost:5173`.
- Click the dot `·` in the footer to open the admin login. Credentials are prefilled; click **Login**.
- Navigate to `/admin/plan` (also linked from the dashboard quick actions as "Operations Plan").

## What was built
- New admin page: **CRM Control Hub** (`client/src/pages/admin/OperationsPlanPage.tsx`).
- Surfaces financials, onboarding pipeline, automation stack, roadmap, lead snapshots, and folder-driven updates in one view.
- Explicit badges show **Real data** vs **Sample data** on every dataset.
- Dashboard card added to reach the plan quickly.

## Data sources reviewed (real)
- `Proposal CRM System /balance_summary_desert_moon_crm_updated.html`
- `Proposal CRM System /Documents/Sample Balance Summay and New Development Hours Cost.html`
- `Proposal CRM System /CRM Lighting Proposal/PROJECT_PLAN.md`
- `Proposal CRM System /CRM Lighting Proposal/SESSION_NOTES.md` (Dec 1, 2025)
- `Proposal CRM System /CRM Lighting Proposal/CLIENT_IMPROVEMENTS_SUMMARY.md`
- `Proposal CRM System /CRM Lighting Proposal/PROPOSAL_CONTRACT_FLOW.md`
- `Proposal CRM System /Updates/Proposal-Builder-Lighting-CRM-Project, Update 3.pdf`

## Real data represented in the UI
- **Desert Moon Lighting CRM** balance & invoices: Paid $3,834.75, outstanding $4,937.75, advancement invoice pending ($2,000).
- **Hours & cost logged**: 46.5 hrs @ $65/hr ($3,022.50) across multi-company logic, multi-rep roles, deal workflow, remote signature links, and QuickBooks integration (in progress).
- **Progress references**: Development breakdown and updates pulled from the balance summary + session notes above.

## Sample data represented
- Onboarding queue (NDA → Account Form → SOW) steps and channels.
- Lead pipeline records beyond Desert Moon (Coastal Resorts, Metro Facilities Group).
- Upcoming Stripe invoice flow task and automation placeholders (GitHub feed, email ingestion).

## Roadmap (mirrors the UI cards)
1) **Phase 1 — Billing & Documents (Active)**
   - Hook Stripe test keys; create/send advancement invoices from dashboard.
   - Wire NDA, Account Form, and SOW templates with PDF export.
   - Keep source labeling (real vs sample) visible everywhere.
2) **Phase 2 — Onboarding Automation (Queued)**
   - Sequenced NDA → Account Form → SOW with Resend-based follow-ups and signature reminders.
   - Progress dashboard per client.
3) **Phase 3 — Lead Capture & Nurturing (Queued)**
   - Landing page → CRM pipeline with lead scoring, template library for nurture emails, sequence analytics.
4) **Phase 4 — Integrations & AI Assist (Future)**
   - GitHub commits/PRs per project, optional Gmail/IMAP sync, AI quoting and summary drafts.

## Immediate next moves
- Add Stripe keys + webhook to activate the **Prepare advancement invoice** button.
- Bind NDA / Account Form / SOW templates to the onboarding queue cards.
- Map GitHub + email ingestion to the delivery timeline once credentials are ready.
- Keep updating this page as the single source of truth for the plan.
