import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { useScrollToTop } from '../../hooks/useScrollToTop';
import { getApiBaseUrl } from '../../lib/queryClient';
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  FileText,
  CreditCard,
  Users,
  Plus,
  ExternalLink,
  Download,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

interface BillingDashboardData {
  invoices: any[];
  paymentIntents: any[];
  subscriptions: any[];
  quotes: any[];
  paymentLinks: any[];
  summary: {
    totalRevenue: number;
    totalOutstanding: number;
    totalDraft: number;
    totalInvoices: number;
    totalSubscriptions: number;
  };
}

interface Client {
  id: number;
  name: string;
  email: string;
}

export default function BillingPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dashboardData, setDashboardData] = useState<BillingDashboardData | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  // Dialog states
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [showCreatePaymentLinkDialog, setShowCreatePaymentLinkDialog] = useState(false);

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    description: '',
    lineItems: [{ description: '', amount: '', quantity: '1' }],
    dueDate: '',
    sendImmediately: false,
  });

  // Payment link form state
  const [paymentLinkForm, setPaymentLinkForm] = useState({
    clientId: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    loadDashboard();
    loadClients();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/billing/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load billing dashboard');

      const data = await response.json();
      setDashboardData(data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      const response = await fetch(`${baseUrl}/admin/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load clients');

      const data = await response.json();
      setClients(data.clients || []);
    } catch (error: any) {
      console.error('Error loading clients:', error);
    }
  };

  const syncAllStripeData = async () => {
    try {
      setIsSyncing(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      toast({
        title: 'Syncing...',
        description: 'Downloading all data from Stripe. This may take a moment.',
      });

      const response = await fetch(`${baseUrl}/admin/billing/sync/all`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to sync Stripe data');

      const data = await response.json();

      toast({
        title: 'Sync Complete',
        description: `Synced ${data.results.customers.created + data.results.customers.updated} customers, ${data.results.invoices.created + data.results.invoices.updated} invoices`,
      });

      // Reload dashboard
      await loadDashboard();
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const createInvoice = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      // Validate form
      if (!invoiceForm.clientId || !invoiceForm.description) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Validate line items
      const validLineItems = invoiceForm.lineItems.filter(
        item => item.description && item.amount
      ).map(item => ({
        description: item.description,
        amount: parseFloat(item.amount),
        quantity: parseInt(item.quantity) || 1,
      }));

      if (validLineItems.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please add at least one line item',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${baseUrl}/admin/billing/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: parseInt(invoiceForm.clientId),
          description: invoiceForm.description,
          lineItems: validLineItems,
          dueDate: invoiceForm.dueDate || undefined,
          sendImmediately: invoiceForm.sendImmediately,
        }),
      });

      if (!response.ok) throw new Error('Failed to create invoice');

      const data = await response.json();

      toast({
        title: 'Invoice Created',
        description: invoiceForm.sendImmediately
          ? `Invoice sent to client successfully`
          : `Invoice created successfully`,
      });

      setShowCreateInvoiceDialog(false);
      setInvoiceForm({
        clientId: '',
        description: '',
        lineItems: [{ description: '', amount: '', quantity: '1' }],
        dueDate: '',
        sendImmediately: false,
      });

      await loadDashboard();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const createPaymentLink = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      if (!paymentLinkForm.clientId || !paymentLinkForm.amount || !paymentLinkForm.description) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${baseUrl}/admin/billing/payment-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: parseInt(paymentLinkForm.clientId),
          amount: parseFloat(paymentLinkForm.amount),
          description: paymentLinkForm.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to create payment link');

      const data = await response.json();

      toast({
        title: 'Payment Link Created',
        description: 'Payment link has been generated successfully',
      });

      setShowCreatePaymentLinkDialog(false);
      setPaymentLinkForm({
        clientId: '',
        amount: '',
        description: '',
      });

      await loadDashboard();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addLineItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      lineItems: [...invoiceForm.lineItems, { description: '', amount: '', quantity: '1' }],
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
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      paid: { label: 'Paid', variant: 'default' },
      open: { label: 'Open', variant: 'secondary' },
      draft: { label: 'Draft', variant: 'outline' },
      void: { label: 'Void', variant: 'destructive' },
      uncollectible: { label: 'Uncollectible', variant: 'destructive' },
      succeeded: { label: 'Succeeded', variant: 'default' },
      processing: { label: 'Processing', variant: 'secondary' },
      requires_payment_method: { label: 'Awaiting Payment', variant: 'outline' },
      active: { label: 'Active', variant: 'default' },
      past_due: { label: 'Past Due', variant: 'destructive' },
      canceled: { label: 'Canceled', variant: 'outline' },
    };

    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
            <p className="text-muted-foreground">
              Manage Stripe billing, invoices, and payments
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={syncAllStripeData} disabled={isSyncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Stripe Data'}
            </Button>
            <Button onClick={() => setShowCreateInvoiceDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
            <Button variant="secondary" onClick={() => setShowCreatePaymentLinkDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Payment Link
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.summary.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Paid invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.summary.totalOutstanding || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Unpaid invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboardData?.summary.totalDraft || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Draft invoices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.summary.totalInvoices || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.summary.totalSubscriptions || 0}
              </div>
              <p className="text-xs text-muted-foreground">Recurring revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              All invoices from Stripe ({dashboardData?.invoices.length || 0} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">No invoices found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Sync your Stripe data or create your first invoice
                </p>
                <Button onClick={() => setShowCreateInvoiceDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoiceNumber || `#${invoice.id}`}
                      </TableCell>
                      <TableCell>
                        {clients.find(c => c.id === invoice.clientId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {invoice.description || '-'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {formatCurrency(invoice.amountDue)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.hostedInvoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.invoicePdf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.invoicePdf, '_blank')}
                          >
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

        {/* Subscriptions */}
        {dashboardData?.subscriptions && dashboardData.subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>
                Recurring subscriptions ({dashboardData.subscriptions.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        {clients.find(c => c.id === subscription.clientId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(subscription.amount)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {subscription.intervalCount > 1
                          ? `Every ${subscription.intervalCount} ${subscription.interval}s`
                          : subscription.interval}
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell>
                        {subscription.currentPeriodStart && subscription.currentPeriodEnd
                          ? `${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Payment Links */}
        {dashboardData?.paymentLinks && dashboardData.paymentLinks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Links</CardTitle>
              <CardDescription>
                One-time payment links ({dashboardData.paymentLinks.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.paymentLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>{link.description || '-'}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(link.amount)}
                      </TableCell>
                      <TableCell>
                        {link.active ? (
                          <Badge>Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(link.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateInvoiceDialog} onOpenChange={setShowCreateInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Create and send an invoice to a client via Stripe
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={invoiceForm.clientId} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, clientId: value })}>
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
              {invoiceForm.lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-5"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={item.amount}
                    onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                  />
                  <Button
                    className="col-span-2"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    disabled={invoiceForm.lineItems.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sendImmediately"
                checked={invoiceForm.sendImmediately}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, sendImmediately: e.target.checked })}
              />
              <Label htmlFor="sendImmediately" className="cursor-pointer">
                Send invoice to client immediately
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateInvoiceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createInvoice}>
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payment Link Dialog */}
      <Dialog open={showCreatePaymentLinkDialog} onOpenChange={setShowCreatePaymentLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payment Link</DialogTitle>
            <DialogDescription>
              Generate a one-time payment link for a client
            </DialogDescription>
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
            <Button onClick={createPaymentLink}>
              Create Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
