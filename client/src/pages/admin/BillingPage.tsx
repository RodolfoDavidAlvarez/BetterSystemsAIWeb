import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { usePersistedState } from "../../hooks/usePersistedState";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { getApiBaseUrl } from "../../lib/queryClient";
import {
  RefreshCw,
  DollarSign,
  FileText,
  CreditCard,
  Users,
  Plus,
  ExternalLink,
  Download,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Archive,
  Filter,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import ClientPreview from "../../components/admin/ClientPreview";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BillingDashboardData {
  invoices: any[];
  paymentIntents: any[];
  subscriptions: any[];
  quotes: any[];
  paymentLinks: any[];
  clientGroups: {
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
  }[];
  summary: {
    totalRevenue: number;
    totalOutstanding: number;
    totalDraft: number;
    totalInvoices: number;
    totalSubscriptions: number;
    totalClients: number;
  };
}

interface Client {
  id: number;
  name: string;
  email: string;
}

interface BillableTicket {
  id: number;
  title: string;
  description: string;
  timeSpent: string;
  hourlyRate: string | null;
  billableAmount: string | null;
  dealId: number | null;
  dealName?: string;
  applicationSource: string;
  status: string;
  resolvedAt: string | null;
}

type BillingItemType = "invoice" | "subscription" | "paymentLink";

type ArchivedItemsState = {
  invoices: Set<string>;
  subscriptions: Set<string>;
  paymentLinks: Set<string>;
};

const ARCHIVE_STORAGE_KEY = "billingArchivedItems";

const loadArchivedFromStorage = (): ArchivedItemsState => {
  if (typeof window === "undefined") {
    return { invoices: new Set(), subscriptions: new Set(), paymentLinks: new Set() };
  }

  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!raw) return { invoices: new Set(), subscriptions: new Set(), paymentLinks: new Set() };

    const parsed = JSON.parse(raw);
    return {
      invoices: new Set(parsed.invoices || []),
      subscriptions: new Set(parsed.subscriptions || []),
      paymentLinks: new Set(parsed.paymentLinks || []),
    };
  } catch {
    return { invoices: new Set(), subscriptions: new Set(), paymentLinks: new Set() };
  }
};

const persistArchivedToStorage = (state: ArchivedItemsState) => {
  if (typeof window === "undefined") return;
  const serialized = {
    invoices: Array.from(state.invoices),
    subscriptions: Array.from(state.subscriptions),
    paymentLinks: Array.from(state.paymentLinks),
  };
  try {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.warn("Could not persist archived billing items", error);
  }
};

export default function BillingPage() {
  useScrollToTop();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dashboardData, setDashboardData] = useState<BillingDashboardData | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<Array<{month: string; revenue: number}>>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [filterClientId, setFilterClientId] = useState<string>("");
  const [filterDealId, setFilterDealId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "client" | "deal">("all");
  const [archivedItems, setArchivedItems] = useState<ArchivedItemsState>(() => loadArchivedFromStorage());

  // Quick filters - persisted to localStorage
  const [paymentStatusFilter, setPaymentStatusFilter] = usePersistedState<"all" | "paid" | "unpaid" | "draft">("admin:billing:paymentStatus", "all");
  const [typeFilter, setTypeFilter] = usePersistedState<"all" | "invoice" | "subscription" | "paymentLink">("admin:billing:type", "all");
  const [timeFilter, setTimeFilter] = usePersistedState<"all" | "thisYear" | "thisMonth" | "lastMonth" | "lastYear" | "custom">("admin:billing:time", "all");
  const [yearFilter, setYearFilter] = usePersistedState<string>("admin:billing:year", "all");
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

  // Client preview
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [showClientPreview, setShowClientPreview] = useState(false);

  // Filter expansion states
  const [expandedFilters, setExpandedFilters] = useState<{
    quickFilters: boolean;
    advancedFilters: boolean;
  }>({
    quickFilters: false,
    advancedFilters: false,
  });

  // Active tab state - synced with typeFilter and persisted
  const [activeTab, setActiveTab] = usePersistedState<string>("admin:billing:tab", "all");

  const updateArchivedItems = (updater: (prev: ArchivedItemsState) => ArchivedItemsState) => {
    setArchivedItems((prev) => {
      const next = updater(prev);
      persistArchivedToStorage(next);
      return next;
    });
  };

  // Prevent duplicate API calls from React StrictMode
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  // Track if tab change is triggering typeFilter update (to prevent loops)
  const isTabChangingRef = useRef(false);

  // Sync tab with typeFilter when typeFilter changes manually (not from tab click)
  useEffect(() => {
    // Skip sync if tab change triggered this (to avoid loops)
    if (isTabChangingRef.current) {
      isTabChangingRef.current = false;
      return;
    }

    const tabMap: Record<string, string> = {
      all: "all",
      invoice: "invoices",
      subscription: "subscriptions",
      paymentLink: "paymentLinks",
      quote: "quotes",
      other: "other",
    };
    const expectedTab = tabMap[typeFilter] || "all";
    if (activeTab !== expectedTab) {
      setActiveTab(expectedTab);
    }
  }, [typeFilter, activeTab]);

  // Dialog states

  // Dialog states
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [showCreatePaymentLinkDialog, setShowCreatePaymentLinkDialog] = useState(false);

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: "",
    dealId: "",
    description: "",
    lineItems: [{ description: "", amount: "", quantity: "1", tax: "" }],
    dueDate: "",
    sendImmediately: false,
    notes: "",
    taxRate: "",
  });

  // Payment link form state
  const [paymentLinkForm, setPaymentLinkForm] = useState({
    clientId: "",
    amount: "",
    description: "",
  });

  // Billable tickets state for invoice creation
  const [billableTickets, setBillableTickets] = useState<BillableTicket[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    // Prevent duplicate calls from React StrictMode double-invocation
    if (hasLoadedRef.current || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    hasLoadedRef.current = true;

    loadDashboard();
    loadClients();
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/deals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load deals");

      const data = await response.json();
      setDeals(data.deals || []);
    } catch (error: any) {
      console.error("Error loading deals:", error);
    }
  };

  // Load billable tickets for a specific client/deal
  const loadBillableTickets = async (clientId?: string, dealId?: string) => {
    if (!clientId) {
      setBillableTickets([]);
      setSelectedTicketIds([]);
      return;
    }

    try {
      setLoadingTickets(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const params = new URLSearchParams();
      params.append("clientId", clientId);
      if (dealId) params.append("dealId", dealId);

      const response = await fetch(`${baseUrl}/admin/tickets/billable?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load billable tickets");

      const data = await response.json();
      setBillableTickets(data.tickets || []);
      setSelectedTicketIds([]); // Reset selection when tickets change
    } catch (error: any) {
      console.error("Error loading billable tickets:", error);
      setBillableTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Toggle ticket selection
  const toggleTicketSelection = (ticketId: number) => {
    setSelectedTicketIds((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
  };

  // Add selected tickets as line items
  const addTicketsAsLineItems = () => {
    const selectedTickets = billableTickets.filter((t) => selectedTicketIds.includes(t.id));

    if (selectedTickets.length === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket to add",
        variant: "destructive",
      });
      return;
    }

    const newLineItems = selectedTickets.map((ticket) => {
      const hours = parseFloat(ticket.timeSpent) || 0;
      const rate = parseFloat(ticket.hourlyRate || "65"); // Default $65/hr
      return {
        description: `[Ticket #${ticket.id}] ${ticket.title}`,
        amount: rate.toString(),
        quantity: hours.toString(),
        tax: "",
      };
    });

    // Add to existing line items (filter out empty ones first)
    const existingItems = invoiceForm.lineItems.filter(
      (item) => item.description || item.amount
    );
    setInvoiceForm({
      ...invoiceForm,
      lineItems: [...existingItems, ...newLineItems].length > 0
        ? [...existingItems, ...newLineItems]
        : [{ description: "", amount: "", quantity: "1", tax: "" }],
    });

    toast({
      title: "Tickets Added",
      description: `Added ${selectedTickets.length} ticket(s) as line items`,
    });
  };

  // Mark tickets as billed after invoice creation
  const markTicketsAsBilled = async (ticketIds: number[]) => {
    if (ticketIds.length === 0) return;

    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      await fetch(`${baseUrl}/admin/tickets/mark-billed`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticketIds }),
      });
    } catch (error: any) {
      console.error("Error marking tickets as billed:", error);
    }
  };

  const loadDashboard = async () => {
    try {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "BillingPage.tsx:110",
          message: "loadDashboard entry",
          data: { hasToken: !!(localStorage.getItem("authToken") || localStorage.getItem("token")) },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "B",
        }),
      }).catch(() => {});
      // #endregion
      setIsLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/billing/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "BillingPage.tsx:118",
          message: "After fetch response",
          data: { status: response.status, statusText: response.statusText, ok: response.ok },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "B",
        }),
      }).catch(() => {});
      // #endregion

      if (!response.ok) {
        throw new Error(`Failed to load billing dashboard: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "BillingPage.tsx:124",
          message: "Before setDashboardData",
          data: {
            success: data.success,
            hasData: !!data.data,
            invoicesCount: data.data?.invoices?.length || 0,
            clientGroupsCount: data.data?.clientGroups?.length || 0,
          },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "C",
        }),
      }).catch(() => {});
      // #endregion

      if (!data.success || !data.data) {
        throw new Error("Invalid response from billing dashboard");
      }

      // Ensure data structure is safe
      const dashData = {
        invoices: data.data.invoices || [],
        paymentIntents: data.data.paymentIntents || [],
        subscriptions: data.data.subscriptions || [],
        quotes: data.data.quotes || [],
        paymentLinks: data.data.paymentLinks || [],
        clientGroups: data.data.clientGroups || [],
        summary: data.data.summary || {
          totalRevenue: 0,
          totalOutstanding: 0,
          totalDraft: 0,
          totalInvoices: 0,
          totalSubscriptions: 0,
          totalClients: 0,
        },
      };
      setDashboardData(dashData);
      calculateMonthlyRevenue(dashData);
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "BillingPage.tsx:146",
          message: "After setDashboardData success",
          data: { invoicesCount: data.data.invoices?.length || 0 },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "C",
        }),
      }).catch(() => {});
      // #endregion
    } catch (error: any) {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "BillingPage.tsx:147",
          message: "loadDashboard error",
          data: { errorMessage: error?.message, errorType: error?.constructor?.name },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "D",
        }),
      }).catch(() => {});
      // #endregion
      console.error("Error loading billing dashboard:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load billing dashboard",
        variant: "destructive",
      });
      // Set empty data structure to prevent crashes
      setDashboardData({
        invoices: [],
        paymentIntents: [],
        subscriptions: [],
        quotes: [],
        paymentLinks: [],
        clientGroups: [],
        summary: {
          totalRevenue: 0,
          totalOutstanding: 0,
          totalDraft: 0,
          totalInvoices: 0,
          totalSubscriptions: 0,
          totalClients: 0,
        },
      });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Function for manual refresh (called by button)
  const loadFreshStripeData = async () => {
    try {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "BillingPage.tsx:177",
          message: "loadFreshStripeData entry",
          data: { clientsLength: clients.length, isLoading: isLoadingRef.current },
          timestamp: Date.now(),
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "E",
        }),
      }).catch(() => {});
      // #endregion

      // Don't load if we don't have clients yet
      if (clients.length === 0) {
        return;
      }

      // Prevent concurrent calls
      if (isLoadingRef.current) {
        // #region agent log
        fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "BillingPage.tsx:195",
            message: "loadFreshStripeData - skipping concurrent call",
            data: { timestamp: Date.now() },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "E",
          }),
        }).catch(() => {});
        // #endregion
        return;
      }

      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/billing/fresh`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        // Silently fail - we'll still show database data
        return;
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        return;
      }

      // Match Stripe customers with database clients by email
      const clientMap = new Map<string, number>();
      for (const client of clients) {
        if (client.email) {
          clientMap.set(client.email.toLowerCase(), client.id);
        }
      }

      // Merge fresh Stripe data with existing dashboard data
      setDashboardData((prevData: any) => {
        try {
          // #region agent log
          fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "BillingPage.tsx:211",
              message: "loadFreshStripeData setState callback entry",
              data: {
                hasPrevData: !!prevData,
                prevInvoicesCount: prevData?.invoices?.length || 0,
                freshInvoicesCount: data.data?.invoices?.length || 0,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "E",
            }),
          }).catch(() => {});
          // #endregion
          if (!prevData) {
            // If no previous data, return fresh data structure
            const invoices = (data.data.invoices || []).map((inv: any) => {
              const matchingCustomer = data.data.customers?.find((c: any) => c.id === inv.customer);
              const email = matchingCustomer?.email;
              const clientId = email ? clientMap.get(email.toLowerCase()) : null;

              return {
                ...inv,
                clientId: clientId || null,
                invoiceNumber: inv.invoiceNumber || inv.id,
                total: typeof inv.total === "number" ? inv.total : parseFloat(inv.total || 0),
                amountDue: typeof inv.amountDue === "number" ? inv.amountDue : parseFloat(inv.amountDue || 0),
                amountPaid: typeof inv.amountPaid === "number" ? inv.amountPaid : parseFloat(inv.amountPaid || 0),
              };
            });

            return {
              invoices: invoices,
              subscriptions: data.data.subscriptions || [],
              paymentIntents: [],
              quotes: [],
              paymentLinks: [],
              clientGroups: [],
              summary: data.data.summary || {
                totalRevenue: 0,
                totalOutstanding: 0,
                totalDraft: 0,
                totalInvoices: 0,
                totalSubscriptions: 0,
              },
            };
          }

          const freshInvoices = (data.data.invoices || []).map((inv: any) => {
            const matchingCustomer = data.data.customers?.find((c: any) => c.id === inv.customer);
            const email = matchingCustomer?.email;
            const clientId = email ? clientMap.get(email.toLowerCase()) : null;

            return {
              ...inv,
              clientId: clientId || null,
              invoiceNumber: inv.invoiceNumber || inv.id,
              total: typeof inv.total === "number" ? inv.total : parseFloat(inv.total || 0),
              amountDue: typeof inv.amountDue === "number" ? inv.amountDue : parseFloat(inv.amountDue || 0),
              amountPaid: typeof inv.amountPaid === "number" ? inv.amountPaid : parseFloat(inv.amountPaid || 0),
            };
          });

          const freshSubscriptions = (data.data.subscriptions || []).map((sub: any) => {
            const matchingCustomer = data.data.customers?.find((c: any) => c.id === sub.customer);
            const email = matchingCustomer?.email;
            const clientId = email ? clientMap.get(email.toLowerCase()) : null;
            return {
              ...sub,
              clientId: clientId || null,
            };
          });

          // Merge: combine database invoices with Stripe invoices, avoiding duplicates
          const existingInvoiceIds = new Set((prevData.invoices || []).map((inv: any) => inv.stripeInvoiceId || inv.id));
          const newInvoices = freshInvoices.filter((inv: any) => !existingInvoiceIds.has(inv.id));

          return {
            ...prevData,
            invoices: [...(prevData.invoices || []), ...newInvoices],
            subscriptions: freshSubscriptions.length > 0 ? freshSubscriptions : prevData.subscriptions || [],
            summary: {
              ...prevData.summary,
              // Update summary with fresh totals if they're higher (more complete)
              totalRevenue: Math.max(prevData.summary?.totalRevenue || 0, data.data.summary?.totalRevenue || 0),
              totalOutstanding: Math.max(prevData.summary?.totalOutstanding || 0, data.data.summary?.totalOutstanding || 0),
              totalDraft: Math.max(prevData.summary?.totalDraft || 0, data.data.summary?.totalDraft || 0),
            },
          };
        } catch (mergeError: any) {
          console.error("Error merging fresh Stripe data:", mergeError);
          // Return previous data on error to prevent crashes
          return prevData;
        }
      });
    } catch (error: any) {
      // Silently fail - we'll still show database data
      console.error("Could not load fresh Stripe data:", error);
      throw error; // Re-throw so the useEffect can catch it
    }
  };

  const loadClients = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load clients");

      const data = await response.json();
      setClients(data.clients || []);
    } catch (error: any) {
      console.error("Error loading clients:", error);
    }
  };

  const calculateMonthlyRevenue = (data: BillingDashboardData | null) => {
    if (!data) return;

    // Calculate revenue for past 5 months from invoices
    const monthsData: Record<string, number> = {};
    const now = new Date();

    // Initialize last 5 months with 0
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthsData[monthKey] = 0;
    }

    // Sum up paid invoices by month
    data.invoices?.forEach((invoice: any) => {
      if (invoice.status === 'paid' && invoice.paidAt) {
        const paidDate = new Date(invoice.paidAt);
        const monthKey = paidDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (monthKey in monthsData) {
          monthsData[monthKey] += parseFloat(invoice.total || 0);
        }
      }
    });

    // Convert to array format for chart
    const revenueData = Object.entries(monthsData).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100
    }));

    setMonthlyRevenue(revenueData);
  };

  const syncAllStripeData = async () => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      toast({
        title: "Syncing...",
        description: "Downloading all data from Stripe. This may take a moment.",
      });

      const response = await fetch(`${baseUrl}/admin/billing/sync/all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to sync Stripe data");

      const data = await response.json();

      toast({
        title: "Sync Complete",
        description: `Synced ${(data.results.customers.stripeCustomersCreated || 0) + (data.results.customers.stripeCustomersUpdated || 0)} Stripe customers, ${(data.results.customers.crmClientsCreated || 0) + (data.results.customers.crmClientsUpdated || 0)} CRM clients, ${data.results.invoices.created + data.results.invoices.updated} invoices. ${data.note || ""}`,
      });

      // Reload dashboard
      await loadDashboard();
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchFreshStripeData = async () => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      toast({
        title: "Fetching...",
        description: "Getting latest data directly from Stripe.",
      });

      const response = await fetch(`${baseUrl}/admin/billing/fresh`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch fresh Stripe data");

      const data = await response.json();

      // Update dashboard with fresh data (note: this is view-only, not synced to DB)
      if (data.success && data.data) {
        // Match Stripe customer IDs with our database customers
        const customerMap = new Map();
        for (const client of clients) {
          // We'll need to match by email for now since fresh data has customer objects
          if (client.email) {
            customerMap.set(client.email.toLowerCase(), client.id);
          }
        }

        // Merge fresh data with existing dashboard data
        setDashboardData(
          (prevData) =>
            ({
              ...prevData,
              invoices: data.data.invoices.map((inv: any) => {
                // Try to find matching client by customer email from Stripe customers list
                const matchingCustomer = data.data.customers?.find((c: any) => c.id === inv.customer);
                const clientId = matchingCustomer?.email ? customerMap.get(matchingCustomer.email.toLowerCase()) : null;

                return {
                  ...inv,
                  clientId: clientId,
                  customer: matchingCustomer?.name || matchingCustomer?.email || inv.customer,
                };
              }),
              subscriptions: data.data.subscriptions.map((sub: any) => {
                const matchingCustomer = data.data.customers?.find((c: any) => c.id === sub.customer);
                const clientId = matchingCustomer?.email ? customerMap.get(matchingCustomer.email.toLowerCase()) : null;
                return {
                  ...sub,
                  clientId: clientId,
                };
              }),
              summary: data.data.summary,
            }) as any
        );

        toast({
          title: "Data Refreshed",
          description: `Found ${data.data.invoices.length} invoices, ${data.data.subscriptions.length} subscriptions from Stripe`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Fetch Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const createInvoice = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      // Validate form
      if (!invoiceForm.clientId || !invoiceForm.description) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Validate line items
      const validLineItems = invoiceForm.lineItems
        .filter((item) => item.description && item.amount)
        .map((item) => ({
          description: item.description,
          amount: parseFloat(item.amount),
          quantity: parseInt(item.quantity) || 1,
          tax: item.tax ? parseFloat(item.tax) : undefined,
          taxRateId: invoiceForm.taxRate || undefined,
        }));

      if (validLineItems.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one line item",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${baseUrl}/admin/billing/invoices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: parseInt(invoiceForm.clientId),
          dealId: invoiceForm.dealId ? parseInt(invoiceForm.dealId) : undefined,
          description: invoiceForm.description,
          lineItems: validLineItems,
          dueDate: invoiceForm.dueDate || undefined,
          sendImmediately: invoiceForm.sendImmediately,
          notes: invoiceForm.notes || undefined,
          taxRate: invoiceForm.taxRate || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to create invoice");

      await response.json();

      // Extract ticket IDs from line items that were added from tickets
      const ticketIdsFromLineItems = validLineItems
        .map((item) => {
          const match = item.description.match(/\[Ticket #(\d+)\]/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((id): id is number => id !== null);

      // Mark those tickets as billed
      if (ticketIdsFromLineItems.length > 0) {
        await markTicketsAsBilled(ticketIdsFromLineItems);
      }

      toast({
        title: "Invoice Created",
        description: invoiceForm.sendImmediately
          ? `Invoice sent to client successfully${ticketIdsFromLineItems.length > 0 ? ` (${ticketIdsFromLineItems.length} ticket(s) marked as billed)` : ""}`
          : `Invoice created successfully${ticketIdsFromLineItems.length > 0 ? ` (${ticketIdsFromLineItems.length} ticket(s) marked as billed)` : ""}`,
      });

      setShowCreateInvoiceDialog(false);
      setInvoiceForm({
        clientId: "",
        dealId: "",
        description: "",
        lineItems: [{ description: "", amount: "", quantity: "1", tax: "" }],
        dueDate: "",
        sendImmediately: false,
        notes: "",
        taxRate: "",
      });
      // Reset billable tickets state
      setBillableTickets([]);
      setSelectedTicketIds([]);

      await loadDashboard();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createPaymentLink = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();

      if (!paymentLinkForm.clientId || !paymentLinkForm.amount || !paymentLinkForm.description) {
        toast({
          title: "Validation Error",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${baseUrl}/admin/billing/payment-links`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: parseInt(paymentLinkForm.clientId),
          amount: parseFloat(paymentLinkForm.amount),
          description: paymentLinkForm.description,
        }),
      });

      if (!response.ok) throw new Error("Failed to create payment link");

      await response.json();

      toast({
        title: "Payment Link Created",
        description: "Payment link has been generated successfully",
      });

      setShowCreatePaymentLinkDialog(false);
      setPaymentLinkForm({
        clientId: "",
        amount: "",
        description: "",
      });

      await loadDashboard();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addLineItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      lineItems: [...invoiceForm.lineItems, { description: "", amount: "", quantity: "1", tax: "" }],
    });
  };

  const removeLineItem = (index: number) => {
    setInvoiceForm({
      ...invoiceForm,
      lineItems: invoiceForm.lineItems.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const newLineItems = [...invoiceForm.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, lineItems: newLineItems });
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string | Date | null) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInvoiceKey = (invoice: any) => (invoice?.stripeInvoiceId || invoice?.id || invoice?.invoiceNumber)?.toString();
  const getSubscriptionKey = (subscription: any) => (subscription?.stripeSubscriptionId || subscription?.id)?.toString();
  const getPaymentLinkKey = (link: any) => (link?.stripePaymentLinkId || link?.id)?.toString();

  const isArchived = (type: BillingItemType, id?: string | null) => {
    if (!id) return false;
    if (type === "invoice") return archivedItems.invoices.has(id);
    if (type === "subscription") return archivedItems.subscriptions.has(id);
    if (type === "paymentLink") return archivedItems.paymentLinks.has(id);
    return false;
  };

  const compactHeaderClass = "py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
  const compactCellClass = "py-2 align-middle text-sm";

  // Helper to get client info (name, email) from invoice data
  const getClientInfo = (invoice: any) => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/eeaabba8-d84f-4ac1-9027-563534dec8de", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "BillingPage.tsx:816",
        message: "getClientInfo called",
        data: {
          invoiceId: invoice.id,
          hasClientId: !!invoice.clientId,
          hasCustomerName: !!invoice.customerName,
          hasCustomerEmail: !!invoice.customerEmail,
          hasCustomer: !!invoice.customer,
          clientsArrayLength: clients.length,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "F",
      }),
    }).catch(() => {});
    // #endregion

    // First try to find in clients array by clientId
    if (invoice.clientId) {
      const client = clients.find((c: any) => c.id === invoice.clientId);
      if (client) {
        return {
          id: client.id,
          name: client.name,
          email: client.email,
        };
      }
    }

    // If we have customerName/customerEmail from server (from Stripe customer data)
    // This is the most reliable source after clientId
    if (invoice.customerName || invoice.customerEmail) {
      return {
        id: invoice.clientId || null,
        name: invoice.customerName || invoice.customerEmail || "Unknown",
        email: invoice.customerEmail || null,
      };
    }

    // Last resort: check stripeData for customer info
    if (invoice.stripeData?.customer) {
      const customerData = invoice.stripeData.customer;
      if (typeof customerData === "object" && customerData !== null) {
        return {
          id: null,
          name: customerData.name || customerData.email || "Unknown",
          email: customerData.email || null,
        };
      }
      if (typeof customerData === "string") {
        // It's a Stripe customer ID string, try to find matching client
        // This would require additional lookup, but for now return what we can
      }
    }

    // Final fallback
    return {
      id: null,
      name: "Unknown",
      email: null,
    };
  };

  // Helper function to check if item is paid
  const isPaid = (item: any, type: "invoice" | "subscription" | "paymentLink"): boolean => {
    if (type === "invoice") {
      return item.status === "paid" || parseFloat(item.amountPaid || 0) >= parseFloat(item.total || 0);
    }
    if (type === "subscription") {
      return item.status === "active" && parseFloat(item.amount || 0) > 0;
    }
    if (type === "paymentLink") {
      // Payment links are considered "paid" if they have been used (we'd need to track this)
      return item.active === true;
    }
    return false;
  };

  // Helper function to check if date is within filter range
  const isInDateRange = (date: string | Date | null): boolean => {
    if (!date) return false;
    const itemDate = new Date(date);
    const now = new Date();

    // Year filter takes precedence if set
    if (yearFilter !== "all") {
      return itemDate.getFullYear() === parseInt(yearFilter);
    }

    if (timeFilter === "all") return true;
    if (timeFilter === "thisYear") {
      return itemDate.getFullYear() === now.getFullYear();
    }
    if (timeFilter === "thisMonth") {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (timeFilter === "lastMonth") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
    }
    if (timeFilter === "lastYear") {
      return itemDate.getFullYear() === now.getFullYear() - 1;
    }
    if (timeFilter === "custom") {
      if (!customDateRange.start || !customDateRange.end) return true;
      const start = new Date(customDateRange.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDateRange.end);
      end.setHours(23, 59, 59, 999);
      itemDate.setHours(12, 0, 0, 0);
      return itemDate >= start && itemDate <= end;
    }
    return true;
  };

  // Filter invoices based on all active filters
  const getFilteredInvoices = () => {
    return (safeDashboardData.invoices || []).filter((inv: any) => {
      const invoiceKey = getInvoiceKey(inv);
      if (isArchived("invoice", invoiceKey)) return false;

      // Client/Deal filter
      if (filterClientId && inv.clientId !== parseInt(filterClientId)) return false;
      if (filterDealId && inv.dealId && inv.dealId.toString() !== filterDealId) return false;
      if (filterDealId && !inv.dealId) return false;

      // Payment status filter
      if (paymentStatusFilter === "paid" && !isPaid(inv, "invoice")) return false;
      if (paymentStatusFilter === "unpaid" && isPaid(inv, "invoice")) return false;
      if (paymentStatusFilter === "draft" && inv.status !== "draft") return false;

      // Type filter (invoices are always "invoice" type)
      if (typeFilter !== "all" && typeFilter !== "invoice") return false;

      // Date filter
      const invoiceDate = inv.createdAt || inv.dueDate || inv.paidAt;
      if (!isInDateRange(invoiceDate)) return false;

      return true;
    });
  };

  // Filter subscriptions
  const getFilteredSubscriptions = () => {
    return (safeDashboardData.subscriptions || []).filter((sub: any) => {
      const subscriptionKey = getSubscriptionKey(sub);
      if (isArchived("subscription", subscriptionKey)) return false;

      // Client filter
      if (filterClientId && sub.clientId !== parseInt(filterClientId)) return false;

      // Payment status filter
      if (paymentStatusFilter === "paid" && !isPaid(sub, "subscription")) return false;
      if (paymentStatusFilter === "unpaid" && isPaid(sub, "subscription")) return false;

      // Type filter
      if (typeFilter !== "all" && typeFilter !== "subscription") return false;

      // Date filter
      const subDate = sub.createdAt || sub.currentPeriodStart;
      if (!isInDateRange(subDate)) return false;

      return true;
    });
  };

  // Filter payment links
  const getFilteredPaymentLinks = () => {
    return (safeDashboardData.paymentLinks || []).filter((link: any) => {
      const linkKey = getPaymentLinkKey(link);
      if (isArchived("paymentLink", linkKey)) return false;

      // Client filter
      if (filterClientId && link.clientId !== parseInt(filterClientId)) return false;

      // Payment status filter
      if (paymentStatusFilter === "paid" && !isPaid(link, "paymentLink")) return false;
      if (paymentStatusFilter === "unpaid" && isPaid(link, "paymentLink")) return false;

      // Type filter
      if (typeFilter !== "all" && typeFilter !== "paymentLink") return false;

      // Date filter
      const linkDate = link.createdAt;
      if (!isInDateRange(linkDate)) return false;

      return true;
    });
  };

  // Calculate filtered totals
  const getFilteredTotals = () => {
    const filteredInvoices = getFilteredInvoices();
    const filteredSubscriptions = getFilteredSubscriptions();
    const filteredPaymentLinks = getFilteredPaymentLinks();

    const totalRevenue =
      filteredInvoices.filter((inv: any) => isPaid(inv, "invoice")).reduce((sum: number, inv: any) => sum + parseFloat(inv.total || 0), 0) +
      filteredSubscriptions
        .filter((sub: any) => isPaid(sub, "subscription"))
        .reduce((sum: number, sub: any) => sum + parseFloat(sub.amount || 0), 0) +
      filteredPaymentLinks
        .filter((link: any) => isPaid(link, "paymentLink"))
        .reduce((sum: number, link: any) => sum + parseFloat(link.amount || 0), 0);

    const totalOutstanding = filteredInvoices
      .filter((inv: any) => !isPaid(inv, "invoice") && inv.status !== "draft")
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.amountDue || 0), 0);

    return {
      totalRevenue,
      totalOutstanding,
      invoiceCount: filteredInvoices.length,
      subscriptionCount: filteredSubscriptions.length,
      paymentLinkCount: filteredPaymentLinks.length,
    };
  };

  // Get available years from data
  const getAvailableYears = (): number[] => {
    const years = new Set<number>();
    const visibleItems = [
      ...(safeDashboardData.invoices || []).filter((inv: any) => !isArchived("invoice", getInvoiceKey(inv))),
      ...(safeDashboardData.subscriptions || []).filter((sub: any) => !isArchived("subscription", getSubscriptionKey(sub))),
      ...(safeDashboardData.paymentLinks || []).filter((link: any) => !isArchived("paymentLink", getPaymentLinkKey(link))),
    ];

    visibleItems.forEach((item: any) => {
      const date = item.createdAt || item.dueDate || item.paidAt || item.currentPeriodStart;
      if (date) {
        years.add(new Date(date).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      paid: { label: "Paid", variant: "default" },
      open: { label: "Open", variant: "secondary" },
      draft: { label: "Draft", variant: "outline" },
      void: { label: "Void", variant: "destructive" },
      uncollectible: { label: "Uncollectible", variant: "destructive" },
      succeeded: { label: "Succeeded", variant: "default" },
      processing: { label: "Processing", variant: "secondary" },
      requires_payment_method: { label: "Awaiting Payment", variant: "outline" },
      active: { label: "Active", variant: "default" },
      past_due: { label: "Past Due", variant: "destructive" },
      canceled: { label: "Canceled", variant: "outline" },
    };

    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const archiveItem = (type: BillingItemType, id?: string | null) => {
    if (!id) {
      toast({
        title: "Cannot archive",
        description: "This item is missing an identifier.",
        variant: "destructive",
      });
      return;
    }

    updateArchivedItems((prev) => {
      const next: ArchivedItemsState = {
        invoices: new Set(prev.invoices),
        subscriptions: new Set(prev.subscriptions),
        paymentLinks: new Set(prev.paymentLinks),
      };
      if (type === "invoice") next.invoices.add(id);
      if (type === "subscription") next.subscriptions.add(id);
      if (type === "paymentLink") next.paymentLinks.add(id);
      return next;
    });

    toast({
      title: "Item archived",
      description: "It will stay hidden even after refreshing from Stripe.",
    });
  };

  const restoreArchivedItems = () => {
    const totalHidden = archivedItems.invoices.size + archivedItems.subscriptions.size + archivedItems.paymentLinks.size;
    updateArchivedItems(() => ({
      invoices: new Set(),
      subscriptions: new Set(),
      paymentLinks: new Set(),
    }));
    toast({
      title: "Archive cleared",
      description: totalHidden > 0 ? `Restored ${totalHidden} hidden item${totalHidden === 1 ? "" : "s"}.` : "No hidden items to restore.",
    });
  };

  const archiveFilteredItems = () => {
    const invoicesToArchive = getFilteredInvoices().map((inv) => getInvoiceKey(inv)).filter(Boolean) as string[];
    const subscriptionsToArchive = getFilteredSubscriptions().map((sub) => getSubscriptionKey(sub)).filter(Boolean) as string[];
    const linksToArchive = getFilteredPaymentLinks().map((link) => getPaymentLinkKey(link)).filter(Boolean) as string[];

    const total = invoicesToArchive.length + subscriptionsToArchive.length + linksToArchive.length;
    if (total === 0) {
      toast({
        title: "Nothing to archive",
        description: "No visible billing items match your current filters.",
      });
      return;
    }

    updateArchivedItems((prev) => {
      const next: ArchivedItemsState = {
        invoices: new Set(prev.invoices),
        subscriptions: new Set(prev.subscriptions),
        paymentLinks: new Set(prev.paymentLinks),
      };
      invoicesToArchive.forEach((id) => next.invoices.add(id));
      subscriptionsToArchive.forEach((id) => next.subscriptions.add(id));
      linksToArchive.forEach((id) => next.paymentLinks.add(id));
      return next;
    });

    toast({
      title: "Cleaned up",
      description: `Archived ${invoicesToArchive.length} invoice${invoicesToArchive.length === 1 ? "" : "s"}, ${subscriptionsToArchive.length} subscription${subscriptionsToArchive.length === 1 ? "" : "s"}, ${linksToArchive.length} link${linksToArchive.length === 1 ? "" : "s"}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  // Safety check - ensure dashboardData exists, but allow rendering with empty data
  const safeDashboardData = dashboardData || {
    invoices: [],
    paymentIntents: [],
    subscriptions: [],
    quotes: [],
    paymentLinks: [],
    clientGroups: [],
    summary: {
      totalRevenue: 0,
      totalOutstanding: 0,
      totalDraft: 0,
      totalInvoices: 0,
      totalSubscriptions: 0,
      totalClients: 0,
    },
  };

  const archivedTotals = {
    invoices: archivedItems.invoices.size,
    subscriptions: archivedItems.subscriptions.size,
    paymentLinks: archivedItems.paymentLinks.size,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-5">
          <h1 className="text-xl font-semibold tracking-tight">Financial</h1>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {formatCurrency(safeDashboardData?.summary?.totalRevenue || 0)} revenue
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-amber-600 dark:text-amber-400">
              {formatCurrency(safeDashboardData?.summary?.totalOutstanding || 0)} outstanding
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground">{safeDashboardData?.summary?.totalInvoices || 0} invoices</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-[13px]" onClick={fetchFreshStripeData} disabled={isSyncing}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            Sync Stripe
          </Button>
          <Button size="sm" className="h-8 text-[13px] shadow-sm" onClick={() => setShowCreateInvoiceDialog(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Invoice
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[13px]" onClick={() => setShowCreatePaymentLinkDialog(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Payment Link
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">

      {/* Archive / Cleanup */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
        <span className="text-foreground font-medium">Cleanup</span>
        <span>
          Hidden — {archivedTotals.invoices} invoices, {archivedTotals.subscriptions} subs, {archivedTotals.paymentLinks} links
        </span>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={archiveFilteredItems}>
            <Archive className="h-4 w-4" />
            Archive filtered
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={restoreArchivedItems} disabled={archivedTotals.invoices + archivedTotals.subscriptions + archivedTotals.paymentLinks === 0}>
            <Undo2 className="h-4 w-4" />
            Restore hidden
          </Button>
        </div>
      </div>

      {/* Compact Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Active Filters Display */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filters:</span>

              {paymentStatusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {paymentStatusFilter === "paid" ? "Paid" : paymentStatusFilter === "unpaid" ? "Unpaid" : "Draft"}
                  <button onClick={() => setPaymentStatusFilter("all")} className="ml-1 hover:bg-destructive/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {typeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {typeFilter === "invoice"
                    ? "Invoices"
                    : typeFilter === "subscription"
                      ? "Subscriptions"
                      : typeFilter === "paymentLink"
                        ? "Payment Links"
                        : typeFilter === "quote"
                          ? "Quotes"
                          : "Other"}
                  <button
                    onClick={() => {
                      setTypeFilter("all");
                      setActiveTab("all");
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {timeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {timeFilter === "thisYear"
                    ? "This Year"
                    : timeFilter === "thisMonth"
                      ? "This Month"
                      : timeFilter === "lastMonth"
                        ? "Last Month"
                        : timeFilter === "lastYear"
                          ? "Last Year"
                          : yearFilter !== "all"
                            ? yearFilter
                            : "Custom"}
                  <button
                    onClick={() => {
                      setTimeFilter("all");
                      setYearFilter("all");
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filterClientId && (
                <Badge variant="secondary" className="gap-1">
                  Client: {clients.find((c) => c.id === parseInt(filterClientId))?.name || filterClientId}
                  <button
                    onClick={() => {
                      setFilterClientId("");
                      setFilterDealId("");
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filterDealId && (
                <Badge variant="secondary" className="gap-1">
                  Deal: {deals.find((d) => d.id === parseInt(filterDealId))?.name || filterDealId}
                  <button onClick={() => setFilterDealId("")} className="ml-1 hover:bg-destructive/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {paymentStatusFilter === "all" && typeFilter === "all" && timeFilter === "all" && !filterClientId && !filterDealId && (
                <span className="text-sm text-muted-foreground">No filters active</span>
              )}
            </div>

            <div className="flex-1" />

            {/* Expand/Collapse Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedFilters({ ...expandedFilters, quickFilters: !expandedFilters.quickFilters })}
                className="gap-2"
              >
                {expandedFilters.quickFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Quick Filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedFilters({ ...expandedFilters, advancedFilters: !expandedFilters.advancedFilters })}
                className="gap-2"
              >
                {expandedFilters.advancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Advanced
              </Button>
            </div>
          </div>

          {/* Quick Filters - Collapsible */}
          {expandedFilters.quickFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Payment Status */}
                <div>
                  <Label className="mb-2 block text-sm">Payment Status</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={paymentStatusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setPaymentStatusFilter("all")}>
                      All
                    </Button>
                    <Button variant={paymentStatusFilter === "paid" ? "default" : "outline"} size="sm" onClick={() => setPaymentStatusFilter("paid")}>
                      Paid
                    </Button>
                    <Button
                      variant={paymentStatusFilter === "unpaid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentStatusFilter("unpaid")}
                    >
                      Unpaid
                    </Button>
                    <Button
                      variant={paymentStatusFilter === "draft" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentStatusFilter("draft")}
                    >
                      Draft
                    </Button>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <Label className="mb-2 block text-sm">Type</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={typeFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTypeFilter("all");
                        setActiveTab("all");
                      }}
                    >
                      All
                    </Button>
                    <Button
                      variant={typeFilter === "invoice" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTypeFilter("invoice");
                        setActiveTab("invoices");
                      }}
                    >
                      Invoices
                    </Button>
                    <Button
                      variant={typeFilter === "subscription" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTypeFilter("subscription");
                        setActiveTab("subscriptions");
                      }}
                    >
                      Subscriptions
                    </Button>
                    <Button
                      variant={typeFilter === "paymentLink" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTypeFilter("paymentLink");
                        setActiveTab("paymentLinks");
                      }}
                    >
                      Links
                    </Button>
                  </div>
                </div>

                {/* Time Period */}
                <div>
                  <Label className="mb-2 block text-sm">Time Period</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={timeFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTimeFilter("all");
                        setYearFilter("all");
                      }}
                    >
                      All
                    </Button>
                    <Button
                      variant={timeFilter === "thisYear" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTimeFilter("thisYear");
                        setYearFilter(new Date().getFullYear().toString());
                      }}
                    >
                      This Year
                    </Button>
                    <Button variant={timeFilter === "thisMonth" ? "default" : "outline"} size="sm" onClick={() => setTimeFilter("thisMonth")}>
                      This Month
                    </Button>
                    <Button variant={timeFilter === "lastMonth" ? "default" : "outline"} size="sm" onClick={() => setTimeFilter("lastMonth")}>
                      Last Month
                    </Button>
                    <Button
                      variant={timeFilter === "lastYear" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTimeFilter("lastYear");
                        setYearFilter((new Date().getFullYear() - 1).toString());
                      }}
                    >
                      Last Year
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Select
                      value={yearFilter}
                      onValueChange={(value) => {
                        setYearFilter(value);
                        if (value !== "all") {
                          setTimeFilter("custom");
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {getAvailableYears().map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Custom Date Range */}
              {timeFilter === "custom" && (
                <div className="grid gap-2 md:grid-cols-2 pt-2 border-t">
                  <div>
                    <Label className="text-sm">Start Date</Label>
                    <Input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">End Date</Label>
                    <Input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Filters - Collapsible */}
          {expandedFilters.advancedFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="filterClient" className="text-sm">
                    Filter by Client
                  </Label>
                  <Select
                    value={filterClientId || "all"}
                    onValueChange={(value) => {
                      const actualValue = value === "all" ? "" : value;
                      setFilterClientId(actualValue);
                      setViewMode(actualValue ? "client" : viewMode === "client" ? "all" : viewMode);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All clients</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="filterDeal" className="text-sm">
                    Filter by Deal
                  </Label>
                  <Select
                    value={filterDealId || "all"}
                    onValueChange={(value) => {
                      const actualValue = value === "all" ? "" : value;
                      setFilterDealId(actualValue);
                      setViewMode(actualValue ? "deal" : viewMode === "deal" ? "all" : viewMode);
                    }}
                    disabled={!filterClientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={filterClientId ? "All deals" : "Select client first"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All deals</SelectItem>
                      {deals
                        .filter((deal) => !filterClientId || deal.clientId === parseInt(filterClientId))
                        .map((deal) => (
                          <SelectItem key={deal.id} value={deal.id.toString()}>
                            {deal.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm">View Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setViewMode("all");
                        setFilterClientId("");
                        setFilterDealId("");
                      }}
                    >
                      All
                    </Button>
                    <Button
                      variant={viewMode === "client" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setViewMode("client");
                        if (!filterClientId && clients.length > 0) {
                          setFilterClientId(clients[0].id.toString());
                        }
                      }}
                    >
                      Per Client
                    </Button>
                    <Button
                      variant={viewMode === "deal" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setViewMode("deal");
                        if (!filterDealId && deals.length > 0) {
                          setFilterDealId(deals[0].id.toString());
                        }
                      }}
                    >
                      Per Deal
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats - Filtered */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getFilteredTotals().totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {paymentStatusFilter === "all" ? "All paid items" : paymentStatusFilter === "paid" ? "Paid items" : "Filtered"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getFilteredTotals().totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Unpaid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(safeDashboardData.summary?.totalDraft || 0)}</div>
            <p className="text-xs text-muted-foreground">Draft invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtered Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getFilteredTotals().invoiceCount + getFilteredTotals().subscriptionCount + getFilteredTotals().paymentLinkCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {getFilteredTotals().invoiceCount} invoices, {getFilteredTotals().subscriptionCount} subs, {getFilteredTotals().paymentLinkCount} links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeDashboardData.summary?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">With billing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeDashboardData.summary?.totalSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Recurring</p>
          </CardContent>
        </Card>
      </div>

      {/* What to Charge Next - Prominent Section */}
      {safeDashboardData.clientGroups && Array.isArray(safeDashboardData.clientGroups) && safeDashboardData.clientGroups.length > 0 && (() => {
        const clientsWithChargeable = safeDashboardData.clientGroups.filter((g) => (g.nextCharge || 0) > 0);
        const totalNextCharge = clientsWithChargeable.reduce((sum, g) => sum + (g.nextCharge || 0), 0);
        const totalUnbilled = safeDashboardData.clientGroups.reduce((sum, g) => sum + (g.unbilledWork || 0), 0);

        if (clientsWithChargeable.length > 0) {
          return (
            <Card className="border-2 border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      What to Charge Next
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Outstanding balances and unbilled work ready to invoice
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalNextCharge)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(totalUnbilled)} unbilled work
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clientsWithChargeable
                    .sort((a, b) => (b.nextCharge || 0) - (a.nextCharge || 0))
                    .slice(0, 5)
                    .map((group) => (
                      <div
                        key={group.clientId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setInvoiceForm((prev) => ({ ...prev, clientId: group.clientId.toString() }));
                          setShowCreateInvoiceDialog(true);
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-semibold">{group.clientName}</div>
                          <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                            <span>
                              Balance: <span className="font-medium text-amber-600">{formatCurrency(group.balance || 0)}</span>
                            </span>
                            {group.unbilledWork > 0 && (
                              <span>
                                Unbilled: <span className="font-medium text-violet-600">{formatCurrency(group.unbilledWork)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-600">{formatCurrency(group.nextCharge || 0)}</div>
                          <Button size="sm" variant="outline" className="mt-1 text-xs" onClick={(e) => {
                            e.stopPropagation();
                            setInvoiceForm((prev) => ({ ...prev, clientId: group.clientId.toString() }));
                            setShowCreateInvoiceDialog(true);
                          }}>
                            Create Invoice
                          </Button>
                        </div>
                      </div>
                    ))}
                  {clientsWithChargeable.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground pt-2">
                      +{clientsWithChargeable.length - 5} more clients with chargeable amounts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })()}

      {/* Monthly Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 5 Months)</CardTitle>
            <CardDescription>Monthly income from paid invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--card-foreground))'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Billing Groups */}
      {safeDashboardData.clientGroups && Array.isArray(safeDashboardData.clientGroups) && safeDashboardData.clientGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Client Billing Summary</CardTitle>
            <CardDescription>Financial overview by client ({safeDashboardData.clientGroups.length} clients)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total Billed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-right">Unbilled Work</TableHead>
                  <TableHead className="text-right">Next Charge</TableHead>
                  <TableHead className="text-center">Invoices</TableHead>
                  <TableHead className="text-center">Subscriptions</TableHead>
                  <TableHead>Last Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeDashboardData.clientGroups
                  .sort((a, b) => (b.nextCharge || 0) - (a.nextCharge || 0))
                  .map((group) => (
                    <TableRow key={group.clientId}>
                      <TableCell className="font-medium">{group.clientName}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(group.totalBilled)}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-semibold">{formatCurrency(group.totalPaid)}</TableCell>
                      <TableCell className="text-right">
                        {group.balance > 0 ? (
                          <span className="font-bold text-amber-600">{formatCurrency(group.balance)}</span>
                        ) : (
                          <span className="text-muted-foreground">$0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {group.unbilledWork > 0 ? (
                          <span className="font-semibold text-violet-600">{formatCurrency(group.unbilledWork)}</span>
                        ) : (
                          <span className="text-muted-foreground">$0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {group.nextCharge > 0 ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(group.nextCharge)}</span>
                        ) : (
                          <span className="text-muted-foreground">$0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{group.invoiceCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {group.subscriptionCount > 0 ? <Badge>{group.subscriptionCount}</Badge> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{group.lastInvoiceDate ? formatDate(group.lastInvoiceDate) : "—"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Billing Items Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Items</CardTitle>
          <CardDescription>View and manage invoices, subscriptions, payment links, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              isTabChangingRef.current = true; // Flag that tab is changing typeFilter
              setActiveTab(value);
              // Auto-set type filter when tab changes
              if (value !== "all") {
                const typeMap: Record<string, "all" | "invoice" | "subscription" | "paymentLink"> = {
                  invoices: "invoice",
                  subscriptions: "subscription",
                  paymentLinks: "paymentLink",
                };
                if (typeMap[value]) {
                  setTypeFilter(typeMap[value]);
                }
              } else {
                setTypeFilter("all");
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">
                All
                {typeFilter === "all" && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {getFilteredInvoices().length + getFilteredSubscriptions().length + getFilteredPaymentLinks().length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="invoices">
                Invoices
                {getFilteredInvoices().length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {getFilteredInvoices().length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="subscriptions">
                Subscriptions
                {getFilteredSubscriptions().length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {getFilteredSubscriptions().length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="paymentLinks">
                Payment Links
                {getFilteredPaymentLinks().length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {getFilteredPaymentLinks().length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="quotes">
                Quotes
                {(safeDashboardData.quotes || []).length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {(safeDashboardData.quotes || []).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="other">
                Other
                {(safeDashboardData.paymentIntents || []).length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {(safeDashboardData.paymentIntents || []).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* All Tab */}
            <TabsContent value="all" className="mt-6 space-y-6">
              {/* Invoices Section */}
              {getFilteredInvoices().length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Invoices</h3>
                    <Badge variant="outline">{getFilteredInvoices().length}</Badge>
                  </div>
                  <div className="border rounded-lg">
                    <Table className="text-sm [&_th]:py-2 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-2 [&_td]:align-middle">
                      <TableHeader>
                        <TableRow>
                          <TableHead className={compactHeaderClass}>Invoice #</TableHead>
                          <TableHead className={compactHeaderClass}>Client</TableHead>
                          <TableHead className={compactHeaderClass}>Deal</TableHead>
                          <TableHead className={compactHeaderClass}>Description</TableHead>
                          <TableHead className={`${compactHeaderClass} text-right`}>Total</TableHead>
                          <TableHead className={`${compactHeaderClass} text-right`}>Paid</TableHead>
                          <TableHead className={`${compactHeaderClass} text-right`}>Due</TableHead>
                          <TableHead className={compactHeaderClass}>Status</TableHead>
                          <TableHead className={compactHeaderClass}>Due Date</TableHead>
                          <TableHead className={`${compactHeaderClass} text-right`}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredInvoices()
                          .slice(0, 10)
                          .map((invoice) => (
                            <TableRow key={invoice.id} className="hover:bg-muted/40 transition-colors">
                              <TableCell className={`${compactCellClass} font-mono text-sm`}>{invoice.invoiceNumber || `#${invoice.id}`}</TableCell>
                              <TableCell className={compactCellClass}>
                                {(() => {
                                  const clientInfo = getClientInfo(invoice);
                                  if (clientInfo.id) {
                                    return (
                                      <button
                                        onClick={() => {
                                          setSelectedClientId(clientInfo.id);
                                          setShowClientPreview(true);
                                        }}
                                        className="text-left hover:underline text-primary font-medium"
                                      >
                                        {clientInfo.name}
                                        {clientInfo.email && <span className="text-muted-foreground text-xs block">{clientInfo.email}</span>}
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <div>
                                        <span className="font-medium">{clientInfo.name}</span>
                                        {clientInfo.email && <span className="text-muted-foreground text-xs block">{clientInfo.email}</span>}
                                      </div>
                                    );
                                  }
                                })()}
                              </TableCell>
                              <TableCell className={compactCellClass}>
                                {invoice.dealId
                                  ? deals.find((d) => d.id === parseInt(invoice.dealId.toString()))?.name || `Deal #${invoice.dealId}`
                                  : "—"}
                              </TableCell>
                              <TableCell className={`${compactCellClass} max-w-xs truncate`}>{invoice.description || "-"}</TableCell>
                              <TableCell className={`${compactCellClass} text-right font-semibold`}>{formatCurrency(invoice.total)}</TableCell>
                              <TableCell
                                className={`${compactCellClass} text-right font-semibold ${isPaid(invoice, "invoice") ? "text-emerald-600" : "text-muted-foreground"}`}
                              >
                                {formatCurrency(invoice.amountPaid || 0)}
                              </TableCell>
                              <TableCell className={`${compactCellClass} text-right font-semibold text-orange-600`}>
                                {formatCurrency(invoice.amountDue)}
                              </TableCell>
                              <TableCell className={compactCellClass}>{getStatusBadge(invoice.status)}</TableCell>
                              <TableCell className={compactCellClass}>
                                {invoice.dueDate ? formatDateTime(invoice.dueDate) : "-"}
                                {invoice.createdAt && (
                                  <span className="text-xs text-muted-foreground block">Created: {formatDateTime(invoice.createdAt)}</span>
                                )}
                                {invoice.paidAt && <span className="text-xs text-emerald-600 block">Paid: {formatDateTime(invoice.paidAt)}</span>}
                              </TableCell>
                              <TableCell className={`${compactCellClass} text-right`}>
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => archiveItem("invoice", getInvoiceKey(invoice))} title="Archive">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                  {invoice.hostedInvoiceUrl && (
                                    <Button variant="ghost" size="sm" onClick={() => window.open(invoice.hostedInvoiceUrl, "_blank")}>
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {invoice.invoicePdf && (
                                    <Button variant="ghost" size="sm" onClick={() => window.open(invoice.invoicePdf, "_blank")}>
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    {getFilteredInvoices().length > 10 && (
                      <div className="p-4 text-center text-sm text-muted-foreground border-t">
                        Showing 10 of {getFilteredInvoices().length} invoices. Use filters to narrow results.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subscriptions Section */}
              {getFilteredSubscriptions().length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Subscriptions</h3>
                    <Badge variant="outline">{getFilteredSubscriptions().length}</Badge>
                  </div>
                  <div className="border rounded-lg">
                    <Table className="text-sm [&_th]:py-2 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-2 [&_td]:align-middle">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid Status</TableHead>
                          <TableHead>Interval</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Current Period</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredSubscriptions()
                          .slice(0, 10)
                          .map((subscription) => (
                            <TableRow key={subscription.id}>
                              <TableCell>
                                {(() => {
                                  const client = clients.find((c) => c.id === subscription.clientId);
                                  if (client) {
                                    return (
                                      <button
                                        onClick={() => {
                                          setSelectedClientId(client.id);
                                          setShowClientPreview(true);
                                        }}
                                        className="text-left hover:underline text-primary font-medium"
                                      >
                                        {client.name}
                                        <span className="text-muted-foreground text-xs block">{client.email}</span>
                                      </button>
                                    );
                                  } else {
                                    return <span className="text-muted-foreground">—</span>;
                                  }
                                })()}
                              </TableCell>
                              <TableCell className="font-semibold">{formatCurrency(subscription.amount)}</TableCell>
                              <TableCell>
                                {isPaid(subscription, "subscription") ? (
                                  <Badge variant="default">Paid</Badge>
                                ) : (
                                  <Badge variant="outline">Unpaid</Badge>
                                )}
                              </TableCell>
                              <TableCell>{subscription.interval || "—"}</TableCell>
                              <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                              <TableCell>
                                {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                                  <div>
                                    <div>{formatDateTime(subscription.currentPeriodStart)}</div>
                                    <div className="text-xs text-muted-foreground">to {formatDateTime(subscription.currentPeriodEnd)}</div>
                                  </div>
                                ) : (
                                  "-"
                                )}
                                {subscription.createdAt && (
                                  <span className="text-xs text-muted-foreground block mt-1">Created: {formatDateTime(subscription.createdAt)}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => archiveItem("subscription", getSubscriptionKey(subscription))} title="Archive">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    {getFilteredSubscriptions().length > 10 && (
                      <div className="p-4 text-center text-sm text-muted-foreground border-t">
                        Showing 10 of {getFilteredSubscriptions().length} subscriptions. Use filters to narrow results.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Links Section */}
              {getFilteredPaymentLinks().length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Payment Links</h3>
                    <Badge variant="outline">{getFilteredPaymentLinks().length}</Badge>
                  </div>
                  <div className="border rounded-lg">
                    <Table className="text-sm [&_th]:py-2 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-2 [&_td]:align-middle">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid Status</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Link</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredPaymentLinks()
                          .slice(0, 10)
                          .map((link) => (
                            <TableRow key={link.id}>
                              <TableCell>
                                {(() => {
                                  const client = clients.find((c) => c.id === link.clientId);
                                  if (client) {
                                    return (
                                      <button
                                        onClick={() => {
                                          setSelectedClientId(client.id);
                                          setShowClientPreview(true);
                                        }}
                                        className="text-left hover:underline text-primary font-medium"
                                      >
                                        {client.name}
                                        <span className="text-muted-foreground text-xs block">{client.email}</span>
                                      </button>
                                    );
                                  } else {
                                    return <span className="text-muted-foreground">—</span>;
                                  }
                                })()}
                              </TableCell>
                              <TableCell>{link.description || "-"}</TableCell>
                              <TableCell className="font-semibold">{formatCurrency(link.amount)}</TableCell>
                              <TableCell>
                                {isPaid(link, "paymentLink") ? <Badge variant="default">Used/Paid</Badge> : <Badge variant="outline">Pending</Badge>}
                              </TableCell>
                              <TableCell>{link.active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                              <TableCell>
                                {formatDateTime(link.createdAt)}
                                {link.updatedAt && link.updatedAt !== link.createdAt && (
                                  <span className="text-xs text-muted-foreground block">Updated: {formatDateTime(link.updatedAt)}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => window.open(link.url, "_blank")}>
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => archiveItem("paymentLink", getPaymentLinkKey(link))} title="Archive">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    {getFilteredPaymentLinks().length > 10 && (
                      <div className="p-4 text-center text-sm text-muted-foreground border-t">
                        Showing 10 of {getFilteredPaymentLinks().length} payment links. Use filters to narrow results.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {getFilteredInvoices().length === 0 && getFilteredSubscriptions().length === 0 && getFilteredPaymentLinks().length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No billing items found</p>
                  <p className="text-sm text-muted-foreground mb-4">Sync your Stripe data or create your first invoice</p>
                  <Button onClick={() => setShowCreateInvoiceDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="mt-6">
              {getFilteredInvoices().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No invoices found</p>
                  <p className="text-sm text-muted-foreground mb-4">Sync your Stripe data or create your first invoice</p>
                  <Button onClick={() => setShowCreateInvoiceDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table className="text-sm [&_th]:py-2 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-2 [&_td]:align-middle">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Deal</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredInvoices().map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">{invoice.invoiceNumber || `#${invoice.id}`}</TableCell>
                          <TableCell>
                            {(() => {
                              const clientInfo = getClientInfo(invoice);
                              if (clientInfo.id) {
                                return (
                                  <button
                                    onClick={() => {
                                      setSelectedClientId(clientInfo.id);
                                      setShowClientPreview(true);
                                    }}
                                    className="text-left hover:underline text-primary font-medium"
                                  >
                                    {clientInfo.name}
                                    {clientInfo.email && <span className="text-muted-foreground text-xs block">{clientInfo.email}</span>}
                                  </button>
                                );
                              } else {
                                return (
                                  <div>
                                    <span className="font-medium">{clientInfo.name}</span>
                                    {clientInfo.email && <span className="text-muted-foreground text-xs block">{clientInfo.email}</span>}
                                  </div>
                                );
                              }
                            })()}
                          </TableCell>
                          <TableCell>
                            {invoice.dealId
                              ? deals.find((d) => d.id === parseInt(invoice.dealId.toString()))?.name || `Deal #${invoice.dealId}`
                              : "—"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{invoice.description || "-"}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell className={`font-semibold ${isPaid(invoice, "invoice") ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {formatCurrency(invoice.amountPaid || 0)}
                          </TableCell>
                          <TableCell className="font-semibold text-orange-600">{formatCurrency(invoice.amountDue)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell>
                            {invoice.dueDate ? formatDateTime(invoice.dueDate) : "-"}
                            {invoice.createdAt && (
                              <span className="text-xs text-muted-foreground block">Created: {formatDateTime(invoice.createdAt)}</span>
                            )}
                            {invoice.paidAt && <span className="text-xs text-emerald-600 block">Paid: {formatDateTime(invoice.paidAt)}</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => archiveItem("invoice", getInvoiceKey(invoice))} title="Archive">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                              {invoice.hostedInvoiceUrl && (
                                <Button variant="ghost" size="sm" onClick={() => window.open(invoice.hostedInvoiceUrl, "_blank")}>
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              {invoice.invoicePdf && (
                                <Button variant="ghost" size="sm" onClick={() => window.open(invoice.invoicePdf, "_blank")}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="mt-6">
              {getFilteredSubscriptions().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No subscriptions found</p>
                  <p className="text-sm text-muted-foreground">No subscriptions match your current filters</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table className="text-sm [&_th]:py-2 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-2 [&_td]:align-middle">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                      <TableHead>Paid Status</TableHead>
                      <TableHead>Interval</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Period</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredSubscriptions().map((subscription) => (
                      <TableRow key={subscription.id}>
                          <TableCell>
                            {(() => {
                              const client = clients.find((c) => c.id === subscription.clientId);
                              if (client) {
                                return (
                                  <button
                                    onClick={() => {
                                      setSelectedClientId(client.id);
                                      setShowClientPreview(true);
                                    }}
                                    className="text-left hover:underline text-primary font-medium"
                                  >
                                    {client.name}
                                    <span className="text-muted-foreground text-xs block">{client.email}</span>
                                  </button>
                                );
                              } else {
                                return <span className="text-muted-foreground">—</span>;
                              }
                            })()}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(subscription.amount)}</TableCell>
                          <TableCell>
                            {isPaid(subscription, "subscription") ? <Badge variant="default">Paid</Badge> : <Badge variant="outline">Unpaid</Badge>}
                          </TableCell>
                          <TableCell>{subscription.interval || "—"}</TableCell>
                          <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                            <div>
                              <div>{formatDateTime(subscription.currentPeriodStart)}</div>
                              <div className="text-xs text-muted-foreground">to {formatDateTime(subscription.currentPeriodEnd)}</div>
                              </div>
                            ) : (
                              "-"
                            )}
                          {subscription.createdAt && (
                            <span className="text-xs text-muted-foreground block mt-1">Created: {formatDateTime(subscription.createdAt)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => archiveItem("subscription", getSubscriptionKey(subscription))} title="Archive">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </TabsContent>

            {/* Payment Links Tab */}
            <TabsContent value="paymentLinks" className="mt-6">
              {getFilteredPaymentLinks().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No payment links found</p>
                  <p className="text-sm text-muted-foreground mb-4">Create a payment link to get started</p>
                  <Button onClick={() => setShowCreatePaymentLinkDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Payment Link
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table className="text-sm [&_th]:py-2 [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide [&_td]:py-2 [&_td]:align-middle">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                      <TableHead>Paid Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredPaymentLinks().map((link) => (
                      <TableRow key={link.id}>
                          <TableCell>
                            {(() => {
                              const client = clients.find((c) => c.id === link.clientId);
                              if (client) {
                                return (
                                  <button
                                    onClick={() => {
                                      setSelectedClientId(client.id);
                                      setShowClientPreview(true);
                                    }}
                                    className="text-left hover:underline text-primary font-medium"
                                  >
                                    {client.name}
                                    <span className="text-muted-foreground text-xs block">{client.email}</span>
                                  </button>
                                );
                              } else {
                                return <span className="text-muted-foreground">—</span>;
                              }
                            })()}
                          </TableCell>
                          <TableCell>{link.description || "-"}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(link.amount)}</TableCell>
                          <TableCell>
                            {isPaid(link, "paymentLink") ? <Badge variant="default">Used/Paid</Badge> : <Badge variant="outline">Pending</Badge>}
                          </TableCell>
                          <TableCell>{link.active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                          <TableCell>
                            {formatDateTime(link.createdAt)}
                            {link.updatedAt && link.updatedAt !== link.createdAt && (
                              <span className="text-xs text-muted-foreground block">Updated: {formatDateTime(link.updatedAt)}</span>
                            )}
                          </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => window.open(link.url, "_blank")}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => archiveItem("paymentLink", getPaymentLinkKey(link))} title="Archive">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </TabsContent>

            {/* Quotes Tab */}
            <TabsContent value="quotes" className="mt-6">
              {(safeDashboardData.quotes || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No quotes found</p>
                  <p className="text-sm text-muted-foreground">Quotes will appear here when created</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quote #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(safeDashboardData.quotes || []).map((quote: any) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-mono text-sm">{quote.quoteNumber || `#${quote.id}`}</TableCell>
                          <TableCell>
                            {quote.clientId
                              ? (() => {
                                  const client = clients.find((c) => c.id === quote.clientId);
                                  return client ? client.name : "—";
                                })()
                              : "—"}
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(quote.amount || 0)}</TableCell>
                          <TableCell>{getStatusBadge(quote.status || "draft")}</TableCell>
                          <TableCell>{quote.createdAt ? formatDateTime(quote.createdAt) : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Other Tab (Payment Intents, etc.) */}
            <TabsContent value="other" className="mt-6">
              {(safeDashboardData.paymentIntents || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">No other items found</p>
                  <p className="text-sm text-muted-foreground">Payment intents and other billing items will appear here</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(safeDashboardData.paymentIntents || []).map((intent: any) => (
                        <TableRow key={intent.id}>
                          <TableCell>
                            <Badge variant="outline">Payment Intent</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{formatCurrency(intent.amount || 0)}</TableCell>
                          <TableCell>{getStatusBadge(intent.status || "pending")}</TableCell>
                          <TableCell>{intent.createdAt ? formatDateTime(intent.createdAt) : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Legacy Invoices Table - Remove after testing */}
      {/* Invoices Table */}
      <Card className="hidden">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Showing {getFilteredInvoices().length} of {(safeDashboardData.invoices || []).length} invoices
            {paymentStatusFilter !== "all" && ` (${paymentStatusFilter})`}
            {typeFilter !== "all" && ` - ${typeFilter}s only`}
            {timeFilter !== "all" && ` - ${timeFilter === "custom" ? "custom range" : timeFilter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getFilteredInvoices().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No invoices found</p>
              <p className="text-sm text-muted-foreground mb-4">Sync your Stripe data or create your first invoice</p>
              <Button onClick={() => setShowCreateInvoiceDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredInvoices().map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Badge variant="outline">Invoice</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{invoice.invoiceNumber || `#${invoice.id}`}</TableCell>
                    <TableCell>
                      {(() => {
                        const clientInfo = getClientInfo(invoice);
                        if (clientInfo.id) {
                          return (
                            <button
                              onClick={() => {
                                setSelectedClientId(clientInfo.id);
                                setShowClientPreview(true);
                              }}
                              className="text-left hover:underline text-primary font-medium"
                            >
                              {clientInfo.name}
                              {clientInfo.email && <span className="text-muted-foreground text-xs block">{clientInfo.email}</span>}
                            </button>
                          );
                        } else {
                          return (
                            <div>
                              <span className="font-medium">{clientInfo.name}</span>
                              {clientInfo.email && <span className="text-muted-foreground text-xs block">{clientInfo.email}</span>}
                            </div>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      {invoice.dealId ? deals.find((d) => d.id === parseInt(invoice.dealId.toString()))?.name || `Deal #${invoice.dealId}` : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{invoice.description || "-"}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell className={`font-semibold ${isPaid(invoice, "invoice") ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {formatCurrency(invoice.amountPaid || 0)}
                    </TableCell>
                    <TableCell className="font-semibold text-orange-600">{formatCurrency(invoice.amountDue)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {invoice.dueDate ? formatDateTime(invoice.dueDate) : "-"}
                      {invoice.createdAt && <span className="text-xs text-muted-foreground block">Created: {formatDateTime(invoice.createdAt)}</span>}
                      {invoice.paidAt && <span className="text-xs text-emerald-600 block">Paid: {formatDateTime(invoice.paidAt)}</span>}
                    </TableCell>
                    <TableCell>
                      {invoice.hostedInvoiceUrl && (
                        <Button variant="ghost" size="sm" onClick={() => window.open(invoice.hostedInvoiceUrl, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.invoicePdf && (
                        <Button variant="ghost" size="sm" onClick={() => window.open(invoice.invoicePdf, "_blank")}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoiceDialog} onOpenChange={setShowCreateInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Create and send an invoice to a client via Stripe</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Client *</Label>
              <Select
                value={invoiceForm.clientId}
                onValueChange={(value) => {
                  setInvoiceForm({ ...invoiceForm, clientId: value, dealId: "" });
                  loadBillableTickets(value); // Load billable tickets for this client
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deal">Deal (Optional)</Label>
              <Select
                value={invoiceForm.dealId || "none"}
                onValueChange={(value) => {
                  const actualValue = value === "none" ? "" : value;
                  setInvoiceForm({ ...invoiceForm, dealId: actualValue });
                  loadBillableTickets(invoiceForm.clientId, actualValue); // Reload tickets filtered by deal
                }}
                disabled={!invoiceForm.clientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={invoiceForm.clientId ? "Select a deal (optional)" : "Select client first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No deal</SelectItem>
                  {deals
                    .filter((deal) => deal.clientId === parseInt(invoiceForm.clientId))
                    .map((deal) => (
                      <SelectItem key={deal.id} value={deal.id.toString()}>
                        {deal.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Billable Tickets Section */}
            {invoiceForm.clientId && (
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Billable Tickets
                  {billableTickets.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {billableTickets.length}
                    </Badge>
                  )}
                </Label>
                {loadingTickets ? (
                  <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                    Loading billable tickets...
                  </div>
                ) : billableTickets.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                    No billable tickets found for this {invoiceForm.dealId ? "deal" : "client"}
                  </div>
                ) : (
                  <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-2">
                    {billableTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted transition-colors ${
                          selectedTicketIds.includes(ticket.id) ? "bg-muted" : ""
                        }`}
                        onClick={() => toggleTicketSelection(ticket.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTicketIds.includes(ticket.id)}
                          onChange={() => toggleTicketSelection(ticket.id)}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            #{ticket.id} - {ticket.title}
                          </div>
                          <div className="text-xs text-muted-foreground flex gap-2">
                            <span>{parseFloat(ticket.timeSpent).toFixed(2)}h</span>
                            <span>×</span>
                            <span>${parseFloat(ticket.hourlyRate || "65").toFixed(0)}/hr</span>
                            <span>=</span>
                            <span className="font-semibold text-foreground">
                              ${(parseFloat(ticket.timeSpent) * parseFloat(ticket.hourlyRate || "65")).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {ticket.applicationSource}
                        </Badge>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedTicketIds.length} selected
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addTicketsAsLineItems}
                        disabled={selectedTicketIds.length === 0}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Invoice
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                placeholder="Invoice description..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Line Items *</Label>
              {invoiceForm.lineItems.map((item, index) => {
                const itemTotal = (parseFloat(item.amount) || 0) * (parseInt(item.quantity) || 1);
                const itemWithTax = itemTotal + (parseFloat(item.tax) || 0);
                return (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                    <Input
                      className="col-span-4"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    />
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.amount}
                        onChange={(e) => updateLineItem(index, "amount", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Qty</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">Tax</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.tax}
                        onChange={(e) => updateLineItem(index, "tax", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <Label className="text-xs text-muted-foreground mb-1 block">Total</Label>
                      <div className="font-semibold">{formatCurrency(itemWithTax)}</div>
                    </div>
                    <Button
                      className="col-span-1"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={invoiceForm.lineItems.length === 1}
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      invoiceForm.lineItems.reduce((sum, item) => {
                        const itemTotal = (parseFloat(item.amount) || 0) * (parseInt(item.quantity) || 1);
                        return sum + itemTotal;
                      }, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Tax:</span>
                  <span className="font-semibold">
                    {formatCurrency(invoiceForm.lineItems.reduce((sum, item) => sum + (parseFloat(item.tax) || 0), 0))}
                  </span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t font-bold">
                  <span>Total:</span>
                  <span>
                    {formatCurrency(
                      invoiceForm.lineItems.reduce((sum, item) => {
                        const itemTotal = (parseFloat(item.amount) || 0) * (parseInt(item.quantity) || 1);
                        const itemTax = parseFloat(item.tax) || 0;
                        return sum + itemTotal + itemTax;
                      }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Internal Notes (optional)</Label>
              <Textarea
                id="notes"
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                placeholder="Add any internal notes about this invoice..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendImmediately"
                checked={invoiceForm.sendImmediately}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, sendImmediately: e.target.checked })}
              />
              <Label htmlFor="sendImmediately" className="cursor-pointer">
                Send invoice to client immediately via email
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateInvoiceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createInvoice}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payment Link Dialog */}
      <Dialog open={showCreatePaymentLinkDialog} onOpenChange={setShowCreatePaymentLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payment Link</DialogTitle>
            <DialogDescription>Generate a one-time payment link for a client</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="paymentClient">Client *</Label>
              <Select value={paymentLinkForm.clientId} onValueChange={(value) => setPaymentLinkForm({ ...paymentLinkForm, clientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentAmount">Amount *</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={paymentLinkForm.amount}
                onChange={(e) => setPaymentLinkForm({ ...paymentLinkForm, amount: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentDescription">Description *</Label>
              <Textarea
                id="paymentDescription"
                value={paymentLinkForm.description}
                onChange={(e) => setPaymentLinkForm({ ...paymentLinkForm, description: e.target.value })}
                placeholder="What is this payment for?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePaymentLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createPaymentLink}>Create Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Preview */}
      {selectedClientId && (
        <ClientPreview
          open={showClientPreview}
          onOpenChange={setShowClientPreview}
          clientId={selectedClientId}
          onClientUpdated={() => {
            loadClients();
            loadDashboard();
          }}
        />
      )}
    </div>
  );
}
