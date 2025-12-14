import { useEffect, useState } from "react";
import { useToast } from "../../hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
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
  Bug,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  Filter,
  RefreshCw,
  ExternalLink,
  Calendar,
  DollarSign,
  Timer,
  Building2,
  Briefcase,
  Search,
  Plus,
  Receipt,
  Trash2,
  User,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

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
  // Joined data
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
  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    return localStorage.getItem("ticketsSelectedStatus") || "all";
  });
  const [selectedAppSource, setSelectedAppSource] = useState<string>("all");
  const [selectedDeal, setSelectedDeal] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state for editing ticket
  const [editForm, setEditForm] = useState({
    timeSpent: "",
    hourlyRate: "",
    internalNotes: "",
    resolution: "",
    readyToBill: false,
  });

  // Form state for creating new ticket
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

  // Remember last selected tab
  useEffect(() => {
    localStorage.setItem("ticketsSelectedStatus", selectedStatus);
  }, [selectedStatus]);

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

      toast({
        title: "Success",
        description: "Ticket status updated",
      });

      fetchTickets();
      fetchStats();

      if (selectedTicket?.id === ticketId) {
        const data = await response.json();
        setSelectedTicket(data.ticket);
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });

      setSelectedTicket(data.ticket);
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!createForm.title || !createForm.description || !createForm.submitterEmail) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: "Ticket created successfully",
      });

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
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTicket = async (ticketId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the detail view

    if (!confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/admin/tickets/${ticketId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to delete ticket");

      toast({
        title: "Success",
        description: "Ticket deleted successfully",
      });

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }

      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700";
      case "in_progress":
        return "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700";
      case "resolved":
        return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700";
      case "billed":
        return "bg-violet-100 text-violet-900 dark:bg-violet-900 dark:text-violet-100 border-violet-300 dark:border-violet-700";
      default:
        return "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3.5 w-3.5" />;
      case "in_progress":
        return <PlayCircle className="h-3.5 w-3.5" />;
      case "resolved":
        return <CheckCircle className="h-3.5 w-3.5" />;
      case "billed":
        return <Receipt className="h-3.5 w-3.5" />;
      default:
        return <Bug className="h-3.5 w-3.5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100 border-red-300 dark:border-red-700";
      case "high":
        return "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700";
      case "medium":
        return "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700";
      case "low":
        return "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700";
      default:
        return "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700";
    }
  };

  const getAppSourceColor = (source: string) => {
    switch (source) {
      case "crm-lighting":
        return "bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700";
      case "agave-fleet":
        return "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700";
      case "direct":
        return "bg-cyan-100 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-100 border-cyan-300 dark:border-cyan-700";
      default:
        return "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700";
    }
  };

  const getAppSourceLabel = (source: string) => {
    switch (source) {
      case "crm-lighting":
        return "CRM Lighting";
      case "agave-fleet":
        return "AgaveFleet";
      case "direct":
        return "Direct";
      default:
        return source;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusCount = (status: string) => {
    if (!stats) return 0;
    if (status === "all") return stats.total;
    return stats.byStatus[status] || 0;
  };

  if (isLoading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage support tickets from all applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
          <Button
            onClick={() => {
              fetchTickets();
              fetchStats();
            }}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus?.in_progress || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus?.resolved || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unbilled Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.totalUnbilledAmount || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Application Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedAppSource} onValueChange={setSelectedAppSource}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Application" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="crm-lighting">CRM Lighting</SelectItem>
              <SelectItem value="agave-fleet">AgaveFleet</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Deal Filter */}
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedDeal} onValueChange={setSelectedDeal}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Deal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deals</SelectItem>
              {deals.map((deal) => (
                <SelectItem key={deal.id} value={deal.id.toString()}>
                  {deal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Tabs with Notification Badges */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2 relative">
            <Bug className="h-4 w-4" />
            <span>All</span>
            {getStatusCount("all") > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {getStatusCount("all")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2 relative">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
            {getStatusCount("pending") > 0 && (
              <span className="ml-1 rounded-full bg-yellow-500 text-white px-2 py-0.5 text-xs font-medium">
                {getStatusCount("pending")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex items-center gap-2 relative">
            <PlayCircle className="h-4 w-4" />
            <span>In Progress</span>
            {getStatusCount("in_progress") > 0 && (
              <span className="ml-1 rounded-full bg-blue-500 text-white px-2 py-0.5 text-xs font-medium">
                {getStatusCount("in_progress")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2 relative">
            <CheckCircle className="h-4 w-4" />
            <span>Resolved</span>
            {getStatusCount("resolved") > 0 && (
              <span className="ml-1 rounded-full bg-green-500 text-white px-2 py-0.5 text-xs font-medium">
                {getStatusCount("resolved")}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="billed" className="flex items-center gap-2 relative">
            <Receipt className="h-4 w-4" />
            <span>Billed</span>
            {getStatusCount("billed") > 0 && (
              <span className="ml-1 rounded-full bg-purple-500 text-white px-2 py-0.5 text-xs font-medium">
                {getStatusCount("billed")}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          {/* Tickets List View */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
                    onClick={() => openTicketDetail(ticket)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Title, Description, Submitter */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                            {ticket.title}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Badge className={getAppSourceColor(ticket.applicationSource)} variant="outline">
                              {getAppSourceLabel(ticket.applicationSource)}
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                              {ticket.priority}
                            </Badge>
                            <Badge className={`${getStatusColor(ticket.status)} border`} variant="outline">
                              <span className="flex items-center gap-1">
                                {getStatusIcon(ticket.status)}
                                {ticket.status.replace("_", " ")}
                              </span>
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {ticket.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <strong className="text-foreground">Submitted by:</strong>
                            {ticket.submitterName || ticket.submitterEmail}
                          </span>
                          {ticket.deal && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {ticket.deal.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Time, Billing & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(ticket.createdAt), "h:mm a")}
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(ticket.calculatedBillableAmount)}
                          </div>
                          {ticket.readyToBill && !ticket.invoiceId && (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-900 border-green-300">
                              <Receipt className="h-3 w-3 mr-1" />
                              Ready to bill
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteTicket(ticket.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {tickets.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No tickets found</p>
                <p className="text-muted-foreground">
                  Tickets will appear here when submitted from your client applications
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Slide-Over */}
      {selectedTicket && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setSelectedTicket(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-background shadow-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge className={getAppSourceColor(selectedTicket.applicationSource)}>
                      {getAppSourceLabel(selectedTicket.applicationSource)}
                    </Badge>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                    <Badge className={`${getStatusColor(selectedTicket.status)} border`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(selectedTicket.status)}
                        {selectedTicket.status.replace("_", " ")}
                      </span>
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{selectedTicket.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(selectedTicket.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              {/* Submitter Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Submitted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{selectedTicket.submitterName || "Unknown"}</p>
                  <a
                    href={`mailto:${selectedTicket.submitterEmail}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedTicket.submitterEmail}
                  </a>
                  {selectedTicket.client && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Client: {selectedTicket.client.name}
                    </p>
                  )}
                  {selectedTicket.deal && (
                    <p className="text-sm text-muted-foreground">
                      Deal: {selectedTicket.deal.name}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{selectedTicket.description}</p>
                </CardContent>
              </Card>

              {/* Screenshot */}
              {selectedTicket.screenshotUrl && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Screenshot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={selectedTicket.screenshotUrl}
                      alt="Screenshot"
                      className="w-full rounded-lg border"
                    />
                    <a
                      href={selectedTicket.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in new tab
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Status Update */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {["pending", "in_progress", "resolved", "billed"].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedTicket.status === status ? "default" : "outline"}
                        onClick={() => handleStatusUpdate(selectedTicket.id, status)}
                        disabled={isSaving}
                        className="capitalize"
                      >
                        {getStatusIcon(status)}
                        <span className="ml-2">{status.replace("_", " ")}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Time Tracking & Billing */}
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Time & Billing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeSpent">Hours Worked</Label>
                      <Input
                        id="timeSpent"
                        type="number"
                        step="0.25"
                        min="0"
                        value={editForm.timeSpent}
                        onChange={(e) => setEditForm({ ...editForm, timeSpent: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hourlyRate">
                        Rate Override (Default: ${selectedTicket.effectiveHourlyRate})
                      </Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        step="1"
                        min="0"
                        value={editForm.hourlyRate}
                        onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                        placeholder={`${selectedTicket.effectiveHourlyRate}`}
                      />
                    </div>
                  </div>

                  {/* Calculated Amount */}
                  <div className="p-4 bg-background rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Calculated Amount:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          parseFloat(editForm.timeSpent || "0") *
                            (parseFloat(editForm.hourlyRate) || selectedTicket.effectiveHourlyRate)
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {editForm.timeSpent || "0"} hrs × $
                      {editForm.hourlyRate || selectedTicket.effectiveHourlyRate}/hr
                    </p>
                  </div>

                  {/* Ready to Bill Toggle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="readyToBill"
                      checked={editForm.readyToBill}
                      onChange={(e) => setEditForm({ ...editForm, readyToBill: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="readyToBill" className="cursor-pointer">
                      Mark as ready to bill
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Resolution Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editForm.resolution}
                    onChange={(e) => setEditForm({ ...editForm, resolution: e.target.value })}
                    placeholder="How was this ticket resolved?"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Internal Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editForm.internalNotes}
                    onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
                    placeholder="Add internal notes..."
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button onClick={handleTicketUpdate} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Create Ticket Dialog */}
      {showCreateDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowCreateDialog(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-background shadow-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Create New Ticket</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a new support ticket to the system
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateDialog(false)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              {/* Form */}
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      placeholder="Detailed description of the issue"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="submitterName">Submitter Name</Label>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="submitterName"
                          value={createForm.submitterName}
                          onChange={(e) => setCreateForm({ ...createForm, submitterName: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="submitterEmail">Submitter Email *</Label>
                      <Input
                        id="submitterEmail"
                        type="email"
                        value={createForm.submitterEmail}
                        onChange={(e) => setCreateForm({ ...createForm, submitterEmail: e.target.value })}
                        placeholder="user@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={createForm.priority}
                        onValueChange={(value: any) => setCreateForm({ ...createForm, priority: value })}
                      >
                        <SelectTrigger>
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
                      <Label htmlFor="applicationSource">Application Source</Label>
                      <Select
                        value={createForm.applicationSource}
                        onValueChange={(value) => setCreateForm({ ...createForm, applicationSource: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Direct</SelectItem>
                          <SelectItem value="crm-lighting">CRM Lighting</SelectItem>
                          <SelectItem value="agave-fleet">AgaveFleet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="deal">Deal (Optional)</Label>
                    <Select
                      value={createForm.dealId}
                      onValueChange={(value) => setCreateForm({ ...createForm, dealId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a deal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No deal</SelectItem>
                        {deals.map((deal) => (
                          <SelectItem key={deal.id} value={deal.id.toString()}>
                            {deal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Create Button */}
              <Button onClick={handleCreateTicket} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
