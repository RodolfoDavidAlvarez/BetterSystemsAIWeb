import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { SEO } from "@/components/SEO";
import { CheckCircle, Clock, Shield, FileText, ArrowRight } from "lucide-react";

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  projectName: string;
  issuedDate: string;
  dueDate: string;
  subtotal: number;
  total: number;
  paymentUrl: string;
  isDiscounted: boolean;
  discountPercent: number;
  discountDeadline: string;
  originalTotal: number;
  savings: number;
  lineItems: {
    description: string;
    detail: string;
    amount: number;
  }[];
  isPaid: boolean;
}

export default function InvoicePaymentPage() {
  const [, params] = useRoute("/pay/:invoiceNumber");
  const invoiceNumber = params?.invoiceNumber || "";
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check if returning from successful payment
  const urlParams = new URLSearchParams(window.location.search);
  const paymentSuccess = urlParams.get("status") === "success";

  useEffect(() => {
    if (!invoiceNumber) return;

    fetch(`/api/pay/${invoiceNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invoice not found");
        return res.json();
      })
      .then((data) => {
        setInvoice(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Invoice not found");
        setLoading(false);
      });
  }, [invoiceNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading invoice...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-500">This invoice does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Success state
  if (paymentSuccess || invoice.isPaid) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <SEO title={`Payment Received — ${invoice.invoiceNumber}`} description="Payment confirmed" />
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Received</h1>
            <p className="text-gray-500 mb-6">
              Thank you, {invoice.clientName}. Your payment for invoice {invoice.invoiceNumber} has been received.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Amount Paid</p>
              <p className="text-2xl font-bold text-gray-900">${invoice.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
            <p className="text-xs text-gray-400 mt-6">A receipt has been sent to your email.</p>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            Better Systems AI &bull; bettersystems.ai
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 py-12">
      <SEO title={`Invoice ${invoice.invoiceNumber} — Better Systems AI`} description="Secure invoice payment" />

      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">Better Systems AI</h2>
          <h1 className="text-sm text-gray-500">Invoice {invoice.invoiceNumber}</h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Discount Banner */}
          {invoice.isDiscounted && (
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Early Payment Discount</p>
                  <p className="text-lg font-bold">{invoice.discountPercent}% off — Save ${formatCurrency(invoice.savings)}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-xs">Pay before</p>
                  <p className="font-semibold">{invoice.discountDeadline}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amount Due */}
          <div className="px-6 py-8 text-center border-b border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Amount Due</p>
            <p className="text-4xl font-bold text-gray-900 tracking-tight">
              ${formatCurrency(invoice.total)}
            </p>
            {invoice.isDiscounted && (
              <p className="text-sm text-gray-400 mt-1 line-through">
                ${formatCurrency(invoice.originalTotal)}
              </p>
            )}
          </div>

          {/* Invoice Details */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-1">Billed To</p>
                <p className="font-medium text-gray-900">{invoice.clientName}</p>
                <p className="text-gray-500 text-xs">{invoice.projectName}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-1">Due Date</p>
                <p className="font-medium text-gray-900">{invoice.dueDate}</p>
                <p className="text-gray-500 text-xs">Net 30</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-6 py-5 border-b border-gray-100">
            <p className="text-xs uppercase tracking-wider font-medium text-gray-400 mb-3">Line Items</p>
            <div className="space-y-3">
              {invoice.lineItems.map((item, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-400">{item.detail}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                    ${formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500">Subtotal</p>
              <p className="text-sm font-semibold text-gray-900 tabular-nums">${formatCurrency(invoice.subtotal)}</p>
            </div>
            {invoice.isDiscounted && (
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm font-medium text-emerald-600">{invoice.discountPercent}% Early Payment Discount</p>
                <p className="text-sm font-semibold text-emerald-600 tabular-nums">-${formatCurrency(invoice.savings)}</p>
              </div>
            )}
          </div>

          {/* Pay Button */}
          <div className="p-6">
            <a
              href={invoice.paymentUrl}
              className="block w-full bg-gray-900 hover:bg-gray-800 text-white text-center py-4 rounded-xl font-semibold text-base transition-colors"
            >
              Pay ${formatCurrency(invoice.total)}
              <ArrowRight className="inline-block ml-2 w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Secure Payment
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> PDF Invoice Attached
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Net 30 Terms
          </span>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 mt-8">
          Better Systems AI &bull; Custom Software & Automation &bull; bettersystems.ai
        </p>
      </div>
    </div>
  );
}
