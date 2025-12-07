import type { Request, Response } from 'express';
import { db } from '../../db/index';
import {
  stripeCustomers,
  invoices,
  paymentIntents,
  subscriptions,
  quotes,
  paymentLinks,
  clients
} from '../../db/schema';
import { eq } from 'drizzle-orm';
import * as stripeService from '../services/stripe';

// ==================== SYNC OPERATIONS ====================

/**
 * Sync all customers from Stripe to database
 */
export async function syncStripeCustomers(req: Request, res: Response) {
  try {
    const stripeCustomersList = await stripeService.getAllStripeCustomers();
    const syncedCount = {
      created: 0,
      updated: 0,
      skipped: 0,
    };

    for (const stripeCustomer of stripeCustomersList) {
      // Check if customer already exists in our database
      const existing = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.stripeCustomerId, stripeCustomer.id))
        .limit(1);

      if (existing.length > 0) {
        // Update existing customer
        await db
          .update(stripeCustomers)
          .set({
            email: stripeCustomer.email ?? undefined,
            name: stripeCustomer.name ?? undefined,
            phone: stripeCustomer.phone ?? undefined,
            currency: stripeCustomer.currency ?? 'usd',
            balance: (stripeCustomer.balance / 100).toString(),
            stripeData: stripeCustomer as any,
            updatedAt: new Date(),
          })
          .where(eq(stripeCustomers.id, existing[0].id));

        syncedCount.updated++;
      } else {
        // For new customers without a linked client, skip for now
        // They can be linked manually in the UI
        syncedCount.skipped++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${stripeCustomersList.length} Stripe customers`,
      stats: syncedCount,
    });
  } catch (error: any) {
    console.error('Error syncing Stripe customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync Stripe customers',
      error: error.message,
    });
  }
}

/**
 * Sync all invoices from Stripe to database
 */
export async function syncStripeInvoices(req: Request, res: Response) {
  try {
    const stripeInvoicesList = await stripeService.getAllStripeInvoices();
    const syncedCount = {
      created: 0,
      updated: 0,
    };

    for (const stripeInvoice of stripeInvoicesList) {
      // Find the corresponding customer in our database
      const customerRecord = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.stripeCustomerId, stripeInvoice.customer as string))
        .limit(1);

      if (customerRecord.length === 0) {
        console.log(`Skipping invoice ${stripeInvoice.id} - customer not found in database`);
        continue;
      }

      const stripeCustomer = customerRecord[0];

      // Check if invoice already exists
      const existing = await db
        .select()
        .from(invoices)
        .where(eq(invoices.stripeInvoiceId, stripeInvoice.id))
        .limit(1);

      const invoiceData = {
        clientId: stripeCustomer.clientId,
        stripeCustomerId: stripeCustomer.id,
        stripeInvoiceId: stripeInvoice.id,
        stripePaymentIntentId: stripeInvoice.payment_intent as string | null,
        invoiceNumber: stripeInvoice.number ?? undefined,
        description: stripeInvoice.description ?? undefined,
        subtotal: (stripeInvoice.subtotal / 100).toString(),
        tax: (stripeInvoice.tax ?? 0 / 100).toString(),
        total: (stripeInvoice.total / 100).toString(),
        amountPaid: (stripeInvoice.amount_paid / 100).toString(),
        amountDue: (stripeInvoice.amount_due / 100).toString(),
        currency: stripeInvoice.currency,
        status: stripeInvoice.status ?? 'draft',
        dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : undefined,
        paidAt: stripeInvoice.status_transitions?.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
          : undefined,
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url ?? undefined,
        invoicePdf: stripeInvoice.invoice_pdf ?? undefined,
        lineItems: stripeInvoice.lines?.data as any,
        stripeData: stripeInvoice as any,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db
          .update(invoices)
          .set(invoiceData)
          .where(eq(invoices.id, existing[0].id));
        syncedCount.updated++;
      } else {
        await db.insert(invoices).values(invoiceData as any);
        syncedCount.created++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${stripeInvoicesList.length} Stripe invoices`,
      stats: syncedCount,
    });
  } catch (error: any) {
    console.error('Error syncing Stripe invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync Stripe invoices',
      error: error.message,
    });
  }
}

/**
 * Sync all payment intents from Stripe to database
 */
export async function syncStripePaymentIntents(req: Request, res: Response) {
  try {
    const stripePaymentIntentsList = await stripeService.getAllPaymentIntents();
    const syncedCount = {
      created: 0,
      updated: 0,
    };

    for (const pi of stripePaymentIntentsList) {
      // Find the corresponding customer
      let stripeCustomer = null;
      if (pi.customer) {
        const customerRecord = await db
          .select()
          .from(stripeCustomers)
          .where(eq(stripeCustomers.stripeCustomerId, pi.customer as string))
          .limit(1);

        if (customerRecord.length > 0) {
          stripeCustomer = customerRecord[0];
        }
      }

      // Check if payment intent already exists
      const existing = await db
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.stripePaymentIntentId, pi.id))
        .limit(1);

      const paymentIntentData = {
        clientId: stripeCustomer?.clientId,
        stripeCustomerId: stripeCustomer?.id,
        stripePaymentIntentId: pi.id,
        amount: (pi.amount / 100).toString(),
        currency: pi.currency,
        status: pi.status,
        paymentMethod: pi.payment_method as string | null,
        paymentMethodDetails: pi.charges?.data[0]?.payment_method_details as any,
        description: pi.description ?? undefined,
        receiptEmail: pi.receipt_email ?? undefined,
        stripeData: pi as any,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db
          .update(paymentIntents)
          .set(paymentIntentData)
          .where(eq(paymentIntents.id, existing[0].id));
        syncedCount.updated++;
      } else {
        await db.insert(paymentIntents).values(paymentIntentData as any);
        syncedCount.created++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${stripePaymentIntentsList.length} payment intents`,
      stats: syncedCount,
    });
  } catch (error: any) {
    console.error('Error syncing payment intents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync payment intents',
      error: error.message,
    });
  }
}

/**
 * Sync all subscriptions from Stripe to database
 */
export async function syncStripeSubscriptions(req: Request, res: Response) {
  try {
    const stripeSubscriptionsList = await stripeService.getAllSubscriptions();
    const syncedCount = {
      created: 0,
      updated: 0,
    };

    for (const sub of stripeSubscriptionsList) {
      // Find the corresponding customer
      const customerRecord = await db
        .select()
        .from(stripeCustomers)
        .where(eq(stripeCustomers.stripeCustomerId, sub.customer as string))
        .limit(1);

      if (customerRecord.length === 0) {
        console.log(`Skipping subscription ${sub.id} - customer not found`);
        continue;
      }

      const stripeCustomer = customerRecord[0];

      // Check if subscription already exists
      const existing = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))
        .limit(1);

      const subscriptionData = {
        clientId: stripeCustomer.clientId,
        stripeCustomerId: stripeCustomer.id,
        stripeSubscriptionId: sub.id,
        status: sub.status,
        currency: sub.currency,
        amount: sub.items.data[0]?.price?.unit_amount
          ? (sub.items.data[0].price.unit_amount / 100).toString()
          : '0',
        interval: sub.items.data[0]?.price?.recurring?.interval ?? 'month',
        intervalCount: sub.items.data[0]?.price?.recurring?.interval_count ?? 1,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : undefined,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : undefined,
        endedAt: sub.ended_at ? new Date(sub.ended_at * 1000) : undefined,
        trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : undefined,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
        items: sub.items.data as any,
        stripeData: sub as any,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db
          .update(subscriptions)
          .set(subscriptionData)
          .where(eq(subscriptions.id, existing[0].id));
        syncedCount.updated++;
      } else {
        await db.insert(subscriptions).values(subscriptionData as any);
        syncedCount.created++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${stripeSubscriptionsList.length} subscriptions`,
      stats: syncedCount,
    });
  } catch (error: any) {
    console.error('Error syncing subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync subscriptions',
      error: error.message,
    });
  }
}

/**
 * Sync all Stripe data (customers, invoices, payments, subscriptions)
 */
export async function syncAllStripeData(req: Request, res: Response) {
  try {
    console.log('Starting full Stripe data sync...');

    // Sync in order: customers -> invoices -> payment intents -> subscriptions
    const results = {
      customers: { created: 0, updated: 0, skipped: 0 },
      invoices: { created: 0, updated: 0 },
      paymentIntents: { created: 0, updated: 0 },
      subscriptions: { created: 0, updated: 0 },
    };

    // Create mock request/response objects for internal calls
    const mockReq = req;
    let mockRes: any;

    // Customers
    mockRes = {
      json: (data: any) => {
        if (data.success && data.stats) {
          results.customers = data.stats;
        }
      },
      status: () => mockRes,
    };
    await syncStripeCustomers(mockReq, mockRes);

    // Invoices
    mockRes = {
      json: (data: any) => {
        if (data.success && data.stats) {
          results.invoices = data.stats;
        }
      },
      status: () => mockRes,
    };
    await syncStripeInvoices(mockReq, mockRes);

    // Payment Intents
    mockRes = {
      json: (data: any) => {
        if (data.success && data.stats) {
          results.paymentIntents = data.stats;
        }
      },
      status: () => mockRes,
    };
    await syncStripePaymentIntents(mockReq, mockRes);

    // Subscriptions
    mockRes = {
      json: (data: any) => {
        if (data.success && data.stats) {
          results.subscriptions = data.stats;
        }
      },
      status: () => mockRes,
    };
    await syncStripeSubscriptions(mockReq, mockRes);

    res.json({
      success: true,
      message: 'Full Stripe data sync completed',
      results,
    });
  } catch (error: any) {
    console.error('Error in full Stripe sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete full Stripe sync',
      error: error.message,
    });
  }
}

// ==================== INVOICE CREATION ====================

/**
 * Create a new Stripe invoice for a client
 */
export async function createInvoice(req: Request, res: Response) {
  try {
    const {
      clientId,
      description,
      lineItems, // [{ description, amount, quantity }]
      dueDate,
      sendImmediately,
    } = req.body;

    // Get client
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (client.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }

    // Get or create Stripe customer for this client
    let stripeCustomerRecord = await db
      .select()
      .from(stripeCustomers)
      .where(eq(stripeCustomers.clientId, clientId))
      .limit(1);

    let stripeCustomerId: string;

    if (stripeCustomerRecord.length === 0) {
      // Create new Stripe customer
      const newStripeCustomer = await stripeService.createStripeCustomer({
        email: client[0].email,
        name: client[0].name,
        phone: client[0].phone ?? undefined,
        metadata: {
          clientId: clientId.toString(),
        },
      });

      // Save to database
      const inserted = await db
        .insert(stripeCustomers)
        .values({
          clientId,
          stripeCustomerId: newStripeCustomer.id,
          email: newStripeCustomer.email ?? undefined,
          name: newStripeCustomer.name ?? undefined,
          phone: newStripeCustomer.phone ?? undefined,
          stripeData: newStripeCustomer as any,
        })
        .returning();

      stripeCustomerId = newStripeCustomer.id;
      stripeCustomerRecord = inserted;
    } else {
      stripeCustomerId = stripeCustomerRecord[0].stripeCustomerId;
    }

    // Create invoice in Stripe
    const stripeInvoice = await stripeService.createStripeInvoice({
      customer: stripeCustomerId,
      description,
      dueDate: dueDate ? Math.floor(new Date(dueDate).getTime() / 1000) : undefined,
      autoAdvance: false, // Don't auto-finalize
      collectionMethod: 'send_invoice',
      metadata: {
        clientId: clientId.toString(),
      },
    });

    // Add line items
    let totalAmount = 0;
    for (const item of lineItems) {
      const amountInCents = Math.round(item.amount * 100);
      totalAmount += amountInCents * (item.quantity || 1);

      await stripeService.addInvoiceLineItem({
        customer: stripeCustomerId,
        invoice: stripeInvoice.id,
        description: item.description,
        amount: amountInCents,
        quantity: item.quantity || 1,
      });
    }

    // Retrieve the updated invoice with line items
    const updatedInvoice = await stripeService.getStripeInvoice(stripeInvoice.id);

    // Finalize the invoice
    const finalizedInvoice = await stripeService.finalizeStripeInvoice(stripeInvoice.id);

    // Send invoice if requested
    if (sendImmediately) {
      await stripeService.sendStripeInvoice(stripeInvoice.id);
    }

    // Save invoice to database
    const savedInvoice = await db
      .insert(invoices)
      .values({
        clientId,
        stripeCustomerId: stripeCustomerRecord[0].id,
        stripeInvoiceId: finalizedInvoice.id,
        invoiceNumber: finalizedInvoice.number ?? undefined,
        description: finalizedInvoice.description ?? undefined,
        subtotal: (finalizedInvoice.subtotal / 100).toString(),
        tax: ((finalizedInvoice.tax ?? 0) / 100).toString(),
        total: (finalizedInvoice.total / 100).toString(),
        amountPaid: (finalizedInvoice.amount_paid / 100).toString(),
        amountDue: (finalizedInvoice.amount_due / 100).toString(),
        currency: finalizedInvoice.currency,
        status: finalizedInvoice.status ?? 'draft',
        dueDate: finalizedInvoice.due_date ? new Date(finalizedInvoice.due_date * 1000) : undefined,
        hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url ?? undefined,
        invoicePdf: finalizedInvoice.invoice_pdf ?? undefined,
        lineItems: finalizedInvoice.lines?.data as any,
        stripeData: finalizedInvoice as any,
      })
      .returning();

    res.json({
      success: true,
      message: sendImmediately ? 'Invoice created and sent successfully' : 'Invoice created successfully',
      invoice: savedInvoice[0],
      stripeInvoice: finalizedInvoice,
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice',
      error: error.message,
    });
  }
}

// ==================== PAYMENT LINKS ====================

/**
 * Create a payment link for a client
 */
export async function createPaymentLinkForClient(req: Request, res: Response) {
  try {
    const { clientId, amount, description } = req.body;

    const amountInCents = Math.round(amount * 100);

    const stripePaymentLink = await stripeService.createPaymentLink({
      amount: amountInCents,
      description,
      metadata: {
        clientId: clientId.toString(),
      },
    });

    // Save to database
    const savedLink = await db
      .insert(paymentLinks)
      .values({
        clientId,
        stripePaymentLinkId: stripePaymentLink.id,
        url: stripePaymentLink.url,
        description,
        amount: amount.toString(),
        currency: 'usd',
        active: stripePaymentLink.active,
        stripeData: stripePaymentLink as any,
      })
      .returning();

    res.json({
      success: true,
      message: 'Payment link created successfully',
      paymentLink: savedLink[0],
    });
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment link',
      error: error.message,
    });
  }
}

// ==================== GET DATA ====================

/**
 * Get all billing data for dashboard
 */
export async function getBillingDashboard(req: Request, res: Response) {
  try {
    const [
      allInvoices,
      allPaymentIntents,
      allSubscriptions,
      allQuotes,
      allPaymentLinks,
    ] = await Promise.all([
      db.select().from(invoices),
      db.select().from(paymentIntents),
      db.select().from(subscriptions),
      db.select().from(quotes),
      db.select().from(paymentLinks),
    ]);

    // Calculate totals
    const totalRevenue = allInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    const totalOutstanding = allInvoices
      .filter(inv => inv.status === 'open')
      .reduce((sum, inv) => sum + parseFloat(inv.amountDue), 0);

    const totalDraft = allInvoices
      .filter(inv => inv.status === 'draft')
      .reduce((sum, inv) => sum + parseFloat(inv.total), 0);

    res.json({
      success: true,
      data: {
        invoices: allInvoices,
        paymentIntents: allPaymentIntents,
        subscriptions: allSubscriptions,
        quotes: allQuotes,
        paymentLinks: allPaymentLinks,
        summary: {
          totalRevenue,
          totalOutstanding,
          totalDraft,
          totalInvoices: allInvoices.length,
          totalSubscriptions: allSubscriptions.filter(s => s.status === 'active').length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching billing dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing dashboard',
      error: error.message,
    });
  }
}
