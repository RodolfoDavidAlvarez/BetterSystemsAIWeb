import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  TrendingUp,
  ExternalLink,
  Building,
  Receipt,
  Users,
  Bell,
  Trash2,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Archive,
  MoreHorizontal,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STAGES = [
  { id: "lead", label: "Lead" },
  { id: "prospect", label: "Prospect" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "active", label: "Active" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
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
  }).format(amount);
}

function StatusBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    lead: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
    prospect: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    proposal: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800",
    negotiation: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
    won: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",
    lost: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
  };
  return (
    <Badge variant="outline" className={`${colors[stage] || "bg-gray-50 text-gray-700"} capitalize font-medium`}>
      {stage}
    </Badge>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",
    open: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    draft: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    void: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
    uncollectible: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800",
  };
  return (
    <Badge variant="outline" className={`${colors[status] || "bg-gray-50 text-gray-700"} capitalize text-xs`}>
      {status}
    </Badge>
  );
}

function TicketStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    resolved: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",
    billed: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800",
  };
  return (
    <Badge variant="outline" className={`${colors[status] || "bg-gray-50 text-gray-700"} capitalize text-xs`}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function TicketPriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    medium: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    high: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800",
    urgent: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
  };
  return (
    <Badge variant="outline" className={`${colors[priority] || "bg-gray-50 text-gray-700"} capitalize text-xs`}>
      {priority}
    </Badge>
  );
}

// Section Header Component for collapsible sections
function SectionHeader({
  icon: Icon,
  title,
  count,
  isOpen,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}: {
  icon: any;
  title: string;
  count?: number;
  isOpen: boolean;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <span className="font-semibold text-sm">{title}</span>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold ml-auto mr-2">
          {count}
        </Badge>
      )}
      {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" /> : <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />}
    </div>
  );
}

export default function DealDetailPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const dealId = params.id ? parseInt(params.id) : null;

  // Section open states
  const [ticketsOpen, setTicketsOpen] = useState(true);
  const [invoicesOpen, setInvoicesOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);

  // Dialog states
  const [newInteraction, setNewInteraction] = useState({ type: "note", subject: "", content: "" });
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [addContactDialogOpen, setAddContactDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Fetch deal details
  const { data: dealData, isLoading: dealLoading } = useQuery<{ success: boolean; data: any }>({
    queryKey: [`/api/admin/deals/${dealId}`],
    enabled: !!dealId,
  });

  // Fetch stakeholders for this deal
  const { data: stakeholdersData } = useQuery<{ success: boolean; stakeholders: any[] }>({
    queryKey: [`/api/admin/deals/${dealId}/stakeholders`],
    enabled: !!dealId,
  });

  // Fetch all clients (for adding new stakeholders)
  const { data: clientsData } = useQuery<{ success: boolean; clients: any[] }>({
    queryKey: ["/api/admin/clients"],
  });

  // Fetch emails for this deal
  const { data: emailsData } = useQuery<{ success: boolean; emails: any[] }>({
    queryKey: [`/api/admin/deals/${dealId}/emails`],
    enabled: !!dealId,
  });

  const deal = dealData?.data;
  const stakeholders = stakeholdersData?.stakeholders || [];
  const clients = clientsData?.clients || [];
  const emails = emailsData?.emails || [];

  // Get billing data from deal response (already included in getDealById)
  const billing = deal?.billing || {
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    unbilledWork: { ticketCount: 0, totalHours: 0, totalAmount: 0 },
  };
  const invoices = deal?.invoices || [];
  const tickets = deal?.tickets || [];
  const documents = deal?.documents || [];
  const interactions = deal?.interactions || [];

  // Calculate ticket stats
  const ticketStats = {
    total: tickets.length,
    pending: tickets.filter((t: any) => t.status === "pending").length,
    inProgress: tickets.filter((t: any) => t.status === "in_progress").length,
    resolved: tickets.filter((t: any) => t.status === "resolved" && !t.billedAt).length,
    billed: tickets.filter((t: any) => t.status === "billed" || t.billedAt).length,
  };

  // Mutations
  const updateStageMutation = useMutation({
    mutationFn: async ({ stage }: { stage: string }) => {
      const res = await fetch(`/api/admin/deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      toast({ title: "Status updated" });
    },
  });

  const addInteractionMutation = useMutation({
    mutationFn: async (data: { type: string; subject: string; content: string }) => {
      const res = await fetch(`/api/admin/deals/${dealId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
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
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      setUploadDialogOpen(false);
      setUploadFile(null);
      toast({ title: "Document uploaded" });
    },
  });

  // Stakeholder mutations
  const addStakeholderMutation = useMutation({
    mutationFn: async (data: { clientId: number; role?: string; receivesUpdates?: boolean; receivesBilling?: boolean }) => {
      const res = await fetch(`/api/admin/deals/${dealId}/stakeholders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}/stakeholders`] });
      setAddContactDialogOpen(false);
      setSelectedClientId(null);
      toast({ title: "Contact added to deal" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add contact", description: error.message, variant: "destructive" });
    },
  });

  const updateStakeholderMutation = useMutation({
    mutationFn: async ({ stakeholderId, ...data }: { stakeholderId: number; receivesUpdates?: boolean; receivesBilling?: boolean; role?: string }) => {
      const res = await fetch(`/api/admin/stakeholders/${stakeholderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}/stakeholders`] });
      toast({ title: "Contact updated" });
    },
  });

  const removeStakeholderMutation = useMutation({
    mutationFn: async (stakeholderId: number) => {
      const res = await fetch(`/api/admin/stakeholders/${stakeholderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}/stakeholders`] });
      toast({ title: "Contact removed from deal" });
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
    const titleInput = e.currentTarget.elements.namedItem("title") as HTMLInputElement;
    if (titleInput?.value) formData.append("title", titleInput.value);
    uploadMutation.mutate(formData);
  };

  if (dealLoading || !deal) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Sticky Header */}
        <div className="bg-background border-b sticky top-0 z-20">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin/deals")} className="shrink-0 h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-semibold truncate">{deal.name}</h1>
                  <StatusBadge stage={deal.stage} />
                </div>
                <p className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5">
                  <Building className="h-3 w-3" />
                  {deal.clientName}
                  {deal.hourlyRate && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <DollarSign className="h-3 w-3" />
                      ${deal.hourlyRate}/hr
                    </>
                  )}
                </p>
              </div>

              {/* Stage Selector */}
              <Select value={deal.stage} onValueChange={(v) => updateStageMutation.mutate({ stage: v })}>
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/admin/deals/${dealId}/edit`)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Deal
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Deal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1">{formatCurrency(billing.totalPaid || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Invoiced</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-500 mt-1">{formatCurrency(billing.totalInvoiced || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outstanding</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-1">{formatCurrency(billing.totalOutstanding || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unbilled Work</p>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-500 mt-1">{formatCurrency(billing.unbilledWork?.totalAmount || 0)}</p>
                    {billing.unbilledWork?.totalHours > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {billing.unbilledWork.totalHours.toFixed(1)}h • {billing.unbilledWork.ticketCount} ticket{billing.unbilledWork.ticketCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-violet-600 dark:text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-6">
            {/* Left Column - Main Content Sections */}
            <div className="space-y-4">
              {/* Support Tickets Section */}
              <Collapsible open={ticketsOpen} onOpenChange={setTicketsOpen}>
                <Card className="shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
                      <SectionHeader
                        icon={Ticket}
                        title="Support Tickets"
                        count={tickets.length}
                        isOpen={ticketsOpen}
                        iconBg="bg-purple-100 dark:bg-purple-900/50"
                        iconColor="text-purple-600 dark:text-purple-400"
                      />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-4 pb-4">
                      {/* Ticket Stats Summary */}
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="bg-background rounded-lg p-3 text-center border-2 border-yellow-200 dark:border-yellow-800">
                          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{ticketStats.pending}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">Pending</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center border-2 border-blue-200 dark:border-blue-800">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{ticketStats.inProgress}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">In Progress</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center border-2 border-green-200 dark:border-green-800">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-500">{ticketStats.resolved}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">Ready to Bill</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center border-2 border-violet-200 dark:border-violet-800">
                          <p className="text-2xl font-bold text-violet-600 dark:text-violet-500">{ticketStats.billed}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">Billed</p>
                        </div>
                      </div>

                      {/* Tickets List */}
                      {tickets.length > 0 ? (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {tickets.map((ticket: any) => {
                            const hours = parseFloat(ticket.timeSpent || '0');
                            const rate = parseFloat(ticket.hourlyRate || deal.hourlyRate || '65');
                            const billable = hours * rate;
                            const isReadyToBill = (ticket.status === 'resolved' || ticket.readyToBill) && !ticket.billedAt;

                            return (
                              <div
                                key={ticket.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                  isReadyToBill
                                    ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
                                    : 'hover:bg-muted/50'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-muted-foreground font-mono">#{ticket.id}</span>
                                    <p className="font-medium text-sm truncate">{ticket.title}</p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <TicketStatusBadge status={ticket.status} />
                                    {ticket.priority && <TicketPriorityBadge priority={ticket.priority} />}
                                    {hours > 0 && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {hours}h
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(ticket.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  {hours > 0 && (
                                    <p className={`text-sm font-semibold ${isReadyToBill ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                      {formatCurrency(billable)}
                                    </p>
                                  )}
                                  {isReadyToBill && (
                                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 text-[10px] mt-1">
                                      Ready to bill
                                    </Badge>
                                  )}
                                  {ticket.billedAt && (
                                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 text-[10px] mt-1">
                                      Billed
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Ticket className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No support tickets</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end mt-4 pt-3 border-t">
                        <Button size="sm" variant="outline" onClick={() => navigate("/admin/tickets")}>
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          Manage Tickets
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Invoice History Section */}
              <Collapsible open={invoicesOpen} onOpenChange={setInvoicesOpen}>
                <Card className="shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
                      <SectionHeader
                        icon={Receipt}
                        title="Invoice History"
                        count={invoices.length}
                        isOpen={invoicesOpen}
                        iconBg="bg-blue-100 dark:bg-blue-900/50"
                        iconColor="text-blue-600 dark:text-blue-400"
                      />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-4 pb-4">
                      {invoices.length > 0 ? (
                        <div className="space-y-2">
                          {invoices.map((invoice: any) => {
                            const total = parseFloat(invoice.total || '0');
                            const amountPaid = parseFloat(invoice.amountPaid || '0');

                            return (
                              <div key={invoice.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                                <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                  <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">{invoice.invoiceNumber || `INV-${invoice.id}`}</p>
                                    <InvoiceStatusBadge status={invoice.status} />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {invoice.description || 'Invoice'}
                                    {invoice.dueDate && ` • Due ${formatDate(invoice.dueDate)}`}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-semibold text-sm">{formatCurrency(total)}</p>
                                  {invoice.status === 'paid' && invoice.paidAt && (
                                    <p className="text-[10px] text-green-600 dark:text-green-400">
                                      Paid {formatDate(invoice.paidAt)}
                                    </p>
                                  )}
                                  {invoice.status === 'open' && (
                                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                      {formatCurrency(parseFloat(invoice.amountDue || '0'))} due
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No invoices</p>
                        </div>
                      )}

                      <div className="flex justify-end mt-4 pt-3 border-t">
                        <Button size="sm" variant="outline" onClick={() => navigate("/admin/billing")}>
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          Go to Billing
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Activity Timeline Section */}
              <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
                <Card className="shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
                      <SectionHeader
                        icon={Clock}
                        title="Activity Timeline"
                        count={interactions.length + emails.length}
                        isOpen={activityOpen}
                        iconBg="bg-gray-100 dark:bg-gray-800"
                        iconColor="text-gray-600 dark:text-gray-400"
                      />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-4 pb-4">
                      {/* Log Activity Button */}
                      <div className="flex justify-end mb-4">
                        <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="h-4 w-4 mr-1.5" />
                              Log Activity
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label>Type</Label>
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
                                <Label>Subject</Label>
                                <Input className="mt-1.5" value={newInteraction.subject} onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })} />
                              </div>
                              <div>
                                <Label>Details</Label>
                                <Textarea className="mt-1.5" rows={4} value={newInteraction.content} onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => { if (newInteraction.subject) addInteractionMutation.mutate(newInteraction); }}>
                                Save
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Merged Timeline */}
                      {interactions.length > 0 || emails.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {/* Manual interactions */}
                          {interactions.map((interaction: any) => (
                            <div key={`int-${interaction.id}`} className="relative pl-5 pb-3 border-l-2 border-muted ml-2">
                              <div className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                              <div className="bg-muted/30 rounded-lg p-3 ml-3">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div>
                                    <p className="font-medium text-sm">{interaction.subject}</p>
                                    <Badge variant="secondary" className="text-[10px] mt-1 capitalize">{interaction.type}</Badge>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(interaction.createdAt)}</span>
                                </div>
                                {interaction.content && <p className="text-xs text-muted-foreground mt-2">{interaction.content}</p>}
                              </div>
                            </div>
                          ))}

                          {/* Email logs */}
                          {emails.map((email: any) => (
                            <div key={`email-${email.id}`} className="relative pl-5 pb-3 border-l-2 border-muted ml-2">
                              <div className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                              <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-3 ml-3 border border-blue-100 dark:border-blue-900/50">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div>
                                    <p className="font-medium text-sm">{email.subject || 'Email'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                                        <Mail className="h-2.5 w-2.5 mr-1" />
                                        Email
                                      </Badge>
                                      {email.status && (
                                        <Badge variant="outline" className="text-[10px] capitalize">
                                          {email.status}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {email.sentAt ? formatDate(email.sentAt) : formatDate(email.createdAt)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  To: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No activity recorded</p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Documents Section */}
              <Collapsible open={documentsOpen} onOpenChange={setDocumentsOpen}>
                <Card className="shadow-sm">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
                      <SectionHeader
                        icon={FileText}
                        title="Documents"
                        count={documents.length}
                        isOpen={documentsOpen}
                        iconBg="bg-indigo-100 dark:bg-indigo-900/50"
                        iconColor="text-indigo-600 dark:text-indigo-400"
                      />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="flex justify-end mb-4">
                        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Upload className="h-4 w-4 mr-1.5" />
                              Upload
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                            <form onSubmit={handleUpload}>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label>File</Label>
                                  <Input type="file" className="mt-1.5" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} required />
                                </div>
                                <div>
                                  <Label>Title (optional)</Label>
                                  <Input name="title" className="mt-1.5" />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit" disabled={!uploadFile}>Upload</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {documents.length > 0 ? (
                        <div className="space-y-2">
                          {documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors group">
                              <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{doc.title || doc.fileName}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No documents</p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>

            {/* Right Column - Contacts & Quick Info (Always Visible) */}
            <div className="space-y-4">
              {/* Contacts/Stakeholders Panel */}
              <Card className="shadow-sm sticky top-[73px]">
                <CardHeader className="py-3 px-4 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      Contacts
                      {stakeholders.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
                          {stakeholders.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <Dialog open={addContactDialogOpen} onOpenChange={setAddContactDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Contact to Deal</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Select Contact</Label>
                            <Select value={selectedClientId?.toString() || ""} onValueChange={(v) => setSelectedClientId(parseInt(v))}>
                              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a contact..." /></SelectTrigger>
                              <SelectContent>
                                {clients
                                  .filter((c: any) => !stakeholders.some((s: any) => s.clientId === c.id))
                                  .map((client: any) => (
                                    <SelectItem key={client.id} value={client.id.toString()}>
                                      {client.name} {client.company && `- ${client.company}`}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              if (selectedClientId) addStakeholderMutation.mutate({ clientId: selectedClientId, receivesUpdates: true, receivesBilling: true });
                            }}
                            disabled={!selectedClientId}
                          >
                            Add Contact
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  {stakeholders.length > 0 ? (
                    <div className="space-y-3">
                      {stakeholders.map((stakeholder: any) => (
                        <div key={stakeholder.id} className="p-3 rounded-lg border hover:border-primary/30 transition-colors">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm truncate">{stakeholder.clientName}</p>
                                {stakeholder.isPrimary && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">Primary</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{stakeholder.clientEmail}</p>
                              {stakeholder.role && stakeholder.role !== 'stakeholder' && (
                                <p className="text-xs text-muted-foreground/70 capitalize mt-1">{stakeholder.role}</p>
                              )}
                            </div>
                          </div>

                          {/* Notification Toggles */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <Switch
                                      id={`updates-${stakeholder.id}`}
                                      checked={stakeholder.receivesUpdates}
                                      onCheckedChange={(checked) => {
                                        updateStakeholderMutation.mutate({
                                          stakeholderId: stakeholder.id,
                                          receivesUpdates: checked
                                        });
                                      }}
                                      className="data-[state=checked]:bg-blue-600"
                                    />
                                    <span className="text-xs text-muted-foreground group-hover:text-foreground flex items-center gap-1.5">
                                      <Bell className="h-3 w-3" />
                                      Updates
                                    </span>
                                  </label>
                                </TooltipTrigger>
                                <TooltipContent>Receives feature updates & improvements</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <label className="flex items-center gap-2 cursor-pointer group">
                                    <Switch
                                      id={`billing-${stakeholder.id}`}
                                      checked={stakeholder.receivesBilling}
                                      onCheckedChange={(checked) => {
                                        updateStakeholderMutation.mutate({
                                          stakeholderId: stakeholder.id,
                                          receivesBilling: checked
                                        });
                                      }}
                                      className="data-[state=checked]:bg-green-600"
                                    />
                                    <span className="text-xs text-muted-foreground group-hover:text-foreground flex items-center gap-1.5">
                                      <DollarSign className="h-3 w-3" />
                                      Billing
                                    </span>
                                  </label>
                                </TooltipTrigger>
                                <TooltipContent>Receives invoices & billing notifications</TooltipContent>
                              </Tooltip>
                            </div>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeStakeholderMutation.mutate(stakeholder.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove contact</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
                        <Users className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">No contacts assigned</p>
                      <Button size="sm" variant="ghost" className="mt-2" onClick={() => setAddContactDialogOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-1.5" />
                        Add Contact
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deal Quick Info */}
              <Card className="shadow-sm">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <TrendingUp className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                    </div>
                    Deal Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deal Value</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {deal.value ? formatCurrency(parseFloat(deal.value)) : '—'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hourly Rate</span>
                    <span className="font-medium">${deal.hourlyRate || '65'}/hr</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Started</span>
                    <span className="font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(deal.createdAt)}
                    </span>
                  </div>
                  {deal.clientPhone && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {deal.clientPhone}
                        </span>
                      </div>
                    </>
                  )}
                  {deal.clientEmail && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Email</span>
                        <a href={`mailto:${deal.clientEmail}`} className="font-medium text-primary hover:underline flex items-center gap-1.5 truncate max-w-[180px]">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{deal.clientEmail}</span>
                        </a>
                      </div>
                    </>
                  )}

                  {/* Notes Section */}
                  {(deal.description || deal.notes) && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {deal.description || deal.notes}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
