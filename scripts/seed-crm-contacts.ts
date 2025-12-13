import { db } from "../db";
import { clients, deals, dealInteractions } from "../db/schema";
import { eq } from "drizzle-orm";

async function seedCrmContacts() {
  console.log("🌱 Seeding CRM Proposal System contacts...");

  try {
    // Contact data extracted from screenshots and email
    // PARTNERS: Vince, Mike, Micah, Justin
    // SALES REP: Brian Mitchell
    const contactsData = [
      {
        name: "Justin Coonrod",
        contactName: "Justin Coonrod",
        email: "justincoonrod@gmail.com",
        phone: "+1 (602) 481-8050",
        industry: "Solar Energy",
        status: "active",
        source: "CRM Proposal System - Partner",
        notes: `PARTNER - One of the 4 partners in the CRM Proposal System deal

Role: Partner
Company: Independent Solar (implied)
Involved in: CRM Proposal System discussion
Email thread date: November 23, 2025`,
        tags: ["partner", "crm-proposal", "solar", "independent-solar"],
      },
      {
        name: "Micah Izquierdo",
        contactName: "Micah Izquierdo",
        email: "micah@independentsolar.com",
        phone: "+1 (480) 993-4572",
        industry: "Solar Energy",
        companySize: "small",
        status: "active",
        source: "CRM Proposal System - Partner",
        notes: `PARTNER - One of the 4 partners in the CRM Proposal System deal

Role: Partner & EXECUTOR
Personality: Action-oriented, wants to get things done
Company: Independent Solar
Secondary email: micahizquierdo13@gmail.com
Involved in: CRM Proposal System discussion
Email thread date: November 23, 2025
Note: Listed as "CRM PROPOSAÑ SYSTEM" in phone contact

Key Contact: Primary executor and implementer. Best to work with for getting things moving.`,
        tags: ["partner", "crm-proposal", "solar", "independent-solar", "executor", "decision-maker"],
      },
      {
        name: "Mike Mazick",
        contactName: "Mike Mazick",
        email: "mmazick@nssaz.com",
        phone: "+1 (928) 302-0100",
        industry: "Solar Energy",
        status: "active",
        source: "Better Systems Client - Partner",
        notes: `PARTNER - One of the 4 partners in the CRM Proposal System deal

Role: Partner & DECISION MAKER (FINANCIAL AUTHORITY)
Authority: The one who pays - Final decision maker on financial matters
Company: NSS AZ (from email) & Independent Solar
Secondary email: mmazick@independentsolar.com
Better Systems Client relationship
Involved in: CRM Proposal System discussion
Email thread date: November 23, 2025
Note: Listed as "BETTER SYSTEMS CLIENT" in phone contact

Key Contact: Financial decision maker. Critical for contract approval and payment.`,
        tags: ["partner", "crm-proposal", "better-systems-client", "solar", "independent-solar", "nss-az", "financial-decision-maker", "payer"],
      },
      {
        name: "Tyler Spitz",
        contactName: "Tyler Spitz",
        email: "tyler@independentsolar.com",
        phone: "(619) 300-4998",
        industry: "Solar Energy",
        companySize: "small",
        status: "prospect",
        source: "CRM Proposal System",
        notes: `Team member at Independent Solar

Role: Team Member (relationship to partners TBD)
Company: Independent Solar
Involved in: CRM Proposal System discussion (potentially)
Email: Inferred from company domain`,
        tags: ["crm-proposal", "solar", "independent-solar", "team-member"],
      },
      {
        name: "Vince Lo Storto",
        contactName: "Vince Lo Storto",
        email: "Vincelostorto@yahoo.com",
        phone: "+1 (480) 298-9807",
        industry: "Solar Energy",
        status: "active",
        source: "CRM Proposal System - Partner",
        notes: `PARTNER - One of the 4 partners in the CRM Proposal System deal

Role: Partner
Involved in: CRM Proposal System discussion
Email thread date: November 23, 2025`,
        tags: ["partner", "crm-proposal", "solar"],
      },
      {
        name: "Brian Mitchell",
        contactName: "Brian Mitchell",
        email: "brian@independentsolar.com",
        phone: "",
        industry: "Solar Energy",
        status: "active",
        source: "CRM Proposal System - Sales Rep",
        notes: `SALES REP for the CRM Proposal System deal

Role: Sales Representative
Company: Independent Solar (implied)
Involved in: CRM Proposal System as sales representative
Relationship: Works with the 4 partners (Vince, Mike, Micah, Justin)`,
        tags: ["sales-rep", "crm-proposal", "solar", "independent-solar"],
      },
    ];

    // Insert clients (upsert based on email)
    const insertedClients = [];
    for (const contactData of contactsData) {
      // Check if client already exists by email
      const existingClient = await db
        .select()
        .from(clients)
        .where(eq(clients.email, contactData.email))
        .limit(1);

      let client;
      if (existingClient.length > 0) {
        console.log(`✓ Client already exists: ${contactData.name}`);
        // Update existing client
        const [updatedClient] = await db
          .update(clients)
          .set({
            ...contactData,
            updatedAt: new Date(),
          })
          .where(eq(clients.email, contactData.email))
          .returning();
        client = updatedClient;
      } else {
        // Insert new client
        const [newClient] = await db.insert(clients).values(contactData).returning();
        console.log(`✓ Created new client: ${contactData.name}`);
        client = newClient;
      }

      insertedClients.push(client);
    }

    // Create or update the "CRM PROPOSAL SYSTEM" deal
    const dealName = "CRM Proposal System";

    // Check if deal already exists
    const existingDeal = await db
      .select()
      .from(deals)
      .where(eq(deals.name, dealName))
      .limit(1);

    let crmDeal;
    if (existingDeal.length > 0) {
      console.log(`✓ Deal already exists: ${dealName}`);
      crmDeal = existingDeal[0];
    } else {
      // Create deal linked to the first client (can be changed later)
      const [newDeal] = await db
        .insert(deals)
        .values({
          clientId: insertedClients[0].id,
          name: dealName,
          description: "CRM and proposal system for solar companies - 4 partners + sales rep",
          value: "0", // To be determined
          stage: "proposal",
          priority: "high",
          probability: 75,
          source: "real",
          nextSteps: "Follow up with Micah (executor) for implementation timeline. Confirm pricing with Mike (financial decision maker).",
          notes: `PARTNERS (4):
1. Mike Mazick (${insertedClients.find(c => c.name === "Mike Mazick")?.email}) - FINANCIAL DECISION MAKER - The one who pays
2. Micah Izquierdo (${insertedClients.find(c => c.name === "Micah Izquierdo")?.email}) - EXECUTOR - Gets things done, action-oriented
3. Justin Coonrod (${insertedClients.find(c => c.name === "Justin Coonrod")?.email}) - Partner
4. Vince Lo Storto (${insertedClients.find(c => c.name === "Vince Lo Storto")?.email}) - Partner

SALES REP:
- Brian Mitchell (${insertedClients.find(c => c.name === "Brian Mitchell")?.email}) - Sales Representative

OTHER CONTACTS:
- Tyler Spitz (${insertedClients.find(c => c.name === "Tyler Spitz")?.email}) - Team Member

STRATEGY:
- Work with Micah for implementation and execution
- Get final approval and payment from Mike
- Keep all partners in the loop

Email thread date: Nov 23, 2025`,
          tags: ["crm", "proposal", "solar", "multi-stakeholder", "4-partners"],
        })
        .returning();

      console.log(`✓ Created new deal: ${dealName}`);
      crmDeal = newDeal;
    }

    // Add an interaction for the email thread
    const [interaction] = await db
      .insert(dealInteractions)
      .values({
        dealId: crmDeal.id,
        type: "email",
        subject: "CRM Proposal System Discussion",
        content: `Email thread from Rodolfo Alvarez to multiple stakeholders regarding the CRM Proposal System.

Recipients:
- Mike Mazick (mmazick@nssaz.com, mmazick@independentsolar.com)
- Micah Izquierdo (micah@independentsolar.com, micahizquierdo13@gmail.com)
- Justin Coonrod (justincoonrod@gmail.com)
- Vince Lo Storto (Vincelostorto@yahoo.com)

Date: November 23, 2025, 7:01 PM`,
        contactPerson: "Multiple stakeholders",
        status: "completed",
        emailSent: true,
        completedAt: new Date("2025-11-23T19:01:00"),
      })
      .returning();

    console.log(`✓ Created email interaction for the deal`);

    console.log("\n✅ Successfully seeded CRM contacts and deal!");
    console.log(`\nSummary:`);
    console.log(`- Clients created/updated: ${insertedClients.length}`);
    console.log(`- Deal: ${crmDeal.name} (ID: ${crmDeal.id})`);
    console.log(`- Deal Interactions: 1`);

    console.log(`\nClients:`);
    insertedClients.forEach((client, idx) => {
      console.log(`${idx + 1}. ${client.name} (${client.email}) - ${client.phone}`);
    });

  } catch (error) {
    console.error("❌ Error seeding CRM contacts:", error);
    throw error;
  }
}

// Run the seed function
seedCrmContacts()
  .then(() => {
    console.log("\n🎉 Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
