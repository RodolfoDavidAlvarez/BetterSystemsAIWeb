import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { SEO } from "@/components/SEO";
import { CheckCircle, Clock, Shield, FileText, ArrowRight, Sparkles } from "lucide-react";

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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Invoice Not Found</h1>
          <p className="text-gray-500 text-sm">This invoice does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // Success state
  if (paymentSuccess || invoice.isPaid) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
        <SEO title={`Payment Received — ${invoice.invoiceNumber}`} description="Payment confirmed" />
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00ff88]/10 rounded-full blur-[120px]" />

        <div className="max-w-md w-full text-center relative z-10">
          <div className="bg-[#111118] rounded-2xl border border-[#00ff88]/20 p-10 shadow-[0_0_60px_rgba(0,255,136,0.08)]">
            <div className="w-16 h-16 bg-[#00ff88]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#00ff88]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Received</h1>
            <p className="text-gray-400 mb-6">
              Thank you, {invoice.clientName}. Your payment for invoice {invoice.invoiceNumber} has been confirmed.
            </p>
            <div className="bg-[#0a0a0f] rounded-xl p-5 border border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount Paid</p>
              <p className="text-3xl font-bold text-[#00ff88]">${invoice.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
            <p className="text-xs text-gray-600 mt-6">A receipt has been sent to your email.</p>
          </div>
          <p className="text-xs text-gray-700 mt-8">
            Better Systems AI &bull; bettersystems.ai
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <SEO title={`Invoice ${invoice.invoiceNumber} — Better Systems AI`} description="Secure invoice payment" />

      {/* Ambient background effects */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#00d4ff]/8 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-[#00ff88]/6 rounded-full blur-[80px]" />

      <div className="max-w-lg w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">Better Systems AI</span>
          </div>
          <h1 className="text-sm text-gray-500 font-mono">Invoice {invoice.invoiceNumber}</h1>
        </div>

        {/* Main Card */}
        <div className="bg-[#111118] rounded-2xl border border-white/10 overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]">

          {/* Discount Banner */}
          {invoice.isDiscounted && (
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20" />
              <div className="relative px-6 py-4 border-b border-[#00ff88]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#00ff88]" />
                      <p className="text-[#00ff88] text-xs font-semibold uppercase tracking-wider">Early Payment Discount</p>
                    </div>
                    <p className="text-white text-lg font-bold">
                      {invoice.discountPercent}% off — Save <span className="text-[#00ff88]">${formatCurrency(invoice.savings)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">Pay before</p>
                    <p className="text-white font-semibold text-sm">{invoice.discountDeadline}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amount Due */}
          <div className="px-6 py-10 text-center border-b border-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Amount Due</p>
            <p className="text-5xl font-bold text-white tracking-tight">
              ${formatCurrency(invoice.total)}
            </p>
            {invoice.isDiscounted && (
              <p className="text-sm text-gray-600 mt-2 line-through">
                ${formatCurrency(invoice.originalTotal)}
              </p>
            )}
          </div>

          {/* Invoice Details */}
          <div className="px-6 py-5 border-b border-white/5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 text-xs uppercase tracking-wider font-medium mb-1">Billed To</p>
                <p className="font-medium text-white">{invoice.clientName}</p>
                <p className="text-gray-500 text-xs mt-0.5">{invoice.projectName}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-xs uppercase tracking-wider font-medium mb-1">Due Date</p>
                <p className="font-medium text-white">{invoice.dueDate}</p>
                <p className="text-gray-500 text-xs mt-0.5">Net 30</p>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-6 py-5 border-b border-white/5">
            <p className="text-xs uppercase tracking-wider font-medium text-gray-600 mb-4">Line Items</p>
            <div className="space-y-3">
              {invoice.lineItems.map((item, i) => (
                <div key={i} className="flex justify-between items-start group">
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-medium text-gray-200">{item.description}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.detail}</p>
                  </div>
                  <p className="text-sm font-semibold text-white tabular-nums whitespace-nowrap font-mono">
                    ${formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>

            {/* Subtotal / Discount */}
            <div className="mt-5 pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="text-sm font-semibold text-white tabular-nums font-mono">${formatCurrency(invoice.subtotal)}</p>
              </div>
              {invoice.isDiscounted && (
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-[#00ff88]">{invoice.discountPercent}% Early Payment Discount</p>
                  <p className="text-sm font-semibold text-[#00ff88] tabular-nums font-mono">-${formatCurrency(invoice.savings)}</p>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <p className="text-sm font-semibold text-white">Total Due</p>
                <p className="text-lg font-bold text-white tabular-nums font-mono">${formatCurrency(invoice.total)}</p>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <div className="p-6">
            <a
              href={invoice.paymentUrl}
              className="group block w-full text-center py-4 rounded-xl font-semibold text-base transition-all duration-300 bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-[#0a0a0f] hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] hover:scale-[1.02]"
            >
              Pay ${formatCurrency(invoice.total)}
              <ArrowRight className="inline-block ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <p className="text-center text-xs text-gray-600 mt-3">Powered by Stripe — 256-bit SSL encryption</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#00d4ff]/60" /> Secure Payment
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#00d4ff]/60" /> Invoice {invoice.invoiceNumber}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#00d4ff]/60" /> Net 30 Terms
          </span>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700 mt-6">
          Better Systems AI &bull; Custom Software & Automation &bull; bettersystems.ai
        </p>
      </div>
    </div>
  );
}
