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
  authorId: integer("authorId")
    .references(() => users.id)
    .notNull(),
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
  firstName: text("first_name"), // Contact first name
  lastName: text("last_name"), // Contact last name
  contactName: text("contact_name"), // Primary contact person (legacy, use firstName/lastName)
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),

  // Business Details
  industry: text("industry"),
  companySize: text("company_size"), // small, medium, large, enterprise

  // Status
  status: text("status").default("lead").notNull(), // lead, prospect, active, inactive, churned
  source: text("source"), // How they found you: referral, website, linkedin, etc.
  label: text("label").default("contact"), // contact, client, vendor, spam, hidden

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
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),

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
  projectId: integer("project_id")
    .references(() => projects.id)
    .notNull(),

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
  templateId: integer("template_id")
    .references(() => onboardingTemplates.id)
    .notNull(),

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
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  projectId: integer("project_id").references(() => projects.id),
  templateId: integer("template_id")
    .references(() => onboardingTemplates.id)
    .notNull(),

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
  clientOnboardingId: integer("client_onboarding_id")
    .references(() => clientOnboarding.id)
    .notNull(),
  stepId: integer("step_id")
    .references(() => onboardingSteps.id)
    .notNull(),

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

// Client Tasks - To-do items for each client
export const clientTasks = pgTable("client_tasks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  
  // Client association (by name for now, can link to clientId later)
  clientName: text("client_name").notNull(),
  
  // Task details
  task: text("task").notNull(),
  status: text("status").default("NOT DONE").notNull(), // NOT DONE, IN PROGRESS, DONE
  priority: text("priority").notNull(), // Fix, Quick win, Revenue, etc.
  
  // Optional: Link to client record if needed
  clientId: integer("client_id").references(() => clients.id),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Client Tasks Schemas
export const insertClientTaskSchema = createInsertSchema(clientTasks);
export const selectClientTaskSchema = createSelectSchema(clientTasks);
export type InsertClientTask = z.infer<typeof insertClientTaskSchema>;
export type ClientTask = z.infer<typeof selectClientTaskSchema>;

// ==================== BILLING TABLES (STRIPE INTEGRATION) ====================

// Stripe Customers - links clients to Stripe customer IDs
export const stripeCustomers = pgTable("stripe_customers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
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
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
  projectId: integer("project_id").references(() => projects.id),
  dealId: integer("deal_id").references(() => deals.id),
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
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
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
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),
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

// ==================== DEALS & DOCUMENTS TABLES ====================

// Deals - Sales opportunities/engagements (extends client relationship)
export const deals = pgTable("deals", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),

  // Deal Details
  name: text("name").notNull(), // Deal name/title
  description: text("description"),
  value: decimal("value", { precision: 10, scale: 2 }), // Estimated/actual deal value

  // Stage & Status
  stage: text("stage").default("lead").notNull(), // lead, prospect, proposal, negotiation, active, won, lost
  priority: text("priority").default("medium"), // low, medium, high, urgent
  probability: integer("probability").default(50), // 0-100% chance of closing

  // Billing - Default hourly rate for tickets under this deal
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).default("65"), // Default $65/hr

  // Dates
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),

  // Assignment
  ownerId: integer("owner_id").references(() => users.id), // Sales/account owner

  // Internal tracking
  source: text("source").default("real").notNull(), // real, sample (for data tagging)
  nextSteps: text("next_steps"),
  notes: text("notes"),
  tags: text("tags").array(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents - File attachments for deals, clients, projects
export const documents = pgTable("documents", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Polymorphic relationship - can attach to different entities
  entityType: text("entity_type").notNull(), // client, deal, project, update
  entityId: integer("entity_id").notNull(),

  // Document details
  title: text("title").notNull(),
  description: text("description"),
  fileType: text("file_type").notNull(), // pdf, image, doc, etc.
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"), // bytes
  mimeType: text("mime_type"),

  // Storage
  fileUrl: text("file_url").notNull(), // URL or path to file
  thumbnailUrl: text("thumbnail_url"), // For images/previews

  // Categorization
  category: text("category"), // nda, sow, invoice, photo, contract, proposal, etc.
  tags: text("tags").array(),

  // Status
  status: text("status").default("active").notNull(), // active, archived, deleted

  // Tracking
  uploadedBy: integer("uploaded_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Deal Interactions - Communications and activities related to deals
export const dealInteractions = pgTable("deal_interactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  dealId: integer("deal_id")
    .references(() => deals.id)
    .notNull(),

  // Interaction details
  type: text("type").notNull(), // email, call, meeting, note, task
  subject: text("subject").notNull(),
  content: text("content"),

  // People involved
  contactPerson: text("contact_person"), // Client contact
  ownerId: integer("owner_id").references(() => users.id), // Team member

  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),

  // Status
  status: text("status").default("completed").notNull(), // scheduled, completed, cancelled

  // Email tracking
  emailSent: boolean("email_sent").default(false),
  emailOpenedAt: timestamp("email_opened_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email Templates - Reusable templates for client updates
export const emailTemplates = pgTable("email_templates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Template details
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(), // HTML or markdown

  // Categorization
  category: text("category").notNull(), // update, invoice, onboarding, general

  // Template variables (stored as JSON array)
  variables: jsonb("variables"), // e.g., [{"name": "client_name", "description": "Client's name"}]

  // Settings
  includeAttachments: boolean("include_attachments").default(false),
  isActive: boolean("is_active").default(true),

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
  deals: many(deals),
  supportTickets: many(supportTickets),
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

export const dealsRelations = relations(deals, ({ one, many }) => ({
  client: one(clients, {
    fields: [deals.clientId],
    references: [clients.id],
  }),
  owner: one(users, {
    fields: [deals.ownerId],
    references: [users.id],
  }),
  supportTickets: many(supportTickets),
  interactions: many(dealInteractions),
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

// Deals
export const insertDealSchema = createInsertSchema(deals);
export const selectDealSchema = createSelectSchema(deals);
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = z.infer<typeof selectDealSchema>;

// Documents
export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = z.infer<typeof selectDocumentSchema>;

// Deal Interactions
export const insertDealInteractionSchema = createInsertSchema(dealInteractions);
export const selectDealInteractionSchema = createSelectSchema(dealInteractions);
export type InsertDealInteraction = z.infer<typeof insertDealInteractionSchema>;
export type DealInteraction = z.infer<typeof selectDealInteractionSchema>;

// Email Templates
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);
export const selectEmailTemplateSchema = createSelectSchema(emailTemplates);
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = z.infer<typeof selectEmailTemplateSchema>;

// ==================== CHANGELOG TABLES ====================

// Changelogs - Track changes from GitHub commits and manual entries
export const changelogs = pgTable("changelogs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Change Details
  title: text("title").notNull(),
  description: text("description").notNull(), // Markdown supported
  category: text("category").notNull(), // feature, bugfix, improvement, breaking, security, other
  priority: text("priority").default("medium"), // low, medium, high

  // GitHub Integration
  githubCommitSha: text("github_commit_sha"), // SHA of the commit
  githubCommitUrl: text("github_commit_url"), // URL to the commit
  githubAuthor: text("github_author"), // Commit author
  githubDate: timestamp("github_date"), // Commit date

  // Manual vs Auto
  isFromGitHub: boolean("is_from_github").default(false),
  syncedAt: timestamp("synced_at"), // When it was synced from GitHub

  // Status
  status: text("status").default("draft").notNull(), // draft, published, archived
  isPublic: boolean("is_public").default(true), // Can be included in client updates

  // Related to Projects/Updates
  relatedProjectId: integer("related_project_id").references(() => projects.id),
  usedInUpdates: jsonb("used_in_updates"), // Array of update IDs where this changelog was used

  // Metadata
  tags: text("tags").array(),
  notes: text("notes"), // Internal notes

  // Created by
  createdBy: integer("created_by").references(() => users.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Changelog Schemas
export const insertChangelogSchema = createInsertSchema(changelogs);
export const selectChangelogSchema = createSelectSchema(changelogs);
export type InsertChangelog = z.infer<typeof insertChangelogSchema>;
export type Changelog = z.infer<typeof selectChangelogSchema>;

// ==================== SYSTEM UPDATES/ANNOUNCEMENTS TABLE ====================

// System Updates - Announcements sent to deal administrators
export const systemUpdates = pgTable("system_updates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Update Details
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown supported
  category: text("category").notNull(), // announcement, feature, update, maintenance

  // Sending Status
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),

  // Metadata
  createdBy: integer("created_by").references(() => users.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System Update Recipients - Tracks which deals received which updates
export const systemUpdateRecipients = pgTable("system_update_recipients", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  updateId: integer("update_id")
    .references(() => systemUpdates.id)
    .notNull(),
  dealId: integer("deal_id")
    .references(() => deals.id)
    .notNull(),

  // Delivery status
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  emailOpenedAt: timestamp("email_opened_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System Updates Schemas
export const insertSystemUpdateSchema = createInsertSchema(systemUpdates);
export const selectSystemUpdateSchema = createSelectSchema(systemUpdates);
export type InsertSystemUpdate = z.infer<typeof insertSystemUpdateSchema>;
export type SystemUpdate = z.infer<typeof selectSystemUpdateSchema>;

export const insertSystemUpdateRecipientSchema = createInsertSchema(systemUpdateRecipients);
export const selectSystemUpdateRecipientSchema = createSelectSchema(systemUpdateRecipients);
export type InsertSystemUpdateRecipient = z.infer<typeof insertSystemUpdateRecipientSchema>;
export type SystemUpdateRecipient = z.infer<typeof selectSystemUpdateRecipientSchema>;

// ==================== DEAL STAKEHOLDERS TABLE ====================

// Deal Stakeholders - Links multiple contacts/clients to a single deal
export const dealStakeholders = pgTable("deal_stakeholders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  dealId: integer("deal_id")
    .references(() => deals.id)
    .notNull(),
  clientId: integer("client_id")
    .references(() => clients.id)
    .notNull(),

  // Role/relationship to the deal
  role: text("role").default("stakeholder"), // primary, stakeholder, contact, decision_maker, influencer
  isPrimary: boolean("is_primary").default(false), // Is this the primary contact for the deal?

  // Notification preferences
  receivesUpdates: boolean("receives_updates").default(true), // Receives feature updates, fixes, improvements
  receivesBilling: boolean("receives_billing").default(false), // Receives invoices, quotes, payment info

  // Notes specific to this stakeholder's involvement
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deal Stakeholders Schemas
export const insertDealStakeholderSchema = createInsertSchema(dealStakeholders);
export const selectDealStakeholderSchema = createSelectSchema(dealStakeholders);
export type InsertDealStakeholder = z.infer<typeof insertDealStakeholderSchema>;
export type DealStakeholder = z.infer<typeof selectDealStakeholderSchema>;

// ==================== EMAIL LOG TABLE ====================

// Email Log - Stores emails synced from Resend/Gmail for documentation
export const emailLogs = pgTable("email_logs", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // External Email IDs
  resendId: text("resend_id").unique(),
  gmailId: text("gmail_id").unique(),

  // Email Details
  from: text("from").notNull(),
  to: text("to").array().notNull(), // Array of recipient emails
  cc: text("cc").array(), // CC recipients
  bcc: text("bcc").array(), // BCC recipients
  replyTo: text("reply_to"),
  subject: text("subject").notNull(),
  htmlBody: text("html_body"), // HTML content
  textBody: text("text_body"), // Plain text content

  // Status from Resend
  status: text("status").default("sent"), // sent, delivered, bounced, complained, etc.
  lastEvent: text("last_event"), // Last webhook event

  // Categorization
  category: text("category").default("general"), // general, client, notification, marketing, transactional
  tags: text("tags").array(),

  // Related entities
  relatedClientId: integer("related_client_id").references(() => clients.id),
  relatedDealId: integer("related_deal_id").references(() => deals.id),
  relatedProjectId: integer("related_project_id").references(() => projects.id),

  // Timestamps from Resend
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),

  // Sync metadata
  syncedAt: timestamp("synced_at").defaultNow(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email Log Schemas
export const insertEmailLogSchema = createInsertSchema(emailLogs);
export const selectEmailLogSchema = createSelectSchema(emailLogs);
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
export type EmailLog = z.infer<typeof selectEmailLogSchema>;

// ==================== SUPPORT TICKETS TABLE ====================

// Support Tickets - Unified ticket system receiving from external apps
export const supportTickets = pgTable("support_tickets", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  // Relationships
  clientId: integer("client_id").references(() => clients.id),
  dealId: integer("deal_id").references(() => deals.id), // Group tickets by deal

  // Source identification (which app submitted the ticket)
  applicationSource: text("application_source").notNull(), // "crm-lighting", "agave-fleet", "direct"
  externalTicketId: text("external_ticket_id"), // Original ID from source app

  // Submitter info (for email matching to clients)
  submitterEmail: text("submitter_email").notNull(),
  submitterName: text("submitter_name"),

  // Ticket details
  title: text("title").notNull(),
  description: text("description").notNull(),
  screenshotUrl: text("screenshot_url"),
  screenshotUrls: text("screenshot_urls").array(), // Array of screenshot URLs (max 3)
  priority: text("priority").default("medium"), // low, medium, high, urgent
  page: text("page"), // Page/area where issue is occurring (from CRM)
  labels: text("labels").array(),

  // Status flow: pending → in_progress → resolved → billed
  status: text("status").default("pending").notNull(),

  // Time tracking & billing
  timeSpent: decimal("time_spent", { precision: 6, scale: 2 }).default("0"), // Hours worked
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }), // Override rate (null = use deal rate)
  billableAmount: decimal("billable_amount", { precision: 10, scale: 2 }), // Calculated: timeSpent * rate
  readyToBill: boolean("ready_to_bill").default(false),

  // Invoice link (when ticket is billed)
  invoiceId: integer("invoice_id").references(() => invoices.id),
  billedAt: timestamp("billed_at"),

  // Resolution
  resolution: text("resolution"), // How the ticket was resolved
  internalNotes: text("internal_notes"),
  resolvedAt: timestamp("resolved_at"),

  // Assignment
  assignedTo: integer("assigned_to").references(() => users.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support Tickets Relations
export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  client: one(clients, {
    fields: [supportTickets.clientId],
    references: [clients.id],
  }),
  deal: one(deals, {
    fields: [supportTickets.dealId],
    references: [deals.id],
  }),
  assignee: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
  invoice: one(invoices, {
    fields: [supportTickets.invoiceId],
    references: [invoices.id],
  }),
}));

// Support Tickets Schemas
export const insertSupportTicketSchema = createInsertSchema(supportTickets);
export const selectSupportTicketSchema = createSelectSchema(supportTickets);
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = z.infer<typeof selectSupportTicketSchema>;
