import { useEffect, useState } from 'react';
import { Download, ExternalLink, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { getApiBaseUrl } from '../../lib/queryClient';

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
}

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: number;
  clientId: number;
  projectId: number | null;
  invoiceNumber: string;
  description: string | null;
  status: string;
  subtotal: string;
  tax: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  currency: string;
  dueDate: string | null;
  paidAt: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  lineItems: LineItem[] | null;
  createdAt: string;
  updatedAt: string;
  clientName?: string;
}

export default function InvoicePreview({ open, onOpenChange, invoiceId }: InvoicePreviewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceData();
    }
  }, [open, invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const baseUrl = getApiBaseUrl();

      // Since we don't have a single invoice endpoint, fetch from billing dashboard
      const response = await fetch(`${baseUrl}/admin/billing/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success && data.dashboard?.invoices) {
        const found = data.dashboard.invoices.find((inv: Invoice) => inv.id === invoiceId);
        if (found) {
          setInvoice(found);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'draft':
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
      case 'open':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'void':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'uncollectible':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invoice Details</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : invoice ? (
          <div className="space-y-6 pt-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Invoice</p>
                  <h2 className="text-2xl font-bold">{invoice.invoiceNumber}</h2>
                </div>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Amount Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {parseFloat(invoice.tax) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold">{formatCurrency(invoice.total)}</span>
                  </div>
                  {parseFloat(invoice.amountPaid) > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(invoice.amountPaid)}
                      </span>
                    </div>
                  )}
                  {parseFloat(invoice.amountDue) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Due:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(invoice.amountDue)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invoice.lineItems.map((item, index) => (
                      <div key={item.id || index} className="text-sm">
                        <div className="flex justify-between font-medium">
                          <span>{item.description}</span>
                          <span>{formatCurrency(item.amount)}</span>
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-muted-foreground flex justify-between">
                            <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Issued:</span>
                  <span className="font-medium">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due:</span>
                    <span className="font-medium">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {invoice.paidAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {new Date(invoice.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4">
              {invoice.hostedInvoiceUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Stripe
                </Button>
              )}
              {invoice.invoicePdf && (
                <Button
                  variant="outline"
                  onClick={() => window.open(invoice.invoicePdf, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
              {invoice.status === 'open' && (
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reminder
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Invoice not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
