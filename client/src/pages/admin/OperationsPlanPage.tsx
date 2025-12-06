import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  Clock4,
  FileText,
  GitBranch,
  Inbox,
  Layers,
  Mail,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Timer,
  Wallet,
} from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

type DataSource = "real" | "sample";

type Invoice = {
  date: string;
  description: string;
  amount: number;
  status: "paid" | "pending";
  source: DataSource;
};

type WorkItem = {
  requestor: string;
  title: string;
  detail: string;
  hours: number;
  cost: number;
  status: "done" | "in-progress" | "next";
  source: DataSource;
};

type Phase = {
  label: string;
  status: "active" | "queued" | "future";
  focus: string;
  bullets: string[];
};

type UpdateItem = {
  title: string;
  date: string;
  detail: string;
  source: DataSource;
};

type OnboardingItem = {
  title: string;
  owner: string;
  channel: string;
  status: "ready" | "in-progress" | "pending";
  source: DataSource;
};

type Lead = {
  name: string;
  stage: "lead" | "prospect" | "active";
  sequence: string;
  nextStep: string;
  source: DataSource;
};

const primaryInvoices: Invoice[] = [
  {
    date: "Jun 4, 2025",
    description: "Deposit (50%)",
    amount: 1787.5,
    status: "paid",
    source: "real",
  },
  {
    date: "Jun 24, 2025",
    description: "Invoice QDANPTMD-0001",
    amount: 2047.25,
    status: "paid",
    source: "real",
  },
  {
    date: "Nov 11, 2025",
    description: "Advancement Invoice",
    amount: 2000,
    status: "pending",
    source: "real",
  },
];

const workItems: WorkItem[] = [
  {
    requestor: "Vince",
    title: "Multi-company logic & domain setup",
    detail: "Desert Moon Lighting vs. Desert Mist Arizona with dynamic content & domains.",
    hours: 6,
    cost: 390,
    status: "done",
    source: "real",
  },
  {
    requestor: "Mike",
    title: "Multi-rep permissions & roles",
    detail: "Admins see all; reps limited to their own proposals and records.",
    hours: 2,
    cost: 130,
    status: "done",
    source: "real",
  },
  {
    requestor: "Micah",
    title: "Deal management / install-close workflow",
    detail: "Timeline, install date picker, completion schedule with admin archive.",
    hours: 7,
    cost: 455,
    status: "done",
    source: "real",
  },
  {
    requestor: "Vince",
    title: "Remote signature link",
    detail: "Secure email signature links with automatic status updates.",
    hours: 10,
    cost: 650,
    status: "done",
    source: "real",
  },
  {
    requestor: "Vince",
    title: "QuickBooks integration & payment collection",
    detail: "Deposits/final payments reconciliation, webhook mapping & testing.",
    hours: 8,
    cost: 520,
    status: "in-progress",
    source: "real",
  },
  {
    requestor: "—",
    title: "Technical support, implementation & meetings",
    detail: "Post-launch support, coordination, and technical working sessions.",
    hours: 3,
    cost: 195,
    status: "done",
    source: "real",
  },
  {
    requestor: "Sample Lead",
    title: "Stripe invoice creation flow",
    detail: "UI + webhook to send invoice from dashboard and push status to CRM.",
    hours: 5,
    cost: 325,
    status: "next",
    source: "sample",
  },
];

const roadmap: Phase[] = [
  {
    label: "Phase 1 — Billing & Documents",
    status: "active",
    focus: "Stripe invoicing + NDA / Account Form / SOW templates with PDF export.",
    bullets: [
      "Wire Stripe test keys and send invoices from dashboard",
      "Document templates with pre-filled client data and PDF download",
      "Tag data source on every record (real vs sample)",
    ],
  },
  {
    label: "Phase 2 — Onboarding Automation",
    status: "queued",
    focus: "Sequenced NDA → Account Form → SOW with automated follow-ups.",
    bullets: [
      "Resend-based email + optional SMS triggers",
      "E-signature status tracking and reminders",
      "Progress dashboard per client",
    ],
  },
  {
    label: "Phase 3 — Lead Capture & Nurturing",
    status: "queued",
    focus: "Landing page → CRM pipeline with lead scoring and nurture sequences.",
    bullets: [
      "Auto-create leads with timestamps and source attribution",
      "Template library for nurture emails",
      "Sequence analytics (opens, replies, conversions)",
    ],
  },
  {
    label: "Phase 4 — Integrations & AI Assist",
    status: "future",
    focus: "GitHub activity feed, email ingestion, AI quoting and summaries.",
    bullets: [
      "GitHub commits + PRs by project with time-to-complete",
      "Optional Gmail/IMAP sync for client threads",
      "AI quote + update drafts tied to CRM data",
    ],
  },
];

const updates: UpdateItem[] = [
  {
    title: "Balance summary refreshed",
    date: "Nov 10, 2025",
    detail: "Current balance $4,937.75; paid $3,834.75. Source: balance_summary_desert_moon_crm_updated.html",
    source: "real",
  },
  {
    title: "Development progress logged",
    date: "Nov 11, 2025",
    detail: "46.5 hrs @ $65/hr captured for Desert Moon Lighting CRM.",
    source: "real",
  },
  {
    title: "Proposal builder update 3 shared",
    date: "Nov 2025",
    detail: "Proposal-Builder-Lighting-CRM-Project, Update 3 (with access link).",
    source: "real",
  },
  {
    title: "Sample onboarding deck drafted",
    date: "Dec 2025",
    detail: "Sample NDA + intake form + SOW combo for future clients.",
    source: "sample",
  },
];

const onboardingQueue: OnboardingItem[] = [
  {
    title: "NDA dispatch (auto send)",
    owner: "Operations",
    channel: "Resend template • signature link",
    status: "ready",
    source: "sample",
  },
  {
    title: "Account intake form",
    owner: "Client",
    channel: "Form + file upload (photos, permits)",
    status: "in-progress",
    source: "sample",
  },
  {
    title: "Scope of Work (lighting + misting)",
    owner: "Sales",
    channel: "Dynamic PDF + Stripe invoice CTA",
    status: "pending",
    source: "sample",
  },
  {
    title: "Desert Moon: Advancement invoice",
    owner: "Finance",
    channel: "Stripe (pending keys) • auto reminder",
    status: "in-progress",
    source: "real",
  },
];

const automationStack = [
  {
    title: "Resend email delivery",
    status: "connected",
    detail: "Live credentials in .env; powering CRM emails today.",
    source: "real",
    icon: Mail,
  },
  {
    title: "Supabase CRM backend",
    status: "connected",
    detail: "Auth + data live; reuse clients/projects endpoints for new UI blocks.",
    source: "real",
    icon: ShieldCheck,
  },
  {
    title: "Stripe invoicing",
    status: "next",
    detail: "Needs test keys + UI hook to create advancement invoice from dashboard.",
    source: "sample",
    icon: Wallet,
  },
  {
    title: "GitHub delivery tracking",
    status: "planned",
    detail: "Pull commits/PRs to show delivery speed per project.",
    source: "sample",
    icon: GitBranch,
  },
  {
    title: "Email ingestion (Gmail/IMAP)",
    status: "future",
    detail: "Sync client threads and attach to CRM timeline + nurture triggers.",
    source: "sample",
    icon: Inbox,
  },
];

const leads: Lead[] = [
  {
    name: "Desert Moon Lighting CRM",
    stage: "active",
    sequence: "Account management + billing",
    nextStep: "Send advancement invoice and attach progress PDF",
    source: "real",
  },
  {
    name: "Sample: Coastal Resorts",
    stage: "prospect",
    sequence: "Nurture — weekly ops insights",
    nextStep: "Schedule onboarding + send NDA packet",
    source: "sample",
  },
  {
    name: "Sample: Metro Facilities Group",
    stage: "lead",
    sequence: "Inbound landing page",
    nextStep: "Auto-create lead on form submit; assign to sales",
    source: "sample",
  },
];

const statusClassMap: Record<string, string> = {
  done: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "in-progress": "bg-amber-50 text-amber-700 border-amber-200",
  next: "bg-sky-50 text-sky-700 border-sky-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-blue-50 text-blue-700 border-blue-200",
  queued: "bg-slate-50 text-slate-700 border-slate-200",
  future: "bg-slate-50 text-slate-600 border-slate-200",
  connected: "bg-emerald-50 text-emerald-700 border-emerald-200",
  planned: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const stageCopy: Record<Lead["stage"], string> = {
  lead: "Lead",
  prospect: "Prospect",
  active: "Active Client",
};

function SourceBadge({ source }: { source: DataSource }) {
  const styles =
    source === "real"
      ? "bg-slate-900 text-white"
      : "bg-slate-100 text-slate-700 border border-slate-200";
  return (
    <Badge className={`${styles} px-2.5 py-1 text-xs font-medium`}>
      {source === "real" ? "Real data" : "Sample data"}
    </Badge>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <Badge className={`${statusClassMap[label] || "bg-muted text-foreground"} border px-2.5 py-1 text-xs`}>
      {label}
    </Badge>
  );
}

function currency(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OperationsPlanPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();

  const outstanding = primaryInvoices.reduce((acc, invoice) => {
    return invoice.status === "pending" ? acc + invoice.amount : acc;
  }, 0);

  const paid = primaryInvoices.reduce((acc, invoice) => {
    return invoice.status === "paid" ? acc + invoice.amount : acc;
  }, 0);

  const realHours = workItems.filter((w) => w.source === "real").reduce((acc, item) => acc + item.hours, 0);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      <div className="container py-10 space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Central plan & UI pass</p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">CRM Control Hub</h1>
                <p className="text-muted-foreground">
                  Grounded in the Desert Moon Lighting CRM folder. Real vs sample data clearly labeled.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/admin/clients")}>
                <Layers className="mr-2 h-4 w-4" />
                Clients
              </Button>
              <Button onClick={() => navigate("/admin/projects")}>
                <Sparkles className="mr-2 h-4 w-4" />
                Projects
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Outstanding balance
                </CardTitle>
                <CardDescription>Desert Moon Lighting CRM</CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">{currency(outstanding)}</div>
                  <p className="text-sm text-muted-foreground">Paid to date: {currency(paid)}</p>
                </div>
                <SourceBadge source="real" />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  Logged hours
                </CardTitle>
                <CardDescription>Oct 7 – Nov 11, 2025</CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">{realHours.toFixed(1)} hrs</div>
                  <p className="text-sm text-muted-foreground">Captured from progress breakdown</p>
                </div>
                <SourceBadge source="real" />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-primary" />
                  Phase status
                </CardTitle>
                <CardDescription>Billing & documents in motion</CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">Phase 1</div>
                  <p className="text-sm text-muted-foreground">Invoices + NDA/SOW templates</p>
                </div>
                <StatusBadge label="active" />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-primary" />
                  Pipeline
                </CardTitle>
                <CardDescription>Lead → prospect → active</CardDescription>
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold">3</div>
                  <p className="text-sm text-muted-foreground">Records across real + sample</p>
                </div>
                <StatusBadge label="next" />
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="overflow-hidden shadow-md border-blue-100">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-slate-900 text-white px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Foundation in progress</p>
              <h2 className="text-2xl font-semibold">Billing + documents go first</h2>
              <p className="text-sm text-blue-100 max-w-3xl">
                Stripe invoicing, NDA / Account Form / SOW templates, and PDF exports are the first wave. Everything below is wired to that outcome with clear labels for real vs sample data.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="bg-white/15 text-white border-white/30">
                <BadgeCheck className="mr-2 h-4 w-4" />
                Mark Phase 1 Ready
              </Button>
              <Button variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Start Invoice Flow
              </Button>
            </div>
          </div>
          <CardContent className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((phase) => (
              <div key={phase.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{phase.focus}</p>
                    <h3 className="text-lg font-semibold">{phase.label}</h3>
                  </div>
                  <StatusBadge label={phase.status} />
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {phase.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-[2px] h-4 w-4 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-md">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Financials & invoices
                  <SourceBadge source="real" />
                </CardTitle>
                <CardDescription>Data from balance_summary_desert_moon_crm_updated.html</CardDescription>
              </div>
              <Button variant="outline">
                <Wallet className="mr-2 h-4 w-4" />
                Prepare advancement invoice
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold">Desert Moon Lighting CRM</p>
                <p className="text-sm text-muted-foreground">
                  Current balance {currency(outstanding)} · Paid {currency(paid)} · Contract + new features: $5,750.00
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {primaryInvoices.map((invoice) => (
                    <TableRow key={invoice.description}>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell className="font-medium">{invoice.description}</TableCell>
                      <TableCell>
                        <StatusBadge label={invoice.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium">{currency(invoice.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Onboarding queue
                <Badge variant="outline" className="text-xs">NDA • Account Form • SOW</Badge>
              </CardTitle>
              <CardDescription>Each item shows owner, channel, and data source.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {onboardingQueue.map((item) => (
                <div key={item.title} className="rounded-lg border border-slate-200 p-3 bg-white/70">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Owner: {item.owner} • Channel: {item.channel}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge label={item.status} />
                      <SourceBadge source={item.source} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-md">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Delivery workstream
                  <Badge variant="outline" className="text-xs">Hours + cost</Badge>
                </CardTitle>
                <CardDescription>Mix of real delivery and sample next steps.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <SourceBadge source="real" />
                <SourceBadge source="sample" />
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requestor</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workItems.map((item) => (
                    <TableRow key={item.title}>
                      <TableCell className="font-medium">{item.requestor}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.detail}</div>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <StatusBadge label={item.status} />
                        <SourceBadge source={item.source} />
                      </TableCell>
                      <TableCell className="text-right">{item.hours.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{currency(item.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Lead & sequence snapshot
                <Layers className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription>Pipeline plus next action per record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.name} className="rounded-lg border border-slate-200 p-3 bg-white/70">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lead.sequence} • Next: {lead.nextStep}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        {stageCopy[lead.stage]}
                      </Badge>
                      <SourceBadge source={lead.source} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Automation stack
                <Target className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription>Connection status and next lift.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {automationStack.map((item) => (
                <div key={item.title} className="rounded-lg border border-slate-200 p-3 bg-white/70">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{item.title}</p>
                        <StatusBadge label={item.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                      <SourceBadge source={item.source} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Folder-driven updates
                <FileText className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription>Key documents and reports from the shared folder.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {updates.map((item) => (
                <div key={item.title} className="rounded-lg border border-slate-200 p-3 bg-white/70">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        {item.date}
                      </Badge>
                      <SourceBadge source={item.source} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Action list
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription>Immediate moves tied to this UI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                <p>Keep real vs sample labels visible on every dataset and table.</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock4 className="h-4 w-4 text-primary mt-0.5" />
                <p>Plug Stripe keys + webhook to activate the advancement invoice button.</p>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <p>Bind NDA / Account Form / SOW templates to onboarding queue entries.</p>
              </div>
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-primary mt-0.5" />
                <p>Map GitHub and email ingestion to the delivery workstream timeline.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              UI reference notes
              <Separator orientation="vertical" className="h-5" />
              <span className="text-sm font-normal text-muted-foreground">
                Login via footer dot · admin view · route: /admin/plan
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Source documents reviewed: balance_summary_desert_moon_crm_updated.html, Sample Balance Summary and New Development Hours Cost.html, PROJECT_PLAN.md, SESSION_NOTES.md (Dec 1, 2025), CLIENT_IMPROVEMENTS_SUMMARY.md, PROPOSAL_CONTRACT_FLOW.md, Proposal-Builder-Lighting-CRM-Project updates.</p>
            <p>Use this page as the control surface: financials, onboarding, automation stack, roadmap, and lead pipeline are all represented with explicit data-source tags.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
