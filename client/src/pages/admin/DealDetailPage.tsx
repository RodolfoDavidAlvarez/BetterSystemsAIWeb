import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileText,
  Upload,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Download,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Ticket,
  ExternalLink,
  Building2,
  Receipt,
  Users,
  Bell,
  Trash2,
  UserPlus,
  Edit2,
  Archive,
  MoreHorizontal,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

const STAGES = [
  { id: "lead", label: "Lead", color: "bg-amber-500" },
  { id: "prospect", label: "Prospect", color: "bg-blue-500" },
  { id: "proposal", label: "Proposal", color: "bg-indigo-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-purple-500" },
  { id: "active", label: "Active", color: "bg-emerald-500" },
  { id: "won", label: "Won", color: "bg-green-500" },
  { id: "lost", label: "Lost", color: "bg-red-500" },
];

const stageConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  lead: { color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-500/10", borderColor: "border-amber-200 dark:border-amber-500/20" },
  prospect: { color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-500/10", borderColor: "border-blue-200 dark:border-blue-500/20" },
  proposal: { color: "text-indigo-700 dark:text-indigo-400", bgColor: "bg-indigo-50 dark:bg-indigo-500/10", borderColor: "border-indigo-200 dark:border-indigo-500/20" },
  negotiation: { color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-500/10", borderColor: "border-purple-200 dark:border-purple-500/20" },
  active: { color: "text-emerald-700 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-500/10", borderColor: "border-emerald-200 dark:border-emerald-500/20" },
  won: { color: "text-green-700 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-500/10", borderColor: "border-green-200 dark:border-green-500/20" },
  lost: { color: "text-red-700 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-500/10", borderColor: "border-red-200 dark:border-red-500/20" },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function getAvatarColor(email: string) {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600",
    "from-violet-500 to-violet-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600",
  ];
  const index = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

type TabType = "overview" | "tickets" | "invoices" | "activity" | "documents";

export default function DealDetailPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const dealId = params.id ? parseInt(params.id) : null;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [newInteraction, setNewInteraction] = useState({ type: "note", subject: "", content: "" });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Queries
  const { data: dealData, isLoading } = useQuery<{ success: boolean; data: any }>({
    queryKey: [`/api/admin/deals/${dealId}`],
    enabled: !!dealId,
  });

  const { data: stakeholdersData } = useQuery<{ success: boolean; stakeholders: any[] }>({
    queryKey: [`/api/admin/deals/${dealId}/stakeholders`],
    enabled: !!dealId,
  });

  const { data: clientsData } = useQuery<{ success: boolean; clients: any[] }>({
    queryKey: ["/api/admin/clients"],
  });

  const { data: emailsData } = useQuery<{ success: boolean; emails: any[] }>({
    queryKey: [`/api/admin/deals/${dealId}/emails`],
    enabled: !!dealId,
  });

  const deal = dealData?.data;
  const stakeholders = stakeholdersData?.stakeholders || [];
  const clients = clientsData?.clients || [];
  const emails = emailsData?.emails || [];
  const billing = deal?.billing || { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0, unbilledWork: { ticketCount: 0, totalHours: 0, totalAmount: 0 } };
  const invoices = deal?.invoices || [];
  const tickets = deal?.tickets || [];
  const documents = deal?.documents || [];
  const interactions = deal?.interactions || [];

  // Mutations
  const updateStageMutation = useMutation({
    mutationFn: async ({ stage }: { stage: string }) => {
      const res = await fetch(`/api/admin/deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ stage }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      toast({ title: "Stage updated" });
    },
  });

  const addInteractionMutation = useMutation({
    mutationFn: async (data: { type: string; subject: string; content: string }) => {
      const res = await fetch(`/api/admin/deals/${dealId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      setInteractionDialogOpen(false);
      setNewInteraction({ type: "note", subject: "", content: "" });
      toast({ title: "Activity logged" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      setUploadDialogOpen(false);
      setUploadFile(null);
      toast({ title: "Document uploaded" });
    },
  });

  const addStakeholderMutation = useMutation({
    mutationFn: async (data: { clientId: number }) => {
      const res = await fetch(`/api/admin/deals/${dealId}/stakeholders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...data, receivesUpdates: true, receivesBilling: true }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}/stakeholders`] });
      setAddContactDialogOpen(false);
      setSelectedClientId(null);
      toast({ title: "Contact added" });
    },
  });

  const updateStakeholderMutation = useMutation({
    mutationFn: async ({ stakeholderId, ...data }: { stakeholderId: number; receivesUpdates?: boolean; receivesBilling?: boolean }) => {
      const res = await fetch(`/api/admin/stakeholders/${stakeholderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}/stakeholders`] });
    },
  });

  const removeStakeholderMutation = useMutation({
    mutationFn: async (stakeholderId: number) => {
      const res = await fetch(`/api/admin/stakeholders/${stakeholderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}/stakeholders`] });
      toast({ title: "Contact removed" });
    },
  });

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadFile || !dealId) return;
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("entityType", "deal");
    formData.append("entityId", dealId.toString());
    formData.append("category", "general");
    uploadMutation.mutate(formData);
  };

  if (isLoading || !deal) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stage = stageConfig[deal.stage] || stageConfig.lead;
  const ticketStats = {
    pending: tickets.filter((t: any) => t.status === "pending").length,
    inProgress: tickets.filter((t: any) => t.status === "in_progress").length,
    resolved: tickets.filter((t: any) => t.status === "resolved" && !t.billedAt).length,
    billed: tickets.filter((t: any) => t.billedAt).length,
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "tickets", label: "Tickets", count: tickets.length },
    { id: "invoices", label: "Invoices", count: invoices.length },
    { id: "activity", label: "Activity", count: interactions.length + emails.length },
    { id: "documents", label: "Documents", count: documents.length },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-background">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/deals")} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold tracking-tight">{deal.name}</h1>
                <span className={cn("px-2.5 py-1 text-[11px] font-medium rounded-md border", stage.bgColor, stage.borderColor, stage.color)}>
                  {deal.stage}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[13px] text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>{deal.clientName}</span>
                {deal.hourlyRate && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span>${deal.hourlyRate}/hr</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={deal.stage} onValueChange={(v) => updateStageMutation.mutate({ stage: v })}>
              <SelectTrigger className="w-32 h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/admin/deals/${dealId}/edit`)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Deal
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Archive className="h-4 w-4 mr-2" /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border/40 bg-muted/20">
          {[
            { label: "Total Paid", value: billing.totalPaid, color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle },
            { label: "Invoiced", value: billing.totalInvoiced, color: "text-blue-600 dark:text-blue-400", icon: Receipt },
            { label: "Outstanding", value: billing.totalOutstanding, color: "text-amber-600 dark:text-amber-400", icon: AlertCircle },
            { label: "Unbilled", value: billing.unbilledWork?.totalAmount || 0, color: "text-violet-600 dark:text-violet-400", icon: Clock },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-background border border-border/60 flex items-center justify-center">
                <item.icon className={cn("h-5 w-5", item.color)} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">{item.label}</p>
                <p className={cn("text-lg font-semibold", item.color)}>{formatCurrency(item.value)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-border/40 bg-background">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-[13px] font-medium rounded-md transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn("ml-1.5 text-[11px]", activeTab === tab.id ? "opacity-80" : "opacity-60")}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-2 gap-6">
                {/* Deal Details */}
                <Card className="border-border/60">
                  <CardContent className="p-5">
                    <h3 className="text-[13px] font-semibold tracking-tight mb-4">Deal Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Value</label>
                          <p className="text-[14px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                            {deal.value ? formatCurrency(parseFloat(deal.value)) : "—"}
                          </p>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Hourly Rate</label>
                          <p className="text-[14px] font-medium mt-1">${deal.hourlyRate || "65"}/hr</p>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Created</label>
                          <p className="text-[14px] mt-1 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                            {formatDate(deal.createdAt)}
                          </p>
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Priority</label>
                          <p className="text-[14px] mt-1 capitalize">{deal.priority || "Medium"}</p>
                        </div>
                      </div>
                      {(deal.description || deal.notes) && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <label className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium">Notes</label>
                            <p className="text-[13px] text-muted-foreground mt-2 whitespace-pre-wrap">{deal.description || deal.notes}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ticket Summary */}
                <Card className="border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[13px] font-semibold tracking-tight">Ticket Summary</h3>
                      <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={() => setActiveTab("tickets")}>
                        View All
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Pending", value: ticketStats.pending, color: "text-amber-600", bg: "bg-amber-500/10" },
                        { label: "In Progress", value: ticketStats.inProgress, color: "text-blue-600", bg: "bg-blue-500/10" },
                        { label: "Ready to Bill", value: ticketStats.resolved, color: "text-emerald-600", bg: "bg-emerald-500/10" },
                        { label: "Billed", value: ticketStats.billed, color: "text-purple-600", bg: "bg-purple-500/10" },
                      ].map((stat) => (
                        <div key={stat.label} className={cn("rounded-lg p-3 text-center", stat.bg)}>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    {billing.unbilledWork?.totalAmount > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-amber-700 dark:text-amber-400 font-medium">Unbilled Work</span>
                          <span className="text-[14px] font-semibold text-amber-700 dark:text-amber-400">
                            {formatCurrency(billing.unbilledWork.totalAmount)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {billing.unbilledWork.totalHours?.toFixed(1)}h across {billing.unbilledWork.ticketCount} tickets
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tickets Tab */}
            {activeTab === "tickets" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold tracking-tight">Support Tickets</h3>
                  <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => navigate("/admin/tickets")}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Manage Tickets
                  </Button>
                </div>
                {tickets.length > 0 ? (
                  <div className="space-y-2">
                    {tickets.map((ticket: any) => {
                      const hours = parseFloat(ticket.timeSpent || "0");
                      const rate = parseFloat(ticket.hourlyRate || deal.hourlyRate || "65");
                      const billable = hours * rate;
                      const isReadyToBill = ticket.status === "resolved" && !ticket.billedAt;

                      return (
                        <div
                          key={ticket.id}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                            isReadyToBill ? "bg-amber-500/5 border-amber-500/20" : "border-border/60 hover:bg-muted/30"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground font-mono">#{ticket.id}</span>
                              <span className="font-medium text-[14px]">{ticket.title}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={cn(
                                "px-2 py-0.5 text-[10px] font-medium rounded border",
                                ticket.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200",
                                ticket.status === "in_progress" && "bg-blue-50 text-blue-700 border-blue-200",
                                ticket.status === "resolved" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                ticket.status === "billed" && "bg-purple-50 text-purple-700 border-purple-200"
                              )}>
                                {ticket.status.replace("_", " ")}
                              </span>
                              {hours > 0 && (
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {hours}h
                                </span>
                              )}
                              <span className="text-[11px] text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            {hours > 0 && (
                              <p className={cn("text-[14px] font-semibold", isReadyToBill ? "text-amber-600" : "text-muted-foreground")}>
                                {formatCurrency(billable)}
                              </p>
                            )}
                            {isReadyToBill && (
                              <p className="text-[10px] text-amber-600 font-medium mt-0.5">Ready to bill</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border/60 rounded-lg">
                    <Ticket className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No support tickets</p>
                  </div>
                )}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === "invoices" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold tracking-tight">Invoice History</h3>
                  <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => navigate("/admin/billing")}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Go to Billing
                  </Button>
                </div>
                {invoices.length > 0 ? (
                  <div className="space-y-2">
                    {invoices.map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[14px]">{invoice.invoiceNumber || `INV-${invoice.id}`}</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">
                            {invoice.description || "Invoice"} · {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[14px]">{formatCurrency(parseFloat(invoice.total || "0"))}</p>
                          <span className={cn(
                            "text-[10px] font-medium",
                            invoice.status === "paid" && "text-emerald-600",
                            invoice.status === "open" && "text-amber-600",
                            invoice.status === "draft" && "text-muted-foreground"
                          )}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border/60 rounded-lg">
                    <Receipt className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No invoices</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold tracking-tight">Activity Timeline</h3>
                  <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => setInteractionDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Log Activity
                  </Button>
                </div>
                {interactions.length > 0 || emails.length > 0 ? (
                  <div className="space-y-3">
                    {interactions.map((item: any) => (
                      <div key={`int-${item.id}`} className="flex gap-3 p-4 rounded-lg border border-border/60">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-[14px]">{item.subject}</p>
                            <span className="text-[11px] text-muted-foreground">{formatDate(item.createdAt)}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.type}</span>
                          {item.content && <p className="text-[13px] text-muted-foreground mt-2">{item.content}</p>}
                        </div>
                      </div>
                    ))}
                    {emails.map((email: any) => (
                      <div key={`email-${email.id}`} className="flex gap-3 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                          {email.category === "inbound" ? (
                            <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-[14px]">{email.subject || "Email"}</p>
                            <span className="text-[11px] text-muted-foreground">{formatDate(email.sentAt || email.createdAt)}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            To: {Array.isArray(email.to) ? email.to.join(", ") : email.to}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border/60 rounded-lg">
                    <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No activity recorded</p>
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold tracking-tight">Documents</h3>
                  <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                  </Button>
                </div>
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors group">
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[14px]">{doc.title || doc.fileName}</p>
                          <p className="text-[12px] text-muted-foreground">{formatDate(doc.createdAt)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border/60 rounded-lg">
                    <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[13px] text-muted-foreground">No documents</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Sidebar - Contacts */}
      <div className="w-[340px] border-l border-border/60 bg-muted/20 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold tracking-tight">Contacts</h2>
            {stakeholders.length > 0 && (
              <span className="text-[11px] text-muted-foreground">{stakeholders.length}</span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAddContactDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {stakeholders.length > 0 ? (
              stakeholders.map((s: any) => (
                <div key={s.id} className="p-4 rounded-xl border border-border/60 bg-background">
                  <div className="flex items-start gap-3">
                    <div className={cn("h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[13px] font-medium shadow-sm", getAvatarColor(s.clientEmail))}>
                      {getInitials(s.clientName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[14px] truncate">{s.clientName}</p>
                        {s.isPrimary && (
                          <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-primary/10 text-primary">Primary</span>
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground truncate mt-0.5">{s.clientEmail}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-[12px]">
                        <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Updates</span>
                      </div>
                      <Switch
                        checked={s.receivesUpdates}
                        onCheckedChange={(checked) => updateStakeholderMutation.mutate({ stakeholderId: s.id, receivesUpdates: checked })}
                        className="scale-90"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-[12px]">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Billing</span>
                      </div>
                      <Switch
                        checked={s.receivesBilling}
                        onCheckedChange={(checked) => updateStakeholderMutation.mutate({ stakeholderId: s.id, receivesBilling: checked })}
                        className="scale-90"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/40">
                    <Button variant="ghost" size="sm" className="h-7 text-[11px] flex-1" asChild>
                      <a href={`mailto:${s.clientEmail}`}>
                        <Mail className="h-3 w-3 mr-1" /> Email
                      </a>
                    </Button>
                    {s.clientPhone && (
                      <Button variant="ghost" size="sm" className="h-7 text-[11px] flex-1" asChild>
                        <a href={`tel:${s.clientPhone}`}>
                          <Phone className="h-3 w-3 mr-1" /> Call
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeStakeholderMutation.mutate(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-[13px] text-muted-foreground">No contacts assigned</p>
                <Button variant="ghost" size="sm" className="mt-3 h-8 text-[12px]" onClick={() => setAddContactDialogOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add Contact
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Info Footer */}
        <div className="p-4 border-t border-border/60 bg-background space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">Client</span>
            <span className="font-medium">{deal.clientName}</span>
          </div>
          {deal.clientEmail && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Email</span>
              <a href={`mailto:${deal.clientEmail}`} className="font-medium text-primary hover:underline truncate max-w-[180px]">
                {deal.clientEmail}
              </a>
            </div>
          )}
          {deal.clientPhone && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{deal.clientPhone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[12px]">Type</Label>
              <Select value={newInteraction.type} onValueChange={(v) => setNewInteraction({ ...newInteraction, type: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px]">Subject</Label>
              <Input className="mt-1.5" value={newInteraction.subject} onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })} />
            </div>
            <div>
              <Label className="text-[12px]">Details</Label>
              <Textarea className="mt-1.5" rows={4} value={newInteraction.content} onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => newInteraction.subject && addInteractionMutation.mutate(newInteraction)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <form onSubmit={handleUpload}>
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-[12px]">File</Label>
                <Input type="file" className="mt-1.5" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!uploadFile}>Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addContactDialogOpen} onOpenChange={setAddContactDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contact to Deal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-[12px]">Select Contact</Label>
              <Select value={selectedClientId?.toString() || ""} onValueChange={(v) => setSelectedClientId(parseInt(v))}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a contact..." /></SelectTrigger>
                <SelectContent>
                  {clients
                    .filter((c: any) => !stakeholders.some((s: any) => s.clientId === c.id) && c.label !== "hidden" && c.label !== "spam")
                    .map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => selectedClientId && addStakeholderMutation.mutate({ clientId: selectedClientId })} disabled={!selectedClientId}>
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
