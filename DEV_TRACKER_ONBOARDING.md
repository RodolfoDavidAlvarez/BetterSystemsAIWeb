# Developer Tracker — Onboarding Guide

Production system to assign work to developers and track full lifecycle: **delivered → shipped → invoiced → paid**.

## URLs

| What | Where |
|---|---|
| Workspace (landing for devs and admin) | https://www.bettersystems.ai/workspace |
| Tracker (full view) | https://www.bettersystems.ai/dev-tracker.html |
| Login | https://www.bettersystems.ai/admin/login |
| API base | https://www.bettersystems.ai/api/dev-tracker |

## Default credentials

> Change immediately when sharing externally.

| User | Email | Password | Role |
|---|---|---|---|
| Rodo (you) | `rodolfo@bettersystems.ai` | `password123` | admin |
| Alejandra (first dev) | `developer@bettersystems.ai` | `devpass2026` | developer |

**Single identifier** — login takes the email. No separate username to remember.

## What admin sees

- Full workspace at `/workspace` with three tabs: **Brief** (overview), **Resources**, **Tracker** (full embedded)
- Or open `/dev-tracker.html` directly for the deep view
- Every item across every project, every contributor
- Per-item assignment dropdown (admin only)
- "Manage developers" modal: add devs, reset passwords, change role, delete
- Lifecycle pills on every item (D / S / I / P) — click to set delivered/invoiced/paid timestamps
- Bulk-edit (status / version / category / charged / delete)

## What a developer sees

- Lands at `/workspace` after login
- Sees their assigned items only — scoped server-side, not just hidden
- Can change status (open → building → shipped → passing/failing)
- Can add and resolve notes
- Cannot create, delete, reassign, or set lifecycle dates

## Lifecycle model

Every item moves through four optional gates:

| Stage | Trigger | Stored as | Color |
|---|---|---|---|
| **Delivered** | Admin clicks "D" pill — work is handed off | `delivered_at` timestamp | green |
| **Shipped** | Status set to `shipped` — auto-stamps `deployed_at` | `deployed_at` timestamp | electric blue |
| **Invoiced** | Admin clicks "I" pill, enters invoice number | `invoiced_at` + `invoice_number` | orange |
| **Paid** | Admin clicks "P" pill OR Stripe webhook fires | `paid_at` + `stripe_charge_id` | gold |

Internal BSA work (no client invoice) just shows D + S filled — that's fine, no money flow expected.

## Onboarding a new developer (start to finish)

1. Log in as Rodo at https://www.bettersystems.ai/workspace
2. Open the **Tracker** tab → click **"Manage developers"** in the tracker top bar
3. Fill the "Add a developer" form:
   - Full name
   - Email (becomes their login)
   - Initial password (give them something they can change)
   - Role: `developer`
4. Hit **Add user** — credentials shown in popup to copy and send
5. For each item you want them on, pick their email in the per-item assignee dropdown
6. Send them: login URL + email + temp password

## Database

| Table | Purpose |
|---|---|
| `bettersystems.users` | Login accounts. `username` column holds the email value. |
| `qa_items` | Tracker items. Lifecycle columns: `delivered_at`, `deployed_at`, `tested_at`, `invoiced_at`, `paid_at`, `invoice_number`, `stripe_charge_id`, `assignee` |
| `qa_notes` | Append-only notes per item |

## API surface

| Method | Path | Roles |
|---|---|---|
| GET | `/api/dev-tracker/items[?project=...]` | admin, developer (devs scoped to their assignee) |
| GET | `/api/dev-tracker/projects` | all |
| POST | `/api/dev-tracker/items` | admin |
| PATCH | `/api/dev-tracker/items/:id` | admin (any field), developer (status only) |
| DELETE | `/api/dev-tracker/items/:id` | admin |
| **POST** | **`/api/dev-tracker/items/:id/mark-paid`** | **admin** — convenience, accepts `{ invoice_number, stripe_charge_id }` |
| POST | `/api/dev-tracker/items/:id/notes` | all |
| PATCH | `/api/dev-tracker/items/:id/notes/:noteId` | all |
| GET | `/api/dev-tracker/users` | admin |
| POST | `/api/dev-tracker/users` | admin |
| PATCH | `/api/dev-tracker/users/:id` | admin |
| DELETE | `/api/dev-tracker/users/:id` | admin (cannot self-delete) |

## Real-time

Frontend polls every 30 seconds. Devs and admin see updates within ~30s of any change.

---

## Scope to confirm with Alejandra

Once you sync with her, fill these in and I can pre-create the tracker items for her:

- [ ] Hourly rate or monthly retainer
- [ ] Hours per week / availability
- [ ] First project (Heritage Headquarters?) — confirm scope
- [ ] Claude Code subscription billing — who pays, how, when
- [ ] Communication channel (Slack? email? what cadence?)
- [ ] How status reports back to you (weekly check-in? she just updates the tracker?)

Once confirmed, ask Claude to:
1. Pre-create the agreed scope items in the tracker, assigned to her
2. Update this doc's "Scope" section with the locked-in terms
3. Send her a welcome email with creds + a link to her workspace
