import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { getApiBaseUrl } from "../../lib/queryClient";
import {
  RefreshCw,
  Plus,
  ExternalLink,
  Clock,
  Archive,
  Undo2,
  X,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";

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

interface StripePayment {
  id: string;
  date: string;
  amount: number;
  email: string;
  description: string;
  category: string;
}

interface ClientRevenue {
  client: string;
  email: string;
  total: number;
  projected: number;
  payments: StripePayment[];
}

// Active clients list
const ACTIVE_CLIENTS = [
  { name: "Desert Moon Lighting", email: "mmazick@nssaz.com", status: "active" },
  { name: "Brian Mitchell", email: "brian.mitchell38@gmail.com", status: "active" },
  { name: "Agave Environmental", email: "victoria.rosales@agave-inc.com", status: "active" },
  { name: "CGCC Presentation", email: "theresa.whitney@cgc.edu", status: "active" },
];

// Email aliases - maps alternate emails to primary client email
const EMAIL_ALIASES: Record<string, string> = {
  "jeraush@emdivision.com": "brian.mitchell38@gmail.com", // Brian's business email
};

// Projected revenue data - update manually as deals progress
const PROJECTED_REVENUE: Record<string, { amount: number; month: string; note: string }[]> = {
  // Brian Mitchell - remaining 50% ($898.50) + add-ons ($780) = $1,678.50
  "brian.mitchell38@gmail.com": [
    { amount: 1678.50, month: "Feb 2026", note: "Final balance + add-ons (pins/perimeter)" },
  ],
  // Desert Moon Lighting - outstanding balance
  "mmazick@nssaz.com": [
    { amount: 2752, month: "Feb 2026", note: "Outstanding balance" },
  ],
  // Agave Environmental - outstanding invoice + subscription
  "victoria.rosales@agave-inc.com": [
    { amount: 242.20, month: "Feb 2026", note: "Outstanding invoice (Dec - one-time + 1st month)" },
    { amount: 154.92, month: "Mar 2026", note: "Monthly subscription + tax" },
    { amount: 154.92, month: "Apr 2026", note: "Monthly subscription + tax" },
    { amount: 154.92, month: "May 2026", note: "Monthly subscription + tax" },
  ],
};

// One-time projected revenue by month (not tied to existing clients)
const MONTHLY_PROJECTED: Record<string, { amount: number; note: string }[]> = {
  "Apr 2026": [
    { amount: 500, note: "CGCC Presentation" },
  ],
};

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
    const stored = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!stored) {
      return { invoices: new Set(), subscriptions: new Set(), paymentLinks: new Set() };
    }

    const parsed = JSON.parse(stored);
    return {
      invoices: new Set(parsed.invoices || []),
      subscriptions: new Set(parsed.subscriptions || []),
      paymentLinks: new Set(parsed.paymentLinks || []),
    };
  } catch (error) {
    console.error("Error loading archived items from localStorage:", error);
    return { invoices: new Set(), subscriptions: new Set(), paymentLinks: new Set() };
  }
};

const saveArchivedToStorage = (archivedItems: ArchivedItemsState) => {
  if (typeof window === "undefined") return;

  try {
    const toStore = {
      invoices: Array.from(archivedItems.invoices),
      subscriptions: Array.from(archivedItems.subscriptions),
      paymentLinks: Array.from(archivedItems.paymentLinks),
    };
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error("Error saving archived items to localStorage:", error);
  }
};

export default function BillingPage() {
  const [data, setData] = useState<BillingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Monthly revenue for chart
  const [monthlyRevenue, setMonthlyRevenue] = useState<Array<{ month: string; revenue: number; projected: number }>>([]);
  const [stripeTotalRevenue, setStripeTotalRevenue] = useState<number | null>(null);
  const [projectedTotal, setProjectedTotal] = useState<number>(0);
  const [revenueTimeRange, setRevenueTimeRange] = useState<string>("12"); // Default to 12 months

  // Payment history
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [clientRevenue, setClientRevenue] = useState<ClientRevenue[]>([]);
  const [firstPaymentDate, setFirstPaymentDate] = useState<Date | null>(null);

  // Calculate average monthly income
  const calculateAverageIncome = () => {
    if (!payments.length || !firstPaymentDate) return { avg: 0, months: 0 };
    const now = new Date();
    const monthsDiff = Math.max(1,
      (now.getFullYear() - firstPaymentDate.getFullYear()) * 12 +
      (now.getMonth() - firstPaymentDate.getMonth()) + 1
    );
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    return { avg: total / monthsDiff, months: monthsDiff };
  };

  const avgIncomeData = calculateAverageIncome();

  // Archive state
  const [archivedItems, setArchivedItems] = useState<ArchivedItemsState>(loadArchivedFromStorage);
  const [showArchived, setShowArchived] = useState(false);

  // Dialog states
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [viewInvoiceOpen, setViewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [createSubscriptionOpen, setCreateSubscriptionOpen] = useState(false);
  const [createPaymentLinkOpen, setCreatePaymentLinkOpen] = useState(false);
  const [createQuoteOpen, setCreateQuoteOpen] = useState(false);
  const [viewQuoteOpen, setViewQuoteOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [billableTicketsOpen, setBillableTicketsOpen] = useState(false);
  const [billableTickets, setBillableTickets] = useState<BillableTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: "",
    amount: "",
    description: "",
    dueDate: "",
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    clientId: "",
    amount: "",
    description: "",
    interval: "monthly",
  });

  const [paymentLinkForm, setPaymentLinkForm] = useState({
    amount: "",
    description: "",
  });

  const [quoteForm, setQuoteForm] = useState({
    clientId: "",
    items: [{ description: "", quantity: 1, rate: 0 }],
    notes: "",
  });

  const [clients, setClients] = useState<Client[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");

      // Fetch dashboard data
      const dashboardRes = await fetch(`${getApiBaseUrl()}/admin/billing/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!dashboardRes.ok) {
        throw new Error("Failed to fetch billing data");
      }

      const dashboardResult = await dashboardRes.json();
      setData(dashboardResult);

      // Fetch revenue data with current time range
      await fetchRevenueData(revenueTimeRange);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load billing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async (months: string) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const revenueRes = await fetch(`${getApiBaseUrl()}/admin/billing/monthly-revenue?months=${months}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (revenueRes.ok) {
        const revenueResult = await revenueRes.json();
        if (revenueResult.success && revenueResult.data?.monthlyRevenue) {
          // Get all projected months
          const projectedMonths = new Set<string>();
          Object.values(PROJECTED_REVENUE).forEach((projections) => {
            projections.forEach((p) => projectedMonths.add(p.month));
          });
          Object.keys(MONTHLY_PROJECTED).forEach((month) => projectedMonths.add(month));

          // Start with existing data
          const existingMonths = new Set(revenueResult.data.monthlyRevenue.map((m: { month: string }) => m.month));

          // Add future months that have projections
          const now = new Date();
          const futureMonths: { month: string; revenue: number }[] = [];
          for (let i = 1; i <= 6; i++) {
            const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthKey = futureDate.toLocaleDateString("en-US", { year: "numeric", month: "short" });
            if (projectedMonths.has(monthKey) && !existingMonths.has(monthKey)) {
              futureMonths.push({ month: monthKey, revenue: 0 });
            }
          }

          // Combine historical and future data
          const allMonthsData = [...revenueResult.data.monthlyRevenue, ...futureMonths];

          // Add projected amounts to the data
          const revenueWithProjected = allMonthsData.map((item: { month: string; revenue: number }) => {
            let projected = 0;

            // Add monthly projected revenue
            if (MONTHLY_PROJECTED[item.month]) {
              projected += MONTHLY_PROJECTED[item.month].reduce((sum, p) => sum + p.amount, 0);
            }

            // Add client projected revenue for this month
            Object.values(PROJECTED_REVENUE).forEach((projections) => {
              projections.forEach((p) => {
                if (p.month === item.month) {
                  projected += p.amount;
                }
              });
            });

            return { ...item, projected };
          });

          setMonthlyRevenue(revenueWithProjected);

          // Calculate total projected
          let totalProjected = 0;
          Object.values(PROJECTED_REVENUE).forEach((projections) => {
            projections.forEach((p) => totalProjected += p.amount);
          });
          Object.values(MONTHLY_PROJECTED).forEach((projections) => {
            projections.forEach((p) => totalProjected += p.amount);
          });
          setProjectedTotal(totalProjected);

          if (revenueResult.data.totalRevenue !== undefined) {
            setStripeTotalRevenue(revenueResult.data.totalRevenue);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    }
  };

  const handleTimeRangeChange = (newRange: string) => {
    setRevenueTimeRange(newRange);
    fetchRevenueData(newRange);
  };

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch(`${getApiBaseUrl()}/admin/billing/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Filter out test payments (under $5)
          const realPayments = result.data.filter((p: StripePayment) => p.amount >= 5);
          setPayments(realPayments);

          // Find first payment date
          if (realPayments.length > 0) {
            const dates = realPayments.map((p: StripePayment) => new Date(p.date));
            const oldest = new Date(Math.min(...dates.map(d => d.getTime())));
            setFirstPaymentDate(oldest);
          }

          // Aggregate by client email (using aliases)
          const clientMap = new Map<string, ClientRevenue>();
          realPayments.forEach((payment: StripePayment) => {
            const rawEmail = payment.email || "Unknown";
            // Check for email alias
            const key = EMAIL_ALIASES[rawEmail.toLowerCase()] || rawEmail;
            if (clientMap.has(key)) {
              const existing = clientMap.get(key)!;
              existing.total += payment.amount;
              existing.payments.push(payment);
            } else {
              // Check if this is a known active client first
              const activeClient = ACTIVE_CLIENTS.find(c => c.email === key);
              let clientName = activeClient?.name || key;

              // If not found in active clients, create readable name from email
              if (!activeClient && key.includes("@")) {
                const namePart = key.split("@")[0];
                clientName = namePart
                  .replace(/[._]/g, " ")
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
              }
              // Get projected amount for this client
              const clientProjected = PROJECTED_REVENUE[key]
                ? PROJECTED_REVENUE[key].reduce((sum, p) => sum + p.amount, 0)
                : 0;

              clientMap.set(key, {
                client: clientName,
                email: key,
                total: payment.amount,
                projected: clientProjected,
                payments: [payment],
              });
            }
          });

          // Add clients who have projections but no payments yet
          Object.entries(PROJECTED_REVENUE).forEach(([email, projections]) => {
            if (!clientMap.has(email)) {
              const totalProjected = projections.reduce((sum, p) => sum + p.amount, 0);
              // Get client name from ACTIVE_CLIENTS
              const activeClient = ACTIVE_CLIENTS.find(c => c.email === email);
              const clientName = activeClient?.name || email.split("@")[0];
              clientMap.set(email, {
                client: clientName,
                email: email,
                total: 0,
                projected: totalProjected,
                payments: [],
              });
            }
          });

          // Sort by combined total (paid + projected, highest first)
          const sortedClients = Array.from(clientMap.values()).sort((a, b) => (b.total + b.projected) - (a.total + a.projected));
          setClientRevenue(sortedClients);
        }
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch(`${getApiBaseUrl()}/admin/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const clientsData = await response.json();
        // Handle both array response and object with clients property
        const clientsArray = Array.isArray(clientsData) ? clientsData : (clientsData.clients || []);
        setClients(clientsArray);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const calculateMonthlyRevenue = (data: BillingDashboardData | null) => {
    const monthsData: Record<string, number> = {};
    const now = new Date();

    // Initialize last 5 months
    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
      monthsData[monthKey] = 0;
    }

    // Calculate revenue from paid invoices
    if (data?.invoices) {
      data.invoices.forEach((invoice: any) => {
        if (invoice.status === "paid" && invoice.paidAt) {
          const paidDate = new Date(invoice.paidAt);
          const monthKey = paidDate.toLocaleDateString("en-US", { year: "numeric", month: "short" });
          if (monthKey in monthsData) {
            monthsData[monthKey] += parseFloat(invoice.total || 0);
          }
        }
      });
    }

    const revenueData = Object.entries(monthsData).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100,
    }));

    setMonthlyRevenue(revenueData);
  };

  useEffect(() => {
    fetchData();
    fetchClients();
    fetchPayments();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch(`${getApiBaseUrl()}/admin/billing/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceForm),
      });

      if (!response.ok) {
        throw new Error("Failed to create invoice");
      }

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      setCreateInvoiceOpen(false);
      setInvoiceForm({ clientId: "", amount: "", description: "", dueDate: "" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch(`${getApiBaseUrl()}/admin/billing/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptionForm),
      });

      if (!response.ok) {
        throw new Error("Failed to create subscription");
      }

      toast({
        title: "Success",
        description: "Subscription created successfully",
      });

      setCreateSubscriptionOpen(false);
      setSubscriptionForm({ clientId: "", amount: "", description: "", interval: "monthly" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    }
  };

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch(`${getApiBaseUrl()}/admin/billing/payment-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentLinkForm),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment link");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: "Payment link created successfully",
      });

      setCreatePaymentLinkOpen(false);
      setPaymentLinkForm({ amount: "", description: "" });
      fetchData();

      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment link",
        variant: "destructive",
      });
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch(`${getApiBaseUrl()}/admin/billing/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quoteForm),
      });

      if (!response.ok) {
        throw new Error("Failed to create quote");
      }

      toast({
        title: "Success",
        description: "Quote created successfully",
      });

      setCreateQuoteOpen(false);
      setQuoteForm({
        clientId: "",
        items: [{ description: "", quantity: 1, rate: 0 }],
        notes: "",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create quote",
        variant: "destructive",
      });
    }
  };

  const handleArchiveItem = (type: BillingItemType, id: string) => {
    setArchivedItems((prev) => {
      const updated = {
        ...prev,
        [type === "invoice" ? "invoices" : type === "subscription" ? "subscriptions" : "paymentLinks"]: new Set(
          prev[type === "invoice" ? "invoices" : type === "subscription" ? "subscriptions" : "paymentLinks"]
        ).add(id),
      };
      saveArchivedToStorage(updated);
      return updated;
    });

    toast({
      title: "Archived",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} archived successfully`,
    });
  };

  const handleUnarchiveItem = (type: BillingItemType, id: string) => {
    setArchivedItems((prev) => {
      const typeKey = type === "invoice" ? "invoices" : type === "subscription" ? "subscriptions" : "paymentLinks";
      const newSet = new Set(prev[typeKey]);
      newSet.delete(id);

      const updated = {
        ...prev,
        [typeKey]: newSet,
      };
      saveArchivedToStorage(updated);
      return updated;
    });

    toast({
      title: "Unarchived",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} restored successfully`,
    });
  };

  const fetchBillableTickets = async () => {
    try {
      setLoadingTickets(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await fetch(`${getApiBaseUrl()}/admin/tickets/billable`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch billable tickets");
      }

      const tickets = await response.json();
      setBillableTickets(tickets);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load billable tickets",
        variant: "destructive",
      });
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleBillableTicketsClick = () => {
    setBillableTicketsOpen(true);
    fetchBillableTickets();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "pending":
        return "secondary";
      case "overdue":
        return "destructive";
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  const activeInvoices = (data?.invoices || []).filter((inv) => !archivedItems.invoices.has(inv.id.toString()));
  const archivedInvoices = (data?.invoices || []).filter((inv) => archivedItems.invoices.has(inv.id.toString()));

  const activeSubscriptions = (data?.subscriptions || []).filter((sub) => !archivedItems.subscriptions.has(sub.id.toString()));
  const archivedSubscriptions = (data?.subscriptions || []).filter((sub) => archivedItems.subscriptions.has(sub.id.toString()));

  const activePaymentLinks = (data?.paymentLinks || []).filter((link) => !archivedItems.paymentLinks.has(link.id.toString()));
  const archivedPaymentLinks = (data?.paymentLinks || []).filter((link) => archivedItems.paymentLinks.has(link.id.toString()));

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Financial</h1>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stripeTotalRevenue !== null ? stripeTotalRevenue : (data?.summary?.totalRevenue || 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Projected</div>
            <div className="text-2xl font-bold text-amber-500">{formatCurrency(projectedTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Avg Monthly</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(avgIncomeData.avg)}</div>
            <div className="text-xs text-muted-foreground mt-1">{avgIncomeData.months} months</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Outstanding</div>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(242.20 + 2752)}</div>
            <div className="text-xs text-muted-foreground mt-1">Agave + DML</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Open Invoices</div>
            <div className="text-2xl font-bold">2</div>
            <div className="text-xs text-muted-foreground mt-1">Agave (1) + DML (1)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Active Clients</div>
            <div className="text-2xl font-bold">{ACTIVE_CLIENTS.length}</div>
            <div className="text-xs text-muted-foreground mt-1">DML, Brian, Agave, CGCC</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Revenue</CardTitle>
            <Select value={revenueTimeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 2 years</SelectItem>
                <SelectItem value="36">Last 3 years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground mt-1 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-green-500"></span>
                Collected: <span className="font-semibold text-green-600">{formatCurrency(stripeTotalRevenue || 0)}</span>
              </span>
              {projectedTotal > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
                  Projected: <span className="font-semibold text-amber-500">{formatCurrency(projectedTotal)}</span>
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const collected = payload.find(p => p.dataKey === "revenue")?.value as number || 0;
                      const projected = payload.find(p => p.dataKey === "projected")?.value as number || 0;

                      // Get client breakdown for this month's projections
                      const clientBreakdown: { client: string; amount: number; note: string }[] = [];

                      // Check PROJECTED_REVENUE for client projections
                      Object.entries(PROJECTED_REVENUE).forEach(([email, projections]) => {
                        projections.forEach((p) => {
                          if (p.month === label) {
                            const activeClient = ACTIVE_CLIENTS.find(c => c.email === email);
                            clientBreakdown.push({
                              client: activeClient?.name || email,
                              amount: p.amount,
                              note: p.note,
                            });
                          }
                        });
                      });

                      // Check MONTHLY_PROJECTED for non-client projections
                      if (MONTHLY_PROJECTED[label]) {
                        MONTHLY_PROJECTED[label].forEach((p) => {
                          clientBreakdown.push({
                            client: "New",
                            amount: p.amount,
                            note: p.note,
                          });
                        });
                      }

                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
                          <div className="font-semibold text-sm mb-2">{label}</div>
                          <div className="space-y-1 mb-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-green-600">Collected</span>
                              <span className="font-medium text-green-600">{formatCurrency(collected)}</span>
                            </div>
                            {projected > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-amber-500">Projected</span>
                                <span className="font-medium text-amber-500">{formatCurrency(projected)}</span>
                              </div>
                            )}
                          </div>
                          {clientBreakdown.length > 0 && (
                            <div className="border-t pt-2 mt-2">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Breakdown:</div>
                              {clientBreakdown.map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-amber-600/80 mb-0.5">
                                  <span className="truncate mr-2" title={item.note}>{item.client}</span>
                                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} name="revenue" />
                <Bar dataKey="projected" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} name="projected">
                  <LabelList
                    dataKey="projected"
                    position="top"
                    formatter={(value: number) => value > 0 ? `+$${value.toLocaleString()}` : ''}
                    style={{ fontSize: 9, fill: '#d97706' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Client - Horizontal Bar Chart */}
      {clientRevenue.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Client</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Ranked by total revenue • Hover for breakdown</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-blue-500"></span> Collected
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-500"></span> Projected
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: Math.max(200, clientRevenue.length * 50) }}>
              <ResponsiveContainer>
                <BarChart
                  data={clientRevenue}
                  layout="vertical"
                  margin={{ top: 5, right: 80, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <YAxis type="category" dataKey="client" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ClientRevenue;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 max-w-xs">
                            <div className="font-semibold text-sm mb-2">{data.client}</div>
                            <div className="text-xs text-muted-foreground mb-2">{data.email}</div>
                            <div className="flex gap-3 mb-2">
                              <div>
                                <div className="text-xs text-muted-foreground">Collected</div>
                                <div className="text-lg font-bold text-green-600">{formatCurrency(data.total)}</div>
                              </div>
                              {data.projected > 0 && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Projected</div>
                                  <div className="text-lg font-bold text-amber-500">{formatCurrency(data.projected)}</div>
                                </div>
                              )}
                            </div>
                            {data.projected > 0 && PROJECTED_REVENUE[data.email] && (
                              <div className="mb-2 text-xs">
                                <div className="font-medium mb-1 text-amber-600">Upcoming:</div>
                                {PROJECTED_REVENUE[data.email].map((p, i) => (
                                  <div key={i} className="flex justify-between text-amber-600/80">
                                    <span>{p.note}</span>
                                    <span>{formatCurrency(p.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="text-xs font-medium mb-1">Payments:</div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {data.payments.map((p, i) => (
                                <div key={i} className="flex justify-between text-xs border-b border-border/50 pb-1">
                                  <span className="text-muted-foreground">
                                    {new Date(p.date).toLocaleDateString()}
                                  </span>
                                  <span className="font-medium">{formatCurrency(p.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Collected">
                    <LabelList
                      position="right"
                      content={({ x, y, width, height, value, index }) => {
                        if (typeof index !== 'number') return null;
                        const item = clientRevenue[index];
                        if (!item) return null;
                        const combined = item.total + item.projected;
                        const hasProjected = item.projected > 0;
                        // Only show label on the rightmost bar
                        if (hasProjected) return null;
                        return (
                          <text
                            x={(x as number) + (width as number) + 5}
                            y={(y as number) + (height as number) / 2 + 4}
                            fill="#666"
                            fontSize={11}
                          >
                            ${combined.toLocaleString()}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                  <Bar dataKey="projected" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Projected">
                    <LabelList
                      position="right"
                      content={({ x, y, width, height, value, index }) => {
                        if (typeof index !== 'number') return null;
                        const item = clientRevenue[index];
                        if (!item || item.projected === 0) return null;
                        const combined = item.total + item.projected;
                        return (
                          <text
                            x={(x as number) + (width as number) + 5}
                            y={(y as number) + (height as number) / 2 + 4}
                            fill="#666"
                            fontSize={11}
                          >
                            ${combined.toLocaleString()}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payment History (Stripe)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payments found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-green-600">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.category === "Invoice" ? "default" : "secondary"}>
                        {payment.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{payment.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Projected Payments */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
                Projected Payments
              </CardTitle>
              <p className="text-sm text-muted-foreground">Upcoming expected revenue</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Annual Subscription Revenue</div>
              <div className="text-lg font-bold text-purple-600">{formatCurrency(142 * 12)}/yr</div>
              <div className="text-xs text-muted-foreground">Agave @ $142/mo</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Client projections */}
              {Object.entries(PROJECTED_REVENUE).flatMap(([email, projections]) => {
                const client = ACTIVE_CLIENTS.find(c => c.email === email);
                return projections.map((p, i) => (
                  <TableRow key={`${email}-${i}`}>
                    <TableCell>{p.month}</TableCell>
                    <TableCell className="font-medium text-amber-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>{client?.name || email}</TableCell>
                    <TableCell className="text-muted-foreground">{p.note}</TableCell>
                  </TableRow>
                ));
              })}
              {/* Monthly projections (not tied to existing clients) */}
              {Object.entries(MONTHLY_PROJECTED).flatMap(([month, projections]) =>
                projections.map((p, i) => (
                  <TableRow key={`monthly-${month}-${i}`}>
                    <TableCell>{month}</TableCell>
                    <TableCell className="font-medium text-amber-600">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>New</TableCell>
                    <TableCell className="text-muted-foreground">{p.note}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreateInvoiceOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Invoice
        </Button>
        <Button onClick={() => setCreateQuoteOpen(true)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Quote
        </Button>
        <Button onClick={() => setCreateSubscriptionOpen(true)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Subscription
        </Button>
        <Button onClick={() => setCreatePaymentLinkOpen(true)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Payment Link
        </Button>
        <Button onClick={handleBillableTicketsClick} variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-1" />
          Billable Tickets
        </Button>
      </div>

      {/* Client Summary */}
      {data?.clientGroups && data.clientGroups.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Billed</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.clientGroups.map((group) => (
                  <TableRow key={group.clientId}>
                    <TableCell className="font-medium">{group.clientName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(group.totalBilled)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(group.totalPaid)}</TableCell>
                    <TableCell className="text-right text-orange-600">{formatCurrency(group.balance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Invoices</CardTitle>
            {archivedInvoices.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowArchived(!showArchived)}>
                {showArchived ? "Show Active" : `Archived (${archivedInvoices.length})`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(showArchived ? archivedInvoices : activeInvoices).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No invoices</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showArchived ? archivedInvoices : activeInvoices).map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.clientName}</TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(invoice.total))}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(invoice); setViewInvoiceOpen(true); }}>
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => showArchived ? handleUnarchiveItem("invoice", invoice.id.toString()) : handleArchiveItem("invoice", invoice.id.toString())}>
                        {showArchived ? <Undo2 className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quotes */}
      {data?.quotes && data.quotes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.clientName}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(quote.total))}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(quote.status)}>{quote.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedQuote(quote); setViewQuoteOpen(true); }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions */}
      {(activeSubscriptions.length > 0 || archivedSubscriptions.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.clientName}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(sub.amount))}</TableCell>
                    <TableCell className="capitalize">{sub.interval}</TableCell>
                    <TableCell>
                      <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment Links */}
      {(activePaymentLinks.length > 0 || archivedPaymentLinks.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Links</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePaymentLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">{link.description}</TableCell>
                    <TableCell>{formatCurrency(parseFloat(link.amount))}</TableCell>
                    <TableCell>
                      <Badge variant={link.status === "active" ? "default" : "secondary"}>{link.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {link.url && (
                        <Button variant="ghost" size="sm" onClick={() => window.open(link.url, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={createInvoiceOpen} onOpenChange={setCreateInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for a client</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div>
              <Label htmlFor="clientId">Client</Label>
              <Select value={invoiceForm.clientId} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, clientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {(clients || []).map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateInvoiceOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={viewInvoiceOpen} onOpenChange={setViewInvoiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client</Label>
                  <div className="font-medium">{selectedInvoice.clientName}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>
                    <Badge variant={getStatusBadgeVariant(selectedInvoice.status)}>{selectedInvoice.status}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <div className="font-medium text-lg">{formatCurrency(parseFloat(selectedInvoice.total))}</div>
                </div>
                <div>
                  <Label>Created</Label>
                  <div>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="mt-1 p-3 bg-muted rounded">{selectedInvoice.description}</div>
              </div>
              {selectedInvoice.stripeInvoiceId && (
                <div>
                  <Label>Stripe Invoice ID</Label>
                  <div className="font-mono text-sm">{selectedInvoice.stripeInvoiceId}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Subscription Dialog */}
      <Dialog open={createSubscriptionOpen} onOpenChange={setCreateSubscriptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subscription</DialogTitle>
            <DialogDescription>Set up recurring billing for a client</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubscription} className="space-y-4">
            <div>
              <Label htmlFor="sub-clientId">Client</Label>
              <Select value={subscriptionForm.clientId} onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, clientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {(clients || []).map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sub-amount">Amount</Label>
              <Input
                id="sub-amount"
                type="number"
                step="0.01"
                value={subscriptionForm.amount}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="sub-description">Description</Label>
              <Textarea
                id="sub-description"
                value={subscriptionForm.description}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, description: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="sub-interval">Billing Interval</Label>
              <Select value={subscriptionForm.interval} onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, interval: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateSubscriptionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Subscription</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Payment Link Dialog */}
      <Dialog open={createPaymentLinkOpen} onOpenChange={setCreatePaymentLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payment Link</DialogTitle>
            <DialogDescription>Generate a one-time payment link</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePaymentLink} className="space-y-4">
            <div>
              <Label htmlFor="link-amount">Amount</Label>
              <Input
                id="link-amount"
                type="number"
                step="0.01"
                value={paymentLinkForm.amount}
                onChange={(e) => setPaymentLinkForm({ ...paymentLinkForm, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="link-description">Description</Label>
              <Textarea
                id="link-description"
                value={paymentLinkForm.description}
                onChange={(e) => setPaymentLinkForm({ ...paymentLinkForm, description: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreatePaymentLinkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Quote Dialog */}
      <Dialog open={createQuoteOpen} onOpenChange={setCreateQuoteOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Quote</DialogTitle>
            <DialogDescription>Create a detailed quote for a client</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateQuote} className="space-y-4">
            <div>
              <Label htmlFor="quote-clientId">Client</Label>
              <Select value={quoteForm.clientId} onValueChange={(value) => setQuoteForm({ ...quoteForm, clientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {(clients || []).map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Line Items</Label>
              {quoteForm.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...quoteForm.items];
                        newItems[index].description = e.target.value;
                        setQuoteForm({ ...quoteForm, items: newItems });
                      }}
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...quoteForm.items];
                        newItems[index].quantity = parseInt(e.target.value) || 0;
                        setQuoteForm({ ...quoteForm, items: newItems });
                      }}
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => {
                        const newItems = [...quoteForm.items];
                        newItems[index].rate = parseFloat(e.target.value) || 0;
                        setQuoteForm({ ...quoteForm, items: newItems });
                      }}
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    {quoteForm.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newItems = quoteForm.items.filter((_, i) => i !== index);
                          setQuoteForm({ ...quoteForm, items: newItems });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuoteForm({
                    ...quoteForm,
                    items: [...quoteForm.items, { description: "", quantity: 1, rate: 0 }],
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>

            <div>
              <Label htmlFor="quote-notes">Notes (Optional)</Label>
              <Textarea
                id="quote-notes"
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                placeholder="Additional notes or terms"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(quoteForm.items.reduce((sum, item) => sum + item.quantity * item.rate, 0))}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateQuoteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Quote</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Quote Dialog */}
      <Dialog open={viewQuoteOpen} onOpenChange={setViewQuoteOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client</Label>
                  <div className="font-medium">{selectedQuote.clientName}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>
                    <Badge variant={getStatusBadgeVariant(selectedQuote.status)}>{selectedQuote.status}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label>Line Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {JSON.parse(selectedQuote.items).map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.quantity * item.rate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedQuote.notes && (
                <div>
                  <Label>Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded whitespace-pre-wrap">{selectedQuote.notes}</div>
                </div>
              )}

              <div className="pt-4 border-t flex justify-between items-center">
                <span className="font-semibold text-lg">Total:</span>
                <span className="text-2xl font-bold">{formatCurrency(parseFloat(selectedQuote.total))}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Billable Tickets Dialog */}
      <Dialog open={billableTicketsOpen} onOpenChange={setBillableTicketsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Billable Tickets</DialogTitle>
            <DialogDescription>Resolved tickets with billable time and suggested amounts</DialogDescription>
          </DialogHeader>

          {loadingTickets ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : billableTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No billable tickets found</div>
          ) : (
            <div className="space-y-4">
              {billableTickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                        <CardDescription className="mt-1">{ticket.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">{ticket.applicationSource}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Deal:</span>
                        <div className="font-medium">{ticket.dealName || "No deal"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time Spent:</span>
                        <div className="font-medium">{ticket.timeSpent}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hourly Rate:</span>
                        <div className="font-medium">{ticket.hourlyRate ? formatCurrency(parseFloat(ticket.hourlyRate)) : "N/A"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Suggested Amount:</span>
                        <div className="font-bold text-green-600">
                          {ticket.billableAmount ? formatCurrency(parseFloat(ticket.billableAmount)) : "N/A"}
                        </div>
                      </div>
                    </div>
                    {ticket.resolvedAt && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Resolved: {new Date(ticket.resolvedAt).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
