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

// ==================== RELATIONS ====================

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  onboardings: many(clientOnboarding),
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
