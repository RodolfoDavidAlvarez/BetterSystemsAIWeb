import { Request, Response } from 'express';
import { db } from '../../db/index';
import { supportTickets, clients, deals, activityLog, dealStakeholders } from '../../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

// API keys for each external application (store these in environment variables)
const API_KEYS: Record<string, string> = {
  'crm-lighting': process.env.TICKET_API_KEY_CRM_LIGHTING || 'crm_lighting_dev_key',
  'agave-fleet': process.env.TICKET_API_KEY_AGAVE_FLEET || 'agave_fleet_dev_key',
};

// Valid application sources
const VALID_SOURCES = ['crm-lighting', 'agave-fleet'];

interface ExternalTicketPayload {
  apiKey: string;
  applicationSource: string;
  externalTicketId?: string;
  submitterEmail: string;
  submitterName?: string;
  title: string;
  description: string;
  screenshotUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  page?: string;
  status?: string;
  createdAt?: string;
}

// Validate API key for the given application source
const validateApiKey = (apiKey: string, applicationSource: string): boolean => {
  const expectedKey = API_KEYS[applicationSource];
  return !!expectedKey && apiKey === expectedKey;
};

// Find client by email
const findClientByEmail = async (email: string) => {
  const client = await db.select()
    .from(clients)
    .where(eq(clients.email, email.toLowerCase()))
    .limit(1);

  return client[0] || null;
};

// Find active deal for a client
const findActiveDealForClient = async (clientId: number) => {
  // First check if client is primary on any active deal
  let deal = await db.select()
    .from(deals)
    .where(
      and(
        eq(deals.clientId, clientId),
        or(
          eq(deals.stage, 'active'),
          eq(deals.stage, 'negotiation'),
          eq(deals.stage, 'proposal')
        )
      )
    )
    .orderBy(desc(deals.createdAt))
    .limit(1);

  if (deal.length > 0) return deal[0];

  // Check if client is a stakeholder on any active deal
  const stakeholderDeal = await db
    .select({
      id: deals.id,
      name: deals.name,
      clientId: deals.clientId,
      hourlyRate: deals.hourlyRate,
      stage: deals.stage,
    })
    .from(dealStakeholders)
    .innerJoin(deals, eq(dealStakeholders.dealId, deals.id))
    .where(
      and(
        eq(dealStakeholders.clientId, clientId),
        or(
          eq(deals.stage, 'active'),
          eq(deals.stage, 'negotiation'),
          eq(deals.stage, 'proposal')
        )
      )
    )
    .orderBy(desc(deals.createdAt))
    .limit(1);

  return stakeholderDeal[0] || null;
};

// Receive external ticket submission
export const receiveExternalTicket = async (req: Request, res: Response) => {
  try {
    const payload: ExternalTicketPayload = req.body;

    // Validate required fields
    if (!payload.apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }

    if (!payload.applicationSource || !VALID_SOURCES.includes(payload.applicationSource)) {
      return res.status(400).json({
        success: false,
        message: `Invalid application source. Must be one of: ${VALID_SOURCES.join(', ')}`
      });
    }

    // Validate API key
    if (!validateApiKey(payload.apiKey, payload.applicationSource)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key for this application'
      });
    }

    // Validate required ticket fields
    if (!payload.submitterEmail || !payload.title || !payload.description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: submitterEmail, title, and description are required'
      });
    }

    // Try to find matching client by email
    const client = await findClientByEmail(payload.submitterEmail);
    let clientId: number | null = null;
    let dealId: number | null = null;

    if (client) {
      clientId = client.id;

      // Find active deal for this client
      const deal = await findActiveDealForClient(client.id);
      if (deal) {
        dealId = deal.id;
      }
    }

    // Create the ticket
    const newTicket = await db.insert(supportTickets)
      .values({
        clientId,
        dealId,
        applicationSource: payload.applicationSource,
        externalTicketId: payload.externalTicketId || null,
        submitterEmail: payload.submitterEmail.toLowerCase(),
        submitterName: payload.submitterName || null,
        title: payload.title,
        description: payload.description,
        screenshotUrl: payload.screenshotUrl || null,
        priority: payload.priority || 'medium',
        page: payload.page || null,
        status: payload.status || 'pending',
        timeSpent: '0',
        readyToBill: false,
      })
      .returning();

    // Log activity
    await db.insert(activityLog).values({
      entityType: 'ticket',
      entityId: newTicket[0].id,
      action: 'created_external',
      userId: null, // External creation, no user
      details: {
        applicationSource: payload.applicationSource,
        externalTicketId: payload.externalTicketId,
        submitterEmail: payload.submitterEmail,
        clientMatched: !!clientId,
        dealMatched: !!dealId,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Ticket received successfully',
      ticket: {
        id: newTicket[0].id,
        title: newTicket[0].title,
        status: newTicket[0].status,
        clientMatched: !!clientId,
        dealMatched: !!dealId,
        createdAt: newTicket[0].createdAt,
      }
    });
  } catch (error) {
    console.error('Error receiving external ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get ticket status by external ID (for apps to check status)
export const getExternalTicketStatus = async (req: Request, res: Response) => {
  try {
    const { externalId } = req.params;
    const apiKey = req.headers['x-api-key'] as string;
    const applicationSource = req.headers['x-application-source'] as string;

    if (!apiKey || !applicationSource) {
      return res.status(401).json({
        success: false,
        message: 'API key and application source headers are required'
      });
    }

    if (!validateApiKey(apiKey, applicationSource)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    const ticket = await db.select({
      id: supportTickets.id,
      title: supportTickets.title,
      status: supportTickets.status,
      priority: supportTickets.priority,
      resolution: supportTickets.resolution,
      resolvedAt: supportTickets.resolvedAt,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .where(
      and(
        eq(supportTickets.externalTicketId, externalId),
        eq(supportTickets.applicationSource, applicationSource)
      )
    )
    .limit(1);

    if (ticket.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      ticket: ticket[0]
    });
  } catch (error) {
    console.error('Error fetching external ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket status'
    });
  }
};

// Health check endpoint for external apps
export const externalTicketsHealthCheck = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'External tickets API is operational',
    timestamp: new Date().toISOString(),
    supportedSources: VALID_SOURCES,
  });
};
