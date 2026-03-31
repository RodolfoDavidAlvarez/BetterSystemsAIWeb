import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db } from "../../db/index";
import { clients, deals, clientTasks, emailLogs, invoices, projects } from "../../db/schema";
import { eq, desc, like, sql, or, and } from "drizzle-orm";
import { sendEmailViaGmail, searchGmailEmails } from "./gmail";
import { getOpenClawStatusSnapshot } from "./openclaw";
import { saveMemoryNote, upsertOperatorTask } from "./operatorMemory";
import type { OperatorActionEvent, OperatorToolDefinition } from "./operatorTypes";

const TOOL_TIMEOUT_MS = Number(process.env.OPERATOR_TOOL_TIMEOUT_MS || "15000");
const IDEMPOTENCY = new Set<string>();
const WORKSPACE_DIR = path.resolve(process.env.OPENCLAW_WORKSPACE_DIR || path.join(__dirname, "../../OpenClaw-VPS-Setup/workspace"));

// ─── Tool Definitions ────────────────────────────────────────────────

export function getOperatorToolDefinitions(): OperatorToolDefinition[] {
  return [
    // ── Email ──
    {
      type: "function",
      name: "send_email",
      description: "Send an email from rodolfo@bettersystems.ai via Gmail. Use for client communication, follow-ups, invoicing. Always confirm recipient and content with the user before sending.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject line" },
          body: { type: "string", description: "Email body text (plain text)" },
          cc: { type: "string", description: "CC email address (optional)" },
        },
        required: ["to", "subject", "body"],
      },
    },
    {
      type: "function",
      name: "search_emails",
      description: "Search Gmail inbox for recent emails. Use to find client communications, check if someone replied, find specific messages.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Gmail search query (e.g. 'from:brian.mitchell38@gmail.com', 'subject:invoice', 'newer_than:7d')" },
          max_results: { type: "number", description: "Max results to return (default 5)" },
        },
        required: ["query"],
      },
    },
    // ── CRM Clients ──
    {
      type: "function",
      name: "search_clients",
      description: "Search the CRM for clients/contacts. Returns name, email, status, and basic info. Use to look up client details before taking action.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search by name or email (partial match)" },
        },
        required: ["query"],
      },
    },
    {
      type: "function",
      name: "get_client_details",
      description: "Get full details for a specific client including their deals, projects, and recent activity.",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "number", description: "Client ID from CRM" },
          client_name: { type: "string", description: "Client name to search (if ID unknown)" },
        },
      },
    },
    {
      type: "function",
      name: "create_client",
      description: "Create a new client/contact in the CRM. Use when a new lead or contact needs to be tracked.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name or company name" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number (optional)" },
          company: { type: "string", description: "Company name (optional)" },
          source: { type: "string", description: "Lead source (e.g. 'referral', 'cold-outreach', 'website')" },
          notes: { type: "string", description: "Initial notes" },
        },
        required: ["name", "email"],
      },
    },
    // ── Deals ──
    {
      type: "function",
      name: "search_deals",
      description: "Search deals/opportunities in the pipeline. Shows deal name, client, value, stage, and probability.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search by deal name or client name (optional - omit for all active deals)" },
          stage: { type: "string", description: "Filter by stage: 'lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'" },
        },
      },
    },
    {
      type: "function",
      name: "update_deal_stage",
      description: "Update a deal's stage, value, or notes. Use to move deals through the pipeline.",
      parameters: {
        type: "object",
        properties: {
          deal_id: { type: "number", description: "Deal ID" },
          stage: { type: "string", description: "New stage" },
          value: { type: "number", description: "Updated deal value in dollars" },
          notes: { type: "string", description: "Notes to append" },
        },
        required: ["deal_id"],
      },
    },
    {
      type: "function",
      name: "log_deal_interaction",
      description: "Log a meeting, call, email, or note for a deal. Important for tracking client relationships.",
      parameters: {
        type: "object",
        properties: {
          deal_id: { type: "number", description: "Deal ID" },
          type: { type: "string", description: "Interaction type: 'meeting', 'call', 'email', 'note'" },
          summary: { type: "string", description: "What happened, decisions made, next steps" },
        },
        required: ["deal_id", "type", "summary"],
      },
    },
    // ── Billing ──
    {
      type: "function",
      name: "get_billing_summary",
      description: "Get billing overview: outstanding invoices, recent payments, monthly revenue. Use to check financial status.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    {
      type: "function",
      name: "create_invoice",
      description: "Create a draft invoice for a client. Requires client to have a Stripe customer ID. Returns invoice details for review before sending.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Client name to invoice" },
          description: { type: "string", description: "Invoice line item description" },
          amount: { type: "number", description: "Amount in dollars (e.g. 650.00)" },
          due_days: { type: "number", description: "Days until due (default 14)" },
        },
        required: ["client_name", "description", "amount"],
      },
    },
    // ── Tasks ──
    {
      type: "function",
      name: "get_tasks",
      description: "Get open tasks across all clients. Shows task title, client, status, priority, due date.",
      parameters: {
        type: "object",
        properties: {
          client_name: { type: "string", description: "Filter by client name (optional)" },
          status: { type: "string", description: "Filter by status: 'pending', 'in_progress', 'completed'" },
        },
      },
    },
    {
      type: "function",
      name: "create_task",
      description: "Create a new task for a client or internal work.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          client_name: { type: "string", description: "Client name (optional for internal tasks)" },
          priority: { type: "string", description: "'low', 'medium', 'high', 'urgent'" },
          due_date: { type: "string", description: "Due date YYYY-MM-DD (optional)" },
          notes: { type: "string", description: "Task details" },
        },
        required: ["title"],
      },
    },
    {
      type: "function",
      name: "update_task",
      description: "Update a task's status, priority, or notes.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "number", description: "Task ID" },
          status: { type: "string", description: "New status: 'pending', 'in_progress', 'completed'" },
          notes: { type: "string", description: "Notes to add" },
        },
        required: ["task_id"],
      },
    },
    // ── Memory & Context ──
    {
      type: "function",
      name: "save_memory_note",
      description: "Save an important note, decision, or action item to persistent memory. Use for things that should be remembered across sessions.",
      parameters: {
        type: "object",
        properties: {
          section: { type: "string", enum: ["session", "tasks", "general"], description: "Where to save: session (today's log), tasks (action items), general (reference info)" },
          content: { type: "string", description: "The note content" },
        },
        required: ["section", "content"],
      },
    },
    {
      type: "function",
      name: "get_business_context",
      description: "Read current business state: active clients, outstanding money, pipeline, priorities. Use this at the start of a session or when asked about business status.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
    {
      type: "function",
      name: "system_health",
      description: "Check system status: OpenClaw gateway, VPS, database connectivity.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  ];
}

// ─── Tool Execution ──────────────────────────────────────────────────

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number) {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Tool timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ── Individual tool handlers ──

async function handleSendEmail(args: Record<string, unknown>) {
  const to = String(args.to || "");
  const subject = String(args.subject || "");
  const body = String(args.body || "");
  const cc = args.cc ? [String(args.cc)] : undefined;

  if (!to || !subject || !body) throw new Error("to, subject, and body are required");

  const result = await sendEmailViaGmail({ to, subject, text: body, cc });
  if (!result.success) throw new Error(result.error || "Email send failed");
  return { sent: true, to, subject, messageId: result.messageId };
}

async function handleSearchEmails(args: Record<string, unknown>) {
  const query = String(args.query || "");
  const maxResults = Number(args.max_results) || 5;
  if (!query) throw new Error("query is required");

  const results = await searchGmailEmails(query, maxResults);
  return results.map((e: any) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    subject: e.subject,
    date: e.date,
    snippet: e.snippet?.slice(0, 150),
  }));
}

async function handleSearchClients(args: Record<string, unknown>) {
  const query = String(args.query || "").trim();
  if (!query) throw new Error("query is required");

  const rows = await db.select({
    id: clients.id,
    name: clients.name,
    email: clients.email,
    phone: clients.phone,
    status: clients.status,
    label: clients.label,
    industry: clients.industry,
  })
    .from(clients)
    .where(or(
      like(clients.name, `%${query}%`),
      like(clients.email, `%${query}%`),
    ))
    .limit(10);

  return rows.length > 0 ? rows : { message: `No clients found matching "${query}"` };
}

async function handleGetClientDetails(args: Record<string, unknown>) {
  let clientId = args.client_id ? Number(args.client_id) : null;

  if (!clientId && args.client_name) {
    const match = await db.select({ id: clients.id })
      .from(clients)
      .where(like(clients.name, `%${String(args.client_name)}%`))
      .limit(1);
    clientId = match[0]?.id || null;
  }

  if (!clientId) throw new Error("Client not found. Provide client_id or client_name.");

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) throw new Error(`Client ${clientId} not found`);

  const clientDeals = await db.select({
    id: deals.id, name: deals.name, value: deals.value, stage: deals.stage,
  }).from(deals).where(eq(deals.clientId, clientId)).limit(10);

  const clientProjects = await db.select({
    id: projects.id, name: projects.name, status: projects.status, budgetAmount: projects.budgetAmount,
  }).from(projects).where(eq(projects.clientId, clientId)).limit(10);

  return { client, deals: clientDeals, projects: clientProjects };
}

async function handleCreateClient(args: Record<string, unknown>) {
  const name = String(args.name || "");
  const email = String(args.email || "");
  if (!name || !email) throw new Error("name and email are required");

  const [created] = await db.insert(clients).values({
    name,
    email,
    phone: args.phone ? String(args.phone) : null,
    firstName: args.name ? String(args.name).split(" ")[0] : null,
    lastName: args.name ? String(args.name).split(" ").slice(1).join(" ") : null,
    source: args.source ? String(args.source) : "operator-voice",
    status: "lead",
  }).returning({ id: clients.id, name: clients.name, email: clients.email });

  return { created: true, ...created };
}

async function handleSearchDeals(args: Record<string, unknown>) {
  const query = args.query ? String(args.query).trim() : null;
  const stage = args.stage ? String(args.stage) : null;

  let conditions: any[] = [];
  if (query) {
    conditions.push(or(like(deals.name, `%${query}%`), like(deals.description, `%${query}%`)));
  }
  if (stage) {
    conditions.push(eq(deals.stage, stage));
  }

  const rows = await db.select({
    id: deals.id,
    name: deals.name,
    clientId: deals.clientId,
    value: deals.value,
    stage: deals.stage,
    probability: deals.probability,
    notes: deals.notes,
  })
    .from(deals)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(deals.updatedAt))
    .limit(15);

  return rows;
}

async function handleUpdateDealStage(args: Record<string, unknown>) {
  const dealId = Number(args.deal_id);
  if (!dealId) throw new Error("deal_id is required");

  const updates: any = { updatedAt: new Date() };
  if (args.stage) updates.stage = String(args.stage);
  if (args.value !== undefined) updates.value = String(args.value);
  if (args.notes) updates.notes = String(args.notes);

  await db.update(deals).set(updates).where(eq(deals.id, dealId));
  return { updated: true, dealId, ...updates };
}

async function handleLogDealInteraction(args: Record<string, unknown>) {
  const dealId = Number(args.deal_id);
  const type = String(args.type || "note");
  const summary = String(args.summary || "");
  if (!dealId || !summary) throw new Error("deal_id and summary are required");

  // Use the activity logging approach - insert into deal notes
  const [deal] = await db.select({ notes: deals.notes }).from(deals).where(eq(deals.id, dealId)).limit(1);
  const timestamp = new Date().toISOString().split("T")[0];
  const newNote = `[${timestamp}] ${type.toUpperCase()}: ${summary}`;
  const updatedNotes = deal?.notes ? `${deal.notes}\n${newNote}` : newNote;

  await db.update(deals).set({ notes: updatedNotes, updatedAt: new Date() }).where(eq(deals.id, dealId));
  return { logged: true, dealId, type, summary: summary.slice(0, 100) };
}

async function handleGetBillingSummary() {
  const outstandingInvoices = await db.select({
    id: invoices.id,
    clientId: invoices.clientId,
    total: invoices.total,
    amountDue: invoices.amountDue,
    status: invoices.status,
    dueDate: invoices.dueDate,
  })
    .from(invoices)
    .where(or(eq(invoices.status, "open"), eq(invoices.status, "draft"), eq(invoices.status, "overdue")))
    .limit(20);

  const recentPaid = await db.select({
    id: invoices.id,
    total: invoices.total,
    paidAt: invoices.paidAt,
    status: invoices.status,
  })
    .from(invoices)
    .where(eq(invoices.status, "paid"))
    .orderBy(desc(invoices.paidAt))
    .limit(5);

  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.amountDue || 0), 0);

  return {
    totalOutstanding: `$${(totalOutstanding / 100).toFixed(2)}`,
    outstandingCount: outstandingInvoices.length,
    outstandingInvoices: outstandingInvoices.map(i => ({
      id: i.id, status: i.status,
      amountDue: `$${(Number(i.amountDue || 0) / 100).toFixed(2)}`,
      dueDate: i.dueDate,
    })),
    recentPayments: recentPaid.map(i => ({
      total: `$${(Number(i.total || 0) / 100).toFixed(2)}`,
      paidAt: i.paidAt,
    })),
  };
}

async function handleCreateInvoice(args: Record<string, unknown>) {
  // For now, create a draft in our DB. Stripe integration requires customer ID.
  const clientName = String(args.client_name || "");
  const description = String(args.description || "");
  const amount = Number(args.amount || 0);
  if (!clientName || !description || !amount) throw new Error("client_name, description, and amount required");

  const [client] = await db.select({ id: clients.id, name: clients.name, email: clients.email })
    .from(clients)
    .where(like(clients.name, `%${clientName}%`))
    .limit(1);

  if (!client) throw new Error(`Client "${clientName}" not found in CRM`);

  const amountCents = Math.round(amount * 100);
  const [inv] = await db.insert(invoices).values({
    clientId: client.id,
    subtotal: String(amountCents),
    total: String(amountCents),
    amountDue: String(amountCents),
    status: "draft",
    dueDate: new Date(Date.now() + (Number(args.due_days) || 14) * 86400000),
  }).returning({ id: invoices.id });

  return {
    created: true,
    invoiceId: inv.id,
    client: client.name,
    amount: `$${amount.toFixed(2)}`,
    status: "draft",
    note: "Draft created in CRM. Use Stripe dashboard to finalize and send.",
  };
}

async function handleGetTasks(args: Record<string, unknown>) {
  let conditions: any[] = [];
  if (args.client_name) {
    conditions.push(like(clientTasks.clientName, `%${String(args.client_name)}%`));
  }
  if (args.status) {
    conditions.push(eq(clientTasks.status, String(args.status)));
  }

  const rows = await db.select()
    .from(clientTasks)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(clientTasks.createdAt))
    .limit(20);

  return rows.map(t => ({
    id: t.id,
    task: t.task,
    clientName: t.clientName,
    status: t.status,
    priority: t.priority,
  }));
}

async function handleCreateTask(args: Record<string, unknown>) {
  const title = String(args.title || "");
  if (!title) throw new Error("title is required");

  const [task] = await db.insert(clientTasks).values({
    task: title,
    clientName: args.client_name ? String(args.client_name) : "Internal",
    status: "NOT DONE",
    priority: args.priority ? String(args.priority) : "Quick win",
  }).returning({ id: clientTasks.id, task: clientTasks.task });

  // Also save to operator memory
  await upsertOperatorTask({ title, status: "todo", details: args.notes ? String(args.notes) : undefined });

  return { created: true, id: task.id, task: task.task, clientName: args.client_name || "Internal" };
}

async function handleUpdateTask(args: Record<string, unknown>) {
  const taskId = Number(args.task_id);
  if (!taskId) throw new Error("task_id is required");

  const updates: any = { updatedAt: new Date() };
  if (args.status) {
    // Map user-friendly status to DB values
    const statusMap: Record<string, string> = { pending: "NOT DONE", in_progress: "IN PROGRESS", completed: "DONE" };
    updates.status = statusMap[String(args.status)] || String(args.status);
  }

  await db.update(clientTasks).set(updates).where(eq(clientTasks.id, taskId));
  return { updated: true, taskId, ...updates };
}

async function handleGetBusinessContext() {
  // Read key business files for context
  const files: Record<string, string> = {};

  const contextFiles = [
    { key: "soul", path: path.join(WORKSPACE_DIR, "SOUL.md") },
    { key: "claude", path: path.join(WORKSPACE_DIR, "CLAUDE.md") },
  ];

  for (const f of contextFiles) {
    try {
      files[f.key] = fs.readFileSync(f.path, "utf-8").slice(0, 1500);
    } catch { /* skip missing */ }
  }

  // Get live CRM data
  const activeClients = await db.select({
    id: clients.id, name: clients.name, email: clients.email, status: clients.status,
  }).from(clients).where(eq(clients.status, "active")).limit(20);

  const activeDeals = await db.select({
    id: deals.id, name: deals.name, value: deals.value, stage: deals.stage,
  }).from(deals).orderBy(desc(deals.updatedAt)).limit(10);

  const openTasks = await db.select({
    id: clientTasks.id, title: clientTasks.title, clientName: clientTasks.clientName,
    status: clientTasks.status, priority: clientTasks.priority,
  }).from(clientTasks).where(or(eq(clientTasks.status, "pending"), eq(clientTasks.status, "in_progress"))).limit(15);

  return {
    activeClients: activeClients.length,
    clients: activeClients.map(c => ({ name: c.name, email: c.email })),
    deals: activeDeals.map(d => ({ name: d.name, value: d.value, stage: d.stage })),
    openTasks: openTasks.map(t => ({ title: t.title, client: t.clientName, status: t.status, priority: t.priority })),
    memoryFiles: files,
    knownOutstanding: "$4,997.70 (Desert Moon $2,752 + Brian Mitchell $2,003.50 + Agave Fleet $242.20)",
  };
}

// ─── Main executor ───────────────────────────────────────────────────

const TOOL_HANDLERS: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  send_email: handleSendEmail,
  search_emails: handleSearchEmails,
  search_clients: handleSearchClients,
  get_client_details: handleGetClientDetails,
  create_client: handleCreateClient,
  search_deals: handleSearchDeals,
  update_deal_stage: handleUpdateDealStage,
  log_deal_interaction: handleLogDealInteraction,
  get_billing_summary: handleGetBillingSummary,
  create_invoice: handleCreateInvoice,
  get_tasks: handleGetTasks,
  create_task: handleCreateTask,
  update_task: handleUpdateTask,
  save_memory_note: (args) => saveMemoryNote(
    (args.section as "session" | "tasks" | "general") || "general",
    String(args.content || "")
  ),
  get_business_context: handleGetBusinessContext,
  system_health: getOpenClawStatusSnapshot,
};

export function validateToolCall(toolName: string, _args: Record<string, unknown>) {
  if (!(toolName in TOOL_HANDLERS)) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function executeOperatorTool(input: {
  sessionId: string;
  utteranceId: string;
  toolName: string;
  arguments: Record<string, unknown>;
}) {
  const startedAt = Date.now();
  const idempotencyKey = crypto
    .createHash("sha256")
    .update(`${input.sessionId}:${input.utteranceId}:${input.toolName}:${JSON.stringify(input.arguments)}`)
    .digest("hex");

  if (process.env.OPERATOR_TOOLS_ENABLED === "false") {
    return { success: false, result: null, error: "Operator tools disabled", durationMs: Date.now() - startedAt, deduped: false };
  }

  if (IDEMPOTENCY.has(idempotencyKey)) {
    return { success: true, result: { deduped: true }, durationMs: Date.now() - startedAt, deduped: true };
  }

  try {
    validateToolCall(input.toolName, input.arguments);
    IDEMPOTENCY.add(idempotencyKey);

    const handler = TOOL_HANDLERS[input.toolName];
    if (!handler) throw new Error(`No handler for tool: ${input.toolName}`);

    const result = await withTimeout(handler(input.arguments), TOOL_TIMEOUT_MS);
    return { success: true, result, durationMs: Date.now() - startedAt, deduped: false };
  } catch (error: any) {
    return { success: false, result: null, error: error?.message || "Tool execution failed", durationMs: Date.now() - startedAt, deduped: false };
  }
}

export function createOperatorActionEvent(input: {
  sessionId: string;
  utteranceId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  success: boolean;
  result: unknown;
  error?: string;
  durationMs: number;
}): OperatorActionEvent {
  return {
    id: crypto.randomUUID(),
    sessionId: input.sessionId,
    utteranceId: input.utteranceId,
    toolName: input.toolName,
    arguments: input.arguments,
    success: input.success,
    result: input.result,
    error: input.error,
    durationMs: input.durationMs,
    createdAt: new Date().toISOString(),
  };
}
