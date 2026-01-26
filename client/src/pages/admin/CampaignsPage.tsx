import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
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
  ChevronUp,
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
  Search,
  Download,
  Filter,
  ArrowUpDown,
  X,
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

// Professional color palette - muted, high contrast, accessibility-focused
const pipelineStages: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  cold: { label: "Cold", color: "text-slate-600 dark:text-slate-300", bgColor: "bg-slate-100 dark:bg-slate-800/60", dotColor: "bg-slate-400" },
  verified: { label: "Verified", color: "text-blue-700 dark:text-blue-300", bgColor: "bg-blue-50 dark:bg-blue-950/40", dotColor: "bg-blue-500" },
  contacted: { label: "Contacted", color: "text-indigo-700 dark:text-indigo-300", bgColor: "bg-indigo-50 dark:bg-indigo-950/40", dotColor: "bg-indigo-500" },
  warm: { label: "Warm", color: "text-amber-700 dark:text-amber-300", bgColor: "bg-amber-50 dark:bg-amber-950/40", dotColor: "bg-amber-500" },
  interested: { label: "Interested", color: "text-purple-700 dark:text-purple-300", bgColor: "bg-purple-50 dark:bg-purple-950/40", dotColor: "bg-purple-500" },
  booked: { label: "Booked", color: "text-cyan-700 dark:text-cyan-300", bgColor: "bg-cyan-50 dark:bg-cyan-950/40", dotColor: "bg-cyan-500" },
  converted: { label: "Converted", color: "text-emerald-700 dark:text-emerald-300", bgColor: "bg-emerald-50 dark:bg-emerald-950/40", dotColor: "bg-emerald-500" },
  not_interested: { label: "Not Interested", color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-50 dark:bg-rose-950/40", dotColor: "bg-rose-500" },
  bounced: { label: "Bounced", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-50 dark:bg-red-950/40", dotColor: "bg-red-500" },
};

const verificationColors: Record<string, { color: string; bgColor: string; label: string; icon: string }> = {
  ok: { color: "text-emerald-700 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", label: "Valid", icon: "check" },
  catch_all: { color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/30", label: "Catch-All", icon: "alert" },
  invalid: { color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950/30", label: "Invalid", icon: "x" },
  do_not_mail: { color: "text-slate-500 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-800/60", label: "Do Not Mail", icon: "ban" },
};

// Sort configuration
type SortField = "name" | "email" | "status" | "email_verification_result" | "email_sequence_step" | "last_email_sent" | "created_at";
type SortDirection = "asc" | "desc";

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
  // Search, sort, and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [aiFilter, setAiFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter leads based on all criteria
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          (lead.industry && lead.industry.toLowerCase().includes(query)) ||
          (lead.phone && lead.phone.toLowerCase().includes(query))
      );
    }

    // Verification filter
    if (verificationFilter !== "all") {
      result = result.filter(
        (lead) => lead.email_verification_result === verificationFilter
      );
    }

    // AI filter
    if (aiFilter !== "all") {
      result = result.filter(
        (lead) => (aiFilter === "on" ? lead.ai_handling : !lead.ai_handling)
      );
    }

    return result;
  }, [leads, searchQuery, verificationFilter, aiFilter]);

  // Sort leads
  const sortedLeads = useMemo(() => {
    if (!sortField) return filteredLeads;

    return [...filteredLeads].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null/undefined
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";

      // Handle dates
      if (sortField === "last_email_sent" || sortField === "created_at") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      // Handle numbers
      if (sortField === "email_sequence_step") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      // Compare
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredLeads, sortField, sortDirection]);

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Name",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Industry",
      "Company Size",
      "Pipeline Stage",
      "Verification Status",
      "Email Step",
      "AI Handling",
      "Last Email Sent",
      "Last Reply",
      "Created At",
      "Notes",
    ];

    const rows = sortedLeads.map((lead) => [
      lead.id,
      lead.name,
      lead.first_name || "",
      lead.last_name || "",
      lead.email,
      lead.phone || "",
      lead.industry || "",
      lead.company_size || "",
      pipelineStages[lead.status]?.label || lead.status,
      verificationColors[lead.email_verification_result || ""]?.label || (lead.email_verified ? "Verified" : "Not Verified"),
      lead.email_sequence_step,
      lead.ai_handling ? "On" : "Off",
      lead.last_email_sent ? format(new Date(lead.last_email_sent), "yyyy-MM-dd HH:mm") : "",
      lead.last_reply_at ? format(new Date(lead.last_reply_at), "yyyy-MM-dd HH:mm") : "",
      format(new Date(lead.created_at), "yyyy-MM-dd HH:mm"),
      lead.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `cold-outreach-leads-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setVerificationFilter("all");
    setAiFilter("all");
    onSetPipelineFilter("all");
    setSortField(null);
  };

  const hasActiveFilters =
    searchQuery || verificationFilter !== "all" || aiFilter !== "all" || pipelineFilter !== "all";

  // Sortable column header component
  const SortableHeader = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={cn(
        "px-3 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none group",
        className
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <span className="opacity-0 group-hover:opacity-60 transition-opacity">
          {sortField === field ? (
            sortDirection === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5" />
          )}
        </span>
        {sortField === field && (
          <span className="text-violet-500">
            {sortDirection === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Compact Metrics Bar */}
      {metrics && (
        <div className="border-b border-border/50 bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-800/30">
          <div className="flex items-center justify-between px-5 py-2.5">
            {/* Health + Quick Stats */}
            <div className="flex items-center gap-5">
              {/* Health Indicator */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                metrics.health_status === "healthy"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
                  : metrics.health_status === "warning"
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50"
              )}>
                {metrics.health_status === "healthy" ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : metrics.health_status === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  metrics.health_status === "healthy"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : metrics.health_status === "warning"
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-red-700 dark:text-red-400"
                )}>
                  {metrics.health_status}
                </span>
              </div>

              {/* Stat Pills */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/60">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{metrics.total_leads}</span>
                  <span className="text-slate-500 text-xs">leads</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">{metrics.valid_emails}</span>
                  <span className="text-emerald-600/70 dark:text-emerald-400/70 text-xs">valid</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-50 dark:bg-violet-950/30">
                  <Mail className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-semibold text-violet-700 dark:text-violet-300">{metrics.emails_sent_count}</span>
                  <span className="text-violet-600/70 dark:text-violet-400/70 text-xs">sent</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{metrics.responded}</span>
                  <span className="text-blue-600/70 dark:text-blue-400/70 text-xs">replied</span>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md",
                  parseFloat(metrics.bounce_rate) > 5
                    ? "bg-red-50 dark:bg-red-950/30"
                    : parseFloat(metrics.bounce_rate) > 2
                    ? "bg-amber-50 dark:bg-amber-950/30"
                    : "bg-emerald-50 dark:bg-emerald-950/30"
                )}>
                  <Activity className={cn(
                    "h-3.5 w-3.5",
                    parseFloat(metrics.bounce_rate) > 5
                      ? "text-red-500"
                      : parseFloat(metrics.bounce_rate) > 2
                      ? "text-amber-500"
                      : "text-emerald-500"
                  )} />
                  <span className={cn(
                    "font-semibold",
                    parseFloat(metrics.bounce_rate) > 5
                      ? "text-red-700 dark:text-red-300"
                      : parseFloat(metrics.bounce_rate) > 2
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-emerald-700 dark:text-emerald-300"
                  )}>{metrics.bounce_rate}%</span>
                  <span className="text-xs text-muted-foreground">bounce</span>
                </div>
              </div>
            </div>

            {/* Expand/Details Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onSetMetricsExpanded(!metricsExpanded)}
            >
              <DollarSign className="h-3.5 w-3.5 mr-1" />
              ${metrics.costs.total_cost}
              <ChevronDown className={cn(
                "h-3.5 w-3.5 ml-1.5 transition-transform",
                metricsExpanded && "rotate-180"
              )} />
            </Button>
          </div>

          {/* Expanded Metrics */}
          {metricsExpanded && (
            <div className="px-5 pb-4 pt-1 border-t border-border/30">
              <div className="grid grid-cols-4 gap-3 mt-3">
                {/* Verification Breakdown */}
                <div className="p-3 rounded-lg border bg-card/80">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Email Verification
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400">Valid</span>
                      <span className="font-semibold">{metrics.valid_emails}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-600 dark:text-amber-400">Catch-All</span>
                      <span className="font-semibold">{metrics.catch_all}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-600 dark:text-red-400">Invalid</span>
                      <span className="font-semibold">{metrics.invalid_emails}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Do Not Mail</span>
                      <span className="font-semibold">{metrics.do_not_mail}</span>
                    </div>
                  </div>
                </div>

                {/* Email Funnel */}
                <div className="p-3 rounded-lg border bg-card/80">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Email Funnel
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span>Step 1</span>
                      <span className="font-semibold">{metrics.at_step_1}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Step 2</span>
                      <span className="font-semibold">{metrics.at_step_2}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Step 3+</span>
                      <span className="font-semibold">{metrics.at_step_3}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                      <span className="text-emerald-600 dark:text-emerald-400">Response Rate</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{metrics.response_rate}%</span>
                    </div>
                  </div>
                </div>

                {/* Conversions */}
                <div className="p-3 rounded-lg border bg-card/80">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Conversions
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span>Responded</span>
                      <span className="font-semibold">{metrics.responded}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-600 dark:text-cyan-400">Booked Calls</span>
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">{metrics.booked_calls}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400">Converted</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{metrics.converted}</span>
                    </div>
                  </div>
                </div>

                {/* Costs */}
                <div className="p-3 rounded-lg border bg-card/80">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                    Costs (USD)
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3 text-blue-500" />
                        ZeroBounce
                      </span>
                      <span className="font-semibold">${metrics.costs.zerobounce.cost}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Bot className="h-3 w-3 text-violet-500" />
                        Claude AI
                      </span>
                      <span className="font-semibold">${metrics.costs.claude_ai.cost}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t font-semibold">
                      <span>Total</span>
                      <span>${metrics.costs.total_cost}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Warning */}
              {metrics.health_status !== "healthy" && (
                <div className={cn(
                  "mt-3 p-2.5 rounded-lg flex items-center gap-2 text-xs",
                  metrics.health_status === "warning"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50"
                    : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/50"
                )}>
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  {metrics.health_message}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-5 py-2.5">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search by name, email, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm bg-muted/30 border-transparent focus:border-violet-500/50 focus:bg-background"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Verification Filter */}
          <Select value={verificationFilter} onValueChange={setVerificationFilter}>
            <SelectTrigger className="w-32 h-8 text-xs bg-muted/30 border-transparent">
              <SelectValue placeholder="Verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Verification</SelectItem>
              <SelectItem value="ok" className="text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Valid
                </span>
              </SelectItem>
              <SelectItem value="catch_all" className="text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Catch-All
                </span>
              </SelectItem>
              <SelectItem value="invalid" className="text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Invalid
                </span>
              </SelectItem>
              <SelectItem value="do_not_mail" className="text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Do Not Mail
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* AI Filter */}
          <Select value={aiFilter} onValueChange={setAiFilter}>
            <SelectTrigger className="w-28 h-8 text-xs bg-muted/30 border-transparent">
              <SelectValue placeholder="AI Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All AI</SelectItem>
              <SelectItem value="on" className="text-xs">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-emerald-500" />
                  AI On
                </span>
              </SelectItem>
              <SelectItem value="off" className="text-xs">
                <span className="flex items-center gap-1.5">
                  <Pause className="h-3 w-3 text-slate-400" />
                  AI Off
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearAllFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}

          <div className="flex-1" />

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={exportToCSV}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>

        {/* Pipeline Stage Tabs */}
        <div className="flex items-center gap-1 px-5 pb-2 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 text-xs font-medium rounded-md flex-shrink-0 gap-1.5",
              pipelineFilter === "all"
                ? "bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            onClick={() => onSetPipelineFilter("all")}
          >
            All
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-semibold",
              pipelineFilter === "all"
                ? "bg-violet-200/50 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400"
                : "bg-muted text-muted-foreground"
            )}>
              {allLeads.length}
            </span>
          </Button>
          {Object.entries(pipelineStages).map(([key, stage]) => {
            const count = allLeads.filter((l) => l.status === key).length;
            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-xs font-medium rounded-md flex-shrink-0 gap-1.5",
                  pipelineFilter === key
                    ? cn(stage.bgColor, stage.color)
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                onClick={() => onSetPipelineFilter(key)}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", stage.dotColor)} />
                {stage.label}
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                  pipelineFilter === key
                    ? "bg-black/5 dark:bg-white/10"
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <div className="flex items-center gap-3 px-5 py-2 bg-violet-50 dark:bg-violet-950/40 border-b border-violet-200 dark:border-violet-800/50">
          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
            {selectedLeads.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-6 text-xs px-2 bg-white dark:bg-slate-900" onClick={() => onBulkUpdate("pause")}>
              <Pause className="h-3 w-3 mr-1" /> Pause AI
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-xs px-2 bg-white dark:bg-slate-900" onClick={() => onBulkUpdate("resume")}>
              <Play className="h-3 w-3 mr-1" /> Resume AI
            </Button>
            <Select onValueChange={(value) => onBulkUpdate(value)}>
              <SelectTrigger className="h-6 w-28 text-xs bg-white dark:bg-slate-900">
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(pipelineStages).map(([key, stage]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full", stage.dotColor)} />
                      {stage.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs ml-auto text-violet-600 dark:text-violet-400 hover:text-violet-700"
            onClick={() => {
              // Clear selection via parent - need to add onClearSelection prop
              window.location.reload(); // Temporary - should be handled by parent
            }}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Data Table */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground/40" />
          </div>
        ) : sortedLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Target className="h-7 w-7 text-violet-500 opacity-50" />
            </div>
            <p className="text-sm font-medium">
              {hasActiveFilters ? "No leads match your filters" : "No cold outreach leads"}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {hasActiveFilters ? "Try adjusting your filters" : "Add leads to get started"}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 dark:supports-[backdrop-filter]:bg-slate-900/80 z-10">
              <tr className="border-b border-border/60">
                <th className="w-10 px-3 py-2.5 text-left">
                  <Checkbox
                    checked={selectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
                    onCheckedChange={onToggleAllLeads}
                  />
                </th>
                <SortableHeader field="name">Name</SortableHeader>
                <SortableHeader field="email">Email</SortableHeader>
                <SortableHeader field="email_verification_result">Verified</SortableHeader>
                <SortableHeader field="status">Pipeline</SortableHeader>
                <SortableHeader field="email_sequence_step">Step</SortableHeader>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">AI</th>
                <SortableHeader field="last_email_sent">Last Activity</SortableHeader>
                <th className="w-10 px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {sortedLeads.map((lead) => {
                const isSelected = selectedLeads.includes(lead.id);
                const verificationStatus = verificationColors[lead.email_verification_result || ""] || null;
                const pipelineStage = pipelineStages[lead.status] || pipelineStages.cold;

                return (
                  <tr
                    key={lead.id}
                    className={cn(
                      "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors",
                      isSelected && "bg-violet-50/50 dark:bg-violet-950/20"
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleLeadSelection(lead.id)}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-foreground">{lead.name}</div>
                      {lead.industry && (
                        <div className="text-[11px] text-muted-foreground/70 mt-0.5">{lead.industry}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-3 py-2.5">
                      {lead.email_verified ? (
                        verificationStatus ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium",
                            verificationStatus.bgColor,
                            verificationStatus.color
                          )}>
                            {verificationStatus.label}
                          </span>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60">Not verified</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Select
                        value={lead.status}
                        onValueChange={(value) => onUpdateLeadStatus(lead.id, value)}
                      >
                        <SelectTrigger className={cn(
                          "h-6 w-auto min-w-24 text-[11px] font-medium border-0 px-2 py-0",
                          pipelineStage.bgColor,
                          pipelineStage.color
                        )}>
                          <span className="flex items-center gap-1.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full", pipelineStage.dotColor)} />
                            <SelectValue />
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(pipelineStages).map(([key, stage]) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              <span className="flex items-center gap-1.5">
                                <span className={cn("w-1.5 h-1.5 rounded-full", stage.dotColor)} />
                                {stage.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={cn(
                              "w-4 h-1 rounded-full transition-colors",
                              step <= lead.email_sequence_step
                                ? "bg-violet-500"
                                : "bg-slate-200 dark:bg-slate-700"
                            )}
                          />
                        ))}
                        <span className="text-[11px] text-muted-foreground ml-1.5 tabular-nums">
                          {lead.email_sequence_step}/3
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-5 px-1.5 text-[11px] font-medium",
                          lead.ai_handling
                            ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => onToggleAutomation(lead.id, lead.ai_handling)}
                      >
                        {lead.ai_handling ? (
                          <>
                            <Zap className="h-3 w-3 mr-0.5" />
                            On
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3 mr-0.5" />
                            Off
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground">
                      {lead.last_reply_at ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Replied {formatDistanceToNow(new Date(lead.last_reply_at), { addSuffix: true })}
                        </span>
                      ) : lead.last_email_sent ? (
                        <span>
                          Sent {formatDistanceToNow(new Date(lead.last_email_sent), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">No activity</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted">
                            <MoreHorizontal className="h-3.5 w-3.5" />
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

      {/* Footer Stats */}
      {sortedLeads.length > 0 && (
        <div className="flex items-center justify-between px-5 py-2 border-t border-border/50 bg-muted/20 text-xs text-muted-foreground">
          <span>
            Showing {sortedLeads.length} of {allLeads.length} leads
            {hasActiveFilters && " (filtered)"}
          </span>
          <span className="flex items-center gap-3">
            {sortField && (
              <span>
                Sorted by {sortField === "email_verification_result" ? "verification" : sortField.replace("_", " ")} ({sortDirection})
              </span>
            )}
          </span>
        </div>
      )}
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
