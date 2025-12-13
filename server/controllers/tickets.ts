import { Request, Response } from 'express';
import { db } from '../../db/index';
import {
  supportTickets,
  clients,
  deals,
  activityLog,
} from '../../db/schema';
import { eq, desc, and, or, sql, count, isNull, ilike } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

// Default hourly rate when neither ticket nor deal has one set
const DEFAULT_HOURLY_RATE = 65;

// Get all tickets with filtering and pagination
export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const {
      status,
      clientId,
      dealId,
      priority,
      applicationSource,
      readyToBill,
      search,
      page = '1',
      limit = '50'
    } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(supportTickets.status, status as string));
    }
    if (clientId) {
      conditions.push(eq(supportTickets.clientId, parseInt(clientId as string)));
    }
    if (dealId) {
      conditions.push(eq(supportTickets.dealId, parseInt(dealId as string)));
    }
    if (priority && priority !== 'all') {
      conditions.push(eq(supportTickets.priority, priority as string));
    }
    if (applicationSource && applicationSource !== 'all') {
      conditions.push(eq(supportTickets.applicationSource, applicationSource as string));
    }
    if (readyToBill === 'true') {
      conditions.push(eq(supportTickets.readyToBill, true));
    }
    if (search) {
      conditions.push(
        or(
          ilike(supportTickets.title, `%${search}%`),
          ilike(supportTickets.description, `%${search}%`),
          ilike(supportTickets.submitterEmail, `%${search}%`)
        )
      );
    }

    const tickets = await db.select({
      ticket: supportTickets,
      clientName: clients.name,
      clientEmail: clients.email,
      dealName: deals.name,
      dealHourlyRate: deals.hourlyRate,
    })
    .from(supportTickets)
    .leftJoin(clients, eq(supportTickets.clientId, clients.id))
    .leftJoin(deals, eq(supportTickets.dealId, deals.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(supportTickets.createdAt))
    .limit(parseInt(limit as string))
    .offset(offset);

    // Calculate effective rate and billable amount for each ticket
    const ticketsWithBilling = tickets.map((t: typeof tickets[0]) => {
      const effectiveRate = t.ticket.hourlyRate
        ? parseFloat(t.ticket.hourlyRate)
        : t.dealHourlyRate
          ? parseFloat(t.dealHourlyRate)
          : DEFAULT_HOURLY_RATE;

      const timeSpent = parseFloat(t.ticket.timeSpent || '0');
      const calculatedAmount = timeSpent * effectiveRate;

      return {
        ...t.ticket,
        client: t.clientName ? { name: t.clientName, email: t.clientEmail } : null,
        deal: t.dealName ? { name: t.dealName, hourlyRate: t.dealHourlyRate } : null,
        effectiveHourlyRate: effectiveRate,
        calculatedBillableAmount: calculatedAmount,
      };
    });

    // Get counts by status for tabs
    const statusCounts = await db.select({
      status: supportTickets.status,
      count: count()
    })
    .from(supportTickets)
    .groupBy(supportTickets.status);

    // Get total count
    const totalResult = await db.select({ count: count() }).from(supportTickets);
    const total = totalResult[0]?.count || 0;

    res.json({
      success: true,
      tickets: ticketsWithBilling,
      statusCounts: statusCounts.reduce((acc: Record<string, number>, s: { status: string; count: number }) => {
        acc[s.status] = s.count;
        return acc;
      }, {} as Record<string, number>),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get single ticket by ID
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = await db.select({
      ticket: supportTickets,
      clientName: clients.name,
      clientEmail: clients.email,
      dealName: deals.name,
      dealHourlyRate: deals.hourlyRate,
    })
    .from(supportTickets)
    .leftJoin(clients, eq(supportTickets.clientId, clients.id))
    .leftJoin(deals, eq(supportTickets.dealId, deals.id))
    .where(eq(supportTickets.id, parseInt(id)))
    .limit(1);

    if (ticket.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const t = ticket[0];
    const effectiveRate = t.ticket.hourlyRate
      ? parseFloat(t.ticket.hourlyRate)
      : t.dealHourlyRate
        ? parseFloat(t.dealHourlyRate)
        : DEFAULT_HOURLY_RATE;

    res.json({
      success: true,
      ticket: {
        ...t.ticket,
        client: t.clientName ? { name: t.clientName, email: t.clientEmail } : null,
        deal: t.dealName ? { name: t.dealName, hourlyRate: t.dealHourlyRate } : null,
        effectiveHourlyRate: effectiveRate,
      }
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket'
    });
  }
};

// Create new ticket (internal creation from admin)
export const createTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketData = req.body;

    // If clientId provided, validate it exists
    if (ticketData.clientId) {
      const client = await db.select()
        .from(clients)
        .where(eq(clients.id, ticketData.clientId))
        .limit(1);

      if (client.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Client not found'
        });
      }
    }

    // If dealId provided, validate it exists
    if (ticketData.dealId) {
      const deal = await db.select()
        .from(deals)
        .where(eq(deals.id, ticketData.dealId))
        .limit(1);

      if (deal.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Deal not found'
        });
      }
    }

    const newTicket = await db.insert(supportTickets)
      .values({
        ...ticketData,
        status: ticketData.status || 'pending',
        applicationSource: ticketData.applicationSource || 'direct',
        assignedTo: req.user?.id,
      })
      .returning();

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'ticket',
        entityId: newTicket[0].id,
        action: 'created',
        userId: req.user.id,
        details: { title: newTicket[0].title, applicationSource: newTicket[0].applicationSource }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: newTicket[0]
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update ticket (including status changes and time tracking)
export const updateTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const existing = await db.select({
      ticket: supportTickets,
      dealHourlyRate: deals.hourlyRate,
    })
    .from(supportTickets)
    .leftJoin(deals, eq(supportTickets.dealId, deals.id))
    .where(eq(supportTickets.id, parseInt(id)))
    .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const existingTicket = existing[0].ticket;
    const dealRate = existing[0].dealHourlyRate;

    // Handle status-specific updates
    if (updateData.status === 'resolved' && existingTicket.status !== 'resolved') {
      updateData.resolvedAt = new Date();
    }

    // Calculate billable amount if time or rate changed
    if (updateData.timeSpent !== undefined || updateData.hourlyRate !== undefined) {
      const timeSpent = parseFloat(updateData.timeSpent ?? existingTicket.timeSpent ?? '0');

      // Get effective rate
      let effectiveRate = DEFAULT_HOURLY_RATE;
      if (updateData.hourlyRate) {
        effectiveRate = parseFloat(updateData.hourlyRate);
      } else if (existingTicket.hourlyRate) {
        effectiveRate = parseFloat(existingTicket.hourlyRate);
      } else if (dealRate) {
        effectiveRate = parseFloat(dealRate);
      }

      updateData.billableAmount = (timeSpent * effectiveRate).toFixed(2);
    }

    // Set updated timestamp
    updateData.updatedAt = new Date();

    const updatedTicket = await db.update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, parseInt(id)))
      .returning();

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'ticket',
        entityId: parseInt(id),
        action: updateData.status ? 'status_changed' : 'updated',
        userId: req.user.id,
        details: {
          changes: Object.keys(updateData).filter(k => k !== 'updatedAt'),
          newStatus: updateData.status
        }
      });
    }

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updatedTicket[0]
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete ticket
export const deleteTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Don't allow deletion of billed tickets
    if (existing[0].status === 'billed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a billed ticket'
      });
    }

    await db.delete(supportTickets).where(eq(supportTickets.id, parseInt(id)));

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'ticket',
        entityId: parseInt(id),
        action: 'deleted',
        userId: req.user.id,
        details: { title: existing[0].title }
      });
    }

    res.json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ticket'
    });
  }
};

// Get billable tickets (resolved or ready to bill, not yet billed)
export const getBillableTickets = async (req: Request, res: Response) => {
  try {
    const { clientId, dealId } = req.query;

    const conditions = [
      or(
        eq(supportTickets.status, 'resolved'),
        eq(supportTickets.readyToBill, true)
      ),
      isNull(supportTickets.invoiceId) // Not yet billed
    ];

    if (clientId) {
      conditions.push(eq(supportTickets.clientId, parseInt(clientId as string)));
    }
    if (dealId) {
      conditions.push(eq(supportTickets.dealId, parseInt(dealId as string)));
    }

    const tickets = await db.select({
      ticket: supportTickets,
      clientName: clients.name,
      dealName: deals.name,
      dealHourlyRate: deals.hourlyRate,
    })
    .from(supportTickets)
    .leftJoin(clients, eq(supportTickets.clientId, clients.id))
    .leftJoin(deals, eq(supportTickets.dealId, deals.id))
    .where(and(...conditions))
    .orderBy(desc(supportTickets.resolvedAt));

    // Calculate billing for each ticket
    const ticketsWithBilling = tickets.map((t: typeof tickets[0]) => {
      const effectiveRate = t.ticket.hourlyRate
        ? parseFloat(t.ticket.hourlyRate)
        : t.dealHourlyRate
          ? parseFloat(t.dealHourlyRate)
          : DEFAULT_HOURLY_RATE;

      const timeSpent = parseFloat(t.ticket.timeSpent || '0');
      const billableAmount = timeSpent * effectiveRate;

      return {
        ...t.ticket,
        clientName: t.clientName,
        dealName: t.dealName,
        effectiveHourlyRate: effectiveRate,
        calculatedBillableAmount: billableAmount,
      };
    });

    res.json({
      success: true,
      tickets: ticketsWithBilling,
      totalBillableAmount: ticketsWithBilling.reduce((sum: number, t: typeof ticketsWithBilling[0]) => sum + t.calculatedBillableAmount, 0)
    });
  } catch (error) {
    console.error('Error fetching billable tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billable tickets'
    });
  }
};

// Mark tickets as billed (called after invoice creation)
export const markTicketsAsBilled = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ticketIds, invoiceId } = req.body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ticket IDs are required'
      });
    }

    // Update all specified tickets
    const updatedTickets = [];
    for (const ticketId of ticketIds) {
      const updated = await db.update(supportTickets)
        .set({
          status: 'billed',
          invoiceId: invoiceId || null,
          billedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(supportTickets.id, ticketId))
        .returning();

      if (updated.length > 0) {
        updatedTickets.push(updated[0]);
      }

      // Log activity
      if (req.user) {
        await db.insert(activityLog).values({
          entityType: 'ticket',
          entityId: ticketId,
          action: 'billed',
          userId: req.user.id,
          details: { invoiceId }
        });
      }
    }

    res.json({
      success: true,
      message: `${updatedTickets.length} tickets marked as billed`,
      tickets: updatedTickets
    });
  } catch (error) {
    console.error('Error marking tickets as billed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark tickets as billed'
    });
  }
};

// Get ticket stats for dashboard/tabs
export const getTicketStats = async (req: Request, res: Response) => {
  try {
    const { clientId, dealId, applicationSource } = req.query;

    const conditions = [];
    if (clientId) {
      conditions.push(eq(supportTickets.clientId, parseInt(clientId as string)));
    }
    if (dealId) {
      conditions.push(eq(supportTickets.dealId, parseInt(dealId as string)));
    }
    if (applicationSource && applicationSource !== 'all') {
      conditions.push(eq(supportTickets.applicationSource, applicationSource as string));
    }

    // Status counts
    const statusCountsQuery = db.select({
      status: supportTickets.status,
      count: count()
    })
    .from(supportTickets);

    if (conditions.length > 0) {
      statusCountsQuery.where(and(...conditions));
    }

    const statusCounts = await statusCountsQuery.groupBy(supportTickets.status);

    // Priority counts
    const priorityCountsQuery = db.select({
      priority: supportTickets.priority,
      count: count()
    })
    .from(supportTickets);

    if (conditions.length > 0) {
      priorityCountsQuery.where(and(...conditions));
    }

    const priorityCounts = await priorityCountsQuery.groupBy(supportTickets.priority);

    // Application source counts
    const appSourceCountsQuery = db.select({
      applicationSource: supportTickets.applicationSource,
      count: count()
    })
    .from(supportTickets);

    if (conditions.length > 0) {
      appSourceCountsQuery.where(and(...conditions));
    }

    const appSourceCounts = await appSourceCountsQuery.groupBy(supportTickets.applicationSource);

    // Get unbilled amount
    const unbilledConditions = [
      or(
        eq(supportTickets.status, 'resolved'),
        eq(supportTickets.readyToBill, true)
      ),
      isNull(supportTickets.invoiceId),
      ...conditions
    ];

    const unbilledResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(${supportTickets.billableAmount} AS DECIMAL)), 0)`
    })
    .from(supportTickets)
    .where(and(...unbilledConditions));

    const total = statusCounts.reduce((acc: number, s: { status: string; count: number }) => acc + s.count, 0);

    res.json({
      success: true,
      stats: {
        total,
        byStatus: statusCounts.reduce((acc: Record<string, number>, s: { status: string; count: number }) => {
          acc[s.status] = s.count;
          return acc;
        }, {} as Record<string, number>),
        byPriority: priorityCounts.reduce((acc: Record<string, number>, p: { priority: string | null; count: number }) => {
          acc[p.priority || 'none'] = p.count;
          return acc;
        }, {} as Record<string, number>),
        byApplicationSource: appSourceCounts.reduce((acc: Record<string, number>, a: { applicationSource: string; count: number }) => {
          acc[a.applicationSource] = a.count;
          return acc;
        }, {} as Record<string, number>),
        totalUnbilledAmount: parseFloat(unbilledResult[0]?.total || '0')
      }
    });
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket stats'
    });
  }
};
