import { pgTable, text, integer, timestamp, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  role: text("role").default("admin").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  coverImage: text("coverImage"),
  authorId: integer("authorId").references(() => users.id).notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  tags: text("tags").array(),
  category: text("category").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertBlogPostSchema = createInsertSchema(blogPosts);
export const selectBlogPostSchema = createSelectSchema(blogPosts);
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = z.infer<typeof selectBlogPostSchema>;

// ==================== CRM TABLES ====================

// Clients - businesses or individuals you work with
export const clients = pgTable("clients", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // Basic Info
  name: text("name").notNull(), // Company or individual name
  contactName: text("contact_name"), // Primary contact person
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),

  // Business Details
  industry: text("industry"),
  companySize: text("company_size"), // small, medium, large, enterprise

  // Status
  status: text("status").default("lead").notNull(), // lead, prospect, active, inactive, churned
  source: text("source"), // How they found you: referral, website, linkedin, etc.

  // Address
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("USA"),

  // Internal Notes
  notes: text("notes"),
  tags: text("tags").array(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects - engagements with clients
export const projects = pgTable("projects", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").references(() => clients.id).notNull(),

  // Project Details
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // consulting, development, integration, retainer, assessment

  // Status & Progress
  status: text("status").default("pending").notNull(), // pending, proposal, active, on-hold, completed, cancelled
  priority: text("priority").default("medium"), // low, medium, high, urgent
  progress: integer("progress").default(0), // 0-100 percentage

  // Financials
  budgetType: text("budget_type"), // fixed, hourly, retainer
  budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  totalBilled: decimal("total_billed", { precision: 10, scale: 2 }).default("0"),

  // Timeline
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  dueDate: timestamp("due_date"),

  // Internal
  assignedTo: integer("assigned_to").references(() => users.id),
  notes: text("notes"),
  tags: text("tags").array(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project Updates - notifications/status updates sent to clients
export const projectUpdates = pgTable("project_updates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer("project_id").references(() => projects.id).notNull(),

  // Update Content
  title: text("title").notNull(),
  content: text("content").notNull(), // Rich text/markdown supported
  updateType: text("update_type").notNull(), // progress, milestone, blocker, deliverable, general

  // Notification Status
  sentToClient: boolean("sent_to_client").default(false),
  sentAt: timestamp("sent_at"),
  sentVia: text("sent_via"), // email, sms, portal

  // Internal
  isInternal: boolean("is_internal").default(false), // Internal notes vs client-facing
  createdBy: integer("created_by").references(() => users.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Onboarding Templates - reusable onboarding sequences
export const onboardingTemplates = pgTable("onboarding_templates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  projectType: text("project_type"), // Which type of projects this applies to
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Onboarding Steps - individual steps in a template
export const onboardingSteps = pgTable("onboarding_steps", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  templateId: integer("template_id").references(() => onboardingTemplates.id).notNull(),

  // Step Details
  stepOrder: integer("step_order").notNull(),
  title: text("title").notNull(),
  description: text("description"),

  // Configuration
  actionType: text("action_type").notNull(), // form, meeting, document, task, email, wait
  actionConfig: jsonb("action_config"), // JSON config for the action

  // Automation
  daysAfterPrevious: integer("days_after_previous").default(0), // Auto-schedule timing
  isRequired: boolean("is_required").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client Onboarding Progress - tracks client through onboarding
export const clientOnboarding = pgTable("client_onboarding", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  templateId: integer("template_id").references(() => onboardingTemplates.id).notNull(),

  // Progress
  currentStepId: integer("current_step_id").references(() => onboardingSteps.id),
  status: text("status").default("in_progress").notNull(), // in_progress, completed, stalled
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Onboarding Step Completion - tracks individual step completion
export const onboardingStepCompletion = pgTable("onboarding_step_completion", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientOnboardingId: integer("client_onboarding_id").references(() => clientOnboarding.id).notNull(),
  stepId: integer("step_id").references(() => onboardingSteps.id).notNull(),

  status: text("status").default("pending").notNull(), // pending, in_progress, completed, skipped
  completedAt: timestamp("completed_at"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity Log - track all CRM activities
export const activityLog = pgTable("activity_log", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // What happened
  entityType: text("entity_type").notNull(), // client, project, update, onboarding
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(), // created, updated, deleted, status_changed, email_sent, etc.
  details: jsonb("details"), // Additional context

  // Who did it
  userId: integer("user_id").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== BILLING TABLES (STRIPE INTEGRATION) ====================

// Stripe Customers - links clients to Stripe customer IDs
export const stripeCustomers = pgTable("stripe_customers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  stripeCustomerId: text("stripe_customer_id").unique().notNull(),

  // Customer metadata from Stripe
  email: text("email"),
  name: text("name"),
  phone: text("phone"),

  // Billing details
  currency: text("currency").default("usd"),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"), // Account balance

  // Stripe metadata
  stripeData: jsonb("stripe_data"), // Full Stripe customer object

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoices - Stripe invoices
export const invoices = pgTable("invoices", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  stripeCustomerId: integer("stripe_customer_id").references(() => stripeCustomers.id),

  // Stripe IDs
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),

  // Invoice details
  invoiceNumber: text("invoice_number"),
  description: text("description"),

  // Financial details
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),

  // Status and dates
  status: text("status").notNull(), // draft, open, paid, void, uncollectible
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),

  // URLs
  hostedInvoiceUrl: text("hosted_invoice_url"),
  invoicePdf: text("invoice_pdf"),

  // Line items (stored as JSON)
  lineItems: jsonb("line_items"),

  // Stripe metadata
  stripeData: jsonb("stripe_data"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment Intents - Stripe payment tracking
export const paymentIntents = pgTable("payment_intents", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").references(() => clients.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  stripeCustomerId: integer("stripe_customer_id").references(() => stripeCustomers.id),

  // Stripe ID
  stripePaymentIntentId: text("stripe_payment_intent_id").unique().notNull(),

  // Payment details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),

  // Status
  status: text("status").notNull(), // requires_payment_method, requires_confirmation, requires_action, processing, succeeded, canceled

  // Payment method
  paymentMethod: text("payment_method"), // card, bank_transfer, etc.
  paymentMethodDetails: jsonb("payment_method_details"),

  // Metadata
  description: text("description"),
  receiptEmail: text("receipt_email"),

  // Stripe metadata
  stripeData: jsonb("stripe_data"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscriptions - Recurring billing
export const subscriptions = pgTable("subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  stripeCustomerId: integer("stripe_customer_id").references(() => stripeCustomers.id),

  // Stripe ID
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),

  // Subscription details
  status: text("status").notNull(), // active, past_due, unpaid, canceled, incomplete, incomplete_expired, trialing

  // Pricing
  currency: text("currency").default("usd").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  interval: text("interval").notNull(), // month, year, week, day
  intervalCount: integer("interval_count").default(1),

  // Dates
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAt: timestamp("cancel_at"),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),

  // Items (stored as JSON)
  items: jsonb("items"),

  // Stripe metadata
  stripeData: jsonb("stripe_data"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quotes - Estimates/proposals that can be converted to invoices
export const quotes = pgTable("quotes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),

  // Quote details
  quoteNumber: text("quote_number").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),

  // Financial details
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),

  // Status
  status: text("status").default("draft").notNull(), // draft, sent, accepted, declined, expired, converted

  // Dates
  expiresAt: timestamp("expires_at"),
  acceptedAt: timestamp("accepted_at"),
  convertedAt: timestamp("converted_at"),

  // Line items (stored as JSON)
  lineItems: jsonb("line_items").notNull(),

  // Terms and notes
  terms: text("terms"),
  notes: text("notes"),

  // Conversion
  convertedToInvoiceId: integer("converted_to_invoice_id").references(() => invoices.id),

  // Created by
  createdBy: integer("created_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment Links - One-time payment links
export const paymentLinks = pgTable("payment_links", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id").references(() => clients.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  quoteId: integer("quote_id").references(() => quotes.id),

  // Stripe ID
  stripePaymentLinkId: text("stripe_payment_link_id").unique(),

  // Link details
  url: text("url").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),

  // Status
  active: boolean("active").default(true),
  expiresAt: timestamp("expires_at"),

  // Tracking
  clickCount: integer("click_count").default(0),
  paidAt: timestamp("paid_at"),

  // Stripe metadata
  stripeData: jsonb("stripe_data"),

  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== RELATIONS ====================

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  onboardings: many(clientOnboarding),
  stripeCustomers: many(stripeCustomers),
  invoices: many(invoices),
  quotes: many(quotes),
  subscriptions: many(subscriptions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  assignee: one(users, {
    fields: [projects.assignedTo],
    references: [users.id],
  }),
  updates: many(projectUpdates),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [projectUpdates.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [projectUpdates.createdBy],
    references: [users.id],
  }),
}));

// ==================== ZOD SCHEMAS & TYPES ====================

// Clients
export const insertClientSchema = createInsertSchema(clients);
export const selectClientSchema = createSelectSchema(clients);
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = z.infer<typeof selectClientSchema>;

// Projects
export const insertProjectSchema = createInsertSchema(projects);
export const selectProjectSchema = createSelectSchema(projects);
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = z.infer<typeof selectProjectSchema>;

// Project Updates
export const insertProjectUpdateSchema = createInsertSchema(projectUpdates);
export const selectProjectUpdateSchema = createSelectSchema(projectUpdates);
export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;
export type ProjectUpdate = z.infer<typeof selectProjectUpdateSchema>;

// Onboarding Templates
export const insertOnboardingTemplateSchema = createInsertSchema(onboardingTemplates);
export const selectOnboardingTemplateSchema = createSelectSchema(onboardingTemplates);
export type InsertOnboardingTemplate = z.infer<typeof insertOnboardingTemplateSchema>;
export type OnboardingTemplate = z.infer<typeof selectOnboardingTemplateSchema>;

// Onboarding Steps
export const insertOnboardingStepSchema = createInsertSchema(onboardingSteps);
export const selectOnboardingStepSchema = createSelectSchema(onboardingSteps);
export type InsertOnboardingStep = z.infer<typeof insertOnboardingStepSchema>;
export type OnboardingStep = z.infer<typeof selectOnboardingStepSchema>;

// Client Onboarding
export const insertClientOnboardingSchema = createInsertSchema(clientOnboarding);
export const selectClientOnboardingSchema = createSelectSchema(clientOnboarding);
export type InsertClientOnboarding = z.infer<typeof insertClientOnboardingSchema>;
export type ClientOnboarding = z.infer<typeof selectClientOnboardingSchema>;

// Activity Log
export const insertActivityLogSchema = createInsertSchema(activityLog);
export const selectActivityLogSchema = createSelectSchema(activityLog);
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = z.infer<typeof selectActivityLogSchema>;

// Stripe Customers
export const insertStripeCustomerSchema = createInsertSchema(stripeCustomers);
export const selectStripeCustomerSchema = createSelectSchema(stripeCustomers);
export type InsertStripeCustomer = z.infer<typeof insertStripeCustomerSchema>;
export type StripeCustomer = z.infer<typeof selectStripeCustomerSchema>;

// Invoices
export const insertInvoiceSchema = createInsertSchema(invoices);
export const selectInvoiceSchema = createSelectSchema(invoices);
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = z.infer<typeof selectInvoiceSchema>;

// Payment Intents
export const insertPaymentIntentSchema = createInsertSchema(paymentIntents);
export const selectPaymentIntentSchema = createSelectSchema(paymentIntents);
export type InsertPaymentIntent = z.infer<typeof insertPaymentIntentSchema>;
export type PaymentIntent = z.infer<typeof selectPaymentIntentSchema>;

// Subscriptions
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const selectSubscriptionSchema = createSelectSchema(subscriptions);
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = z.infer<typeof selectSubscriptionSchema>;

// Quotes
export const insertQuoteSchema = createInsertSchema(quotes);
export const selectQuoteSchema = createSelectSchema(quotes);
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = z.infer<typeof selectQuoteSchema>;

// Payment Links
export const insertPaymentLinkSchema = createInsertSchema(paymentLinks);
export const selectPaymentLinkSchema = createSelectSchema(paymentLinks);
export type InsertPaymentLink = z.infer<typeof insertPaymentLinkSchema>;
export type PaymentLink = z.infer<typeof selectPaymentLinkSchema>;
