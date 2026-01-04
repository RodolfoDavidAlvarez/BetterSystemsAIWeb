import { Request, Response } from 'express';
import { db } from '../../db/index';
import { deals, dealInteractions, documents, clients, projects, invoices, supportTickets, emailLogs, dealStakeholders } from '../../db/schema';
import { eq, desc, and, sql, or, inArray } from 'drizzle-orm';

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
        hourlyRate: deals.hourlyRate, // Added
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
        clientPhone: clients.phone, // Added
        clientContactName: clients.contactName, // Added
        clientStatus: clients.status,
      })
      .from(deals)
      .leftJoin(clients, eq(deals.clientId, clients.id))
      .orderBy(desc(deals.createdAt));

    // Get interactions count, documents count, and stakeholders count for each deal
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

        const [stakeholdersCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(dealStakeholders)
          .where(eq(dealStakeholders.dealId, deal.id));

        return {
          ...deal,
          interactionsCount: Number(interactionsCount.count) || 0,
          documentsCount: Number(documentsCount.count) || 0,
          stakeholdersCount: Number(stakeholdersCount.count) || 0,
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

    // Get deal with client info - flattened for frontend
    const [deal] = await db
      .select({
        id: deals.id,
        name: deals.name,
        description: deals.description,
        value: deals.value,
        stage: deals.stage,
        priority: deals.priority,
        probability: deals.probability,
        hourlyRate: deals.hourlyRate, // Added
        expectedCloseDate: deals.expectedCloseDate,
        actualCloseDate: deals.actualCloseDate,
        nextSteps: deals.nextSteps,
        notes: deals.notes,
        tags: deals.tags,
        source: deals.source,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        // Flattened client info for frontend
        clientId: clients.id,
        clientName: clients.name,
        clientEmail: clients.email,
        clientPhone: clients.phone, // Added
        clientContactName: clients.contactName, // Added
        clientStatus: clients.status,
        clientIndustry: clients.industry,
        clientWebsite: clients.website,
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
    const relatedProjects = deal.clientId ? await db
      .select()
      .from(projects)
      .where(eq(projects.clientId, deal.clientId))
      .orderBy(desc(projects.createdAt)) : [];

    // Get related invoices for this DEAL specifically (not just client)
    const relatedInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.dealId, dealId))
      .orderBy(desc(invoices.createdAt));

    // Get support tickets for this deal
    const dealTickets = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.dealId, dealId))
      .orderBy(desc(supportTickets.createdAt));

    // Calculate billing summary from invoices
    const billingSummary = relatedInvoices.reduce(
      (acc, invoice) => {
        const total = parseFloat(invoice.total || '0');
        const paid = parseFloat(invoice.amountPaid || '0');
        const due = parseFloat(invoice.amountDue || '0');

        acc.totalInvoiced += total;
        acc.totalPaid += paid;
        acc.totalOutstanding += due;

        return acc;
      },
      { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0 }
    );

    // Calculate unbilled work from resolved tickets
    const effectiveRate = parseFloat(deal.hourlyRate || '65');
    const unbilledWork = dealTickets
      .filter(t => (t.status === 'resolved' || t.readyToBill) && !t.billedAt)
      .reduce((acc, ticket) => {
        const hours = parseFloat(ticket.timeSpent || '0');
        const ticketRate = parseFloat(ticket.hourlyRate || '') || effectiveRate;
        acc.ticketCount++;
        acc.totalHours += hours;
        acc.totalAmount += hours * ticketRate;
        return acc;
      }, { ticketCount: 0, totalHours: 0, totalAmount: 0 });

    res.json({
      success: true,
      data: {
        ...deal,
        interactions,
        documents: dealDocuments,
        projects: relatedProjects,
        invoices: relatedInvoices,
        tickets: dealTickets,
        billing: {
          ...billingSummary,
          unbilledWork,
        },
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

// Get email history for a deal (from Resend logs + stakeholder matching)
export async function getDealEmails(req: Request, res: Response) {
  try {
    const dealId = parseInt(req.params.dealId);

    // Get all stakeholder emails for this deal
    const stakeholders = await db
      .select({ email: clients.email })
      .from(dealStakeholders)
      .innerJoin(clients, eq(dealStakeholders.clientId, clients.id))
      .where(eq(dealStakeholders.dealId, dealId));

    const stakeholderEmails = stakeholders.map(s => s.email?.toLowerCase()).filter(Boolean);

    // Get email logs where:
    // 1. relatedDealId matches this deal, OR
    // 2. Any recipient matches a stakeholder email
    let emails;
    if (stakeholderEmails.length > 0) {
      emails = await db
        .select()
        .from(emailLogs)
        .where(
          or(
            eq(emailLogs.relatedDealId, dealId),
            // Check if any 'to' email matches stakeholder emails
            sql`EXISTS (
              SELECT 1 FROM unnest(${emailLogs.to}) AS t(email)
              WHERE LOWER(t.email) = ANY(ARRAY[${sql.raw(stakeholderEmails.map(e => `'${e}'`).join(','))}]::text[])
            )`
          )
        )
        .orderBy(desc(emailLogs.sentAt))
        .limit(100);
    } else {
      emails = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.relatedDealId, dealId))
        .orderBy(desc(emailLogs.sentAt))
        .limit(100);
    }

    res.json({ success: true, emails });
  } catch (error: any) {
    console.error('Error fetching deal emails:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
