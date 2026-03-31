import { useEffect, useState } from "react";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { getApiBaseUrl } from "../../lib/queryClient";
import {
  Rocket,
  Key,
  Server,
  DollarSign,
  Search,
  ExternalLink,
  Shield,
  Database,
  Mail,
  CreditCard,
  Phone,
  Bot,
  Globe,
  BarChart3,
  Cloud,
  Zap,
  Eye,
  EyeOff,
  Building2,
  Layers,
  RefreshCw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────

type Company = "BSA" | "SSW" | "AZCC" | "Shared";
type ServiceCategory = "AI" | "Email" | "Database" | "Payment" | "Communication" | "Analytics" | "Hosting" | "CRM" | "Auth" | "Maps" | "Dev Tools";

interface ServiceEntry {
  name: string;
  category: ServiceCategory;
  company: Company;
  envVar: string;
  envFile: string;
  monthlyCost: number | null; // null = free tier or unknown
  plan: string;
  status: "active" | "inactive" | "free";
  url: string;
  notes?: string;
}

interface PlatformSummary {
  platform: string;
  keyCount: number;
  companies: Company[];
  totalMonthlyCost: number;
  category: ServiceCategory;
}

interface OpenClawConfig {
  localGatewayUrl: string;
  vpsGatewayHost: string;
  vpsGatewayPort: number;
  vpsGatewayWsUrl: string;
  sshTunnelCommand: string;
  localGatewayUiUrl: string;
  vpsGatewayUiUrlLocalTunnel: string;
  workspacePath: string;
  stateDir: string;
}

interface OpenClawStatus {
  generatedAt: string;
  localGateway: {
    reachable: boolean;
    latencyMs: number | null;
    httpReachable: boolean;
    details: string;
  };
  vpsGateway: {
    reachable: boolean;
    latencyMs: number | null;
    details: string;
  };
  workspace: {
    ready: boolean;
    presentFiles: string[];
    missingFiles: string[];
  };
  runtime: {
    openAiConfigured: boolean;
    anthropicConfigured: boolean;
    elevenLabsConfigured: boolean;
    gatewayTokenConfigured: boolean;
    recommendedAudioStack: "openai-realtime" | "elevenlabs-convai";
    operatorVoiceEnabled?: boolean;
    operatorToolsEnabled?: boolean;
    realtimeModel?: string;
  };
}

// ─── Service Data ────────────────────────────────────────────────────────

const services: ServiceEntry[] = [
  // ── AI Services ──
  {
    name: "OpenAI",
    category: "AI",
    company: "BSA",
    envVar: "OPENAI_API_KEY",
    envFile: "www.BetterSystems.ai/.env",
    monthlyCost: 15,
    plan: "Pay-as-you-go",
    status: "active",
    url: "https://platform.openai.com",
    notes: "Lead analysis, voice agent summaries",
  },
  {
    name: "OpenAI",
    category: "AI",
    company: "SSW",
    envVar: "OPENAI_API_KEY",
    envFile: "Organic Soil Wholesale/.env",
    monthlyCost: 5,
    plan: "Pay-as-you-go",
    status: "active",
    url: "https://platform.openai.com",
    notes: "Whisper transcription",
  },
  {
    name: "Anthropic Claude",
    category: "AI",
    company: "BSA",
    envVar: "ANTHROPIC_API_KEY",
    envFile: "www.BetterSystems.ai/.env",
    monthlyCost: 20,
    plan: "Pay-as-you-go",
    status: "active",
    url: "https://console.anthropic.com",
    notes: "Cold outreach automation",
  },
  {
    name: "Anthropic Claude",
    category: "AI",
    company: "SSW",
    envVar: "ANTHROPIC_API_KEY",
    envFile: "Waste Diversion App/.env",
    monthlyCost: 5,
    plan: "Pay-as-you-go",
    status: "active",
    url: "https://console.anthropic.com",
    notes: "Waste ticket OCR/vision",
  },
  {
    name: "Google Gemini",
    category: "AI",
    company: "BSA",
    envVar: "GEMINI_API_KEY",
    envFile: "www.BetterSystems.ai/.env",
    monthlyCost: 0,
    plan: "Free tier",
    status: "free",
    url: "https://aistudio.google.com",
    notes: "Proposal cover image generation",
  },
  {
    name: "Google Gemini",
    category: "AI",
    company: "SSW",
    envVar: "GEMINI_API_KEY",
    envFile: "Protocols/.env.local",
    monthlyCost: 0,
    plan: "Free tier",
    status: "free",
    url: "https://aistudio.google.com",
    notes: "Protocol cover images",
  },
  {
    name: "ElevenLabs",
    category: "AI",
    company: "BSA",
    envVar: "ELEVENLABS_API_KEY",
    envFile: "www.BetterSystems.ai/.env",
    monthlyCost: 5,
    plan: "Starter",
    status: "active",
    url: "https://elevenlabs.io",
    notes: "Voice AI receptionist (Aria)",
  },
  {
    name: "Grok (xAI)",
    category: "AI",
    company: "SSW",
    envVar: "XAI_API_KEY",
    envFile: "Organic Soil Wholesale/.env",
    monthlyCost: 0,
    plan: "Free tier",
    status: "free",
    url: "https://console.x.ai",
    notes: "Alternative AI provider",
  },

  // ── Email Services ──
  {
    name: "Resend",
    category: "Email",
    company: "BSA",
    envVar: "RESEND_API_KEY",
    envFile: "www.BetterSystems.ai/.env",
    monthlyCost: 0,
    plan: "Free (3K emails/mo)",
    status: "active",
    url: "https://resend.com",
    notes: "bettersystems.ai, learnbetterai.com domains",
  },
  {
    name: "Resend",
    category: "Email",
    company: "SSW",
    envVar: "RESEND_API_KEY",
    envFile: "Organic Soil Wholesale/.env",
    monthlyCost: 0,
    plan: "Free (3K emails/mo)",
    status: "active",
    url: "https://resend.com",
    notes: "soilseedandwater.com, desertmoonlightingaz.com",
  },
  {
    name: "Gmail API",
    category: "Email",
    company: "BSA",
    envVar: "credentials.json",
    envFile: "~/.gmail-mcp/",
    monthlyCost: 0,
    plan: "Google Workspace",
    status: "active",
    url: "https://mail.google.com",
    notes: "rodolfo@bettersystems.ai via MCP",
  },
  {
    name: "Gmail API",
    category: "Email",
    company: "SSW",
    envVar: "credentials.json",
    envFile: "~/.soilseed-mcp/",
    monthlyCost: 0,
    plan: "Google Workspace",
    status: "active",
    url: "https://mail.google.com",
    notes: "ralvarez@soilseedandwater.com via helper script",
  },

  // ── Payment ──
  {
    name: "Stripe",
    category: "Payment",
    company: "BSA",
    envVar: "STRIPE_SECRET_KEY",
    envFile: "www.BetterSystems.ai/.env",
    monthlyCost: 0,
    plan: "Live (2.9% + 30c)",
    status: "active",
    url: "https://dashboard.stripe.com",
    notes: "Invoicing, payment links, subscriptions",
  },
  {
    name: "Stripe",
    category: "Payment",
    company: "SSW",
    envVar: "STRIPE_SECRET_KEY",
    envFile: "Organic Soil Wholesale/.env",
    monthlyCost: 0,
    plan: "Live (2.9% + 30c)",
    status: "active",
    url: "https://dashboard.stripe.com",
    notes: "Soil product ecommerce",
  },
  {
    name: "QuickBooks Online",
    category: "Payment",
    company: "BSA",
    envVar: "QUICKBOOKS_CLIENT_ID",
    envFile: "CRM Lighting Proposal/.env",
    monthlyCost: 30,
    plan: "Simple Start",
    status: "active",
    url: "https://app.qbo.intuit.com",
    notes: "Desert Moon Lighting accounting - LIVE",
  },

  // ── Database ──
  {
    name: "PostgreSQL (Local)",
    category: "Database",
    company: "BSA",
    envVar: "DATABASE_URL",
    envFile: "www.BetterSystems.ai/.env",
    monthlyCost: 0,
    plan: "Local",
    status: "active",
    url: "",
    notes: "localhost:5432/better_systems_ai",
  },
  {
    name: "Supabase",
    category: "Database",
    company: "BSA",
    envVar: "SUPABASE_URL",
    envFile: "CRM Lighting Proposal/.env",
    monthlyCost: 0,
    plan: "Free tier",
    status: "active",
    url: "https://supabase.com/dashboard",
    notes: "Desert Moon CRM (nnkuwtfktblqlfjugnrj)",
  },
  {
    name: "Supabase",
    category: "Database",
    company: "BSA",
    envVar: "SUPABASE_URL",
    envFile: "Agavefleet.com/.env",
    monthlyCost: 0,
    plan: "Free tier",
    status: "active",
    url: "https://supabase.com/dashboard",
    notes: "Agave Fleet (kxcixjiafdohbpwijfmd)",
  },
  {
    name: "Supabase",
    category: "Database",
    company: "BSA",
    envVar: "SUPABASE_URL",
    envFile: "Brian Mitchell/.env.local",
    monthlyCost: 0,
    plan: "Free tier",
    status: "active",
    url: "https://supabase.com/dashboard",
    notes: "Bubba's Map (pldmyvweyxzzxechvqdc)",
  },
  {
    name: "Supabase",
    category: "Database",
    company: "SSW",
    envVar: "SUPABASE_URL",
    envFile: "Organic Soil Wholesale/.env",
    monthlyCost: 0,
    plan: "Free tier",
    status: "active",
    url: "https://supabase.com/dashboard",
    notes: "OSW + Waste Diversion (govktyrtmwzbzqkmzmrf)",
  },
  {
    name: "Airtable",
    category: "Database",
    company: "Shared",
    envVar: "AIRTABLE_API_KEY",
    envFile: "Soil Seed and Water/.env",
    monthlyCost: 0,
    plan: "Free tier",
    status: "active",
    url: "https://airtable.com",
    notes: "Master key - 6+ bases across both companies",
  },

  // ── Communication ──
  {
    name: "Twilio",
    category: "Communication",
    company: "BSA",
    envVar: "TWILIO_ACCOUNT_SID",
    envFile: "CRM Lighting Proposal/.env",
    monthlyCost: 2,
    plan: "Pay-as-you-go",
    status: "active",
    url: "https://console.twilio.com",
    notes: "+18445235784 - CRM SMS alerts",
  },
  {
    name: "Twilio",
    category: "Communication",
    company: "SSW",
    envVar: "TWILIO_ACCOUNT_SID",
    envFile: "Waste Diversion App/.env",
    monthlyCost: 0,
    plan: "Shared account",
    status: "active",
    url: "https://console.twilio.com",
    notes: "+16028061439 - Waste app notifications",
  },

  // ── Analytics & Lead Gen ──
  {
    name: "Apollo.io",
    category: "Analytics",
    company: "BSA",
    envVar: "APOLLO_API_KEY",
    envFile: "Cold Outreach System/automation/.env",
    monthlyCost: 0,
    plan: "Free (10K credits/mo)",
    status: "active",
    url: "https://app.apollo.io",
    notes: "Using SSW account credits for BSA outreach",
  },
  {
    name: "Apollo.io",
    category: "Analytics",
    company: "SSW",
    envVar: "APOLLO_API_KEY",
    envFile: "Soil Seed and Water/.env",
    monthlyCost: 0,
    plan: "Free (10K credits/mo)",
    status: "active",
    url: "https://app.apollo.io",
    notes: "Orchard/vineyard prospects",
  },
  {
    name: "ZeroBounce",
    category: "Analytics",
    company: "BSA",
    envVar: "ZEROBOUNCE_API_KEY",
    envFile: "Cold Outreach System/automation/.env",
    monthlyCost: 0,
    plan: "Pay-as-you-go",
    status: "active",
    url: "https://www.zerobounce.net",
    notes: "Email verification for cold outreach",
  },
  {
    name: "HubSpot",
    category: "CRM",
    company: "SSW",
    envVar: "HUBSPOT_ACCESS_TOKEN",
    envFile: "Organic Soil Wholesale/.env",
    monthlyCost: 0,
    plan: "Free CRM",
    status: "active",
    url: "https://app.hubspot.com",
    notes: "OSW website lead capture",
  },

  // ── Maps & Location ──
  {
    name: "Google Places API",
    category: "Maps",
    company: "BSA",
    envVar: "GOOGLE_PLACES_API_KEY",
    envFile: "CRM Lighting Proposal/.env",
    monthlyCost: 0,
    plan: "Free tier ($200 credit)",
    status: "active",
    url: "https://console.cloud.google.com",
    notes: "Address autocomplete in proposals",
  },
  {
    name: "Mapbox",
    category: "Maps",
    company: "BSA",
    envVar: "NEXT_PUBLIC_MAPBOX_TOKEN",
    envFile: "Brian Mitchell/.env.local",
    monthlyCost: 0,
    plan: "Free tier",
    status: "active",
    url: "https://account.mapbox.com",
    notes: "Legacy - Bubba's Map (superseded by Google)",
  },

  // ── Hosting & Deploy ──
  {
    name: "Vercel",
    category: "Hosting",
    company: "BSA",
    envVar: "N/A (CLI)",
    envFile: "N/A",
    monthlyCost: 0,
    plan: "Hobby (free)",
    status: "active",
    url: "https://vercel.com/dashboard",
    notes: "BSA website, client apps",
  },
  {
    name: "Vercel",
    category: "Hosting",
    company: "SSW",
    envVar: "N/A (CLI)",
    envFile: "N/A",
    monthlyCost: 0,
    plan: "Hobby (free)",
    status: "active",
    url: "https://vercel.com/dashboard",
    notes: "OSW, Waste Diversion, AZCC",
  },
  {
    name: "DigitalOcean",
    category: "Hosting",
    company: "BSA",
    envVar: "N/A",
    envFile: "Credentials/digitalocean.md",
    monthlyCost: 6,
    plan: "Basic Droplet",
    status: "active",
    url: "https://cloud.digitalocean.com",
    notes: "rodolfo@bettersystems.ai",
  },

  // ── Auth ──
  {
    name: "NextAuth",
    category: "Auth",
    company: "BSA",
    envVar: "NEXTAUTH_SECRET",
    envFile: "Brian Mitchell/.env.local",
    monthlyCost: 0,
    plan: "Open source",
    status: "active",
    url: "https://next-auth.js.org",
    notes: "Bubba's New Home Guide auth",
  },
  {
    name: "Google Calendar API",
    category: "Dev Tools",
    company: "BSA",
    envVar: "tokens.json",
    envFile: "~/.config/google-calendar-mcp/",
    monthlyCost: 0,
    plan: "Free (Workspace)",
    status: "active",
    url: "https://calendar.google.com",
    notes: "rodolfo@bettersystems.ai via MCP",
  },
  {
    name: "Google Drive API",
    category: "Dev Tools",
    company: "BSA",
    envVar: "Keychain",
    envFile: "macOS Keychain",
    monthlyCost: 0,
    plan: "Free (Workspace)",
    status: "active",
    url: "https://drive.google.com",
    notes: "Docs, search via MCP",
  },
  {
    name: "GitHub API",
    category: "Dev Tools",
    company: "Shared",
    envVar: "N/A (MCP)",
    envFile: "MCP config",
    monthlyCost: 0,
    plan: "Free",
    status: "active",
    url: "https://github.com",
    notes: "Changelog sync, repo management",
  },
  {
    name: "Make.com",
    category: "Dev Tools",
    company: "AZCC",
    envVar: "Webhook URL",
    envFile: "AZCC-Website",
    monthlyCost: 0,
    plan: "Free tier",
    status: "active",
    url: "https://www.make.com",
    notes: "Form submission automation",
  },
  {
    name: "Claude Code (CLI)",
    category: "Dev Tools",
    company: "BSA",
    envVar: "N/A",
    envFile: "N/A",
    monthlyCost: 100,
    plan: "Max Plan",
    status: "active",
    url: "https://claude.ai",
    notes: "Primary development tool",
  },
  {
    name: "Google Workspace",
    category: "Email",
    company: "BSA",
    envVar: "N/A",
    envFile: "N/A",
    monthlyCost: 7,
    plan: "Business Starter",
    status: "active",
    url: "https://admin.google.com",
    notes: "rodolfo@bettersystems.ai",
  },
  {
    name: "Google Workspace",
    category: "Email",
    company: "SSW",
    envVar: "N/A",
    envFile: "N/A",
    monthlyCost: 7,
    plan: "Business Starter",
    status: "active",
    url: "https://admin.google.com",
    notes: "ralvarez@soilseedandwater.com",
  },
];

// ─── Computed Data ───────────────────────────────────────────────────────

function getCompanyColor(company: Company) {
  switch (company) {
    case "BSA":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "SSW":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    case "AZCC":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
    case "Shared":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  }
}

function getCategoryIcon(category: ServiceCategory) {
  switch (category) {
    case "AI":
      return <Bot className="h-4 w-4" />;
    case "Email":
      return <Mail className="h-4 w-4" />;
    case "Database":
      return <Database className="h-4 w-4" />;
    case "Payment":
      return <CreditCard className="h-4 w-4" />;
    case "Communication":
      return <Phone className="h-4 w-4" />;
    case "Analytics":
      return <BarChart3 className="h-4 w-4" />;
    case "Hosting":
      return <Cloud className="h-4 w-4" />;
    case "CRM":
      return <Building2 className="h-4 w-4" />;
    case "Auth":
      return <Shield className="h-4 w-4" />;
    case "Maps":
      return <Globe className="h-4 w-4" />;
    case "Dev Tools":
      return <Zap className="h-4 w-4" />;
  }
}

function getStatusBadge(status: "active" | "inactive" | "free") {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Active</Badge>;
    case "inactive":
      return <Badge variant="secondary">Inactive</Badge>;
    case "free":
      return <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20">Free</Badge>;
  }
}

function computePlatformSummaries(): PlatformSummary[] {
  const map = new Map<string, PlatformSummary>();

  services.forEach((s) => {
    const existing = map.get(s.name);
    if (existing) {
      existing.keyCount += 1;
      if (!existing.companies.includes(s.company)) {
        existing.companies.push(s.company);
      }
      existing.totalMonthlyCost += s.monthlyCost ?? 0;
    } else {
      map.set(s.name, {
        platform: s.name,
        keyCount: 1,
        companies: [s.company],
        totalMonthlyCost: s.monthlyCost ?? 0,
        category: s.category,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.totalMonthlyCost - a.totalMonthlyCost || b.keyCount - a.keyCount);
}

// ─── Component ───────────────────────────────────────────────────────────

export default function MissionControlPage() {
  useScrollToTop();
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState<"all" | Company>("all");
  const [showEnvPaths, setShowEnvPaths] = useState(false);
  const [openClawStatus, setOpenClawStatus] = useState<OpenClawStatus | null>(null);
  const [openClawConfig, setOpenClawConfig] = useState<OpenClawConfig | null>(null);
  const [openClawLoading, setOpenClawLoading] = useState(true);
  const [openClawError, setOpenClawError] = useState<string | null>(null);
  const localGatewayLatency = openClawStatus?.localGateway.latencyMs;
  const vpsGatewayLatency = openClawStatus?.vpsGateway.latencyMs;

  const platformSummaries = computePlatformSummaries();

  const totalServices = new Set(services.map((s) => s.name)).size;
  const totalKeys = services.length;
  const totalMonthlyCost = services.reduce((sum, s) => sum + (s.monthlyCost ?? 0), 0);
  const paidServices = services.filter((s) => (s.monthlyCost ?? 0) > 0);
  const freeServices = services.filter((s) => (s.monthlyCost ?? 0) === 0);

  const bsaCost = services.filter((s) => s.company === "BSA").reduce((sum, s) => sum + (s.monthlyCost ?? 0), 0);
  const sswCost = services.filter((s) => s.company === "SSW").reduce((sum, s) => sum + (s.monthlyCost ?? 0), 0);

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      searchQuery === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.envVar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.notes || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === "all" || s.company === companyFilter;
    return matchesSearch && matchesCompany;
  });

  const categories = Array.from(new Set(services.map((s) => s.category))).sort();

  const fetchOpenClawState = async () => {
    try {
      setOpenClawLoading(true);
      setOpenClawError(null);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const [configRes, statusRes] = await Promise.all([
        fetch(`${baseUrl}/admin/openclaw/config`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${baseUrl}/admin/openclaw/status`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const configPayload = await configRes.json();
      const statusPayload = await statusRes.json();

      if (!configRes.ok || !configPayload.success) {
        throw new Error(configPayload.message || "Failed to load OpenClaw config");
      }
      if (!statusRes.ok || !statusPayload.success) {
        throw new Error(statusPayload.message || "Failed to load OpenClaw status");
      }

      setOpenClawConfig(configPayload.config);
      setOpenClawStatus(statusPayload.status);
    } catch (error) {
      setOpenClawError(error instanceof Error ? error.message : "Failed to load OpenClaw state");
    } finally {
      setOpenClawLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenClawState();
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Rocket className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
          </div>
          <p className="text-muted-foreground">Complete inventory of all software, API keys, and platform costs across every business.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>OpenClaw Ops</CardTitle>
                <CardDescription>
                  Local-first conversational assistant with VPS fallback, tool actions, and memory files (`CLAUDE.md` + `SOUL.md`).
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <a href="/admin/operator-voice" className="inline-flex">
                  <Button variant="default" size="sm">
                    Open Operator Voice
                  </Button>
                </a>
                <Button variant="outline" size="sm" onClick={fetchOpenClawState} disabled={openClawLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${openClawLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {openClawError && <p className="text-sm text-red-500">{openClawError}</p>}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Local Gateway</p>
                <p className="font-semibold mt-1">
                  {openClawStatus?.localGateway.reachable ? "Online" : "Offline"}
                </p>
                {typeof localGatewayLatency === "number" && (
                  <p className="text-xs text-muted-foreground mt-1">{localGatewayLatency}ms</p>
                )}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">VPS Gateway</p>
                <p className="font-semibold mt-1">
                  {openClawStatus?.vpsGateway.reachable ? "Reachable" : "Not Reachable"}
                </p>
                {typeof vpsGatewayLatency === "number" && (
                  <p className="text-xs text-muted-foreground mt-1">{vpsGatewayLatency}ms</p>
                )}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Workspace Memory</p>
                <p className="font-semibold mt-1">{openClawStatus?.workspace.ready ? "Ready" : "Missing Files"}</p>
                {!openClawStatus?.workspace.ready && openClawStatus && (
                  <p className="text-xs text-muted-foreground mt-1">{openClawStatus?.workspace.missingFiles.join(", ")}</p>
                )}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Realtime Stack</p>
                <p className="font-semibold mt-1">{openClawStatus?.runtime.recommendedAudioStack || "Pending"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  OpenAI: {openClawStatus?.runtime.openAiConfigured ? "Yes" : "No"} | ElevenLabs: {openClawStatus?.runtime.elevenLabsConfigured ? "Yes" : "No"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Operator Voice: {openClawStatus?.runtime.operatorVoiceEnabled ? "On" : "Off"} | Tools: {openClawStatus?.runtime.operatorToolsEnabled ? "On" : "Off"}
                </p>
              </div>
            </div>

            {openClawConfig && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Local Gateway URL</p>
                  <code className="text-xs">{openClawConfig.localGatewayUrl}</code>
                  <p className="text-xs text-muted-foreground mt-2">Workspace: {openClawConfig.workspacePath}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">VPS Tunnel Command</p>
                  <code className="text-xs break-all">{openClawConfig.sshTunnelCommand}</code>
                  <p className="text-xs text-muted-foreground mt-2">Then open: {openClawConfig.vpsGatewayUiUrlLocalTunnel}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalServices}</p>
                  <p className="text-xs text-muted-foreground">Platforms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalKeys}</p>
                  <p className="text-xs text-muted-foreground">API Keys / Configs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalMonthlyCost}</p>
                  <p className="text-xs text-muted-foreground">Est. Monthly Cost</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10">
                  <Server className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{freeServices.length}</p>
                  <p className="text-xs text-muted-foreground">Free / Open Source</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Breakdown by Company */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Better Systems AI</p>
                  <p className="text-xl font-bold mt-1">${bsaCost}/mo</p>
                </div>
                <Badge className={getCompanyColor("BSA")}>BSA</Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalMonthlyCost > 0 ? (bsaCost / totalMonthlyCost) * 100 : 0}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Soil Seed & Water</p>
                  <p className="text-xl font-bold mt-1">${sswCost}/mo</p>
                </div>
                <Badge className={getCompanyColor("SSW")}>SSW</Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalMonthlyCost > 0 ? (sswCost / totalMonthlyCost) * 100 : 0}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid Services</p>
                  <p className="text-xl font-bold mt-1">
                    {paidServices.length} of {totalKeys}
                  </p>
                </div>
                <Badge variant="outline">{Math.round((freeServices.length / totalKeys) * 100)}% free</Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(paidServices.length / totalKeys) * 100}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Services / Platforms / By Category */}
        <Tabs defaultValue="services">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="services">All Services</TabsTrigger>
              <TabsTrigger value="platforms">By Platform</TabsTrigger>
              <TabsTrigger value="categories">By Category</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search services, keys, notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <div className="flex gap-1">
                {(["all", "BSA", "SSW", "AZCC", "Shared"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setCompanyFilter(f)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      companyFilter === f ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
                    }`}
                  >
                    {f === "all" ? "All" : f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── All Services Tab ── */}
          <TabsContent value="services">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Service Inventory</CardTitle>
                    <CardDescription>
                      {filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""} across all businesses
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setShowEnvPaths(!showEnvPaths)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border"
                  >
                    {showEnvPaths ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showEnvPaths ? "Hide" : "Show"} Env Paths
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Service</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Plan</TableHead>
                        {showEnvPaths && <TableHead className="min-w-[200px]">Env Variable</TableHead>}
                        <TableHead className="text-right">Monthly Cost</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service, idx) => (
                        <TableRow key={`${service.name}-${service.company}-${idx}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{service.name}</span>
                              {service.url && (
                                <a href={service.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            {service.notes && <p className="text-xs text-muted-foreground mt-0.5">{service.notes}</p>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getCompanyColor(service.company)}>
                              {service.company}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              {getCategoryIcon(service.category)}
                              {service.category}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{service.plan}</TableCell>
                          {showEnvPaths && (
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{service.envVar}</code>
                              <p className="text-xs text-muted-foreground mt-0.5">{service.envFile}</p>
                            </TableCell>
                          )}
                          <TableCell className="text-right font-medium">
                            {service.monthlyCost === null ? (
                              <span className="text-muted-foreground">Unknown</span>
                            ) : service.monthlyCost === 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                            ) : (
                              <span>${service.monthlyCost}</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(service.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── By Platform Tab ── */}
          <TabsContent value="platforms">
            <Card>
              <CardHeader>
                <CardTitle>Platform Summary</CardTitle>
                <CardDescription>Grouped by service provider - {platformSummaries.length} unique platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Platform</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-center">Keys / Configs</TableHead>
                        <TableHead>Used By</TableHead>
                        <TableHead className="text-right">Total Monthly</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {platformSummaries
                        .filter((p) => {
                          if (companyFilter === "all") return true;
                          return p.companies.includes(companyFilter);
                        })
                        .filter((p) => {
                          if (!searchQuery) return true;
                          return p.platform.toLowerCase().includes(searchQuery.toLowerCase());
                        })
                        .map((platform) => (
                          <TableRow key={platform.platform}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(platform.category)}
                                <span className="font-medium">{platform.platform}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{platform.category}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{platform.keyCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {platform.companies.map((c) => (
                                  <Badge key={c} variant="outline" className={`text-xs ${getCompanyColor(c)}`}>
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {platform.totalMonthlyCost === 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                              ) : (
                                <span>${platform.totalMonthlyCost}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── By Category Tab ── */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const categoryServices = filteredServices.filter((s) => s.category === category);
                if (categoryServices.length === 0) return null;
                const categoryCost = categoryServices.reduce((sum, s) => sum + (s.monthlyCost ?? 0), 0);

                return (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category as ServiceCategory)}
                          <CardTitle className="text-base">{category}</CardTitle>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">
                            {categoryCost === 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                            ) : (
                              <span>${categoryCost}/mo</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {categoryServices.map((service, idx) => (
                          <div key={`${service.name}-${service.company}-${idx}`} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-medium text-sm truncate">{service.name}</span>
                              <Badge variant="outline" className={`text-xs shrink-0 ${getCompanyColor(service.company)}`}>
                                {service.company}
                              </Badge>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              {(service.monthlyCost ?? 0) === 0 ? (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">Free</span>
                              ) : (
                                <span className="text-sm font-medium">${service.monthlyCost}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
