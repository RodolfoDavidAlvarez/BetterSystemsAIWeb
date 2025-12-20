import type { Request, Response } from "express";
import { db } from "../../db/index";
import { stripeCustomers, invoices, paymentIntents, subscriptions, quotes, paymentLinks, clients, deals, supportTickets } from "../../db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import * as stripeService from "../services/stripe";

// ==================== SYNC OPERATIONS ====================

/**
 * Sync all customers from Stripe to database AND CRM
 * Creates/updates clients in CRM based on Stripe customer data
 */
export async function syncStripeCustomers(req: Request, res: Response) {
  try {
    console.log("Starting comprehensive Stripe customer sync...");
    const stripeCustomersList = await stripeService.getAllStripeCustomers();
    console.log(`Found ${stripeCustomersList.length} Stripe customers to sync`);

    const syncedCount = {
      stripeCustomersCreated: 0,
      stripeCustomersUpdated: 0,
      crmClientsCreated: 0,
      crmClientsUpdated: 0,
      skipped: 0,
    };

    for (const stripeCustomer of stripeCustomersList) {
      // Check if Stripe customer record already exists in our database
      const existingStripeCustomer = await db.select().from(stripeCustomers).where(eq(stripeCustomers.stripeCustomerId, stripeCustomer.id)).limit(1);

      let stripeCustomerDbId: number;

      if (existingStripeCustomer.length > 0) {
        // Update existing Stripe customer record
        await db
          .update(stripeCustomers)
          .set({
            email: stripeCustomer.email ?? undefined,
            name: stripeCustomer.name ?? undefined,
            phone: stripeCustomer.phone ?? undefined,
            currency: stripeCustomer.currency ?? "usd",
            balance: ((stripeCustomer.balance || 0) / 100).toString(),
            stripeData: stripeCustomer as any,
            updatedAt: new Date(),
          })
          .where(eq(stripeCustomers.id, existingStripeCustomer[0].id));

        stripeCustomerDbId = existingStripeCustomer[0].id;
        syncedCount.stripeCustomersUpdated++;

        // Update linked client if exists
        if (existingStripeCustomer[0].clientId) {
          await db
            .update(clients)
            .set({
              email: stripeCustomer.email ?? undefined,
              name: stripeCustomer.name ?? undefined,
              phone: stripeCustomer.phone ?? undefined,
              updatedAt: new Date(),
            })
            .where(eq(clients.id, existingStripeCustomer[0].clientId));
          syncedCount.crmClientsUpdated++;
        }
      } else {
        // Create new Stripe customer record
        const inserted = await db
          .insert(stripeCustomers)
          .values({
            stripeCustomerId: stripeCustomer.id,
            email: stripeCustomer.email ?? undefined,
            name: stripeCustomer.name ?? undefined,
            phone: stripeCustomer.phone ?? undefined,
            currency: stripeCustomer.currency ?? "usd",
            balance: ((stripeCustomer.balance || 0) / 100).toString(),
            stripeData: stripeCustomer as any,
          })
          .returning();

        if (inserted.length > 0) {
          stripeCustomerDbId = inserted[0].id;
          syncedCount.stripeCustomersCreated++;
        } else {
          syncedCount.skipped++;
          continue;
        }
      }

      // Sync to CRM clients table
      if (stripeCustomer.email) {
        // Check if client already exists by email
        const existingClient = await db.select().from(clients).where(eq(clients.email, stripeCustomer.email)).limit(1);

        if (existingClient.length > 0) {
          // Update existing client and link to Stripe customer
          await db
            .update(clients)
            .set({
              name: stripeCustomer.name || existingClient[0].name,
              phone: stripeCustomer.phone || existingClient[0].phone,
              updatedAt: new Date(),
            })
            .where(eq(clients.id, existingClient[0].id));

          // Link Stripe customer to client if not already linked
          if (!existingStripeCustomer[0]?.clientId) {
            await db.update(stripeCustomers).set({ clientId: existingClient[0].id }).where(eq(stripeCustomers.id, stripeCustomerDbId));
          }

          syncedCount.crmClientsUpdated++;
        } else {
          // Create new client in CRM from Stripe customer data
          const newClient = await db
            .insert(clients)
            .values({
              name: stripeCustomer.name || stripeCustomer.email.split("@")[0] || "Unknown",
              email: stripeCustomer.email,
              phone: stripeCustomer.phone ?? undefined,
              status: "active", // Mark as active since they have Stripe account
              source: "stripe", // Indicate they came from Stripe
              notes: `Synced from Stripe customer ${stripeCustomer.id}`,
            })
            .returning();

          if (newClient.length > 0) {
            // Link Stripe customer to new client
            await db.update(stripeCustomers).set({ clientId: newClient[0].id }).where(eq(stripeCustomers.id, stripeCustomerDbId));

            syncedCount.crmClientsCreated++;
          }
        }
      } else {
        syncedCount.skipped++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${stripeCustomersList.length} Stripe customers to database and CRM`,
      stats: syncedCount,
    });
  } catch (error: any) {
    console.error("Error syncing Stripe customers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync Stripe customers",
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
      const existing = await db.select().from(invoices).where(eq(invoices.stripeInvoiceId, stripeInvoice.id)).limit(1);

      const invoiceData = {
        clientId: stripeCustomer.clientId,
        stripeCustomerId: stripeCustomer.id,
        stripeInvoiceId: stripeInvoice.id,
        stripePaymentIntentId: stripeInvoice.payment_intent as string | null,
        invoiceNumber: stripeInvoice.number ?? undefined,
        description: stripeInvoice.description ?? undefined,
        subtotal: (stripeInvoice.subtotal / 100).toString(),
        tax: ((stripeInvoice.tax ?? 0) / 100).toString(), // Fixed: proper parentheses for tax calculation
        total: (stripeInvoice.total / 100).toString(),
        amountPaid: (stripeInvoice.amount_paid / 100).toString(),
        amountDue: (stripeInvoice.amount_due / 100).toString(),
        currency: stripeInvoice.currency || "usd",
        status: stripeInvoice.status ?? "draft",
        dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : undefined,
        paidAt: stripeInvoice.status_transitions?.paid_at ? new Date(stripeInvoice.status_transitions.paid_at * 1000) : undefined,
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url ?? undefined,
        invoicePdf: stripeInvoice.invoice_pdf ?? undefined,
        lineItems: stripeInvoice.lines?.data as any,
        stripeData: stripeInvoice as any,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db.update(invoices).set(invoiceData).where(eq(invoices.id, existing[0].id));
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
    console.error("Error syncing Stripe invoices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync Stripe invoices",
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
      const existing = await db.select().from(paymentIntents).where(eq(paymentIntents.stripePaymentIntentId, pi.id)).limit(1);

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
        await db.update(paymentIntents).set(paymentIntentData).where(eq(paymentIntents.id, existing[0].id));
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
    console.error("Error syncing payment intents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync payment intents",
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
      const existing = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, sub.id)).limit(1);

      const subscriptionData = {
        clientId: stripeCustomer.clientId,
        stripeCustomerId: stripeCustomer.id,
        stripeSubscriptionId: sub.id,
        status: sub.status,
        currency: sub.currency,
        amount: sub.items.data[0]?.price?.unit_amount ? (sub.items.data[0].price.unit_amount / 100).toString() : "0",
        interval: sub.items.data[0]?.price?.recurring?.interval ?? "month",
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
        await db.update(subscriptions).set(subscriptionData).where(eq(subscriptions.id, existing[0].id));
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
    console.error("Error syncing subscriptions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync subscriptions",
      error: error.message,
    });
  }
}

/**
 * Sync all Stripe data (customers, invoices, payments, subscriptions)
 * This is a comprehensive sync that fetches ALL historical data from Stripe
 */
export async function syncAllStripeData(req: Request, res: Response) {
  try {
    console.log("Starting comprehensive Stripe data sync (fetching ALL historical data)...");

    // Sync in order: customers -> invoices -> payment intents -> subscriptions
    const results = {
      customers: { stripeCustomersCreated: 0, stripeCustomersUpdated: 0, crmClientsCreated: 0, crmClientsUpdated: 0, skipped: 0 },
      invoices: { created: 0, updated: 0 },
      paymentIntents: { created: 0, updated: 0 },
      subscriptions: { created: 0, updated: 0 },
    };

    // Create mock request/response objects for internal calls
    const mockReq = req;
    let mockRes: any;

    // Customers (this also syncs to CRM)
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
      message: "Comprehensive Stripe data sync completed - all historical data fetched",
      results,
      note: "All customers have been synced to CRM. Check the Clients page to see them.",
    });
  } catch (error: any) {
    console.error("Error in full Stripe sync:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete full Stripe sync",
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
      dealId,
      description,
      lineItems, // [{ description, amount, quantity, tax }]
      dueDate,
      sendImmediately,
      taxRate,
      notes,
    } = req.body;

    // Get client
    const client = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);

    if (client.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Get or create Stripe customer for this client
    let stripeCustomerRecord = await db.select().from(stripeCustomers).where(eq(stripeCustomers.clientId, clientId)).limit(1);

    let stripeCustomerId: string;
    let stripeCustomerDbId: number;

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
          currency: "usd",
          balance: "0",
          stripeData: newStripeCustomer as any,
        })
        .returning();

      if (inserted.length === 0) {
        throw new Error("Failed to save Stripe customer to database");
      }

      stripeCustomerId = newStripeCustomer.id;
      stripeCustomerDbId = inserted[0].id;
      stripeCustomerRecord = inserted;
    } else {
      stripeCustomerId = stripeCustomerRecord[0].stripeCustomerId;
      stripeCustomerDbId = stripeCustomerRecord[0].id;

      // Update customer info if it has changed
      await db
        .update(stripeCustomers)
        .set({
          email: client[0].email,
          name: client[0].name,
          phone: client[0].phone ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(stripeCustomers.id, stripeCustomerDbId));
    }

    // Create invoice in Stripe
    const stripeInvoice = await stripeService.createStripeInvoice({
      customer: stripeCustomerId,
      description,
      dueDate: dueDate ? Math.floor(new Date(dueDate).getTime() / 1000) : undefined,
      autoAdvance: false, // Don't auto-finalize
      collectionMethod: "send_invoice",
      metadata: {
        clientId: clientId.toString(),
      },
    });

    // Add line items
    let subtotalAmount = 0;
    for (const item of lineItems) {
      const amountInCents = Math.round(item.amount * 100);
      const quantity = item.quantity || 1;
      subtotalAmount += amountInCents * quantity;

      const lineItemParams: any = {
        customer: stripeCustomerId,
        invoice: stripeInvoice.id,
        description: item.description,
        amount: amountInCents,
        quantity: quantity,
      };

      // Add tax rate if provided for this line item
      if (item.taxRateId) {
        lineItemParams.tax_rates = [item.taxRateId];
      }

      await stripeService.addInvoiceLineItem(lineItemParams);
    }

    // Apply default tax rate if provided
    if (taxRate && !lineItems.some((item: any) => item.taxRateId)) {
      // Note: Tax rates need to be created in Stripe first
      // This is a placeholder for future tax rate support
    }

    // Update invoice with notes if provided
    if (notes) {
      await stripeService.updateStripeInvoice(stripeInvoice.id, {
        metadata: {
          notes: notes,
        },
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

    // Ensure we have all required data before saving
    if (!stripeCustomerDbId) {
      throw new Error("Stripe customer database ID is missing");
    }

    // Save invoice to database with all required fields
    const savedInvoice = await db
      .insert(invoices)
      .values({
        clientId,
        dealId: dealId ? parseInt(dealId) : undefined,
        stripeCustomerId: stripeCustomerDbId,
        stripeInvoiceId: finalizedInvoice.id,
        stripePaymentIntentId: finalizedInvoice.payment_intent as string | null,
        invoiceNumber: finalizedInvoice.number ?? undefined,
        description: finalizedInvoice.description ?? (notes || undefined),
        subtotal: (finalizedInvoice.subtotal / 100).toString(),
        tax: ((finalizedInvoice.tax ?? 0) / 100).toString(),
        total: (finalizedInvoice.total / 100).toString(),
        amountPaid: (finalizedInvoice.amount_paid / 100).toString(),
        amountDue: (finalizedInvoice.amount_due / 100).toString(),
        currency: finalizedInvoice.currency || "usd",
        status: finalizedInvoice.status ?? "draft",
        dueDate: finalizedInvoice.due_date ? new Date(finalizedInvoice.due_date * 1000) : undefined,
        paidAt: finalizedInvoice.status_transitions?.paid_at ? new Date(finalizedInvoice.status_transitions.paid_at * 1000) : undefined,
        hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url ?? undefined,
        invoicePdf: finalizedInvoice.invoice_pdf ?? undefined,
        lineItems: finalizedInvoice.lines?.data as any,
        stripeData: finalizedInvoice as any,
      })
      .returning();

    if (savedInvoice.length === 0) {
      throw new Error("Failed to save invoice to database");
    }

    res.json({
      success: true,
      message: sendImmediately ? "Invoice created and sent successfully" : "Invoice created successfully",
      invoice: savedInvoice[0],
      stripeInvoice: finalizedInvoice,
    });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
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
        currency: "usd",
        active: stripePaymentLink.active,
        stripeData: stripePaymentLink as any,
      })
      .returning();

    res.json({
      success: true,
      message: "Payment link created successfully",
      paymentLink: savedLink[0],
    });
  } catch (error: any) {
    console.error("Error creating payment link:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment link",
      error: error.message,
    });
  }
}

// ==================== GET DATA ====================

/**
 * Get client-grouped billing summary with running balances
 */
export async function getClientBillingSummary(req: Request, res: Response) {
  try {
    const { clientId } = req.params;

    // Get all billing data for this client
    const [clientInvoices, clientPaymentIntents, clientSubscriptions, client] = await Promise.all([
      clientId
        ? db
            .select()
            .from(invoices)
            .where(eq(invoices.clientId, parseInt(clientId)))
        : db.select().from(invoices),
      clientId
        ? db
            .select()
            .from(paymentIntents)
            .where(eq(paymentIntents.clientId, parseInt(clientId)))
        : db.select().from(paymentIntents),
      clientId
        ? db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.clientId, parseInt(clientId)))
        : db.select().from(subscriptions),
      clientId
        ? db
            .select()
            .from(clients)
            .where(eq(clients.id, parseInt(clientId)))
            .limit(1)
        : Promise.resolve([]),
    ]);

    // Calculate running balance
    const transactions: any[] = [];

    // Add invoices as transactions
    clientInvoices.forEach((inv: any) => {
      transactions.push({
        date: inv.createdAt,
        type: "invoice",
        description: inv.description || `Invoice ${inv.invoiceNumber}`,
        amount: parseFloat(inv.total),
        amountPaid: parseFloat(inv.amountPaid),
        status: inv.status,
        invoiceNumber: inv.invoiceNumber,
      });
    });

    // Add payments as transactions
    clientPaymentIntents
      .filter((pi: any) => pi.status === "succeeded")
      .forEach((pi: any) => {
        transactions.push({
          date: pi.createdAt,
          type: "payment",
          description: pi.description || "Payment received",
          amount: -parseFloat(pi.amount), // Negative because it reduces balance
          status: "paid",
        });
      });

    // Sort by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = transactions.map((tx) => {
      if (tx.type === "invoice") {
        runningBalance += tx.amount - tx.amountPaid;
      } else {
        runningBalance += tx.amount;
      }
      return {
        ...tx,
        runningBalance,
      };
    });

    // Calculate summary
    const totalInvoiced = clientInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);
    const totalPaid = clientInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amountPaid), 0);
    const totalOutstanding = clientInvoices
      .filter((inv: any) => inv.status === "open")
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.amountDue), 0);

    res.json({
      success: true,
      data: {
        client: client[0] || null,
        transactions: transactionsWithBalance,
        summary: {
          totalInvoiced,
          totalPaid,
          totalOutstanding,
          currentBalance: runningBalance,
          invoiceCount: clientInvoices.length,
          activeSubscriptions: clientSubscriptions.filter((s: any) => s.status === "active").length,
        },
        invoices: clientInvoices,
        subscriptions: clientSubscriptions,
      },
    });
  } catch (error: any) {
    console.error("Error fetching client billing summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client billing summary",
      error: error.message,
    });
  }
}

/**
 * Get fresh Stripe data directly from API (without syncing to database)
 */
export async function getFreshStripeData(req: Request, res: Response) {
  try {
    const [stripeInvoices, stripeSubscriptions, stripeCustomers] = await Promise.all([
      stripeService.getAllStripeInvoices(),
      stripeService.getAllSubscriptions(),
      stripeService.getAllStripeCustomers(),
    ]);

    // Calculate summary from Stripe data
    const totalRevenue = stripeInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total / 100, 0);

    const totalOutstanding = stripeInvoices.filter((inv) => inv.status === "open").reduce((sum, inv) => sum + inv.amount_due / 100, 0);

    const totalDraft = stripeInvoices.filter((inv) => inv.status === "draft").reduce((sum, inv) => sum + inv.total / 100, 0);

    res.json({
      success: true,
      data: {
        invoices: stripeInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.number,
          customer: inv.customer,
          description: inv.description,
          total: inv.total / 100,
          amountDue: inv.amount_due / 100,
          amountPaid: inv.amount_paid / 100,
          currency: inv.currency,
          status: inv.status,
          dueDate: inv.due_date ? new Date(inv.due_date * 1000).toISOString() : null,
          created: new Date(inv.created * 1000).toISOString(),
          hostedInvoiceUrl: inv.hosted_invoice_url,
          invoicePdf: inv.invoice_pdf,
          lineItems: inv.lines?.data || [],
        })),
        subscriptions: stripeSubscriptions.map((sub) => ({
          id: sub.id,
          customer: sub.customer,
          status: sub.status,
          amount: sub.items.data[0]?.price?.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
          currency: sub.currency,
          interval: sub.items.data[0]?.price?.recurring?.interval || "month",
          intervalCount: sub.items.data[0]?.price?.recurring?.interval_count || 1,
          currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        })),
        customers: stripeCustomers.map((cust) => ({
          id: cust.id,
          email: cust.email,
          name: cust.name,
        })),
        summary: {
          totalRevenue,
          totalOutstanding,
          totalDraft,
          totalInvoices: stripeInvoices.length,
          totalSubscriptions: stripeSubscriptions.filter((s) => s.status === "active").length,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching fresh Stripe data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fresh Stripe data",
      error: error.message,
    });
  }
}

/**
 * Get deal-grouped billing summary
 */
export async function getDealBillingSummary(req: Request, res: Response) {
  try {
    const { dealId } = req.params;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        message: "Deal ID is required",
      });
    }

    // Get the deal and its client
    const dealRecord = await db
      .select()
      .from(deals)
      .where(eq(deals.id, parseInt(dealId)))
      .limit(1);

    if (dealRecord.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    const deal = dealRecord[0];
    const clientId = deal.clientId;

    // Get all billing data for this client (since deals belong to clients)
    const [clientInvoices, clientPaymentIntents, clientSubscriptions, client] = await Promise.all([
      db.select().from(invoices).where(eq(invoices.clientId, clientId)),
      db.select().from(paymentIntents).where(eq(paymentIntents.clientId, clientId)),
      db.select().from(subscriptions).where(eq(subscriptions.clientId, clientId)),
      db.select().from(clients).where(eq(clients.id, clientId)).limit(1),
    ]);

    // Filter invoices by dealId if present, otherwise show all client invoices
    const dealInvoices = dealId ? clientInvoices.filter((inv: any) => inv.dealId === parseInt(dealId)) : clientInvoices;

    // Calculate running balance
    const transactions: any[] = [];

    // Add invoices as transactions
    dealInvoices.forEach((inv: any) => {
      transactions.push({
        date: inv.createdAt,
        type: "invoice",
        description: inv.description || `Invoice ${inv.invoiceNumber}`,
        amount: parseFloat(inv.total),
        amountPaid: parseFloat(inv.amountPaid),
        status: inv.status,
        invoiceNumber: inv.invoiceNumber,
        invoiceId: inv.id,
      });
    });

    // Add payments as transactions (for this client)
    clientPaymentIntents
      .filter((pi: any) => pi.status === "succeeded")
      .forEach((pi: any) => {
        transactions.push({
          date: pi.createdAt,
          type: "payment",
          description: pi.description || "Payment received",
          amount: -parseFloat(pi.amount), // Negative because it reduces balance
          status: "paid",
          paymentIntentId: pi.id,
        });
      });

    // Sort by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = transactions.map((tx) => {
      if (tx.type === "invoice") {
        runningBalance += tx.amount - tx.amountPaid;
      } else {
        runningBalance += tx.amount;
      }
      return {
        ...tx,
        runningBalance,
      };
    });

    // Calculate summary
    const totalInvoiced = dealInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);
    const totalPaid = dealInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amountPaid), 0);
    const totalOutstanding = dealInvoices
      .filter((inv: any) => inv.status === "open")
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.amountDue), 0);

    res.json({
      success: true,
      data: {
        deal: deal,
        client: client[0] || null,
        transactions: transactionsWithBalance,
        summary: {
          totalInvoiced,
          totalPaid,
          totalOutstanding,
          currentBalance: runningBalance,
          invoiceCount: dealInvoices.length,
          activeSubscriptions: clientSubscriptions.filter((s: any) => s.status === "active").length,
        },
        invoices: dealInvoices,
        subscriptions: clientSubscriptions,
      },
    });
  } catch (error: any) {
    console.error("Error fetching deal billing summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deal billing summary",
      error: error.message,
    });
  }
}

/**
 * Get all billing data for dashboard
 * If database is empty, also fetches from Stripe directly
 */
export async function getBillingDashboard(req: Request, res: Response) {
  try {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "billing.ts:923",
        message: "getBillingDashboard entry",
        data: { timestamp: Date.now() },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion
    const [allInvoices, allPaymentIntents, allSubscriptions, allQuotes, allPaymentLinks, allClients] = await Promise.all([
      db.select().from(invoices),
      db.select().from(paymentIntents),
      db.select().from(subscriptions),
      db.select().from(quotes),
      db.select().from(paymentLinks),
      db.select().from(clients),
    ]);
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "billing.ts:933",
        message: "After DB queries",
        data: { invoicesCount: allInvoices.length, clientsCount: allClients.length },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "B",
      }),
    }).catch(() => {});
    // #endregion

    // Always fetch fresh data from Stripe to ensure we have all historical data
    // This ensures we see all invoices, even if database is empty or incomplete
    let stripeInvoices = allInvoices;
    let stripePaymentIntents = allPaymentIntents;
    let stripeSubscriptions = allSubscriptions;

    // Always fetch customer data from Stripe to enrich invoices with customer info
    // This ensures we have customer names/emails even for database invoices
    let stripeCustomersList: any[] = [];
    try {
      stripeCustomersList = await stripeService.getAllStripeCustomers();
      console.log(`Fetched ${stripeCustomersList.length} Stripe customers for enrichment`);
    } catch (error) {
      console.error("Error fetching Stripe customers for enrichment:", error);
    }

    // Get all Stripe customer records from database
    const allStripeCustomerRecords = await db.select().from(stripeCustomers);

    // Create maps for quick lookup
    const stripeCustomerIdToInfoMap = new Map<string, { name: string | null; email: string | null; clientId: number | null }>();
    const stripeCustomerDbIdToStripeIdMap = new Map<number, string>();

    // Map database stripe customer records
    for (const record of allStripeCustomerRecords) {
      stripeCustomerDbIdToStripeIdMap.set(record.id, record.stripeCustomerId);
      stripeCustomerIdToInfoMap.set(record.stripeCustomerId, {
        name: record.name || null,
        email: record.email || null,
        clientId: record.clientId,
      });
    }

    // Also add Stripe API customer data (more up-to-date)
    for (const cust of stripeCustomersList) {
      const existing = stripeCustomerIdToInfoMap.get(cust.id);
      stripeCustomerIdToInfoMap.set(cust.id, {
        name: cust.name || existing?.name || null,
        email: cust.email || existing?.email || null,
        clientId: existing?.clientId || null,
      });
    }

    // Enrich database invoices with customer info
    if (allInvoices.length > 0) {
      stripeInvoices = allInvoices.map((inv: any) => {
        // Get Stripe customer ID from invoice's stripeCustomerId (which is a DB ID)
        let stripeCustId: string | null = null;
        if (inv.stripeCustomerId) {
          // inv.stripeCustomerId is the database ID (integer), get the actual Stripe customer ID (string)
          stripeCustId = stripeCustomerDbIdToStripeIdMap.get(inv.stripeCustomerId) || null;
        }

        // Fallback: try to get from stripeData (this is the most reliable)
        if (!stripeCustId && inv.stripeData?.customer) {
          stripeCustId = typeof inv.stripeData.customer === "string" ? inv.stripeData.customer : inv.stripeData.customer?.id || null;
        }

        // Get customer info from map
        const customerInfo = stripeCustId ? stripeCustomerIdToInfoMap.get(stripeCustId) : null;

        // Also try to get from the stripeCustomers record directly if we have the DB ID
        let customerInfoFromDb: { name: string | null; email: string | null; clientId: number | null } | null = null;
        if (inv.stripeCustomerId) {
          const stripeCustRecord = allStripeCustomerRecords.find((r) => r.id === inv.stripeCustomerId);
          if (stripeCustRecord) {
            customerInfoFromDb = {
              name: stripeCustRecord.name || null,
              email: stripeCustRecord.email || null,
              clientId: stripeCustRecord.clientId,
            };
          }
        }

        const enrichedInvoice = {
          ...inv,
          customer: stripeCustId,
          customerName: customerInfo?.name || customerInfoFromDb?.name || inv.customerName || null,
          customerEmail: customerInfo?.email || customerInfoFromDb?.email || inv.customerEmail || null,
          // Ensure clientId is set if we found it
          clientId: inv.clientId || customerInfo?.clientId || customerInfoFromDb?.clientId || null,
        };

        // #region agent log
        if (!enrichedInvoice.customerName && !enrichedInvoice.customerEmail) {
          fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "billing.ts:1127",
              message: "Invoice missing customer info",
              data: {
                invoiceId: inv.id,
                stripeInvoiceId: inv.stripeInvoiceId,
                stripeCustomerId: inv.stripeCustomerId,
                hasStripeCustId: !!stripeCustId,
                hasCustomerInfo: !!customerInfo,
                hasCustomerInfoFromDb: !!customerInfoFromDb,
                stripeDataCustomer: inv.stripeData?.customer,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "F",
            }),
          }).catch(() => {});
        }
        // #endregion

        return enrichedInvoice;
      });
    }

    // Always fetch fresh data from Stripe to ensure we have complete customer information
    // This ensures customer names/emails are always available, even for old invoices
    const shouldFetchFromStripe = true; // Always fetch to get customer info

    if (shouldFetchFromStripe) {
      try {
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "billing.ts:939",
            message: "Fetching ALL historical data from Stripe",
            data: { timestamp: Date.now(), hasInvoicesInDB: allInvoices.length > 0 },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }).catch(() => {});
        // #endregion
        console.log("Fetching ALL historical data from Stripe (this may take a moment for large accounts)...");
        // Fetch ALL historical data from Stripe (with pagination)
        // Use already fetched customers if available, otherwise fetch fresh
        const [freshInvoices, freshPaymentIntents, freshSubscriptions] = await Promise.all([
          stripeService.getAllStripeInvoices(),
          stripeService.getAllPaymentIntents(),
          stripeService.getAllSubscriptions(),
        ]);

        // Use existing stripeCustomersList or fetch if empty
        if (stripeCustomersList.length === 0) {
          stripeCustomersList = await stripeService.getAllStripeCustomers();
        }

        // Update the customer info map with fresh Stripe data
        for (const cust of stripeCustomersList) {
          const existing = stripeCustomerIdToInfoMap.get(cust.id);
          stripeCustomerIdToInfoMap.set(cust.id, {
            name: cust.name || existing?.name || null,
            email: cust.email || existing?.email || null,
            clientId: existing?.clientId || null,
          });
        }

        console.log(
          `Fetched ${freshInvoices.length} invoices, ${freshSubscriptions.length} subscriptions, ${stripeCustomersList.length} customers from Stripe`
        );

        // Create a map of Stripe customer IDs to client IDs
        const customerMap = new Map<string, number>();
        const allStripeCustomerRecords = await db.select().from(stripeCustomers);

        // First, use database records to map Stripe customer IDs to client IDs
        for (const stripeCustRecord of allStripeCustomerRecords) {
          if (stripeCustRecord.clientId) {
            customerMap.set(stripeCustRecord.stripeCustomerId, stripeCustRecord.clientId);
          }
        }

        // Also match by email if we have Stripe customer emails from Stripe API
        const stripeCustomerEmailMap = new Map<string, string>(); // email -> stripe customer id
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "billing.ts:962",
            message: "Before stripeCustomersFromAPI loop",
            data: { stripeCustomersListLength: stripeCustomersList?.length || 0, stripeCustomersListType: typeof stripeCustomersList },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "A",
          }),
        }).catch(() => {});
        // #endregion
        for (const cust of stripeCustomersList) {
          if (cust.email) {
            stripeCustomerEmailMap.set(cust.email.toLowerCase(), cust.id);
          }
        }

        // Match clients to Stripe customers by email (if not already in customerMap)
        for (const client of allClients) {
          if (client.email) {
            const stripeCustId = stripeCustomerEmailMap.get(client.email.toLowerCase());
            if (stripeCustId && !customerMap.has(stripeCustId)) {
              // Try to find in database records first
              const matchingRecord = allStripeCustomerRecords.find((r) => r.stripeCustomerId === stripeCustId);
              if (matchingRecord && matchingRecord.clientId) {
                customerMap.set(stripeCustId, matchingRecord.clientId);
              } else {
                // If not in DB, still map it so invoices show up (even if clientId is null)
                // We'll create the link later
              }
            }
          }
        }

        // Convert Stripe invoices to our format
        // Merge with database invoices to preserve any additional data, but use Stripe data for customer info
        const stripeInvoiceMap = new Map<string, any>();
        freshInvoices.forEach((inv: any) => {
          const clientId = inv.customer ? customerMap.get(inv.customer as string) : null;
          // Get customer info from Stripe customer list
          const stripeCustomer = stripeCustomersList.find((c: any) => c.id === inv.customer);
          stripeInvoiceMap.set(inv.id, {
            id: inv.id,
            clientId: clientId,
            stripeInvoiceId: inv.id,
            invoiceNumber: inv.number,
            description: inv.description,
            subtotal: (inv.subtotal / 100).toString(),
            tax: ((inv.tax ?? 0) / 100).toString(),
            total: (inv.total / 100).toString(),
            amountPaid: (inv.amount_paid / 100).toString(),
            amountDue: (inv.amount_due / 100).toString(),
            currency: inv.currency || "usd",
            status: inv.status ?? "draft",
            dueDate: inv.due_date ? new Date(inv.due_date * 1000) : null,
            paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : null,
            hostedInvoiceUrl: inv.hosted_invoice_url,
            invoicePdf: inv.invoice_pdf,
            lineItems: inv.lines?.data || [],
            stripeData: inv,
            customer: inv.customer, // Keep Stripe customer ID
            customerName: stripeCustomer?.name || stripeCustomer?.email || null,
            customerEmail: stripeCustomer?.email || null,
            createdAt: new Date(inv.created * 1000),
            updatedAt: new Date(),
          });
        });

        // Merge: use Stripe data (with customer info) but keep database invoices that might not be in Stripe
        // For database invoices, enrich with customer info if available
        const mergedInvoices = [...stripeInvoiceMap.values()];

        // Add any database invoices that aren't in Stripe (shouldn't happen, but just in case)
        for (const dbInv of allInvoices) {
          if (!stripeInvoiceMap.has(dbInv.stripeInvoiceId)) {
            // Enrich this database invoice with customer info
            let stripeCustId: string | null = null;
            if (dbInv.stripeCustomerId) {
              stripeCustId = stripeCustomerDbIdToStripeIdMap.get(dbInv.stripeCustomerId) || null;
            }
            const customerInfo = stripeCustId ? stripeCustomerIdToInfoMap.get(stripeCustId) : null;
            mergedInvoices.push({
              ...dbInv,
              customer: stripeCustId,
              customerName: customerInfo?.name || dbInv.customerName || null,
              customerEmail: customerInfo?.email || dbInv.customerEmail || null,
            });
          }
        }

        stripeInvoices = mergedInvoices;

        // Convert payment intents
        stripePaymentIntents = freshPaymentIntents.map((pi: any) => {
          const clientId = pi.customer ? customerMap.get(pi.customer as string) : null;
          return {
            id: pi.id,
            clientId: clientId,
            stripePaymentIntentId: pi.id,
            amount: (pi.amount / 100).toString(),
            currency: pi.currency || "usd",
            status: pi.status,
            paymentMethod: pi.payment_method,
            description: pi.description,
            receiptEmail: pi.receipt_email,
            stripeData: pi,
            createdAt: new Date(pi.created * 1000),
            updatedAt: new Date(),
          };
        });

        // Convert subscriptions
        stripeSubscriptions = freshSubscriptions.map((sub: any) => {
          const clientId = sub.customer ? customerMap.get(sub.customer as string) : null;
          const stripeCustomer = stripeCustomersList.find((c: any) => c.id === sub.customer);
          return {
            id: sub.id,
            clientId: clientId,
            stripeSubscriptionId: sub.id,
            status: sub.status,
            currency: sub.currency || "usd",
            amount: sub.items.data[0]?.price?.unit_amount ? (sub.items.data[0].price.unit_amount / 100).toString() : "0",
            interval: sub.items.data[0]?.price?.recurring?.interval || "month",
            intervalCount: sub.items.data[0]?.price?.recurring?.interval_count || 1,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            items: sub.items.data,
            stripeData: sub,
            customer: sub.customer, // Keep Stripe customer ID
            customerName: stripeCustomer?.name || stripeCustomer?.email || null,
            customerEmail: stripeCustomer?.email || null,
            createdAt: new Date(sub.created * 1000),
            updatedAt: new Date(),
          };
        });
      } catch (stripeError) {
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "billing.ts:1051",
            message: "Stripe fetch error",
            data: { errorMessage: stripeError?.message, errorType: stripeError?.constructor?.name },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "D",
          }),
        }).catch(() => {});
        // #endregion
        console.error("Error fetching Stripe data for dashboard:", stripeError);
        // Continue with empty database data
      }
    }

    // Calculate totals using the invoices we have (from DB or Stripe)
    const totalRevenue = stripeInvoices
      .filter((inv: any) => inv.status === "paid")
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.total || 0), 0);

    const totalOutstanding = stripeInvoices
      .filter((inv: any) => inv.status === "open")
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.amountDue || 0), 0);

    const totalDraft = stripeInvoices
      .filter((inv: any) => inv.status === "draft")
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.total || 0), 0);

    // Get all billable tickets (unbilled work) for all clients
    const DEFAULT_HOURLY_RATE = 65;
    const allBillableTickets = await db
      .select({
        ticket: supportTickets,
        dealHourlyRate: deals.hourlyRate,
      })
      .from(supportTickets)
      .leftJoin(deals, eq(supportTickets.dealId, deals.id))
      .where(
        and(
          or(eq(supportTickets.status, "resolved"), eq(supportTickets.readyToBill, true)),
          isNull(supportTickets.invoiceId)
        )
      );

    // Calculate unbilled work per client
    const unbilledWorkByClient = new Map<number, number>();
    for (const item of allBillableTickets) {
      if (!item.ticket.clientId) continue;

      const effectiveRate = item.ticket.hourlyRate
        ? parseFloat(item.ticket.hourlyRate)
        : item.dealHourlyRate
          ? parseFloat(item.dealHourlyRate)
          : DEFAULT_HOURLY_RATE;

      const timeSpent = parseFloat(item.ticket.timeSpent || "0");
      const billableAmount = timeSpent * effectiveRate;

      const current = unbilledWorkByClient.get(item.ticket.clientId) || 0;
      unbilledWorkByClient.set(item.ticket.clientId, current + billableAmount);
    }

    // Group invoices by client
    const clientGroups = allClients
      .map((client: any) => {
        const clientInvoices = stripeInvoices.filter((inv: any) => inv.clientId === client.id);
        const clientSubscriptions = stripeSubscriptions.filter((sub: any) => sub.clientId === client.id);

        const totalBilled = clientInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0);
        const totalPaid = clientInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amountPaid), 0);
        const balance = clientInvoices
          .filter((inv: any) => inv.status !== "void" && inv.status !== "paid")
          .reduce((sum: number, inv: any) => sum + parseFloat(inv.amountDue), 0);

        const unbilledWork = unbilledWorkByClient.get(client.id) || 0;
        const nextCharge = balance + unbilledWork;

        return {
          clientId: client.id,
          clientName: client.name,
          totalBilled,
          totalPaid,
          balance,
          unbilledWork,
          nextCharge,
          invoiceCount: clientInvoices.length,
          subscriptionCount: clientSubscriptions.filter((s: any) => s.status === "active").length,
          lastInvoiceDate:
            clientInvoices.length > 0
              ? clientInvoices.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
              : null,
        };
      })
      .filter((g: any) => g.invoiceCount > 0 || g.subscriptionCount > 0 || g.unbilledWork > 0);

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "billing.ts:1098",
        message: "Before sending response",
        data: { invoicesCount: stripeInvoices.length, clientGroupsCount: clientGroups.length, totalRevenue },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "C",
      }),
    }).catch(() => {});
    // #endregion
    res.json({
      success: true,
      data: {
        invoices: stripeInvoices,
        paymentIntents: stripePaymentIntents,
        subscriptions: stripeSubscriptions,
        quotes: allQuotes,
        paymentLinks: allPaymentLinks,
        clientGroups,
        summary: {
          totalRevenue,
          totalOutstanding,
          totalDraft,
          totalInvoices: stripeInvoices.length,
          totalSubscriptions: stripeSubscriptions.filter((s: any) => s.status === "active").length,
          totalClients: clientGroups.length,
        },
      },
    });
  } catch (error: any) {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "billing.ts:1117",
        message: "getBillingDashboard top-level error",
        data: { errorMessage: error?.message, errorType: error?.constructor?.name },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "D",
      }),
    }).catch(() => {});
    // #endregion
    console.error("Error fetching billing dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch billing dashboard",
      error: error.message,
    });
  }
}
