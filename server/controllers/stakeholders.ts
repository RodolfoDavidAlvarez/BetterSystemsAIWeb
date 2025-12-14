import { Request, Response } from "express";
import { db } from "../../db/index";
import { dealStakeholders, clients } from "../../db/schema";
import { eq, and } from "drizzle-orm";

// Get all stakeholders for a deal
export const getDealStakeholders = async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;

    const stakeholders = await db
      .select({
        id: dealStakeholders.id,
        dealId: dealStakeholders.dealId,
        clientId: dealStakeholders.clientId,
        role: dealStakeholders.role,
        isPrimary: dealStakeholders.isPrimary,
        receivesUpdates: dealStakeholders.receivesUpdates,
        receivesBilling: dealStakeholders.receivesBilling,
        notes: dealStakeholders.notes,
        createdAt: dealStakeholders.createdAt,
        // Client info - name is company name, contactName is person name
        clientName: clients.name,
        clientContactName: clients.contactName,
        clientEmail: clients.email,
        clientPhone: clients.phone,
      })
      .from(dealStakeholders)
      .innerJoin(clients, eq(dealStakeholders.clientId, clients.id))
      .where(eq(dealStakeholders.dealId, parseInt(dealId)))
      .orderBy(dealStakeholders.isPrimary);

    res.json({ success: true, stakeholders });
  } catch (error) {
    console.error("Error fetching stakeholders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stakeholders" });
  }
};

// Add a stakeholder to a deal
export const addDealStakeholder = async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    const { clientId, role, isPrimary, receivesUpdates, receivesBilling, notes } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: "Client ID is required" });
    }

    // Check if stakeholder already exists
    const existing = await db
      .select()
      .from(dealStakeholders)
      .where(
        and(
          eq(dealStakeholders.dealId, parseInt(dealId)),
          eq(dealStakeholders.clientId, clientId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "This contact is already a stakeholder" });
    }

    const [stakeholder] = await db
      .insert(dealStakeholders)
      .values({
        dealId: parseInt(dealId),
        clientId,
        role: role || "stakeholder",
        isPrimary: isPrimary || false,
        receivesUpdates: receivesUpdates !== false, // Default true
        receivesBilling: receivesBilling || false,
        notes,
      })
      .returning();

    // Fetch with client info
    const [fullStakeholder] = await db
      .select({
        id: dealStakeholders.id,
        dealId: dealStakeholders.dealId,
        clientId: dealStakeholders.clientId,
        role: dealStakeholders.role,
        isPrimary: dealStakeholders.isPrimary,
        receivesUpdates: dealStakeholders.receivesUpdates,
        receivesBilling: dealStakeholders.receivesBilling,
        notes: dealStakeholders.notes,
        createdAt: dealStakeholders.createdAt,
        clientName: clients.name,
        clientContactName: clients.contactName,
        clientEmail: clients.email,
        clientPhone: clients.phone,
      })
      .from(dealStakeholders)
      .innerJoin(clients, eq(dealStakeholders.clientId, clients.id))
      .where(eq(dealStakeholders.id, stakeholder.id));

    res.status(201).json({ success: true, stakeholder: fullStakeholder });
  } catch (error) {
    console.error("Error adding stakeholder:", error);
    res.status(500).json({ success: false, message: "Failed to add stakeholder" });
  }
};

// Update a stakeholder's preferences
export const updateDealStakeholder = async (req: Request, res: Response) => {
  try {
    const { stakeholderId } = req.params;
    const { role, isPrimary, receivesUpdates, receivesBilling, notes } = req.body;

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
    if (receivesUpdates !== undefined) updateData.receivesUpdates = receivesUpdates;
    if (receivesBilling !== undefined) updateData.receivesBilling = receivesBilling;
    if (notes !== undefined) updateData.notes = notes;

    const [updated] = await db
      .update(dealStakeholders)
      .set(updateData)
      .where(eq(dealStakeholders.id, parseInt(stakeholderId)))
      .returning();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Stakeholder not found" });
    }

    // Fetch with client info
    const [fullStakeholder] = await db
      .select({
        id: dealStakeholders.id,
        dealId: dealStakeholders.dealId,
        clientId: dealStakeholders.clientId,
        role: dealStakeholders.role,
        isPrimary: dealStakeholders.isPrimary,
        receivesUpdates: dealStakeholders.receivesUpdates,
        receivesBilling: dealStakeholders.receivesBilling,
        notes: dealStakeholders.notes,
        createdAt: dealStakeholders.createdAt,
        clientName: clients.name,
        clientContactName: clients.contactName,
        clientEmail: clients.email,
        clientPhone: clients.phone,
      })
      .from(dealStakeholders)
      .innerJoin(clients, eq(dealStakeholders.clientId, clients.id))
      .where(eq(dealStakeholders.id, updated.id));

    res.json({ success: true, stakeholder: fullStakeholder });
  } catch (error) {
    console.error("Error updating stakeholder:", error);
    res.status(500).json({ success: false, message: "Failed to update stakeholder" });
  }
};

// Remove a stakeholder from a deal
export const removeDealStakeholder = async (req: Request, res: Response) => {
  try {
    const { stakeholderId } = req.params;

    const [deleted] = await db
      .delete(dealStakeholders)
      .where(eq(dealStakeholders.id, parseInt(stakeholderId)))
      .returning();

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Stakeholder not found" });
    }

    res.json({ success: true, message: "Stakeholder removed" });
  } catch (error) {
    console.error("Error removing stakeholder:", error);
    res.status(500).json({ success: false, message: "Failed to remove stakeholder" });
  }
};
