import { Request, Response } from 'express';
import { db } from '../../db/index';
import { clients, projects, deals, insertClientSchema, activityLog, dealStakeholders, emailLogs } from '../../db/schema';
import { eq, desc, ilike, or, sql, count, ne, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

// Get all clients with optional search and pagination
export const getAllClients = async (req: Request, res: Response) => {
  try {
    const { search, status, label, hideHidden = 'true', page = '1', limit = '100' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Apply filters
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.email, `%${search}%`),
          ilike(clients.contactName, `%${search}%`),
          ilike(clients.firstName, `%${search}%`),
          ilike(clients.lastName, `%${search}%`)
        )
      );
    }
    if (status && status !== 'all') {
      conditions.push(eq(clients.status, status as string));
    }
    if (label && label !== 'all') {
      conditions.push(eq(clients.label, label as string));
    }
    // Hide contacts with label 'hidden' by default
    if (hideHidden === 'true') {
      conditions.push(sql`(${clients.label} IS NULL OR ${clients.label} != 'hidden')`);
    }

    const allClients = await db.select()
      .from(clients)
      .where(conditions.length > 0 ? sql`${conditions.reduce((acc: any, cond: any) => sql`${acc} AND ${cond}`)}` : undefined)
      .orderBy(desc(clients.createdAt))
      .limit(parseInt(limit as string))
      .offset(offset);

    // Get deal information for each client (check both primary client and stakeholder relationships)
    const clientsWithDeals = await Promise.all(
      allClients.map(async (client: { id: number; name: string; email: string; status: string; [key: string]: unknown }) => {
        // First check if client is primary on any deal
        let clientDeals = await db.select()
          .from(deals)
          .where(eq(deals.clientId, client.id))
          .orderBy(desc(deals.createdAt))
          .limit(1);

        // If no primary deal found, check stakeholder relationships
        if (clientDeals.length === 0) {
          const stakeholderDeals = await db
            .select({
              id: deals.id,
              name: deals.name,
              stage: deals.stage,
              value: deals.value,
              clientId: deals.clientId,
              createdAt: deals.createdAt,
              updatedAt: deals.updatedAt,
              description: deals.description,
              priority: deals.priority,
              probability: deals.probability,
              expectedCloseDate: deals.expectedCloseDate,
              actualCloseDate: deals.actualCloseDate,
              ownerId: deals.ownerId,
              source: deals.source,
              nextSteps: deals.nextSteps,
              notes: deals.notes,
              tags: deals.tags,
            })
            .from(dealStakeholders)
            .innerJoin(deals, eq(dealStakeholders.dealId, deals.id))
            .where(eq(dealStakeholders.clientId, client.id))
            .orderBy(desc(deals.createdAt))
            .limit(1);

          clientDeals = stakeholderDeals;
        }

        return {
          ...client,
          deal: clientDeals[0] || null,
        };
      })
    );

    // Get total count
    const totalResult = await db.select({ count: count() }).from(clients);
    const total = totalResult[0]?.count || 0;

    res.json({
      success: true,
      clients: clientsWithDeals,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get single client by ID with associated emails
export const getClientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await db.select()
      .from(clients)
      .where(eq(clients.id, parseInt(id)))
      .limit(1);

    if (client.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get client's projects
    const clientProjects = await db.select()
      .from(projects)
      .where(eq(projects.clientId, parseInt(id)))
      .orderBy(desc(projects.createdAt));

    // Get associated emails (where client is sender or recipient)
    const clientEmail = client[0].email.toLowerCase();
    const clientEmails = await db.select()
      .from(emailLogs)
      .where(
        sql`LOWER(${emailLogs.from}) LIKE ${`%${clientEmail}%`} OR ${emailLogs.to}::text ILIKE ${`%${clientEmail}%`}`
      )
      .orderBy(desc(emailLogs.sentAt))
      .limit(50);

    res.json({
      success: true,
      client: client[0],
      projects: clientProjects,
      emails: clientEmails
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new client
export const createClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientData = req.body;

    // Validate input
    const parsed = insertClientSchema.safeParse(clientData);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client data',
        errors: parsed.error.errors
      });
    }

    const newClient = await db.insert(clients)
      .values(parsed.data)
      .returning();

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'client',
        entityId: newClient[0].id,
        action: 'created',
        userId: req.user.id,
        details: { name: newClient[0].name }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client: newClient[0]
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update client
export const updateClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if client exists
    const existing = await db.select()
      .from(clients)
      .where(eq(clients.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const updatedClient = await db.update(clients)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(clients.id, parseInt(id)))
      .returning();

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'client',
        entityId: parseInt(id),
        action: 'updated',
        userId: req.user.id,
        details: { changes: Object.keys(updateData) }
      });
    }

    res.json({
      success: true,
      message: 'Client updated successfully',
      client: updatedClient[0]
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete client
export const deleteClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if client exists
    const existing = await db.select()
      .from(clients)
      .where(eq(clients.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if client has projects
    const clientProjects = await db.select()
      .from(projects)
      .where(eq(projects.clientId, parseInt(id)))
      .limit(1);

    if (clientProjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete client with existing projects. Please delete or reassign projects first.'
      });
    }

    await db.delete(clients).where(eq(clients.id, parseInt(id)));

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'client',
        entityId: parseInt(id),
        action: 'deleted',
        userId: req.user.id,
        details: { name: existing[0].name }
      });
    }

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get client stats for dashboard
export const getClientStats = async (_req: Request, res: Response) => {
  try {
    const stats = await db.select({
      status: clients.status,
      count: count()
    })
    .from(clients)
    .groupBy(clients.status);

    const total = stats.reduce((acc: number, s: { status: string; count: number }) => acc + s.count, 0);

    res.json({
      success: true,
      stats: {
        total,
        byStatus: stats.reduce((acc: Record<string, number>, s: { status: string; count: number }) => {
          acc[s.status] = s.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client stats'
    });
  }
};
