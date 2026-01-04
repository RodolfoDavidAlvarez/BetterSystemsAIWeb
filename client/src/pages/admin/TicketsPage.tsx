import { useEffect, useState } from "react";
import { useToast } from "../../hooks/use-toast";
import { usePersistedState } from "../../hooks/usePersistedState";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { getApiBaseUrl } from "../../lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Clock,
  CheckCircle,
  X,
  PlayCircle,
  ExternalLink,
  DollarSign,
  Briefcase,
  Search,
  Plus,
  Receipt,
  Trash2,
  Mail,
  Image,
  Download,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";

interface Ticket {
  id: number;
  clientId: number | null;
  dealId: number | null;
  applicationSource: string;
  externalTicketId: string | null;
  submitterEmail: string;
  submitterName: string | null;
  title: string;
  description: string;
  screenshotUrl: string | null;
  screenshotUrls: string[] | null;
  priority: string;
  labels: string[] | null;
  status: "pending" | "in_progress" | "resolved" | "billed";
  timeSpent: string;
  hourlyRate: string | null;
  billableAmount: string | null;
  readyToBill: boolean;
  invoiceId: number | null;
  billedAt: string | null;
  resolution: string | null;
  internalNotes: string | null;
  resolvedAt: string | null;
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
  client?: { name: string; email: string } | null;
  deal?: { name: string; hourlyRate: string } | null;
  effectiveHourlyRate: number;
  calculatedBillableAmount: number;
}

interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byApplicationSource: Record<string, number>;
  totalUnbilledAmount: number;
}

interface Deal {
  id: number;
  name: string;
  clientId: number;
}

export default function TicketsPage() {
  useScrollToTop();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = usePersistedState<string>("admin:tickets:status", "all");
  const [selectedAppSource, setSelectedAppSource] = usePersistedState<string>("admin:tickets:appSource", "all");
  const [selectedDeal, setSelectedDeal] = usePersistedState<string>("admin:tickets:deal", "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [editForm, setEditForm] = useState({
    timeSpent: "",
    hourlyRate: "",
    internalNotes: "",
    resolution: "",
    readyToBill: false,
  });

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    submitterEmail: "",
    submitterName: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    applicationSource: "direct",
    dealId: "",
  });

  const baseUrl = getApiBaseUrl();

  useEffect(() => {
    fetchTickets();
    fetchStats();
    fetchDeals();
  }, [selectedStatus, selectedAppSource, selectedDeal, searchQuery]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedAppSource !== "all") params.append("applicationSource", selectedAppSource);
      if (selectedDeal !== "all") params.append("dealId", selectedDeal);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`${baseUrl}/admin/tickets?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch tickets");

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin/tickets/stats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin/deals`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch deals");
      const data = await response.json();
      setDeals(data.deals || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
    }
  };

  const handleStatusUpdate = async (ticketId: number, newStatus: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${baseUrl}/admin/tickets/${ticketId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({ title: "Status updated" });
      fetchTickets();
      fetchStats();

      if (selectedTicket?.id === ticketId) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTicketUpdate = async () => {
    if (!selectedTicket) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${baseUrl}/admin/tickets/${selectedTicket.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          timeSpent: editForm.timeSpent || selectedTicket.timeSpent,
          hourlyRate: editForm.hourlyRate || null,
          internalNotes: editForm.internalNotes,
          resolution: editForm.resolution,
          readyToBill: editForm.readyToBill,
        }),
      });

      if (!response.ok) throw new Error("Failed to update ticket");

      const data = await response.json();
      toast({ title: "Ticket saved" });
      setSelectedTicket(data.ticket);
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({ title: "Error", description: "Failed to update ticket", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!createForm.title || !createForm.description || !createForm.submitterEmail) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${baseUrl}/admin/tickets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: createForm.title,
          description: createForm.description,
          submitterEmail: createForm.submitterEmail,
          submitterName: createForm.submitterName || null,
          priority: createForm.priority,
          applicationSource: createForm.applicationSource,
          dealId: createForm.dealId ? parseInt(createForm.dealId) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create ticket");

      toast({ title: "Ticket created" });
      setShowCreateDialog(false);
      setCreateForm({
        title: "",
        description: "",
        submitterEmail: "",
        submitterName: "",
        priority: "medium",
        applicationSource: "direct",
        dealId: "",
      });
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({ title: "Error", description: "Failed to create ticket", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTicket = async (ticketId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this ticket?")) return;

    try {
      const response = await fetch(`${baseUrl}/admin/tickets/${ticketId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to delete ticket");

      toast({ title: "Ticket deleted" });
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast({ title: "Error", description: "Failed to delete ticket", variant: "destructive" });
    }
  };

  const openTicketDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditForm({
      timeSpent: ticket.timeSpent || "0",
      hourlyRate: ticket.hourlyRate || "",
      internalNotes: ticket.internalNotes || "",
      resolution: ticket.resolution || "",
      readyToBill: ticket.readyToBill,
    });
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      billed: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    };
    return styles[status] || "bg-muted text-muted-foreground";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      pending: <Clock className="h-3.5 w-3.5" />,
      in_progress: <PlayCircle className="h-3.5 w-3.5" />,
      resolved: <CheckCircle className="h-3.5 w-3.5" />,
      billed: <Receipt className="h-3.5 w-3.5" />,
    };
    return icons[status] || <Clock className="h-3.5 w-3.5" />;
  };

  const getPriorityStyle = (priority: string) => {
    const styles: Record<string, string> = {
      urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
      high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    };
    return styles[priority] || "bg-muted text-muted-foreground";
  };

  const getAppLabel = (source: string) => {
    const labels: Record<string, string> = {
      "crm-lighting": "CRM",
      "agave-fleet": "Agave",
      direct: "Direct",
    };
    return labels[source] || source;
  };

  const getAppStyle = (source: string) => {
    const styles: Record<string, string> = {
      "crm-lighting": "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
      "agave-fleet": "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      direct: "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
    };
    return styles[source] || "bg-muted text-muted-foreground";
  };

  const getAvatarColor = (email: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-emerald-500 to-emerald-600',
      'from-violet-500 to-violet-600',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600',
      'from-cyan-500 to-cyan-600',
      'from-indigo-500 to-indigo-600',
      'from-pink-500 to-pink-600',
    ];
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const getStatusCount = (status: string) => {
    if (!stats) return 0;
    return status === "all" ? stats.total : stats.byStatus[status] || 0;
  };

  const exportToCSV = () => {
    if (tickets.length === 0) {
      toast({ title: "No tickets to export" });
      return;
    }

    const headers = [
      "ID",
      "Title",
      "Status",
      "Priority",
      "Source",
      "Submitter Name",
      "Submitter Email",
      "Deal",
      "Hours",
      "Rate",
      "Billable Amount",
      "Ready to Bill",
      "Created",
      "Description",
      "Resolution",
    ];

    const rows = tickets.map((ticket) => [
      ticket.id,
      `"${(ticket.title || "").replace(/"/g, '""')}"`,
      ticket.status,
      ticket.priority,
      getAppLabel(ticket.applicationSource),
      `"${(ticket.submitterName || "").replace(/"/g, '""')}"`,
      ticket.submitterEmail,
      ticket.deal?.name || "",
      ticket.timeSpent || "0",
      ticket.hourlyRate || ticket.effectiveHourlyRate,
      ticket.calculatedBillableAmount.toFixed(2),
      ticket.readyToBill ? "Yes" : "No",
      format(new Date(ticket.createdAt), "yyyy-MM-dd HH:mm"),
      `"${(ticket.description || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${(ticket.resolution || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tickets-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: `Exported ${tickets.length} tickets` });
  };

  if (isLoading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-5">
            <h1 className="text-xl font-semibold tracking-tight">Support Tickets</h1>
            <div className="flex items-center gap-2 text-[13px]">
              {stats?.byStatus?.pending ? (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                  <Clock className="h-3 w-3" />
                  {stats.byStatus.pending} pending
                </div>
              ) : null}
              <span className="text-muted-foreground">{stats?.total || 0} total</span>
              {(stats?.totalUnbilledAmount || 0) > 0 && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatCurrency(stats?.totalUnbilledAmount || 0)} unbilled
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportToCSV} variant="ghost" size="sm" className="h-8 text-[13px]" disabled={tickets.length === 0}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} size="sm" className="h-8 text-[13px] shadow-sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border/60 bg-muted/30">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-ring/50"
            />
          </div>
          <Select value={selectedAppSource} onValueChange={setSelectedAppSource}>
            <SelectTrigger className="w-[120px] h-9 border-border/60">
              <SelectValue placeholder="App" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Apps</SelectItem>
              <SelectItem value="crm-lighting">CRM</SelectItem>
              <SelectItem value="agave-fleet">Agave</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDeal} onValueChange={setSelectedDeal}>
            <SelectTrigger className="w-[140px] h-9 border-border/60">
              <SelectValue placeholder="Deal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deals</SelectItem>
              {deals.map((deal) => (
                <SelectItem key={deal.id} value={deal.id.toString()}>{deal.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center ml-auto">
            {["all", "pending", "in_progress", "resolved", "billed"].map((status, idx) => (
              <Button
                key={status}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 text-[13px] font-normal rounded-none border-b-2 border-transparent",
                  selectedStatus === status
                    ? "border-b-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  idx === 0 && "rounded-l-md",
                  idx === 4 && "rounded-r-md"
                )}
                onClick={() => setSelectedStatus(status)}
              >
                {status === "all" ? "All" : status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                <span className={cn(
                  "ml-1.5 text-[11px]",
                  selectedStatus === status ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                  {getStatusCount(status)}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_100px_100px_100px_100px_60px] gap-4 px-5 py-2.5 border-b border-border/40 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
          <div className="w-10"></div>
          <div>Ticket</div>
          <div>Priority</div>
          <div>Status</div>
          <div>Source</div>
          <div className="text-right">Amount</div>
          <div></div>
        </div>

        {/* Tickets List */}
        <ScrollArea className="flex-1">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Receipt className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">No tickets found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="grid grid-cols-[auto_1fr_100px_100px_100px_100px_60px] gap-4 px-5 py-3 cursor-pointer transition-all duration-150 items-center group hover:bg-muted/50"
                  onClick={() => openTicketDetail(ticket)}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-medium shadow-sm",
                    getAvatarColor(ticket.submitterEmail)
                  )}>
                    {getInitials(ticket.submitterName, ticket.submitterEmail)}
                  </div>

                  {/* Title & Description */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[14px] truncate">{ticket.title}</span>
                      {ticket.readyToBill && !ticket.invoiceId && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                          Ready
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground/70 mt-0.5">
                      <span className="truncate">{ticket.submitterName || ticket.submitterEmail}</span>
                      {ticket.deal && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 truncate">
                            <Briefcase className="h-3 w-3" />
                            {ticket.deal.name}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <span className={cn(
                      "text-[11px] px-2 py-1 rounded font-medium border",
                      getPriorityStyle(ticket.priority),
                      ticket.priority === "urgent" && "border-red-200 dark:border-red-800",
                      ticket.priority === "high" && "border-orange-200 dark:border-orange-800",
                      ticket.priority === "medium" && "border-amber-200 dark:border-amber-800",
                      ticket.priority === "low" && "border-slate-200 dark:border-slate-800"
                    )}>
                      {ticket.priority}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={cn(
                      "text-[11px] px-2 py-1 rounded font-medium flex items-center gap-1 w-fit",
                      getStatusStyle(ticket.status)
                    )}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Source */}
                  <div>
                    <span className={cn(
                      "text-[11px] px-2 py-1 rounded font-medium",
                      getAppStyle(ticket.applicationSource)
                    )}>
                      {getAppLabel(ticket.applicationSource)}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    {ticket.calculatedBillableAmount > 0 ? (
                      <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(ticket.calculatedBillableAmount)}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground/50">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteTicket(ticket.id, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-border/60 text-[12px] text-muted-foreground/70">
          {tickets.length} tickets
        </div>
      </div>

      {/* Ticket Detail Panel */}
      {selectedTicket && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedTicket(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l z-50 overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={getStatusStyle(selectedTicket.status)}>
                  {getStatusIcon(selectedTicket.status)}
                  <span className="ml-1">{selectedTicket.status.replace("_", " ")}</span>
                </Badge>
                <Badge variant="secondary" className={getPriorityStyle(selectedTicket.priority)}>
                  {selectedTicket.priority}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title & Meta */}
              <div>
                <h2 className="text-xl font-semibold mb-2">{selectedTicket.title}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{getAppLabel(selectedTicket.applicationSource)}</span>
                  <span>{format(new Date(selectedTicket.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </div>

              {/* Submitter */}
              <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border/40">
                <div className={cn(
                  "h-11 w-11 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0",
                  getAvatarColor(selectedTicket.submitterEmail)
                )}>
                  {getInitials(selectedTicket.submitterName, selectedTicket.submitterEmail)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[14px]">{selectedTicket.submitterName || "Unknown"}</p>
                  <a href={`mailto:${selectedTicket.submitterEmail}`} className="text-[13px] text-primary hover:underline flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    {selectedTicket.submitterEmail}
                  </a>
                  {selectedTicket.deal && (
                    <p className="text-[12px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" />
                      {selectedTicket.deal.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Screenshots */}
              {((selectedTicket.screenshotUrls && selectedTicket.screenshotUrls.length > 0) || selectedTicket.screenshotUrl) && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    Screenshots
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(selectedTicket.screenshotUrls || [selectedTicket.screenshotUrl].filter(Boolean)).map((url, i) => (
                      <a
                        key={i}
                        href={url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group rounded-lg overflow-hidden border"
                      >
                        <img src={url!} alt={`Screenshot ${i + 1}`} className="w-full h-24 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="h-4 w-4 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h4 className="text-sm font-medium mb-2">Status</h4>
                <div className="grid grid-cols-4 gap-2">
                  {["pending", "in_progress", "resolved", "billed"].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedTicket.status === status ? "default" : "outline"}
                      onClick={() => handleStatusUpdate(selectedTicket.id, status)}
                      disabled={isSaving}
                      className="text-xs capitalize"
                    >
                      {status.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time & Billing */}
              <div className="p-4 border rounded-lg bg-emerald-500/5 border-emerald-200 dark:border-emerald-800">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                  Time & Billing
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-xs">Hours</Label>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={editForm.timeSpent}
                      onChange={(e) => setEditForm({ ...editForm, timeSpent: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Rate (${selectedTicket.effectiveHourlyRate}/hr)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.hourlyRate}
                      onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                      placeholder={`${selectedTicket.effectiveHourlyRate}`}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-background rounded-md">
                  <span className="text-sm">Total</span>
                  <span className="text-lg font-semibold text-emerald-600">
                    {formatCurrency(
                      parseFloat(editForm.timeSpent || "0") *
                      (parseFloat(editForm.hourlyRate) || selectedTicket.effectiveHourlyRate)
                    )}
                  </span>
                </div>
                <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.readyToBill}
                    onChange={(e) => setEditForm({ ...editForm, readyToBill: e.target.checked })}
                    className="rounded"
                  />
                  Mark as ready to bill
                </label>
              </div>

              {/* Resolution */}
              <div>
                <Label className="text-sm">Resolution</Label>
                <Textarea
                  value={editForm.resolution}
                  onChange={(e) => setEditForm({ ...editForm, resolution: e.target.value })}
                  placeholder="How was this resolved?"
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <Label className="text-sm">Internal Notes</Label>
                <Textarea
                  value={editForm.internalNotes}
                  onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
                  placeholder="Private notes..."
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Save */}
              <Button onClick={handleTicketUpdate} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Create Ticket Panel */}
      {showCreateDialog && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCreateDialog(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l z-50 overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold">New Ticket</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Brief description"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Detailed description"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={createForm.submitterName}
                    onChange={(e) => setCreateForm({ ...createForm, submitterName: e.target.value })}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={createForm.submitterEmail}
                    onChange={(e) => setCreateForm({ ...createForm, submitterEmail: e.target.value })}
                    placeholder="user@example.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={createForm.priority}
                    onValueChange={(value: any) => setCreateForm({ ...createForm, priority: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select
                    value={createForm.applicationSource}
                    onValueChange={(value) => setCreateForm({ ...createForm, applicationSource: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="crm-lighting">CRM</SelectItem>
                      <SelectItem value="agave-fleet">Agave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Deal</Label>
                <Select
                  value={createForm.dealId}
                  onValueChange={(value) => setCreateForm({ ...createForm, dealId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {deals.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id.toString()}>{deal.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateTicket} disabled={isCreating} className="w-full mt-4">
                {isCreating ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
