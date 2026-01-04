import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePersistedState } from "@/hooks/usePersistedState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Briefcase,
  DollarSign,
  Users,
  TrendingUp,
  User,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Target,
  Zap,
  ChevronRight,
  Calendar,
  Building2,
} from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useToast } from "@/hooks/use-toast";
import { getApiBaseUrl } from "@/lib/queryClient";

type Deal = {
  id: number;
  name: string;
  description?: string;
  value: string;
  stage: string;
  notes?: string;
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  hourlyRate?: string;
  createdAt: string;
  stakeholdersCount?: number;
};

type Client = {
  id: number;
  name: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  label?: string | null;
};

type CreateDealForm = {
  name: string;
  description: string;
  value: string;
  stage: string;
  priority: string;
  hourlyRate: string;
  expectedCloseDate: string;
  clientId: string;
  notes: string;
};

const STAGES = [
  { id: "lead", label: "Lead", color: "from-amber-500 to-orange-500", bgColor: "bg-amber-500/10", textColor: "text-amber-600", borderColor: "border-amber-500/30" },
  { id: "prospect", label: "Prospect", color: "from-sky-500 to-blue-500", bgColor: "bg-sky-500/10", textColor: "text-sky-600", borderColor: "border-sky-500/30" },
  { id: "proposal", label: "Proposal", color: "from-indigo-500 to-purple-500", bgColor: "bg-indigo-500/10", textColor: "text-indigo-600", borderColor: "border-indigo-500/30" },
  { id: "negotiation", label: "Negotiation", color: "from-violet-500 to-purple-600", bgColor: "bg-violet-500/10", textColor: "text-violet-600", borderColor: "border-violet-500/30" },
  { id: "active", label: "Active", color: "from-emerald-500 to-teal-500", bgColor: "bg-emerald-500/10", textColor: "text-emerald-600", borderColor: "border-emerald-500/30" },
  { id: "won", label: "Won", color: "from-green-500 to-emerald-600", bgColor: "bg-green-500/10", textColor: "text-green-600", borderColor: "border-green-500/30" },
  { id: "lost", label: "Lost", color: "from-rose-500 to-red-600", bgColor: "bg-rose-500/10", textColor: "text-rose-600", borderColor: "border-rose-500/30" },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFullCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusBadge({ stage }: { stage: string }) {
  const stageInfo = STAGES.find(s => s.id === stage) || STAGES[0];
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
      ${stageInfo.bgColor} ${stageInfo.textColor} border ${stageInfo.borderColor}
      transition-all duration-300 hover:scale-105
    `}>
      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${stageInfo.color}`} />
      {stageInfo.label}
    </span>
  );
}

// Animated counter component
function AnimatedValue({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{formatCurrency(displayValue)}</span>;
}

const initialFormState: CreateDealForm = {
  name: "",
  description: "",
  value: "",
  stage: "lead",
  priority: "medium",
  hourlyRate: "",
  expectedCloseDate: "",
  clientId: "",
  notes: "",
};

export default function DealsPage() {
  useScrollToTop();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const baseUrl = getApiBaseUrl();
  const [isLoaded, setIsLoaded] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = usePersistedState<string>("admin:deals:stageFilter", "all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateDealForm>(initialFormState);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const { data: dealsData, isLoading } = useQuery<{ success: boolean; data: Deal[] }>({
    queryKey: ["/api/admin/deals"],
  });

  const { data: clientsData } = useQuery<{ success: boolean; clients: Client[] }>({
    queryKey: ["/api/admin/clients", { hideHidden: true }],
    queryFn: async () => {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`${baseUrl}/admin/clients?hideHidden=true&limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.json();
    },
  });

  const clients = clientsData?.clients || [];
  const deals = dealsData?.data || [];

  const createDealMutation = useMutation({
    mutationFn: async (data: CreateDealForm) => {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`${baseUrl}/admin/deals`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          value: data.value ? parseFloat(data.value) : 0,
          stage: data.stage,
          priority: data.priority,
          hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : null,
          expectedCloseDate: data.expectedCloseDate || null,
          clientId: parseInt(data.clientId),
          notes: data.notes || null,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to create deal");
      }
      return result;
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: "Deal created successfully" });
      setShowCreateModal(false);
      setCreateForm(initialFormState);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      if (data.deal?.id) {
        navigate(`/admin/deals/${data.deal.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive"
      });
    },
  });

  const handleCreateDeal = () => {
    if (!createForm.name.trim()) {
      toast({ title: "Error", description: "Deal name is required", variant: "destructive" });
      return;
    }
    if (!createForm.clientId) {
      toast({ title: "Error", description: "Please select a contact", variant: "destructive" });
      return;
    }
    createDealMutation.mutate(createForm);
  };

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = !searchQuery ||
      deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === "all" || deal.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Calculate stats
  const stats = {
    total: deals.length,
    active: deals.filter(d => d.stage === "active").length,
    totalValue: deals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0),
    pipelineValue: deals.filter(d => !["won", "lost"].includes(d.stage)).reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0),
    clients: new Set(deals.map(d => d.clientId)).size,
    wonValue: deals.filter(d => d.stage === "won").reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading your deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }} />

      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className={`
          transition-all duration-700 ease-out
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/25">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Deals Pipeline
                  </h1>
                  <p className="text-muted-foreground mt-0.5 text-sm lg:text-base">
                    Track opportunities and manage your sales pipeline
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="
                group relative overflow-hidden
                bg-gradient-to-r from-primary to-primary/90
                hover:from-primary/90 hover:to-primary
                shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30
                transition-all duration-300 hover:-translate-y-0.5
              "
            >
              <span className="relative flex items-center gap-2">
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-300" />
                New Deal
              </span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`
          grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8
          transition-all duration-700 delay-100 ease-out
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          {/* Total Deals */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-border/50 p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Deals</p>
              <p className="text-3xl font-bold mt-1 tabular-nums">{stats.total}</p>
            </div>
          </div>

          {/* Active Deals */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-border/50 p-5 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Zap className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Live</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>
              <p className="text-3xl font-bold mt-1 text-emerald-600 tabular-nums">{stats.active}</p>
            </div>
          </div>

          {/* Pipeline Value */}
          <div className="group relative overflow-hidden rounded-2xl bg-white border border-border/50 p-5 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
                <Sparkles className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pipeline</p>
              <p className="text-3xl font-bold mt-1 text-amber-600 tabular-nums">
                <AnimatedValue value={stats.pipelineValue} />
              </p>
            </div>
          </div>

          {/* Won Value */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white shadow-lg shadow-green-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">Won</span>
              </div>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Revenue</p>
              <p className="text-3xl font-bold mt-1 tabular-nums">
                <AnimatedValue value={stats.wonValue} />
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className={`
          flex flex-col sm:flex-row gap-4 mb-6
          transition-all duration-700 delay-200 ease-out
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-white border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStageFilter("all")}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${stageFilter === "all"
                  ? "bg-foreground text-background shadow-lg"
                  : "bg-white text-muted-foreground hover:bg-muted/50 border border-border/50"
                }
              `}
            >
              All Stages
            </button>
            {STAGES.slice(0, 5).map((stage) => (
              <button
                key={stage.id}
                onClick={() => setStageFilter(stage.id)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${stageFilter === stage.id
                    ? `bg-gradient-to-r ${stage.color} text-white shadow-lg`
                    : `bg-white ${stage.textColor} hover:${stage.bgColor} border border-border/50`
                  }
                `}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deals List */}
        <div className={`
          transition-all duration-700 delay-300 ease-out
          ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}>
          {filteredDeals.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border-2 border-dashed border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No deals found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery || stageFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first deal to start tracking your pipeline"
                }
              </p>
              {!searchQuery && stageFilter === "all" && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Deal
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <div className="divide-y divide-border/50">
                {filteredDeals.map((deal, index) => (
                  <button
                    key={deal.id}
                    onClick={() => navigate(`/admin/deals/${deal.id}`)}
                    className="
                      w-full text-left px-6 py-5
                      hover:bg-gradient-to-r hover:from-muted/30 hover:to-transparent
                      transition-all duration-200
                      flex items-center gap-5
                      group
                    "
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
                        <span className="text-lg font-bold text-primary">
                          {deal.clientName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {deal.stakeholdersCount && deal.stakeholdersCount > 0 && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-muted border-2 border-white flex items-center justify-center">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            +{deal.stakeholdersCount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {deal.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {deal.clientName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(deal.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="hidden sm:block text-right shrink-0">
                      {deal.value && parseFloat(deal.value) > 0 && (
                        <p className="text-lg font-bold text-foreground tabular-nums">
                          {formatFullCurrency(parseFloat(deal.value))}
                        </p>
                      )}
                      {deal.hourlyRate && parseFloat(deal.hourlyRate) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ${deal.hourlyRate}/hr
                        </p>
                      )}
                    </div>

                    {/* Status + Arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge stage={deal.stage} />
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results summary */}
        {filteredDeals.length > 0 && (
          <div className={`
            mt-4 text-center text-sm text-muted-foreground
            transition-all duration-700 delay-400 ease-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}>
            Showing {filteredDeals.length} of {deals.length} deals
            {stageFilter !== "all" && ` in ${STAGES.find(s => s.id === stageFilter)?.label || stageFilter}`}
          </div>
        )}
      </div>

      {/* Create Deal Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              Create New Deal
            </DialogTitle>
            <DialogDescription>
              Add a new opportunity to your pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm font-medium">Deal Name</Label>
              <Input
                id="name"
                placeholder="e.g., Website Redesign Project"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client" className="text-sm font-medium">Contact</Label>
              <Select
                value={createForm.clientId}
                onValueChange={(value) => setCreateForm({ ...createForm, clientId: value })}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select a contact..." />
                </SelectTrigger>
                <SelectContent>
                  {clients
                    .filter(c => c.label !== 'hidden' && c.label !== 'spam')
                    .map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{client.firstName && client.lastName ? `${client.firstName} ${client.lastName}` : client.name}</span>
                          <span className="text-muted-foreground text-xs">({client.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="value" className="text-sm font-medium">Deal Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="0"
                  value={createForm.value}
                  onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage" className="text-sm font-medium">Stage</Label>
                <Select
                  value={createForm.stage}
                  onValueChange={(value) => setCreateForm({ ...createForm, stage: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                <Select
                  value={createForm.priority}
                  onValueChange={(value) => setCreateForm({ ...createForm, priority: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hourlyRate" className="text-sm font-medium">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="0"
                  value={createForm.hourlyRate}
                  onChange={(e) => setCreateForm({ ...createForm, hourlyRate: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expectedCloseDate" className="text-sm font-medium">Expected Close Date</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={createForm.expectedCloseDate}
                onChange={(e) => setCreateForm({ ...createForm, expectedCloseDate: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the deal..."
                rows={2}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="rounded-xl resize-none"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes..."
                rows={2}
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                className="rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm(initialFormState);
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDeal}
              disabled={createDealMutation.isPending}
              className="rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20"
            >
              {createDealMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Deal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
