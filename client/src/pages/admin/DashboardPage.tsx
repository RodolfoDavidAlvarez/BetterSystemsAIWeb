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
import { AlertCircle, CheckCircle2, XCircle, Clock, DollarSign, FileText, ExternalLink, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { getApiBaseUrl } from "../../lib/queryClient";

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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Fiex":
        return <Badge variant="destructive">Fiex</Badge>;
      case "Quick win":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Quick win</Badge>;
      case "Revenue":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Revenue</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "IN PROGRESS":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "NOT DONE":
        return <XCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Fetch tasks and billing data from API
  useEffect(() => {
    fetchClientTasks();
    fetchBillingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // If API returns error, show default tasks as fallback
        console.warn("API returned unsuccessful response, using default tasks");
        setTasksByClient(defaultTasksByClient);
      }
    } catch (error) {
      console.error("Error fetching client tasks:", error);
      // If fetch fails (e.g., table doesn't exist or server not restarted), show default tasks
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
    // If task doesn't have an ID (default task), don't try to save
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

      // Handle 503 (Service Unavailable) - table doesn't exist
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
        // Refresh tasks
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
        // Convert array to record keyed by client name
        const billingByClient: Record<string, ClientBillingInfo> = {};
        const historyByClient: Record<string, PaymentHistoryItem[]> = {};
        const workByClient: Record<string, OutstandingWorkItem[]> = {};

        data.data.clientGroups.forEach((group: ClientBillingInfo) => {
          billingByClient[group.clientName] = group;

          // For Desert Moon Lighting, add specific payment history and outstanding work
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
                estimatedAmount: 325, // ~5 hours @ $65/hr
                priority: "Quick win",
                status: "NOT DONE",
              },
              {
                id: "contract-values-fix",
                description: "Contract monetary values not matching",
                estimatedAmount: 195, // ~3 hours @ $65/hr
                priority: "Fiex",
                status: "NOT DONE",
              },
              {
                id: "quickbooks-integration",
                description: "Finalize QuickBooks integration & payment collection",
                estimatedAmount: 1300, // ~20 hours @ $65/hr
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
      // Silently fail - billing data is optional
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

  // Use API data if available, otherwise fall back to defaults
  const effectiveTasksByClient = Object.keys(tasksByClient).length > 0 ? tasksByClient : defaultTasksByClient;
  const clients = Object.keys(effectiveTasksByClient);
  const currentTasks = effectiveTasksByClient[activeClient] || [];
  const currentBilling = billingData[activeClient];

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* To-Do Section - Client Work */}
        <Card>
          <CardHeader>
            <CardTitle>To-Do</CardTitle>
            <CardDescription>Outstanding work that needs to be completed for each client</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeClient} onValueChange={setActiveClient}>
              <TabsList className="mb-4">
                {clients.map((client) => (
                  <TabsTrigger key={client} value={client}>
                    {client}
                  </TabsTrigger>
                ))}
              </TabsList>

              {clients.map((client) => {
                const clientTasks = effectiveTasksByClient[client] || [];
                return (
                  <TabsContent key={client} value={client}>
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading tasks...</p>
                      </div>
                    ) : clientTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No outstanding tasks for {client}</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientTasks.map((task, idx) => (
                            <TableRow key={task.id || `task-${client}-${idx}`}>
                              <TableCell className="font-medium">{task.task}</TableCell>
                              <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                              <TableCell className="text-right">
                                <Select
                                  value={task.status}
                                  onValueChange={(value) => updateTaskStatus(task.id, value as "NOT DONE" | "DONE" | "IN PROGRESS")}
                                  disabled={updatingTaskId === task.id}
                                >
                                  <SelectTrigger className="w-[140px] ml-auto">
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
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Billing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Billing</CardTitle>
            <CardDescription>Billing overview and quick actions for each client</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeClient} onValueChange={setActiveClient}>
              <TabsList className="mb-4">
                {clients.map((client) => (
                  <TabsTrigger key={client} value={client}>
                    {client}
                  </TabsTrigger>
                ))}
              </TabsList>

              {clients.map((client) => {
                const clientBilling = billingData[client];
                return (
                  <TabsContent key={client} value={client}>
                    {isLoadingBilling ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading billing data...</p>
                      </div>
                    ) : !clientBilling ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No billing data available for {client}</p>
                        <p className="text-sm mt-2">Sync Stripe data to see billing information</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Balance Owed</span>
                            </div>
                            <p className="text-2xl font-bold">{formatCurrency(clientBilling.balance)}</p>
                            {clientBilling.unbilledWork > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">+ {formatCurrency(clientBilling.unbilledWork)} unbilled</p>
                            )}
                          </div>

                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Last Invoice</span>
                            </div>
                            <p className="text-lg font-semibold">{formatDate(clientBilling.lastInvoiceDate)}</p>
                            {clientBilling.invoiceCount > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {clientBilling.invoiceCount} total invoice{clientBilling.invoiceCount !== 1 ? "s" : ""}
                              </p>
                            )}
                          </div>

                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Next Charge</span>
                            </div>
                            <p className="text-2xl font-bold">{formatCurrency(clientBilling.nextCharge)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Balance + Unbilled Work</p>
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 border rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Total Billed</p>
                            <p className="text-lg font-semibold mt-1">{formatCurrency(clientBilling.totalBilled)}</p>
                          </div>
                          <div className="p-3 border rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Total Paid</p>
                            <p className="text-lg font-semibold mt-1">{formatCurrency(clientBilling.totalPaid)}</p>
                          </div>
                          <div className="p-3 border rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Invoices</p>
                            <p className="text-lg font-semibold mt-1">{clientBilling.invoiceCount}</p>
                          </div>
                          <div className="p-3 border rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Subscriptions</p>
                            <p className="text-lg font-semibold mt-1">{clientBilling.subscriptionCount}</p>
                          </div>
                        </div>

                        {/* Payment History */}
                        {paymentHistory[client] && paymentHistory[client].length > 0 && (
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Recent Payments
                            </h4>
                            <div className="space-y-2">
                              {paymentHistory[client].map((payment, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                  <div>
                                    <p className="font-medium">{formatDate(payment.date)}</p>
                                    <p className="text-xs text-muted-foreground">{payment.description}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-emerald-600">{formatCurrency(payment.amount)}</p>
                                    <Badge variant="outline" className="text-xs">
                                      {payment.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Outstanding Work Items */}
                        {outstandingWork[client] && outstandingWork[client].length > 0 && (
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              Outstanding Work (Billable)
                            </h4>
                            <div className="space-y-2">
                              {outstandingWork[client].map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-medium text-sm">{item.description}</p>
                                      {getPriorityBadge(item.priority)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Est: {formatCurrency(item.estimatedAmount)}</p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
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
                              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold">Total Outstanding Work</p>
                                  <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
                                    {formatCurrency(outstandingWork[client].reduce((sum, item) => sum + item.estimatedAmount, 0))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                          <Button variant="default" size="sm" onClick={() => navigate(`/admin/billing?clientId=${clientBilling.clientId}`)}>
                            <FileText className="h-4 w-4 mr-2" />
                            View All Invoices
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/billing?clientId=${clientBilling.clientId}&action=create`)}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Create Invoice
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/clients?clientId=${clientBilling.clientId}`)}>
                            View Client Details
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                          {clientBilling.balance > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/billing?clientId=${clientBilling.clientId}&filter=unpaid`)}
                            >
                              View Outstanding
                              <ExternalLink className="h-3 w-3 ml-2" />
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
