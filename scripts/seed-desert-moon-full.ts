/**
 * Seed script to populate Desert Moon Lighting CRM deal with:
 * - Updated deal value and stage
 * - Stakeholder roles and billing preferences
 * - Historical invoices (3 from billing history)
 * - Development work as resolved support tickets
 */

import { db } from "../db";
import { deals, dealStakeholders, invoices, supportTickets, clients } from "../db/schema";
import { eq, and } from "drizzle-orm";

async function seedDesertMoonData() {
  console.log("🚀 Starting Desert Moon Lighting CRM data seed...\n");

  try {
    // ==================== 1. UPDATE DEAL ====================
    console.log("📋 Updating deal record...");

    const [updatedDeal] = await db
      .update(deals)
      .set({
        name: "Desert Moon Lighting CRM",
        description: "Full CRM system with proposal builder, multi-company support (Desert Moon Lighting + Desert Mist Arizona), QuickBooks integration, remote signature links, and mobile optimization.",
        value: "8772.50",
        stage: "active",
        hourlyRate: "65",
        priority: "high",
        probability: 100,
        notes: `PROJECT VALUE BREAKDOWN:
- Original Contract: $3,575.00
- Scope Increase (New Features): $2,175.00
- Development Hours (46.5 hrs @ $65/hr): $3,022.50
- TOTAL: $8,772.50

PAYMENT HISTORY:
- June 4, 2025: $1,787.50 (50% deposit) - PAID
- June 24, 2025: $2,047.25 (Invoice QDANPTMD-0001) - PAID
- Nov 11, 2025: $2,000.00 (Advancement Invoice) - PENDING
- Remaining: $2,937.75 - Not yet invoiced

DEVELOPMENT PERIOD: October 7 - November 11, 2025 (46.5 billable hours)`,
        source: "real",
        updatedAt: new Date(),
      })
      .where(eq(deals.id, 1))
      .returning();

    console.log(`   ✅ Deal updated: ${updatedDeal.name} - Value: $${updatedDeal.value}`);

    // ==================== 2. GET CLIENT IDS ====================
    console.log("\n👥 Fetching client IDs...");

    const clientsData = await db
      .select({ id: clients.id, name: clients.name, email: clients.email })
      .from(clients)
      .where(eq(clients.status, "active"));

    const mikeMazick = clientsData.find(c => c.email === "mmazick@nssaz.com");
    const micahIzquierdo = clientsData.find(c => c.email === "micah@independentsolar.com");
    const vinceLoStorto = clientsData.find(c => c.email.toLowerCase() === "vincelostorto@yahoo.com");
    const justinCoonrod = clientsData.find(c => c.email === "justincoonrod@gmail.com");

    console.log(`   Found: Mike (${mikeMazick?.id}), Micah (${micahIzquierdo?.id}), Vince (${vinceLoStorto?.id}), Justin (${justinCoonrod?.id})`);

    // ==================== 3. UPDATE STAKEHOLDERS ====================
    console.log("\n🔗 Updating stakeholder roles and preferences...");

    // All 4 partners are authorizers AND receive both updates AND billing notifications

    // Mike Mazick - Financial Decision Maker - receives billing
    if (mikeMazick) {
      await db
        .update(dealStakeholders)
        .set({
          role: "authorizer",
          isPrimary: false,
          receivesUpdates: true,
          receivesBilling: true, // All 4 get billing
          notes: "Financial decision maker. Handles all payments via Stripe.",
        })
        .where(and(
          eq(dealStakeholders.dealId, 1),
          eq(dealStakeholders.clientId, mikeMazick.id)
        ));
      console.log("   ✅ Mike Mazick: authorizer, updates=true, billing=true");
    }

    // Micah Izquierdo - Executor/Authorizer
    if (micahIzquierdo) {
      await db
        .update(dealStakeholders)
        .set({
          role: "authorizer",
          isPrimary: false,
          receivesUpdates: true,
          receivesBilling: true, // All 4 get billing
          notes: "Action-oriented executor. Gets things done. Main point of contact for feature requests.",
        })
        .where(and(
          eq(dealStakeholders.dealId, 1),
          eq(dealStakeholders.clientId, micahIzquierdo.id)
        ));
      console.log("   ✅ Micah Izquierdo: authorizer, updates=true, billing=true");
    }

    // Vince Lo Storto - Technical Lead/Authorizer (Primary)
    if (vinceLoStorto) {
      await db
        .update(dealStakeholders)
        .set({
          role: "authorizer",
          isPrimary: true, // Primary contact
          receivesUpdates: true,
          receivesBilling: true, // All 4 get billing
          notes: "Technical lead. Primary contact for development discussions and feature prioritization.",
        })
        .where(and(
          eq(dealStakeholders.dealId, 1),
          eq(dealStakeholders.clientId, vinceLoStorto.id)
        ));
      console.log("   ✅ Vince Lo Storto: authorizer (PRIMARY), updates=true, billing=true");
    }

    // Justin Coonrod - Authorizer
    if (justinCoonrod) {
      await db
        .update(dealStakeholders)
        .set({
          role: "authorizer",
          isPrimary: false,
          receivesUpdates: true,
          receivesBilling: true, // All 4 get billing
          notes: "Partner and authorizer for major decisions.",
        })
        .where(and(
          eq(dealStakeholders.dealId, 1),
          eq(dealStakeholders.clientId, justinCoonrod.id)
        ));
      console.log("   ✅ Justin Coonrod: authorizer, updates=true, billing=true");
    }

    // ==================== 4. INSERT HISTORICAL INVOICES ====================
    console.log("\n💰 Inserting historical invoices...");

    // Check if invoices already exist
    const existingInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.dealId, 1));

    if (existingInvoices.length === 0) {
      // Invoice 1: 50% Deposit - PAID
      await db.insert(invoices).values({
        clientId: mikeMazick?.id || 4,
        dealId: 1,
        invoiceNumber: "DML-2025-001",
        description: "Desert Moon Lighting CRM - 50% Deposit",
        subtotal: "1787.50",
        tax: "0",
        total: "1787.50",
        amountPaid: "1787.50",
        amountDue: "0",
        currency: "usd",
        status: "paid",
        dueDate: new Date("2025-06-04"),
        paidAt: new Date("2025-06-04"),
        lineItems: JSON.stringify([
          { description: "CRM System Development - 50% Deposit", amount: 1787.50, quantity: 1 }
        ]),
      });
      console.log("   ✅ Invoice DML-2025-001: $1,787.50 (PAID June 4)");

      // Invoice 2: QDANPTMD-0001 - PAID
      await db.insert(invoices).values({
        clientId: mikeMazick?.id || 4,
        dealId: 1,
        invoiceNumber: "QDANPTMD-0001",
        description: "Desert Moon Lighting CRM - Development Progress Payment",
        subtotal: "2047.25",
        tax: "0",
        total: "2047.25",
        amountPaid: "2047.25",
        amountDue: "0",
        currency: "usd",
        status: "paid",
        dueDate: new Date("2025-06-24"),
        paidAt: new Date("2025-06-24"),
        lineItems: JSON.stringify([
          { description: "Development milestone - Multi-company setup + permissions", amount: 2047.25, quantity: 1 }
        ]),
      });
      console.log("   ✅ Invoice QDANPTMD-0001: $2,047.25 (PAID June 24)");

      // Invoice 3: Advancement - PENDING
      await db.insert(invoices).values({
        clientId: mikeMazick?.id || 4,
        dealId: 1,
        invoiceNumber: "DML-2025-003",
        description: "Desert Moon Lighting CRM - Development Advancement",
        subtotal: "2000.00",
        tax: "0",
        total: "2000.00",
        amountPaid: "0",
        amountDue: "2000.00",
        currency: "usd",
        status: "open",
        dueDate: new Date("2025-11-25"),
        lineItems: JSON.stringify([
          { description: "Advancement payment - Ongoing development work", amount: 2000.00, quantity: 1 }
        ]),
      });
      console.log("   ✅ Invoice DML-2025-003: $2,000.00 (PENDING)");
    } else {
      console.log(`   ⏭️  Skipped: ${existingInvoices.length} invoices already exist`);
    }

    // ==================== 5. INSERT SUPPORT TICKETS (Development Work) ====================
    console.log("\n🎫 Inserting development work as support tickets...");

    const existingTickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.dealId, 1));

    if (existingTickets.length === 0) {
      const developmentWork = [
        {
          title: "Multi-Company Logic & Domain Setup",
          description: "Configure separate entities for Desert Moon Lighting vs. Desert Mist Arizona with dynamic content and pricing logic per LLC. Domain-specific branding.",
          requestor: "Vince",
          hours: 6.0,
          status: "billed" as const
        },
        {
          title: "Multi-Rep Permissions & Roles",
          description: "Admin access to all proposals/records. User-level restriction to own proposals only. Privacy controls implemented.",
          requestor: "Mike",
          hours: 2.0,
          status: "billed" as const
        },
        {
          title: "Deal Management / Install-Close Workflow",
          description: "Project timeline tracking. Install date picker functionality. Completion schedule with date selection.",
          requestor: "Micah",
          hours: 7.0,
          status: "billed" as const
        },
        {
          title: "Archive System",
          description: "Proposals/contracts move to admin Archive. Review before deletion capability. Prevents accidental data loss.",
          requestor: "Micah",
          hours: 3.5,
          status: "billed" as const
        },
        {
          title: "Branding - White Background Format",
          description: "Unified PDF style for both companies. Consistent headers/footers. Professional document appearance.",
          requestor: "Mike",
          hours: 0.5,
          status: "billed" as const
        },
        {
          title: "Remote Signature Link System",
          description: "Email secure client-sign links. Status auto-updates on completion. Automated workflow integration.",
          requestor: "Vince",
          hours: 10.0,
          status: "billed" as const
        },
        {
          title: "Proposal Builder - Inline Price Editing",
          description: "Real-time price editing in builder. Data loss safeguards. Immediate price updates.",
          requestor: "Vince",
          hours: 0.5,
          status: "billed" as const
        },
        {
          title: "Auto Address Fill (ZIP, City, State)",
          description: "Auto-populate city/state from ZIP entry. Real-time address lookup. Validation system.",
          requestor: "Vince",
          hours: 0.5,
          status: "billed" as const
        },
        {
          title: "Drawing Tools Enhancements",
          description: "Clear drawings button. Undo/Redo functionality. Adjustable line thickness slider.",
          requestor: "Vince",
          hours: 0.5,
          status: "billed" as const
        },
        {
          title: "QuickBooks Integration & Payment Collection",
          description: "Deposits/final payments reconciliation. Webhook mapping & testing. Payment status tracking.",
          requestor: "Vince",
          hours: 8.0,
          status: "in_progress" as const
        },
        {
          title: "Technical Support, Implementation & Meetings",
          description: "Post-launch support and coordination. Technical working sessions.",
          requestor: "Team",
          hours: 3.0,
          status: "billed" as const
        },
        {
          title: "Mobile Optimization - Tables & Cards",
          description: "Table responsiveness for mobile. Card view layouts for proposals, clients, deals. Settings tab navigation overflow fixes.",
          requestor: "Team",
          hours: 2.0,
          status: "resolved" as const
        },
        {
          title: "Contract Builder Mobile Optimization",
          description: "Deposit summary optimization. PhotoDrawingCanvas toolbar optimization for touch. Proposal and contract builder mobile optimization.",
          requestor: "Team",
          hours: 3.0,
          status: "resolved" as const
        },
      ];

      for (const work of developmentWork) {
        const billableAmount = work.hours * 65;
        await db.insert(supportTickets).values({
          clientId: mikeMazick?.id || 4,
          dealId: 1,
          applicationSource: "direct",
          submitterEmail: "vince@desertmoonlighting.com",
          submitterName: work.requestor,
          title: work.title,
          description: work.description,
          priority: "medium",
          status: work.status,
          timeSpent: work.hours.toString(),
          hourlyRate: "65",
          billableAmount: billableAmount.toString(),
          readyToBill: work.status === "resolved",
          billedAt: work.status === "billed" ? new Date() : null,
          resolvedAt: ["resolved", "billed"].includes(work.status) ? new Date() : null,
          resolution: ["resolved", "billed"].includes(work.status) ? "Completed and deployed" : null,
        });
        console.log(`   ✅ ${work.title}: ${work.hours}hrs ($${billableAmount}) - ${work.status}`);
      }
    } else {
      console.log(`   ⏭️  Skipped: ${existingTickets.length} tickets already exist`);
    }

    // ==================== SUMMARY ====================
    console.log("\n" + "=".repeat(60));
    console.log("✅ SEED COMPLETE!");
    console.log("=".repeat(60));

    // Get final stats
    const finalInvoices = await db.select().from(invoices).where(eq(invoices.dealId, 1));
    const finalTickets = await db.select().from(supportTickets).where(eq(supportTickets.dealId, 1));
    const finalStakeholders = await db.select().from(dealStakeholders).where(eq(dealStakeholders.dealId, 1));

    const totalPaid = finalInvoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + parseFloat(i.amountPaid || "0"), 0);

    const totalOutstanding = finalInvoices
      .filter(i => i.status !== "paid")
      .reduce((sum, i) => sum + parseFloat(i.amountDue || "0"), 0);

    console.log(`
📊 DESERT MOON LIGHTING CRM - SUMMARY
─────────────────────────────────────
Deal Value:     $${updatedDeal.value}
Total Paid:     $${totalPaid.toFixed(2)}
Outstanding:    $${totalOutstanding.toFixed(2)}
─────────────────────────────────────
Stakeholders:   ${finalStakeholders.length}
Invoices:       ${finalInvoices.length}
Support Tickets: ${finalTickets.length}
─────────────────────────────────────
    `);

  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  }
}

// Run the seed
seedDesertMoonData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
