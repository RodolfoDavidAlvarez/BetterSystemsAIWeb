import { Request, Response } from 'express';
import { db } from '../../db/index';
import { deals, dealInteractions, documents, clients, projects, invoices } from '../../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// Get all deals with related data
export async function getAllDeals(req: Request, res: Response) {
  try {
    const allDeals = await db
      .select({
        id: deals.id,
        name: deals.name,
        description: deals.description,
        value: deals.value,
        stage: deals.stage,
        priority: deals.priority,
        probability: deals.probability,
        expectedCloseDate: deals.expectedCloseDate,
        actualCloseDate: deals.actualCloseDate,
        nextSteps: deals.nextSteps,
        notes: deals.notes,
        tags: deals.tags,
        source: deals.source,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        // Client info
        clientId: clients.id,
        clientName: clients.name,
        clientEmail: clients.email,
        clientStatus: clients.status,
      })
      .from(deals)
      .leftJoin(clients, eq(deals.clientId, clients.id))
      .orderBy(desc(deals.createdAt));

    // Get interactions count for each deal
    const dealsWithCounts = await Promise.all(
      allDeals.map(async (deal) => {
        const [interactionsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(dealInteractions)
          .where(eq(dealInteractions.dealId, deal.id));

        const [documentsCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(documents)
          .where(
            and(
              eq(documents.entityType, 'deal'),
              eq(documents.entityId, deal.id),
              eq(documents.status, 'active')
            )
          );

        return {
          ...deal,
          interactionsCount: Number(interactionsCount.count) || 0,
          documentsCount: Number(documentsCount.count) || 0,
        };
      })
    );

    res.json({ success: true, data: dealsWithCounts });
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get single deal with all related data
export async function getDealById(req: Request, res: Response) {
  try {
    const dealId = parseInt(req.params.id);

    // Get deal with client info
    const [deal] = await db
      .select({
        id: deals.id,
        name: deals.name,
        description: deals.description,
        value: deals.value,
        stage: deals.stage,
        priority: deals.priority,
        probability: deals.probability,
        expectedCloseDate: deals.expectedCloseDate,
        actualCloseDate: deals.actualCloseDate,
        nextSteps: deals.nextSteps,
        notes: deals.notes,
        tags: deals.tags,
        source: deals.source,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        client: clients,
      })
      .from(deals)
      .leftJoin(clients, eq(deals.clientId, clients.id))
      .where(eq(deals.id, dealId));

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    // Get interactions
    const interactions = await db
      .select()
      .from(dealInteractions)
      .where(eq(dealInteractions.dealId, dealId))
      .orderBy(desc(dealInteractions.createdAt));

    // Get documents
    const dealDocuments = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.entityType, 'deal'),
          eq(documents.entityId, dealId),
          eq(documents.status, 'active')
        )
      )
      .orderBy(desc(documents.createdAt));

    // Get related projects
    const relatedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.clientId, deal.client!.id!))
      .orderBy(desc(projects.createdAt));

    // Get related invoices
    const relatedInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, deal.client!.id!))
      .orderBy(desc(invoices.createdAt));

    // Calculate billing summary
    const billingSummary = relatedInvoices.reduce(
      (acc, invoice) => {
        const total = parseFloat(invoice.total || '0');
        const paid = parseFloat(invoice.amountPaid || '0');
        const due = parseFloat(invoice.amountDue || '0');

        acc.total += total;
        acc.paid += paid;
        acc.outstanding += due;

        return acc;
      },
      { total: 0, paid: 0, outstanding: 0 }
    );

    res.json({
      success: true,
      data: {
        ...deal,
        interactions,
        documents: dealDocuments,
        projects: relatedProjects,
        invoices: relatedInvoices,
        billing: billingSummary,
      },
    });
  } catch (error: any) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Create new deal
export async function createDeal(req: Request, res: Response) {
  try {
    const [newDeal] = await db.insert(deals).values(req.body).returning();

    res.status(201).json({ success: true, data: newDeal });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update deal
export async function updateDeal(req: Request, res: Response) {
  try {
    const dealId = parseInt(req.params.id);
    const [updatedDeal] = await db
      .update(deals)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(deals.id, dealId))
      .returning();

    if (!updatedDeal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    res.json({ success: true, data: updatedDeal });
  } catch (error: any) {
    console.error('Error updating deal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Delete deal
export async function deleteDeal(req: Request, res: Response) {
  try {
    const dealId = parseInt(req.params.id);
    await db.delete(deals).where(eq(deals.id, dealId));

    res.json({ success: true, message: 'Deal deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Add interaction to deal
export async function addDealInteraction(req: Request, res: Response) {
  try {
    const dealId = parseInt(req.params.id);
    const [interaction] = await db
      .insert(dealInteractions)
      .values({
        dealId,
        ...req.body,
      })
      .returning();

    res.status(201).json({ success: true, data: interaction });
  } catch (error: any) {
    console.error('Error adding interaction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get deal interactions
export async function getDealInteractions(req: Request, res: Response) {
  try {
    const dealId = parseInt(req.params.id);
    const interactions = await db
      .select()
      .from(dealInteractions)
      .where(eq(dealInteractions.dealId, dealId))
      .orderBy(desc(dealInteractions.createdAt));

    res.json({ success: true, data: interactions });
  } catch (error: any) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
