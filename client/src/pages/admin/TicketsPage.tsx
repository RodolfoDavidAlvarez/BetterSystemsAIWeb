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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAppSource, setSelectedAppSource] = useState<string>("all");
  const [selectedDeal, setSelectedDeal] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing ticket
  const [editForm, setEditForm] = useState({
    timeSpent: "",
    hourlyRate: "",
    internalNotes: "",
    resolution: "",
    readyToBill: false,
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
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "resolved":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
      case "billed":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30";
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
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "high":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "low":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getAppSourceColor = (source: string) => {
    switch (source) {
      case "crm-lighting":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400";
      case "agave-fleet":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "direct":
        return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
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
          {/* Tickets Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50"
                onClick={() => openTicketDetail(ticket)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={getAppSourceColor(ticket.applicationSource)}>
                      {getAppSourceLabel(ticket.applicationSource)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={`${getStatusColor(ticket.status)} border`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace("_", " ")}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base line-clamp-2">{ticket.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {ticket.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    {/* Client/Deal Info */}
                    {ticket.deal && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        <span className="truncate">{ticket.deal.name}</span>
                      </div>
                    )}
                    {ticket.client && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{ticket.client.name}</span>
                      </div>
                    )}

                    {/* Time & Billing */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        <span>{parseFloat(ticket.timeSpent || "0")}hrs</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium text-green-600">
                        <DollarSign className="h-3 w-3" />
                        <span>{formatCurrency(ticket.calculatedBillableAmount)}</span>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Ready to Bill indicator */}
                  {ticket.readyToBill && !ticket.invoiceId && (
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-green-600">
                      <Receipt className="h-3 w-3" />
                      Ready to bill
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

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
    </div>
  );
}
