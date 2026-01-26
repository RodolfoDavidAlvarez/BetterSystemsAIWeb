import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

// ==================== CUSTOMERS ====================

/**
 * Get ALL Stripe customers with pagination
 * Fetches all customers including historical data
 */
export async function getAllStripeCustomers() {
  const allCustomers: Stripe.Customer[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;

  while (hasMore) {
    const params: Stripe.CustomerListParams = {
      limit: 100, // Maximum per request
    };

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const customers = await stripe.customers.list(params);
    allCustomers.push(...customers.data);

    hasMore = customers.has_more;
    if (customers.data.length > 0) {
      startingAfter = customers.data[customers.data.length - 1].id;
    }
  }

  return allCustomers;
}

export async function getStripeCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId);
}

export async function createStripeCustomer(params: { email: string; name?: string; phone?: string; metadata?: Record<string, string> }) {
  return await stripe.customers.create(params);
}

export async function updateStripeCustomer(customerId: string, params: Stripe.CustomerUpdateParams) {
  return await stripe.customers.update(customerId, params);
}

// ==================== INVOICES ====================

/**
 * Get ALL Stripe invoices with pagination
 * Fetches all invoices including historical data
 */
export async function getAllStripeInvoices(customerId?: string) {
  const allInvoices: Stripe.Invoice[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;

  while (hasMore) {
    const params: Stripe.InvoiceListParams = {
      limit: 100, // Maximum per request
    };

    if (customerId) {
      params.customer = customerId;
    }

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const invoices = await stripe.invoices.list(params);
    allInvoices.push(...invoices.data);

    hasMore = invoices.has_more;
    if (invoices.data.length > 0) {
      startingAfter = invoices.data[invoices.data.length - 1].id;
    }
  }

  return allInvoices;
}

export async function getStripeInvoice(invoiceId: string) {
  return await stripe.invoices.retrieve(invoiceId);
}

export async function createStripeInvoice(params: {
  customer: string;
  description?: string;
  dueDate?: number;
  autoAdvance?: boolean;
  collectionMethod?: "charge_automatically" | "send_invoice";
  metadata?: Record<string, string>;
}) {
  const invoice = await stripe.invoices.create({
    customer: params.customer,
    description: params.description,
    due_date: params.dueDate,
    auto_advance: params.autoAdvance ?? false,
    collection_method: params.collectionMethod ?? "send_invoice",
    metadata: params.metadata,
  });

  return invoice;
}

export async function addInvoiceLineItem(params: {
  customer: string;
  invoice?: string;
  description: string;
  amount: number; // in cents
  currency?: string;
  quantity?: number;
}) {
  const invoiceItem = await stripe.invoiceItems.create({
    customer: params.customer,
    invoice: params.invoice,
    description: params.description,
    amount: params.amount,
    currency: params.currency ?? "usd",
    quantity: params.quantity ?? 1,
  });

  return invoiceItem;
}

export async function finalizeStripeInvoice(invoiceId: string) {
  return await stripe.invoices.finalizeInvoice(invoiceId);
}

export async function sendStripeInvoice(invoiceId: string) {
  return await stripe.invoices.sendInvoice(invoiceId);
}

export async function updateStripeInvoice(invoiceId: string, params: Stripe.InvoiceUpdateParams) {
  return await stripe.invoices.update(invoiceId, params);
}

export async function voidStripeInvoice(invoiceId: string) {
  return await stripe.invoices.voidInvoice(invoiceId);
}

export async function payStripeInvoice(invoiceId: string) {
  return await stripe.invoices.pay(invoiceId);
}

// ==================== PAYMENT INTENTS ====================

/**
 * Get ALL payment intents with pagination
 * Fetches all payment intents including historical data
 */
export async function getAllPaymentIntents(customerId?: string) {
  const allPaymentIntents: Stripe.PaymentIntent[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;

  while (hasMore) {
    const params: Stripe.PaymentIntentListParams = {
      limit: 100, // Maximum per request
    };

    if (customerId) {
      params.customer = customerId;
    }

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const paymentIntents = await stripe.paymentIntents.list(params);
    allPaymentIntents.push(...paymentIntents.data);

    hasMore = paymentIntents.has_more;
    if (paymentIntents.data.length > 0) {
      startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
    }
  }

  return allPaymentIntents;
}

export async function getPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function createPaymentIntent(params: {
  amount: number; // in cents
  currency?: string;
  customer?: string;
  description?: string;
  metadata?: Record<string, string>;
  receiptEmail?: string;
}) {
  return await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency ?? "usd",
    customer: params.customer,
    description: params.description,
    metadata: params.metadata,
    receipt_email: params.receiptEmail,
    automatic_payment_methods: {
      enabled: true,
    },
  });
}

// ==================== SUBSCRIPTIONS ====================

/**
 * Get ALL subscriptions with pagination
 * Fetches all subscriptions including historical data
 */
export async function getAllSubscriptions(customerId?: string) {
  const allSubscriptions: Stripe.Subscription[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;

  while (hasMore) {
    const params: Stripe.SubscriptionListParams = {
      limit: 100, // Maximum per request
    };

    if (customerId) {
      params.customer = customerId;
    }

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const subscriptions = await stripe.subscriptions.list(params);
    allSubscriptions.push(...subscriptions.data);

    hasMore = subscriptions.has_more;
    if (subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    }
  }

  return allSubscriptions;
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export async function createSubscription(params: {
  customer: string;
  items: Array<{ price: string; quantity?: number }>;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}) {
  return await stripe.subscriptions.create({
    customer: params.customer,
    items: params.items,
    trial_period_days: params.trialPeriodDays,
    metadata: params.metadata,
  });
}

export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = false) {
  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

// ==================== PAYMENT LINKS ====================

export async function createPaymentLink(params: {
  amount: number; // in cents
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}) {
  // Create a price first (required for payment links)
  const price = await stripe.prices.create({
    unit_amount: params.amount,
    currency: params.currency ?? "usd",
    product_data: {
      name: params.description ?? "Payment",
    },
  });

  // Create the payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: params.metadata,
  });

  return paymentLink;
}

export async function getPaymentLink(paymentLinkId: string) {
  return await stripe.paymentLinks.retrieve(paymentLinkId);
}

// ==================== CHARGES ====================

/**
 * Get ALL Stripe charges with pagination
 * Fetches all charges including historical data - this shows actual money received
 */
export async function getAllStripeCharges(limit?: number) {
  const allCharges: Stripe.Charge[] = [];
  let hasMore = true;
  let startingAfter: string | undefined = undefined;

  while (hasMore) {
    const params: Stripe.ChargeListParams = {
      limit: 100, // Maximum per request
    };

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const charges = await stripe.charges.list(params);
    allCharges.push(...charges.data);

    hasMore = charges.has_more;
    if (charges.data.length > 0) {
      startingAfter = charges.data[charges.data.length - 1].id;
    }
  }

  return allCharges;
}

/**
 * Get all successful payments with details
 * Returns formatted payment history
 */
export async function getPaymentHistory() {
  const allCharges = await getAllStripeCharges();

  const payments = allCharges
    .filter((c) => c.status === "succeeded" && !c.refunded)
    .map((charge) => {
      const description = charge.description || "";
      let category = "Payment Link";

      if (charge.invoice || description.includes("Payment for Invoice")) {
        category = "Invoice";
      }

      return {
        id: charge.id,
        date: new Date(charge.created * 1000).toISOString(),
        amount: charge.amount / 100,
        email: charge.receipt_email || charge.billing_details?.email || "",
        description: description,
        category: category,
      };
    });

  return payments;
}

/**
 * Get monthly revenue from Stripe charges
 * Returns last N months of actual revenue data
 */
export async function getMonthlyRevenueFromStripe(months: number = 6) {
  const allCharges = await getAllStripeCharges();

  // Initialize months data
  const monthsData: Record<string, number> = {};
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
    monthsData[monthKey] = 0;
  }

  // Sum up successful charges by month
  for (const charge of allCharges) {
    if (charge.status === "succeeded" && !charge.refunded) {
      const chargeDate = new Date(charge.created * 1000);
      const monthKey = chargeDate.toLocaleDateString("en-US", { year: "numeric", month: "short" });

      if (monthKey in monthsData) {
        // Amount is in cents, convert to dollars
        monthsData[monthKey] += charge.amount / 100;
      }
    }
  }

  return Object.entries(monthsData).map(([month, revenue]) => ({
    month,
    revenue: Math.round(revenue * 100) / 100,
  }));
}

// ==================== WEBHOOK HANDLING ====================

export function constructWebhookEvent(payload: string | Buffer, signature: string, secret: string) {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export async function handleWebhookEvent(event: Stripe.Event) {
  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  switch (event.type) {
    case "customer.created":
    case "customer.updated":
      return { type: "customer", data: event.data.object as Stripe.Customer };

    case "invoice.created":
    case "invoice.updated":
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.finalized":
      return { type: "invoice", data: event.data.object as Stripe.Invoice };

    case "payment_intent.created":
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
      return { type: "payment_intent", data: event.data.object as Stripe.PaymentIntent };

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return { type: "subscription", data: event.data.object as Stripe.Subscription };

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      return { type: "unhandled", data: event.data.object };
  }
}
