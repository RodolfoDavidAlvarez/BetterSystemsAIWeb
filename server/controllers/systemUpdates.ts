import { Request, Response } from "express";
import { db } from "../../db";
import { systemUpdates, systemUpdateRecipients, deals, clients } from "../../db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { sendCustomerEmail } from "../services/email";

// Get all system updates
export async function getAllUpdates(_req: Request, res: Response) {
  try {
    const updates = await db
      .select()
      .from(systemUpdates)
      .orderBy(desc(systemUpdates.createdAt));

    res.json({ success: true, data: updates });
  } catch (error: any) {
    console.error("Error fetching updates:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get a single update by ID
export async function getUpdateById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const update = await db
      .select()
      .from(systemUpdates)
      .where(eq(systemUpdates.id, parseInt(id)))
      .limit(1);

    if (!update.length) {
      return res.status(404).json({ success: false, message: "Update not found" });
    }

    // Get recipients for this update
    const recipients = await db
      .select({
        id: systemUpdateRecipients.id,
        dealId: systemUpdateRecipients.dealId,
        emailSent: systemUpdateRecipients.emailSent,
        emailSentAt: systemUpdateRecipients.emailSentAt,
        dealName: deals.name,
        clientName: clients.name,
        clientEmail: clients.email,
      })
      .from(systemUpdateRecipients)
      .innerJoin(deals, eq(systemUpdateRecipients.dealId, deals.id))
      .innerJoin(clients, eq(deals.clientId, clients.id))
      .where(eq(systemUpdateRecipients.updateId, parseInt(id)));

    res.json({
      success: true,
      data: {
        ...update[0],
        recipients,
      },
    });
  } catch (error: any) {
    console.error("Error fetching update:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Send a new update to selected deals
export async function sendUpdate(req: Request, res: Response) {
  try {
    const { title, content, category, dealIds } = req.body;

    if (!title || !content || !category || !dealIds || !dealIds.length) {
      return res.status(400).json({
        success: false,
        message: "Title, content, category, and at least one deal are required",
      });
    }

    // Create the update record
    const [newUpdate] = await db
      .insert(systemUpdates)
      .values({
        title,
        content,
        category,
        sentAt: new Date(),
        recipientCount: dealIds.length,
        createdBy: (req as any).user?.id,
      })
      .returning();

    // Get deal details for email sending
    const dealsWithClients = await db
      .select({
        dealId: deals.id,
        dealName: deals.name,
        clientName: clients.name,
        clientEmail: clients.email,
      })
      .from(deals)
      .innerJoin(clients, eq(deals.clientId, clients.id))
      .where(inArray(deals.id, dealIds));

    const selectedDeals = dealsWithClients;

    // Create recipient records and send emails
    const recipientPromises = selectedDeals.map(async (deal: { dealId: number; dealName: string; clientName: string; clientEmail: string }) => {
      // Insert recipient record
      await db.insert(systemUpdateRecipients).values({
        updateId: newUpdate.id,
        dealId: deal.dealId,
        emailSent: true,
        emailSentAt: new Date(),
      });

      // Send email
      try {
        await sendCustomerEmail({
          email: deal.clientEmail,
          name: deal.clientName,
          formType: "System Update",
          formIdentifier: "System Update",
          subject: `${getCategoryLabel(category)}: ${title}`,
          customMessage: `
Hello ${deal.clientName},

${content}

---
This update is regarding: ${deal.dealName}

Best regards,
Better Systems AI Team
          `.trim(),
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${deal.clientEmail}:`, emailError);
      }
    });

    await Promise.all(recipientPromises);

    res.json({
      success: true,
      data: newUpdate,
      message: `Update sent to ${selectedDeals.length} recipient(s)`,
    });
  } catch (error: any) {
    console.error("Error sending update:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Helper function to get category label
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    announcement: "Announcement",
    feature: "New Feature",
    update: "Update",
    maintenance: "Maintenance Notice",
  };
  return labels[category] || "Update";
}

// Delete an update
export async function deleteUpdate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Delete recipients first (foreign key constraint)
    await db.delete(systemUpdateRecipients).where(eq(systemUpdateRecipients.updateId, parseInt(id)));

    // Delete the update
    await db.delete(systemUpdates).where(eq(systemUpdates.id, parseInt(id)));

    res.json({ success: true, message: "Update deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting update:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
