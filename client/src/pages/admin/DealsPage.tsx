import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  Briefcase,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";

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
};

const STAGES = [
  { id: "lead", label: "Lead", color: "bg-amber-500" },
  { id: "prospect", label: "Prospect", color: "bg-blue-500" },
  { id: "proposal", label: "Proposal", color: "bg-indigo-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-purple-500" },
  { id: "active", label: "Active", color: "bg-emerald-500" },
  { id: "won", label: "Won", color: "bg-green-500" },
  { id: "lost", label: "Lost", color: "bg-red-500" },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    lead: "bg-amber-50 text-amber-700 border-amber-200",
    prospect: "bg-blue-50 text-blue-700 border-blue-200",
    proposal: "bg-indigo-50 text-indigo-700 border-indigo-200",
    negotiation: "bg-purple-50 text-purple-700 border-purple-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    won: "bg-green-50 text-green-700 border-green-200",
    lost: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={`${colors[stage] || "bg-gray-50 text-gray-700"} capitalize font-medium`}>
      {stage}
    </Badge>
  );
}

export default function DealsPage() {
  useScrollToTop();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const { data: dealsData, isLoading } = useQuery<{ success: boolean; data: Deal[] }>({
    queryKey: ["/api/admin/deals"],
  });

  const deals = dealsData?.data || [];

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
    clients: new Set(deals.map(d => d.clientId)).size,
  };

  // Group deals by stage for the pipeline view
  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(d => d.stage === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-muted-foreground mt-1">Manage your sales pipeline and client projects</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" />New Deal</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Deals</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Clients</p>
                <p className="text-2xl font-bold">{stats.clients}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Value</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={stageFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStageFilter("all")}
          >
            All
          </Button>
          {STAGES.slice(0, 5).map((stage) => (
            <Button
              key={stage.id}
              variant={stageFilter === stage.id ? "default" : "outline"}
              size="sm"
              onClick={() => setStageFilter(stage.id)}
            >
              {stage.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Deals List */}
      {filteredDeals.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
          <Briefcase className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="font-semibold text-lg">No deals found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery || stageFilter !== "all" ? "Try adjusting your filters" : "Create your first deal to get started"}
          </p>
        </div>
      ) : (
        <div className="bg-background rounded-xl border overflow-hidden">
          <div className="divide-y">
            {filteredDeals.map((deal) => (
              <button
                key={deal.id}
                onClick={() => navigate(`/admin/deals/${deal.id}`)}
                className="w-full text-left px-5 py-4 hover:bg-muted/50 transition-colors flex items-center gap-4"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <span className="text-lg font-semibold text-primary">
                    {deal.clientName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{deal.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{deal.clientName}</p>
                </div>
                <div className="hidden md:block text-right shrink-0">
                  {deal.value && parseFloat(deal.value) > 0 && (
                    <p className="font-semibold text-green-600">{formatCurrency(parseFloat(deal.value))}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDate(deal.createdAt)}</p>
                </div>
                <div className="shrink-0">
                  <StatusBadge stage={deal.stage} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
