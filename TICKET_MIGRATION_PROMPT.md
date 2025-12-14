# Support Ticket Migration - CRM & Better Systems AI Sync

## Overview

Here are 7 support tickets that were previously submitted via email and need to be migrated into the database. These tickets should populate in BOTH systems:

1. **CRM Proposal System** (client-facing support tickets)
2. **Better Systems AI Admin Dashboard** (internal ticket management)

The tickets need to be synchronized between both applications so that updates in one system reflect in the other.

---

## Database Schema Requirements

The support tickets table should have these fields:

```sql
CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  submitted_by VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  category VARCHAR(50),
  project_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Ticket Data - Exact as Submitted

### Ticket #1: Deals Vs Agreement
- **Subject:** Deals Vs Agreement
- **Submitted By:** Micah Izquierdo
- **Contact Email:** micahizquierdo13@gmail.com
- **Submitted At:** 2025-12-13T22:54:39.772Z
- **Project:** CRM Proposal System
- **Priority:** High
- **Category:** Feature Request
- **Status:** Open

**Full Message:**
```
Hey Rodolfo - any way DEALS could just be the jobs with SIGNED agreements?

Agreements - agreements sent out

Deals - Deals sold and Contracts finalized - *filterable by rep*

Proposals - NEW - Any/all proposals generated with a full list of all proposals out. **Also filterable by rep*

I believe this will remove any confusion on what is a solid deal, what is a proposal and what is a legitimate signed contract we can execute and install on. please lmk if any issues with this idea *filterable by rep*

Only filterable by rep available for admin users. This will let us track who's busy and who's not!
```

**Brief Description:** Reorganize the workflow to have three distinct sections: Proposals (all generated), Agreements (sent out), and Deals (signed contracts only). Add rep filtering to Proposals and Deals pages for admin users to track individual rep activity.

---

### Ticket #2: Photos not expanding
- **Subject:** Photos not expanding
- **Submitted By:** Micah Izquierdo
- **Contact Email:** micahizquierdo13@gmail.com
- **Submitted At:** 2025-12-13T22:39:45.498Z
- **Project:** CRM Proposal System
- **Priority:** High
- **Category:** Bug
- **Status:** Open

**Full Message:**
```
On the photo section for deals the photos were not loading when I clicked on them as it took me to another page to view. Unsure if this is a bug or programming but when deal was sold I was unable to verify a paint match because the photos wouldn't pop up for me to view
```

**Brief Description:** Bug where photos in the deals section don't load or expand when clicked, preventing verification of paint matches and other visual details.

---

### Ticket #3: Rep Filter
- **Subject:** Rep Filter
- **Submitted By:** Micah Izquierdo
- **Contact Email:** micahizquierdo13@gmail.com
- **Submitted At:** 2025-12-13T22:38:58.201Z
- **Project:** CRM Proposal System
- **Priority:** Medium
- **Category:** Feature Request
- **Status:** Open

**Full Message:**
```
On deals sold - can we please have a dropdown of users that allows us to filter based off who's deal it is? I had a rep ask me about his projects. When we have hundreds - it would be nice to simply select their name and see only their projects so I can discuss with them only their projects and know for sure it is theirs.
```

**Brief Description:** Add a dropdown filter on the deals page to filter by sales rep, making it easier to review individual rep's projects and have targeted discussions.

---

### Ticket #4: Remove On Quoting
- **Subject:** Remove On Quoting
- **Submitted By:** Micah Izquierdo
- **Contact Email:** micahizquierdo13@gmail.com
- **Submitted At:** 2025-12-13T22:37:27.386Z
- **Project:** CRM Proposal System
- **Priority:** High
- **Category:** Feature Request
- **Status:** Open

**Full Message:**
```
Reps are getting confused with the power supply and control box costs. Can we please remove those from the quoting section of the process? We are charging reps at a cost per linear foot and the cost is included in their redline. I am asking to remove this to remove confusion for reps. I confirmed this one with Vince as well. He agreed we should get rid of it
```

**Brief Description:** Remove power supply and control box line items from the quoting interface as they're already included in the per-linear-foot cost and causing confusion among sales reps.

---

### Ticket #5: New Deal Workflow Verification
- **Subject:** New Deal Workflow Verification
- **Submitted By:** Micah Izquierdo
- **Contact Email:** micahizquierdo13@gmail.com
- **Submitted At:** 2025-12-13T22:36:14.020Z
- **Project:** CRM Proposal System
- **Priority:** High
- **Category:** Bug
- **Status:** Open

**Full Message:**
```
I have not seen any emails come in from the new deal email except for your test. I believe we had deals sign this week and I did not get an email. Can you please verify it is indeed working?
```

**Brief Description:** Email notifications for new signed deals are not being received. Need to verify and fix the automated email workflow when deals are signed.

---

### Ticket #6: Contract Value - Discounts
- **Subject:** Contract Value - Discounts
- **Submitted By:** Micah Izquierdo
- **Contact Email:** micahizquierdo13@gmail.com
- **Submitted At:** 2025-12-13T22:35:38.968Z
- **Project:** CRM Proposal System
- **Priority:** High
- **Category:** Bug
- **Status:** Open

**Full Message:**
```
When a sales rep gives discounts - the total contract value on deals shows the price before the discounts. Can we please make it so that the total contract value shows the price AFTER the discounts have been applied?
```

**Brief Description:** The total contract value displayed on deal cards shows the pre-discount price instead of the final price after discounts. Need to fix the calculation to show the actual final amount.

---

### Ticket #7: Sending User Invites
- **Subject:** Sending User Invites
- **Submitted By:** Micah Izquierdo
- **Contact Email:** micahizquierdo13@gmail.com
- **Submitted At:** 2025-12-13T22:34:41.081Z
- **Project:** CRM Proposal System
- **Priority:** Medium
- **Category:** Feature Request
- **Status:** Open

**Full Message:**
```
Hey Rodolfo

As an admin - I can only send admin invites. Can I have the ability as well as other admins to send out USER invites?
```

**Brief Description:** Currently admins can only send admin invites. Need to add functionality for admins to also send USER role invites for regular team members.

---

## Synchronization Requirements

### Between CRM Proposal System and Better Systems AI Admin

1. **Ticket Creation:**
   - When a ticket is submitted in the CRM, it should automatically appear in the Better Systems AI admin dashboard
   - When a ticket is created in Better Systems AI admin, it should sync to the CRM if it's project-related

2. **Ticket Updates:**
   - Status changes (open → in progress → resolved → closed)
   - Priority changes
   - Assignee changes
   - Comments/notes added

3. **Real-time Sync:**
   - Use webhooks or polling to keep both systems in sync
   - Changes in one system should reflect in the other within seconds

4. **User Mapping:**
   - "Micah Izquierdo" (micahizquierdo13@gmail.com) is a user in the CRM system
   - Map CRM users to Better Systems AI admin users for proper attribution

5. **Project Association:**
   - All these tickets are associated with "CRM Proposal System" project
   - Tickets should be filterable by project in both systems

---

## Import Instructions

### Step 1: Create Database Table
Run the SQL schema above to create the `support_tickets` table if it doesn't exist.

### Step 2: Import Ticket Data
Use the SQL file provided (`support-tickets-export.sql`) or import via JSON/CSV.

### Step 3: Set Up Sync Mechanism
- Configure webhook endpoints between CRM and Better Systems AI admin
- Implement ticket sync service that listens for updates
- Add API endpoints for ticket CRUD operations in both systems

### Step 4: Verify Import
Check that all 7 tickets appear in both:
- CRM Proposal System ticket interface
- Better Systems AI admin dashboard

### Step 5: Test Synchronization
1. Update a ticket status in CRM → verify it updates in admin
2. Add a comment in admin → verify it appears in CRM
3. Change priority in CRM → verify it syncs to admin

---

## Expected Behavior After Migration

1. **In CRM Proposal System:**
   - Users can view tickets related to their projects
   - Admins can see all tickets
   - Users can create new tickets
   - Ticket status updates sync to admin

2. **In Better Systems AI Admin:**
   - All tickets visible in centralized dashboard
   - Can assign tickets to team members
   - Can update status, priority, category
   - Can add internal notes
   - Changes sync back to CRM

3. **Notifications:**
   - Email notifications when ticket status changes
   - Notifications when tickets are assigned
   - Updates sent to ticket submitter

---

## Additional Context

- **Client:** Desert Moon Lighting (using CRM Proposal System)
- **Primary Contact:** Micah Izquierdo (Operations Manager)
- **Submitted:** December 13, 2025 (all 7 tickets within 20 minutes)
- **Original Source:** Email forwarding system (now being replaced with database storage)

These tickets represent real user feedback and feature requests that need to be tracked, prioritized, and implemented. The synchronization between systems ensures that both the client-facing CRM and the internal Better Systems AI admin have up-to-date ticket information.

---

## Files Available

1. **JSON Format:** `support-tickets-export.json` (programmatic import)
2. **SQL Format:** `support-tickets-export.sql` (direct database import)
3. **CSV Format:** `support-tickets-export.csv` (bulk import tools)

All files located in: `/Users/rodolfoalvarez/Documents/Better Systems AI/BetterSystems.ai/`
