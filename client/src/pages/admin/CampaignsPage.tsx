import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible";
import {
  Send,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Pause,
  Play,
  Trash2,
  User,
  Building2,
  Calendar,
  ChevronRight,
  ChevronDown,
  Target,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Shield,
  DollarSign,
  Activity,
  Phone,
  Zap,
  Bot,
  Users,
  ArrowUpRight,
  CircleDot,
} from "lucide-react";
import { getApiBaseUrl } from "../../lib/queryClient";
import { cn } from "../../lib/utils";
import { format, formatDistanceToNow } from "date-fns";

// ================== TYPES ==================

interface Campaign {
  id: number;
  client_id: number;
  campaign_name: string;
  product_focus: string | null;
  current_step: number;
  max_steps: number;
  status: string;
  last_email_sent_at: string | null;
  next_email_due_at: string | null;
  days_between_emails: number;
  response_detected_at: string | null;
  gmail_thread_id: string | null;
  created_at: string;
  updated_at: string;
  client_name: string;
  client_email: string;
  first_name: string | null;
  industry: string | null;
}

interface CampaignStats {
  total: number;
  active: number;
  responded: number;
  completed: number;
  unactivated: number;
  at_step_1: number;
  at_step_2: number;
  at_step_3: number;
}

interface ColdLead {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  industry: string | null;
  company_size: string | null;
  status: string;
  source: string;
  notes: string | null;
  email_verified: boolean;
  email_verification_result: string | null;
  email_sequence_step: number;
  last_email_sent: string | null;
  next_followup_date: string | null;
  ai_handling: boolean;
  last_reply_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ColdMetrics {
  total_leads: string;
  verified: string;
  unverified: string;
  valid_emails: string;
  catch_all: string;
  invalid_emails: string;
  do_not_mail: string;
  emails_sent_count: string;
  at_step_1: string;
  at_step_2: string;
  at_step_3: string;
  responded: string;
  booked_calls: string;
  converted: string;
  bounce_rate: string;
  response_rate: string;
  health_status: "healthy" | "warning" | "critical";
  health_message: string;
  costs: {
    zerobounce: {
      verifications_used: number;
      free_remaining: number;
      paid_verifications: number;
      cost: string;
    };
    claude_ai: {
      classifications: number;
      responses_generated: number;
      cost: string;
    };
    total_cost: string;
    currency: string;
  };
}

// ================== CONFIG ==================

const campaignStatusConfig: Record<string, { color: string; bgColor: string; icon: typeof CheckCircle2; label: string }> = {
  active: {
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
    icon: Play,
    label: "Active",
  },
  responded: {
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
    icon: MessageSquare,
    label: "Responded",
  },
  completed: {
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    icon: CheckCircle2,
    label: "Completed",
  },
  unactivated: {
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900/40",
    icon: XCircle,
    label: "Unactivated",
  },
};

const pipelineStages: Record<string, { label: string; color: string; bgColor: string }> = {
  cold: { label: "Cold Lead", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800" },
  verified: { label: "Verified", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/40" },
  contacted: { label: "Contacted", color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-100 dark:bg-violet-900/40" },
  warm: { label: "Warm Lead", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/40" },
  interested: { label: "Interested", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/40" },
  booked: { label: "Booked Call", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/40" },
  converted: { label: "Converted", color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100 dark:bg-teal-900/40" },
  not_interested: { label: "Not Interested", color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-100 dark:bg-rose-900/40" },
  bounced: { label: "Bounced", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/40" },
};

const verificationColors: Record<string, { color: string; bgColor: string; label: string }> = {
  ok: { color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", label: "Valid" },
  catch_all: { color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30", label: "Catch-All" },
  invalid: { color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", label: "Invalid" },
  do_not_mail: { color: "text-slate-600", bgColor: "bg-slate-100 dark:bg-slate-800", label: "Do Not Mail" },
};

// ================== MAIN COMPONENT ==================

export default function CampaignsPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<"sequences" | "cold-outreach">("cold-outreach");

  // Email Sequences state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Cold Outreach state
  const [coldLeads, setColdLeads] = useState<ColdLead[]>([]);
  const [coldMetrics, setColdMetrics] = useState<ColdMetrics | null>(null);
  const [coldLoading, setColdLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState("all");

  const baseUrl = getApiBaseUrl();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // ================== DATA FETCHING ==================

  useEffect(() => {
    if (activeTab === "sequences") {
      fetchCampaigns();
      fetchStats();
    } else {
      fetchColdLeads();
      fetchColdMetrics();
    }
  }, [activeTab]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin/campaigns`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({ title: "Error", description: "Failed to load campaigns", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin/campaigns/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchColdLeads = async () => {
    setColdLoading(true);
    try {
      const response = await fetch(`${baseUrl}/admin/cold-outreach/leads`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setColdLeads(data.leads);
      }
    } catch (error) {
      console.error("Error fetching cold leads:", error);
      toast({ title: "Error", description: "Failed to load cold outreach leads", variant: "destructive" });
    } finally {
      setColdLoading(false);
    }
  };

  const fetchColdMetrics = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin/cold-outreach/metrics`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setColdMetrics(data.metrics);
      }
    } catch (error) {
      console.error("Error fetching cold metrics:", error);
    }
  };

  // ================== HANDLERS ==================

  const handleUpdateCampaignStatus = async (campaignId: number, newStatus: string) => {
    try {
      const response = await fetch(`${baseUrl}/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Updated", description: `Campaign status changed to ${newStatus}` });
        fetchCampaigns();
        fetchStats();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update campaign", variant: "destructive" });
    }
  };

  const handleDeleteCampaign = async (campaignId: number, clientName: string) => {
    if (!confirm(`Remove ${clientName} from this campaign?`)) return;
    try {
      const response = await fetch(`${baseUrl}/admin/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Removed", description: "Campaign removed successfully" });
        if (selectedCampaign?.id === campaignId) setSelectedCampaign(null);
        fetchCampaigns();
        fetchStats();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove campaign", variant: "destructive" });
    }
  };

  const handleUpdateLeadStatus = async (leadId: number, newStatus: string) => {
    try {
      const response = await fetch(`${baseUrl}/admin/cold-outreach/leads/${leadId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Updated", description: `Lead status changed` });
        fetchColdLeads();
        fetchColdMetrics();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update lead", variant: "destructive" });
    }
  };

  const handleToggleAutomation = async (leadId: number, currentlyPaused: boolean) => {
    try {
      const response = await fetch(`${baseUrl}/admin/cold-outreach/leads/${leadId}/toggle-automation`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ pause: !currentlyPaused }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Updated", description: data.message });
        fetchColdLeads();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to toggle automation", variant: "destructive" });
    }
  };

  const handleBulkUpdate = async (action: "pause" | "resume" | string) => {
    if (selectedLeads.length === 0) {
      toast({ title: "No leads selected", description: "Select leads first", variant: "destructive" });
      return;
    }

    try {
      const body: any = { leadIds: selectedLeads };
      if (action === "pause") body.ai_handling = false;
      else if (action === "resume") body.ai_handling = true;
      else body.status = action;

      const response = await fetch(`${baseUrl}/admin/cold-outreach/bulk-update`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Updated", description: data.message });
        setSelectedLeads([]);
        fetchColdLeads();
        fetchColdMetrics();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to bulk update", variant: "destructive" });
    }
  };

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const toggleAllLeads = () => {
    const visibleIds = filteredColdLeads.map((l) => l.id);
    if (selectedLeads.length === visibleIds.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(visibleIds);
    }
  };

  // ================== FILTERS ==================

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  const filteredColdLeads = coldLeads.filter((l) => {
    if (pipelineFilter === "all") return true;
    return l.status === pipelineFilter;
  });

  const getStepProgress = (current: number, max: number) => {
    return Array.from({ length: max }, (_, i) => i < current);
  };

  // ================== RENDER ==================

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Campaigns</h1>
            <p className="text-sm text-muted-foreground">Email sequences & cold outreach</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-4 rounded-md transition-all",
              activeTab === "cold-outreach"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("cold-outreach")}
          >
            <Target className="h-4 w-4 mr-2" />
            Cold Outreach
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-4 rounded-md transition-all",
              activeTab === "sequences"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("sequences")}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Sequences
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => {
              if (activeTab === "sequences") {
                fetchCampaigns();
                fetchStats();
              } else {
                fetchColdLeads();
                fetchColdMetrics();
              }
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "cold-outreach" ? (
        <ColdOutreachTab
          leads={filteredColdLeads}
          allLeads={coldLeads}
          metrics={coldMetrics}
          loading={coldLoading}
          selectedLeads={selectedLeads}
          metricsExpanded={metricsExpanded}
          pipelineFilter={pipelineFilter}
          onToggleLeadSelection={toggleLeadSelection}
          onToggleAllLeads={toggleAllLeads}
          onSetMetricsExpanded={setMetricsExpanded}
          onSetPipelineFilter={setPipelineFilter}
          onUpdateLeadStatus={handleUpdateLeadStatus}
          onToggleAutomation={handleToggleAutomation}
          onBulkUpdate={handleBulkUpdate}
          onRefresh={() => { fetchColdLeads(); fetchColdMetrics(); }}
          navigate={navigate}
        />
      ) : (
        <EmailSequencesTab
          campaigns={filteredCampaigns}
          allCampaigns={campaigns}
          stats={stats}
          loading={isLoading}
          statusFilter={statusFilter}
          selectedCampaign={selectedCampaign}
          onSetStatusFilter={setStatusFilter}
          onSetSelectedCampaign={setSelectedCampaign}
          onUpdateStatus={handleUpdateCampaignStatus}
          onDelete={handleDeleteCampaign}
          navigate={navigate}
        />
      )}
    </div>
  );
}

// ================== COLD OUTREACH TAB ==================

interface ColdOutreachTabProps {
  leads: ColdLead[];
  allLeads: ColdLead[];
  metrics: ColdMetrics | null;
  loading: boolean;
  selectedLeads: number[];
  metricsExpanded: boolean;
  pipelineFilter: string;
  onToggleLeadSelection: (id: number) => void;
  onToggleAllLeads: () => void;
  onSetMetricsExpanded: (expanded: boolean) => void;
  onSetPipelineFilter: (filter: string) => void;
  onUpdateLeadStatus: (id: number, status: string) => void;
  onToggleAutomation: (id: number, paused: boolean) => void;
  onBulkUpdate: (action: string) => void;
  onRefresh: () => void;
  navigate: (path: string) => void;
}

function ColdOutreachTab({
  leads,
  allLeads,
  metrics,
  loading,
  selectedLeads,
  metricsExpanded,
  pipelineFilter,
  onToggleLeadSelection,
  onToggleAllLeads,
  onSetMetricsExpanded,
  onSetPipelineFilter,
  onUpdateLeadStatus,
  onToggleAutomation,
  onBulkUpdate,
  onRefresh,
  navigate,
}: ColdOutreachTabProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Health Metrics Card */}
      {metrics && (
        <Collapsible open={metricsExpanded} onOpenChange={onSetMetricsExpanded}>
          <div className="border-b border-border/60 bg-muted/20">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-6">
                  {/* Health Status */}
                  <div className="flex items-center gap-2">
                    {metrics.health_status === "healthy" ? (
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    ) : metrics.health_status === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      metrics.health_status === "healthy" ? "text-emerald-600 dark:text-emerald-400" :
                      metrics.health_status === "warning" ? "text-amber-600 dark:text-amber-400" :
                      "text-red-600 dark:text-red-400"
                    )}>
                      {metrics.health_status === "healthy" ? "Healthy" :
                       metrics.health_status === "warning" ? "Warning" : "Critical"}
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{metrics.total_leads}</span>
                      <span className="text-muted-foreground">leads</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">{metrics.verified}</span>
                      <span className="text-muted-foreground">verified</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-violet-500" />
                      <span className="font-medium">{metrics.emails_sent_count}</span>
                      <span className="text-muted-foreground">sent</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{metrics.responded}</span>
                      <span className="text-muted-foreground">replied</span>
                    </span>
                    <span className={cn(
                      "flex items-center gap-1.5",
                      parseFloat(metrics.bounce_rate) > 5 ? "text-red-600" :
                      parseFloat(metrics.bounce_rate) > 2 ? "text-amber-600" : "text-emerald-600"
                    )}>
                      <Activity className="h-4 w-4" />
                      <span className="font-medium">{metrics.bounce_rate}%</span>
                      <span className="opacity-70">bounce</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    ${metrics.costs.total_cost} total
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    metricsExpanded && "rotate-180"
                  )} />
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-5 pb-4 pt-1">
                <div className="grid grid-cols-4 gap-4">
                  {/* Verification Breakdown */}
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Email Verification
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-600">Valid</span>
                        <span className="font-medium">{metrics.valid_emails}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-600">Catch-All</span>
                        <span className="font-medium">{metrics.catch_all}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-600">Invalid</span>
                        <span className="font-medium">{metrics.invalid_emails}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Do Not Mail</span>
                        <span className="font-medium">{metrics.do_not_mail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Email Funnel */}
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Email Funnel
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Step 1</span>
                        <span className="font-medium">{metrics.at_step_1}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Step 2</span>
                        <span className="font-medium">{metrics.at_step_2}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Step 3+</span>
                        <span className="font-medium">{metrics.at_step_3}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-emerald-600">Response Rate</span>
                        <span className="font-medium text-emerald-600">{metrics.response_rate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Success Metrics */}
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Conversions
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Responded</span>
                        <span className="font-medium">{metrics.responded}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Booked Calls</span>
                        <span className="font-medium text-green-600">{metrics.booked_calls}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-teal-600">Converted</span>
                        <span className="font-medium text-teal-600">{metrics.converted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="p-4 rounded-xl border bg-card">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Costs (USD)
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-blue-500" />
                          ZeroBounce
                        </span>
                        <span className="font-medium">${metrics.costs.zerobounce.cost}</span>
                      </div>
                      <div className="text-xs text-muted-foreground pl-5">
                        {metrics.costs.zerobounce.verifications_used} used / {metrics.costs.zerobounce.free_remaining} free left
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <Bot className="h-3.5 w-3.5 text-violet-500" />
                          Claude AI
                        </span>
                        <span className="font-medium">${metrics.costs.claude_ai.cost}</span>
                      </div>
                      <div className="text-xs text-muted-foreground pl-5">
                        {metrics.costs.claude_ai.classifications} classifications, {metrics.costs.claude_ai.responses_generated} responses
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t font-medium">
                        <span>Total</span>
                        <span>${metrics.costs.total_cost}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health Message */}
                {metrics.health_status !== "healthy" && (
                  <div className={cn(
                    "mt-4 p-3 rounded-lg flex items-center gap-2 text-sm",
                    metrics.health_status === "warning"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                  )}>
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    {metrics.health_message}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-2 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-200 dark:border-violet-800">
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            {selectedLeads.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onBulkUpdate("pause")}>
              <Pause className="h-3 w-3 mr-1" /> Pause AI
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onBulkUpdate("resume")}>
              <Play className="h-3 w-3 mr-1" /> Resume AI
            </Button>
            <Select onValueChange={(value) => onBulkUpdate(value)}>
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue placeholder="Set status..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(pipelineStages).map(([key, stage]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto" onClick={() => {}}>
            Clear
          </Button>
        </div>
      )}

      {/* Pipeline Filter Tabs */}
      <div className="flex items-center gap-1 px-5 py-2 border-b border-border/40 overflow-x-auto">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 text-xs font-normal rounded-md flex-shrink-0",
            pipelineFilter === "all" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onSetPipelineFilter("all")}
        >
          All
          <span className="ml-1.5 text-[10px] text-muted-foreground">{allLeads.length}</span>
        </Button>
        {Object.entries(pipelineStages).map(([key, stage]) => {
          const count = allLeads.filter((l) => l.status === key).length;
          if (count === 0) return null;
          return (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 text-xs font-normal rounded-md flex-shrink-0",
                pipelineFilter === key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onSetPipelineFilter(key)}
            >
              {stage.label}
              <span className="ml-1.5 text-[10px] text-muted-foreground">{count}</span>
            </Button>
          );
        })}
      </div>

      {/* Spreadsheet Table */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground/50" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-violet-500 opacity-50" />
            </div>
            <p className="text-sm font-medium">No cold outreach leads</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add leads to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr className="border-b border-border/60">
                <th className="w-10 px-3 py-2 text-left">
                  <Checkbox
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onCheckedChange={onToggleAllLeads}
                  />
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Verified</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Pipeline</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Step</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">AI</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Last Activity</th>
                <th className="w-10 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {leads.map((lead) => {
                const isSelected = selectedLeads.includes(lead.id);
                const verificationStatus = verificationColors[lead.email_verification_result || ""] || null;
                const pipelineStage = pipelineStages[lead.status] || pipelineStages.cold;

                return (
                  <tr
                    key={lead.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      isSelected && "bg-violet-50 dark:bg-violet-900/10"
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleLeadSelection(lead.id)}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{lead.name}</div>
                      {lead.industry && (
                        <div className="text-xs text-muted-foreground">{lead.industry}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-3 py-2.5">
                      {lead.email_verified ? (
                        verificationStatus ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                            verificationStatus.bgColor,
                            verificationStatus.color
                          )}>
                            {verificationStatus.label}
                          </span>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">Not verified</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Select
                        value={lead.status}
                        onValueChange={(value) => onUpdateLeadStatus(lead.id, value)}
                      >
                        <SelectTrigger className={cn(
                          "h-7 w-32 text-xs border-0 bg-transparent",
                          pipelineStage.bgColor,
                          pipelineStage.color
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(pipelineStages).map(([key, stage]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              <span className={stage.color}>{stage.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={cn(
                              "w-5 h-1.5 rounded-full",
                              step <= lead.email_sequence_step ? "bg-violet-500" : "bg-muted-foreground/20"
                            )}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">
                          {lead.email_sequence_step}/3
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 px-2 text-xs",
                          lead.ai_handling ? "text-emerald-600" : "text-muted-foreground"
                        )}
                        onClick={() => onToggleAutomation(lead.id, lead.ai_handling)}
                      >
                        {lead.ai_handling ? (
                          <>
                            <Zap className="h-3 w-3 mr-1" />
                            On
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Off
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {lead.last_reply_at ? (
                        <span className="text-emerald-600">
                          Replied {formatDistanceToNow(new Date(lead.last_reply_at), { addSuffix: true })}
                        </span>
                      ) : lead.last_email_sent ? (
                        <span>
                          Sent {formatDistanceToNow(new Date(lead.last_email_sent), { addSuffix: true })}
                        </span>
                      ) : (
                        <span>No activity</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(`/admin/clients?email=${lead.email}`)}>
                            <User className="h-3.5 w-3.5 mr-2" />
                            View Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `mailto:${lead.email}`}>
                            <Mail className="h-3.5 w-3.5 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onToggleAutomation(lead.id, lead.ai_handling)}>
                            {lead.ai_handling ? (
                              <>
                                <Pause className="h-3.5 w-3.5 mr-2" />
                                Pause AI
                              </>
                            ) : (
                              <>
                                <Play className="h-3.5 w-3.5 mr-2" />
                                Resume AI
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ScrollArea>
    </div>
  );
}

// ================== EMAIL SEQUENCES TAB ==================

interface EmailSequencesTabProps {
  campaigns: Campaign[];
  allCampaigns: Campaign[];
  stats: CampaignStats | null;
  loading: boolean;
  statusFilter: string;
  selectedCampaign: Campaign | null;
  onSetStatusFilter: (filter: string) => void;
  onSetSelectedCampaign: (campaign: Campaign | null) => void;
  onUpdateStatus: (id: number, status: string) => void;
  onDelete: (id: number, name: string) => void;
  navigate: (path: string) => void;
}

function EmailSequencesTab({
  campaigns,
  allCampaigns,
  stats,
  loading,
  statusFilter,
  selectedCampaign,
  onSetStatusFilter,
  onSetSelectedCampaign,
  onUpdateStatus,
  onDelete,
  navigate,
}: EmailSequencesTabProps) {
  const getStepProgress = (current: number, max: number) => {
    return Array.from({ length: max }, (_, i) => i < current);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Panel - Campaign List */}
      <div
        className={cn(
          "flex flex-col border-r border-border/60 transition-all duration-300 ease-in-out",
          selectedCampaign ? "w-[60%]" : "w-full"
        )}
      >
        {/* Stats Bar */}
        {stats && (
          <div className="flex items-center gap-6 px-5 py-3 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{stats.total} total</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{stats.active} active</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">{stats.responded} responded</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm">{stats.unactivated} unactivated</span>
            </div>
            {Number(stats.responded) > 0 && Number(stats.total) > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  {((Number(stats.responded) / Number(stats.total)) * 100).toFixed(1)}% response rate
                </span>
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-border/40">
          {["all", "active", "responded", "unactivated", "completed"].map((status) => (
            <Button
              key={status}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 text-[13px] font-normal rounded-md",
                statusFilter === status
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onSetStatusFilter(status)}
            >
              {status === "all" ? "All" : campaignStatusConfig[status]?.label || status}
              <span className="ml-1.5 text-[11px] text-muted-foreground">
                {status === "all"
                  ? allCampaigns.length
                  : allCampaigns.filter((c) => c.status === status).length}
              </span>
            </Button>
          ))}
        </div>

        {/* Campaign List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground/50" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-violet-500 opacity-50" />
              </div>
              <p className="text-sm font-medium">No campaigns found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Add contacts to a campaign from the Contacts page
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate("/admin/clients")}
              >
                Go to Contacts
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {campaigns.map((campaign) => {
                const isSelected = selectedCampaign?.id === campaign.id;
                const StatusIcon = campaignStatusConfig[campaign.status]?.icon || AlertCircle;
                const progress = getStepProgress(campaign.current_step, campaign.max_steps);

                return (
                  <div
                    key={campaign.id}
                    onClick={() => onSetSelectedCampaign(campaign)}
                    className={cn(
                      "px-5 py-4 cursor-pointer transition-all duration-150 group",
                      isSelected ? "bg-accent/80" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-[15px] truncate">
                            {campaign.client_name}
                          </span>
                          <span
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium",
                              campaignStatusConfig[campaign.status]?.bgColor,
                              campaignStatusConfig[campaign.status]?.color
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {campaignStatusConfig[campaign.status]?.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {campaign.client_email}
                          </span>
                          {campaign.industry && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {campaign.industry}
                            </span>
                          )}
                        </div>

                        {/* Progress Steps */}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            Step {campaign.current_step}/{campaign.max_steps}
                          </span>
                          <div className="flex items-center gap-1">
                            {progress.map((completed, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-6 h-1.5 rounded-full transition-colors",
                                  completed
                                    ? "bg-violet-500"
                                    : "bg-muted-foreground/20"
                                )}
                              />
                            ))}
                          </div>
                          {campaign.next_email_due_at && campaign.status === "active" && (
                            <span className="text-[11px] text-muted-foreground ml-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Next:{" "}
                              {formatDistanceToNow(new Date(campaign.next_email_due_at), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {campaign.status === "active" ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(campaign.id, "completed");
                                }}
                              >
                                <Pause className="h-3.5 w-3.5 mr-2" />
                                Pause Campaign
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateStatus(campaign.id, "active");
                                }}
                              >
                                <Play className="h-3.5 w-3.5 mr-2" />
                                Resume Campaign
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/clients?email=${campaign.client_email}`);
                              }}
                            >
                              <User className="h-3.5 w-3.5 mr-2" />
                              View Contact
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(campaign.id, campaign.client_name);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Campaign Detail */}
      {selectedCampaign && (
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          <div className="px-6 py-4 border-b border-border/60 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedCampaign.client_name}</h2>
                <p className="text-sm text-muted-foreground">{selectedCampaign.client_email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetSelectedCampaign(null)}
              >
                Close
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Status Card */}
              <div className="p-4 rounded-xl border bg-card">
                <h3 className="text-sm font-medium mb-3">Campaign Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      Current Step
                    </p>
                    <p className="text-2xl font-bold text-violet-500">
                      {selectedCampaign.current_step}/{selectedCampaign.max_steps}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      Status
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium mt-1",
                        campaignStatusConfig[selectedCampaign.status]?.bgColor,
                        campaignStatusConfig[selectedCampaign.status]?.color
                      )}
                    >
                      {campaignStatusConfig[selectedCampaign.status]?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 rounded-xl border bg-card">
                <h3 className="text-sm font-medium mb-3">Email Timeline</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((step) => {
                    const isSent = step <= selectedCampaign.current_step;
                    const isCurrent = step === selectedCampaign.current_step + 1;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            isSent
                              ? "bg-violet-500 text-white"
                              : isCurrent
                              ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-2 border-violet-500"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isSent ? <CheckCircle2 className="h-4 w-4" /> : step}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isSent
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            Email {step}
                            {step === 1 && " - Initial Outreach"}
                            {step === 2 && " - Follow-up"}
                            {step === 3 && " - Final Check-in"}
                          </p>
                          {isSent && (
                            <p className="text-xs text-muted-foreground">
                              Sent
                            </p>
                          )}
                          {isCurrent && selectedCampaign.next_email_due_at && (
                            <p className="text-xs text-violet-600 dark:text-violet-400">
                              Due{" "}
                              {formatDistanceToNow(
                                new Date(selectedCampaign.next_email_due_at),
                                { addSuffix: true }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-4 rounded-xl border bg-card">
                <h3 className="text-sm font-medium mb-3">Contact Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${selectedCampaign.client_email}`}
                      className="text-primary hover:underline"
                    >
                      {selectedCampaign.client_email}
                    </a>
                  </div>
                  {selectedCampaign.industry && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCampaign.industry}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Added{" "}
                      {format(new Date(selectedCampaign.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    navigate(`/admin/clients?email=${selectedCampaign.client_email}`)
                  }
                >
                  <User className="h-4 w-4 mr-2" />
                  View Contact
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    (window.location.href = `mailto:${selectedCampaign.client_email}`)
                  }
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
