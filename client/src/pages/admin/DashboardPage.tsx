import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { useToast } from "../../hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { AlertCircle, CheckCircle2, XCircle, Clock, DollarSign, FileText, ExternalLink, Calendar, TrendingUp, AlertTriangle, Activity, Users, Zap } from "lucide-react";
import { getApiBaseUrl } from "../../lib/queryClient";
import ActivityTimeline from "../../components/admin/ActivityTimeline";

interface OutstandingTask {
  id?: number;
  task: string;
  status: "NOT DONE" | "DONE" | "IN PROGRESS";
  priority: "Fiex" | "Quick win" | "Revenue";
  clientName: string;
}

interface ClientBillingInfo {
  clientId: number;
  clientName: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  unbilledWork: number;
  nextCharge: number;
  invoiceCount: number;
  subscriptionCount: number;
  lastInvoiceDate: string | null;
}

interface OutstandingWorkItem {
  id: string;
  description: string;
  estimatedAmount: number;
  priority: "Fiex" | "Quick win" | "Revenue";
  status: "NOT DONE" | "IN PROGRESS" | "DONE";
}

interface PaymentHistoryItem {
  date: string;
  amount: number;
  description: string;
  status: string;
}

interface LatestClient {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string | null;
  source: string | null;
  createdAt: string;
}

interface OpsEvent {
  date: string;
  title: string;
  detail: string;
}

interface OpsStatus {
  latestEvents: OpsEvent[];
  waitingOn: string[];
  links?: { paymentPage?: string };
}

export default function DashboardPage() {
  useScrollToTop();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeClient, setActiveClient] = useState<string>("Desert Moon Lighting");
  const [tasksByClient, setTasksByClient] = useState<Record<string, OutstandingTask[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const isInitializing = useRef(false);
  const [billingData, setBillingData] = useState<Record<string, ClientBillingInfo>>({});
  const [isLoadingBilling, setIsLoadingBilling] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<Record<string, PaymentHistoryItem[]>>({});
  const [outstandingWork, setOutstandingWork] = useState<Record<string, OutstandingWorkItem[]>>({});
  const [latestClients, setLatestClients] = useState<LatestClient[]>([]);
  const [opsStatus, setOpsStatus] = useState<OpsStatus>({ latestEvents: [], waitingOn: [] });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Fiex":
        return <Badge className="bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/20">Fiex</Badge>;
      case "Quick win":
        return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">Quick win</Badge>;
      case "Revenue":
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">Revenue</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-700 text-slate-400">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "IN PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "NOT DONE":
        return <XCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  // Fetch tasks and billing data from API
  useEffect(() => {
    fetchClientTasks();
    fetchBillingData();
    fetchLatestClients();
    fetchOpsStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLatestClients = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/clients/latest?limit=8`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setLatestClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching latest clients:", error);
    }
  };

  const fetchOpsStatus = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/ops-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOpsStatus({
          latestEvents: data.latestEvents || [],
          waitingOn: data.waitingOn || [],
          links: data.links || {},
        });
      }
    } catch (error) {
      console.error("Error fetching ops status:", error);
    }
  };

  const fetchClientTasks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/client-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      // Handle 503 (Service Unavailable) - table doesn't exist
      if (response.status === 503) {
        console.warn("Database table not found, using default tasks");
        setTasksByClient(defaultTasksByClient);
        toast({
          title: "Database Migration Required",
          description: data.message || 'Please complete the database migration by running "npm run db:push"',
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setTasksByClient(data.tasksByClient || {});

        // Initialize with default tasks if database is empty AND not currently initializing
        if (Object.keys(data.tasksByClient || {}).length === 0 && !isInitializing.current) {
          await initializeDefaultTasks();
        }
      } else {
        console.warn("API returned unsuccessful response, using default tasks");
        setTasksByClient(defaultTasksByClient);
      }
    } catch (error) {
      console.error("Error fetching client tasks:", error);
      setTasksByClient(defaultTasksByClient);
      toast({
        title: "Warning",
        description: "Could not load tasks from database. Showing default tasks. Please restart the server and complete the database migration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultTasks = async () => {
    if (isInitializing.current) return;
    try {
      isInitializing.current = true;
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const defaultTasks = [
        { clientName: "Desert Moon Lighting", task: "SMS Notification for E-signature", priority: "Quick win", status: "NOT DONE" },
        { clientName: "Desert Moon Lighting", task: "Finalize payment collection system", priority: "Revenue", status: "NOT DONE" },
        {
          clientName: "Agave Fleet",
          task: "Make sure that the mechanics are able to properly submit the service",
          priority: "Fiex",
          status: "NOT DONE",
        },
      ];

      for (const task of defaultTasks) {
        await fetch(`${baseUrl}/admin/client-tasks`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(task),
        });
      }

      // Reload tasks
      await fetchClientTasks();
    } catch (error) {
      console.error("Error initializing default tasks:", error);
    } finally {
      isInitializing.current = false;
    }
  };

  const updateTaskStatus = async (taskId: number | undefined, newStatus: "NOT DONE" | "DONE" | "IN PROGRESS") => {
    if (!taskId) {
      toast({
        title: "Info",
        description: "Default tasks cannot be saved until the database migration is complete.",
        variant: "default",
      });
      return;
    }

    try {
      setUpdatingTaskId(taskId);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/client-tasks/${taskId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.status === 503) {
        toast({
          title: "Database Migration Required",
          description: data.message || 'Please complete the database migration by running "npm run db:push"',
          variant: "destructive",
        });
        return;
      }

      if (data.success) {
        toast({
          title: "Success",
          description: "Task status updated",
        });
        await fetchClientTasks();
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please ensure the database migration is complete.",
        variant: "destructive",
      });
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Default tasks as fallback if API fails
  const defaultTasksByClient: Record<string, OutstandingTask[]> = {
    "Desert Moon Lighting": [
      {
        task: "SMS Notification for E-signature",
        status: "NOT DONE",
        priority: "Quick win",
        clientName: "Desert Moon Lighting",
      },
      {
        task: "Finalize payment collection system",
        status: "NOT DONE",
        priority: "Revenue",
        clientName: "Desert Moon Lighting",
      },
    ],
    "Agave Fleet": [
      {
        task: "Make sure that the mechanics are able to properly submit the service",
        status: "NOT DONE",
        priority: "Fiex",
        clientName: "Agave Fleet",
      },
    ],
  };

  const fetchBillingData = async () => {
    try {
      setIsLoadingBilling(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/billing/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.clientGroups) {
        const billingByClient: Record<string, ClientBillingInfo> = {};
        const historyByClient: Record<string, PaymentHistoryItem[]> = {};
        const workByClient: Record<string, OutstandingWorkItem[]> = {};

        data.data.clientGroups.forEach((group: ClientBillingInfo) => {
          billingByClient[group.clientName] = group;

          if (group.clientName === "Desert Moon Lighting") {
            historyByClient[group.clientName] = [
              { date: "2025-11-24", amount: 2461.88, description: "Payment received - All development through Nov 10", status: "paid" },
              { date: "2025-08-16", amount: 2047.25, description: "Invoice QDANPTMD-0001", status: "paid" },
              { date: "2025-06-04", amount: 1787.5, description: "50% deposit", status: "paid" },
            ];

            workByClient[group.clientName] = [
              {
                id: "sms-notification",
                description: "SMS Notification for E-signature",
                estimatedAmount: 325,
                priority: "Quick win",
                status: "NOT DONE",
              },
              {
                id: "contract-values-fix",
                description: "Contract monetary values not matching",
                estimatedAmount: 195,
                priority: "Fiex",
                status: "NOT DONE",
              },
              {
                id: "quickbooks-integration",
                description: "Finalize QuickBooks integration & payment collection",
                estimatedAmount: 1300,
                priority: "Revenue",
                status: "NOT DONE",
              },
            ];
          }
        });

        setBillingData(billingByClient);
        setPaymentHistory(historyByClient);
        setOutstandingWork(workByClient);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch {
      return "Invalid date";
    }
  };

  const effectiveTasksByClient = Object.keys(tasksByClient).length > 0 ? tasksByClient : defaultTasksByClient;
  const clients = Object.keys(effectiveTasksByClient);
  const currentTasks = effectiveTasksByClient[activeClient] || [];
  const currentBilling = billingData[activeClient];

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="space-y-5">

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Revenue KPI */}
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-6 translate-x-6" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">
              {formatCurrency(Object.values(billingData).reduce((sum, b) => sum + b.totalPaid, 0))}
            </p>
            <p className="text-[11px] text-slate-600 mt-1">All time collected</p>
          </div>

          {/* Outstanding KPI */}
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-6 translate-x-6" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-amber-500/10">
                <FileText className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-amber-400 tabular-nums">
              {formatCurrency(Object.values(billingData).reduce((sum, b) => sum + b.balance, 0))}
            </p>
            <p className="text-[11px] text-slate-600 mt-1">Awaiting payment</p>
          </div>

          {/* Active Clients KPI */}
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -translate-y-6 translate-x-6" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-indigo-500/10">
                <Users className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Clients</span>
            </div>
            <p className="text-2xl font-bold text-indigo-400 tabular-nums">
              {Object.keys(billingData).length || latestClients.length}
            </p>
            <p className="text-[11px] text-slate-600 mt-1">Active engagements</p>
          </div>

          {/* Pending Tasks KPI */}
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-6 translate-x-6" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-purple-500/10">
                <Zap className="h-3.5 w-3.5 text-purple-400" />
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Open Tasks</span>
            </div>
            <p className="text-2xl font-bold text-purple-400 tabular-nums">
              {Object.values(effectiveTasksByClient).flat().filter(t => t.status !== "DONE").length}
            </p>
            <p className="text-[11px] text-slate-600 mt-1">Across all clients</p>
          </div>
        </div>

        {/* Main Grid: Status + Activity Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Current Status - Takes 2 cols */}
          <div className="lg:col-span-2">
            <Card className="border-slate-800 bg-slate-900/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-200">Current Status</CardTitle>
                <CardDescription className="text-slate-500">Recent events and blockers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent Events</h4>
                  {opsStatus.latestEvents.length === 0 ? (
                    <p className="text-sm text-slate-600">No events available.</p>
                  ) : (
                    <div className="space-y-2">
                      {opsStatus.latestEvents.map((event, idx) => (
                        <div key={`${event.date}-${idx}`} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 hover:border-slate-700 transition-colors">
                          <p className="text-[11px] text-slate-600 font-mono">{event.date}</p>
                          <p className="text-sm font-medium text-slate-200 mt-0.5">{event.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{event.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {opsStatus.waitingOn.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider mb-2">Waiting On</h4>
                    <div className="space-y-1.5">
                      {opsStatus.waitingOn.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500/60 mt-0.5 shrink-0" />
                          <span className="text-slate-400">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {opsStatus.links?.paymentPage && (
                  <a href={opsStatus.links.paymentPage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    <ExternalLink className="h-3 w-3" />
                    Open payment page
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-1">
            <Card className="border-slate-800 bg-slate-900/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  <CardTitle className="text-base text-slate-200">Activity</CardTitle>
                </div>
                <CardDescription className="text-slate-500">Recent CRM activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityTimeline limit={8} compact />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Latest Clients */}
        <Card className="border-slate-800 bg-slate-900/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-200">Latest Clients</CardTitle>
            <CardDescription className="text-slate-500">Most recent client records</CardDescription>
          </CardHeader>
          <CardContent>
            {latestClients.length === 0 ? (
              <p className="text-sm text-slate-600">No recent clients found.</p>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="min-w-[180px] text-slate-500 text-xs uppercase tracking-wider">Name</TableHead>
                      <TableHead className="text-slate-500 text-xs uppercase tracking-wider">Email</TableHead>
                      <TableHead className="whitespace-nowrap text-slate-500 text-xs uppercase tracking-wider">Phone</TableHead>
                      <TableHead className="whitespace-nowrap text-slate-500 text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="whitespace-nowrap text-slate-500 text-xs uppercase tracking-wider">Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latestClients.map((client) => (
                      <TableRow key={client.id} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <TableCell className="font-medium text-slate-200">{client.name || "—"}</TableCell>
                        <TableCell className="text-slate-400">{client.email || "—"}</TableCell>
                        <TableCell className="text-slate-400">{client.phone || "—"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            client.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                            client.status === "lead" ? "bg-blue-500/10 text-blue-400" :
                            "bg-slate-500/10 text-slate-400"
                          }`}>
                            {client.status || "lead"}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">{formatDate(client.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* To-Do Section - Client Work */}
        <Card className="border-slate-800 bg-slate-900/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-200">To-Do</CardTitle>
            <CardDescription className="text-slate-500">Outstanding work by client</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeClient} onValueChange={setActiveClient}>
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-4">
                <TabsList className="bg-slate-800/50 border border-slate-700/50 h-9">
                  {clients.map((client) => (
                    <TabsTrigger
                      key={client}
                      value={client}
                      className="whitespace-nowrap text-xs data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-300 data-[state=active]:shadow-none text-slate-400"
                    >
                      {client}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {clients.map((client) => {
                const clientTasks = effectiveTasksByClient[client] || [];
                return (
                  <TabsContent key={client} value={client}>
                    {isLoading ? (
                      <div className="text-center py-8 text-slate-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto mb-3"></div>
                        <p className="text-sm">Loading tasks...</p>
                      </div>
                    ) : clientTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-slate-700" />
                        <p className="text-sm text-slate-500">No outstanding tasks for {client}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-800 hover:bg-transparent">
                              <TableHead className="min-w-[200px] text-slate-500 text-xs uppercase tracking-wider">Task</TableHead>
                              <TableHead className="whitespace-nowrap text-slate-500 text-xs uppercase tracking-wider">Priority</TableHead>
                              <TableHead className="text-right whitespace-nowrap text-slate-500 text-xs uppercase tracking-wider">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {clientTasks.map((task, idx) => (
                              <TableRow key={task.id || `task-${client}-${idx}`} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                <TableCell className="font-medium text-slate-200">{task.task}</TableCell>
                                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                                <TableCell className="text-right">
                                  <Select
                                    value={task.status}
                                    onValueChange={(value) => updateTaskStatus(task.id, value as "NOT DONE" | "DONE" | "IN PROGRESS")}
                                    disabled={updatingTaskId === task.id}
                                  >
                                    <SelectTrigger className="w-[140px] ml-auto bg-slate-800/50 border-slate-700 text-sm">
                                      <div className="flex items-center gap-2">
                                        {getStatusIcon(task.status)}
                                        <SelectValue />
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NOT DONE">NOT DONE</SelectItem>
                                      <SelectItem value="IN PROGRESS">IN PROGRESS</SelectItem>
                                      <SelectItem value="DONE">DONE</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Billing Section */}
        <Card className="border-slate-800 bg-slate-900/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-200">Quick Billing</CardTitle>
            <CardDescription className="text-slate-500">Billing overview and quick actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeClient} onValueChange={setActiveClient}>
              <TabsList className="mb-4 bg-slate-800/50 border border-slate-700/50 h-9">
                {clients.map((client) => (
                  <TabsTrigger
                    key={client}
                    value={client}
                    className="text-xs data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-300 data-[state=active]:shadow-none text-slate-400"
                  >
                    {client}
                  </TabsTrigger>
                ))}
              </TabsList>

              {clients.map((client) => {
                const clientBilling = billingData[client];
                return (
                  <TabsContent key={client} value={client}>
                    {isLoadingBilling ? (
                      <div className="text-center py-8 text-slate-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto mb-3"></div>
                        <p className="text-sm">Loading billing data...</p>
                      </div>
                    ) : !clientBilling ? (
                      <div className="text-center py-8">
                        <DollarSign className="h-10 w-10 mx-auto mb-3 text-slate-700" />
                        <p className="text-sm text-slate-500">No billing data available for {client}</p>
                        <p className="text-xs text-slate-600 mt-1">Sync Stripe data to see billing information</p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-4 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="h-4 w-4 text-amber-400" />
                              <span className="text-xs text-slate-500 font-medium">Balance Owed</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-100 tabular-nums">{formatCurrency(clientBilling.balance)}</p>
                            {clientBilling.unbilledWork > 0 && (
                              <p className="text-[11px] text-slate-600 mt-1">+ {formatCurrency(clientBilling.unbilledWork)} unbilled</p>
                            )}
                          </div>

                          <div className="p-4 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              <span className="text-xs text-slate-500 font-medium">Last Invoice</span>
                            </div>
                            <p className="text-lg font-semibold text-slate-200">{formatDate(clientBilling.lastInvoiceDate)}</p>
                            {clientBilling.invoiceCount > 0 && (
                              <p className="text-[11px] text-slate-600 mt-1">
                                {clientBilling.invoiceCount} total invoice{clientBilling.invoiceCount !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>

                          <div className="p-4 rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-emerald-400" />
                              <span className="text-xs text-slate-500 font-medium">Next Charge</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-100 tabular-nums">{formatCurrency(clientBilling.nextCharge)}</p>
                            <p className="text-[11px] text-slate-600 mt-1">Balance + Unbilled Work</p>
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 rounded-lg border border-slate-800/50 bg-slate-800/20 text-center">
                            <p className="text-[11px] text-slate-600 uppercase tracking-wider">Total Billed</p>
                            <p className="text-base font-semibold text-slate-300 mt-1 tabular-nums">{formatCurrency(clientBilling.totalBilled)}</p>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-800/50 bg-slate-800/20 text-center">
                            <p className="text-[11px] text-slate-600 uppercase tracking-wider">Total Paid</p>
                            <p className="text-base font-semibold text-emerald-400 mt-1 tabular-nums">{formatCurrency(clientBilling.totalPaid)}</p>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-800/50 bg-slate-800/20 text-center">
                            <p className="text-[11px] text-slate-600 uppercase tracking-wider">Invoices</p>
                            <p className="text-base font-semibold text-slate-300 mt-1">{clientBilling.invoiceCount}</p>
                          </div>
                          <div className="p-3 rounded-lg border border-slate-800/50 bg-slate-800/20 text-center">
                            <p className="text-[11px] text-slate-600 uppercase tracking-wider">Subscriptions</p>
                            <p className="text-base font-semibold text-slate-300 mt-1">{clientBilling.subscriptionCount}</p>
                          </div>
                        </div>

                        {/* Payment History */}
                        {paymentHistory[client] && paymentHistory[client].length > 0 && (
                          <div className="pt-4 border-t border-slate-800">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <TrendingUp className="h-3.5 w-3.5" />
                              Recent Payments
                            </h4>
                            <div className="space-y-2">
                              {paymentHistory[client].map((payment, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800/50 hover:border-slate-700/50 transition-colors">
                                  <div>
                                    <p className="text-sm font-medium text-slate-300">{formatDate(payment.date)}</p>
                                    <p className="text-xs text-slate-600">{payment.description}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-emerald-400 tabular-nums">{formatCurrency(payment.amount)}</p>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400/80">
                                      {payment.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Outstanding Work Items */}
                        {outstandingWork[client] && outstandingWork[client].length > 0 && (
                          <div className="pt-4 border-t border-slate-800">
                            <h4 className="text-xs font-semibold text-amber-500/80 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Outstanding Work (Billable)
                            </h4>
                            <div className="space-y-2">
                              {outstandingWork[client].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/20 hover:border-slate-700 transition-colors">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium text-slate-200">{item.description}</p>
                                      {getPriorityBadge(item.priority)}
                                    </div>
                                    <p className="text-xs text-slate-600">Est: {formatCurrency(item.estimatedAmount)}</p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                                    onClick={() =>
                                      navigate(
                                        `/admin/billing?clientId=${clientBilling.clientId}&action=create&item=${encodeURIComponent(item.description)}&amount=${item.estimatedAmount}`
                                      )
                                    }
                                  >
                                    Invoice
                                  </Button>
                                </div>
                              ))}
                              <div className="mt-3 p-3 rounded-lg border border-amber-800/30 bg-amber-950/20">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold text-amber-400/80">Total Outstanding Work</p>
                                  <p className="text-base font-bold text-amber-400 tabular-nums">
                                    {formatCurrency(outstandingWork[client].reduce((sum, item) => sum + item.estimatedAmount, 0))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                            onClick={() => navigate(`/admin/billing?clientId=${clientBilling.clientId}`)}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                            View All Invoices
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            onClick={() => navigate(`/admin/billing?clientId=${clientBilling.clientId}&action=create`)}
                          >
                            <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                            Create Invoice
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            onClick={() => navigate(`/admin/clients?clientId=${clientBilling.clientId}`)}
                          >
                            View Client
                            <ExternalLink className="h-3 w-3 ml-1.5" />
                          </Button>
                          {clientBilling.balance > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-800/50 text-amber-400 hover:bg-amber-950/30"
                              onClick={() => navigate(`/admin/billing?clientId=${clientBilling.clientId}&filter=unpaid`)}
                            >
                              View Outstanding
                              <ExternalLink className="h-3 w-3 ml-1.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
