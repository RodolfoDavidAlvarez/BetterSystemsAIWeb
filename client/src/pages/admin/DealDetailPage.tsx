import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  FileText,
  Upload,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Download,
  User,
  Briefcase,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Ticket,
  TrendingUp,
  ExternalLink,
  Building,
  Receipt,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STAGES = [
  { id: "lead", label: "Lead" },
  { id: "prospect", label: "Prospect" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "active", label: "Active" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function StatusBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    lead: "bg-amber-50 text-amber-700 border-amber-200",
    prospect: "bg-blue-50 text-blue-700 border-blue-200",
    proposal: "bg-indigo-50 text-indigo-700 border-indigo-200",
    negotiation: "bg-purple-50 text-purple-700 border-purple-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    won: "bg-green-50 text-green-700 border-green-200",
    lost: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <Badge variant="outline" className={`${colors[stage] || "bg-gray-50 text-gray-700"} capitalize font-medium`}>
      {stage}
    </Badge>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    paid: "bg-green-50 text-green-700 border-green-200",
    open: "bg-blue-50 text-blue-700 border-blue-200",
    draft: "bg-gray-50 text-gray-700 border-gray-200",
    void: "bg-red-50 text-red-700 border-red-200",
    uncollectible: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <Badge variant="outline" className={`${colors[status] || "bg-gray-50 text-gray-700"} capitalize text-xs`}>
      {status}
    </Badge>
  );
}

function TicketStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    in_progress: "bg-blue-50 text-blue-700 border-blue-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    billed: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <Badge variant="outline" className={`${colors[status] || "bg-gray-50 text-gray-700"} capitalize text-xs`}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function DealDetailPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const dealId = params.id ? parseInt(params.id) : null;

  const [newInteraction, setNewInteraction] = useState({ type: "note", subject: "", content: "" });
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Fetch deal details
  const { data: dealData, isLoading: dealLoading } = useQuery<{ success: boolean; data: any }>({
    queryKey: [`/api/admin/deals/${dealId}`],
    enabled: !!dealId,
  });

  // Fetch billing summary for this deal
  const { data: billingData } = useQuery<{ success: boolean; data: any }>({
    queryKey: [`/api/admin/billing/deal/${dealId}`],
    enabled: !!dealId,
  });

  // Fetch tickets for this deal
  const { data: ticketsData } = useQuery<{ success: boolean; tickets: any[] }>({
    queryKey: ["/api/admin/tickets", { dealId }],
    enabled: !!dealId,
  });

  const deal = dealData?.data;
  const billing = billingData?.data || {
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    invoices: [],
  };
  const tickets = ticketsData?.tickets || [];

  // Calculate ticket stats
  const ticketStats = {
    total: tickets.length,
    pending: tickets.filter((t: any) => t.status === "pending").length,
    inProgress: tickets.filter((t: any) => t.status === "in_progress").length,
    resolved: tickets.filter((t: any) => t.status === "resolved").length,
    unbilledAmount: tickets
      .filter((t: any) => t.status === "resolved" && !t.billedAt)
      .reduce((sum: number, t: any) => sum + (parseFloat(t.timeSpent || "0") * parseFloat(t.hourlyRate || "65")), 0),
  };

  const updateStageMutation = useMutation({
    mutationFn: async ({ stage }: { stage: string }) => {
      const res = await fetch(`/api/admin/deals/${dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      toast({ title: "Status updated" });
    },
  });

  const addInteractionMutation = useMutation({
    mutationFn: async (data: { type: string; subject: string; content: string }) => {
      const res = await fetch(`/api/admin/deals/${dealId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      setInteractionDialogOpen(false);
      setNewInteraction({ type: "note", subject: "", content: "" });
      toast({ title: "Activity logged" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/admin/documents/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      setUploadDialogOpen(false);
      setUploadFile(null);
      toast({ title: "Document uploaded" });
    },
  });

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadFile || !dealId) return;
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("entityType", "deal");
    formData.append("entityId", dealId.toString());
    formData.append("category", "general");
    const titleInput = e.currentTarget.elements.namedItem("title") as HTMLInputElement;
    if (titleInput?.value) formData.append("title", titleInput.value);
    uploadMutation.mutate(formData);
  };

  if (dealLoading || !deal) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/deals")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold truncate">{deal.name}</h1>
                <StatusBadge stage={deal.stage} />
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">{deal.clientName}</p>
            </div>
            <Select value={deal.stage} onValueChange={(v) => updateStageMutation.mutate({ stage: v })}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Paid</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(billing.totalPaid || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Invoiced</p>
                  <p className="text-xl font-bold">{formatCurrency(billing.totalInvoiced || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Outstanding</p>
                  <p className="text-xl font-bold text-amber-600">{formatCurrency(billing.totalOutstanding || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Unbilled Work</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(ticketStats.unbilledAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Details & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & Deal Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Deal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Primary Contact</p>
                        <p className="font-medium">{deal.clientName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a href={`mailto:${deal.clientEmail}`} className="font-medium text-primary hover:underline text-sm truncate block">
                          {deal.clientEmail}
                        </a>
                      </div>
                    </div>

                    {deal.clientPhone && (
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium text-sm">{deal.clientPhone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Started</p>
                        <p className="font-medium text-sm">{formatDate(deal.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <DollarSign className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Hourly Rate</p>
                        <p className="font-medium text-sm">{deal.hourlyRate ? `$${deal.hourlyRate}/hr` : "$65/hr (default)"}</p>
                      </div>
                    </div>

                    {deal.value && (
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                          <TrendingUp className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Deal Value</p>
                          <p className="font-medium text-sm">{formatCurrency(parseFloat(deal.value) || 0)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {(deal.description || deal.notes) && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{deal.description || deal.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs for Activity, Invoices, Tickets */}
            <Card>
              <Tabs defaultValue="activity" className="w-full">
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="activity" className="text-sm">
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="invoices" className="text-sm">
                      Invoices {billing.invoices?.length > 0 && <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">{billing.invoices.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="text-sm">
                      Tickets {tickets.length > 0 && <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">{tickets.length}</Badge>}
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Activity Tab */}
                  <TabsContent value="activity" className="mt-0">
                    <div className="flex justify-end mb-4">
                      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Log Activity</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Log Activity</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Type</Label>
                              <Select value={newInteraction.type} onValueChange={(v) => setNewInteraction({ ...newInteraction, type: v })}>
                                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="note">Note</SelectItem>
                                  <SelectItem value="call">Call</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="meeting">Meeting</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Subject</Label>
                              <Input className="mt-1.5" value={newInteraction.subject} onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })} />
                            </div>
                            <div>
                              <Label>Details</Label>
                              <Textarea className="mt-1.5" rows={4} value={newInteraction.content} onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })} />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => { if (newInteraction.subject) addInteractionMutation.mutate(newInteraction); }}>
                              Save
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {deal.interactions && deal.interactions.length > 0 ? (
                      <div className="space-y-3">
                        {deal.interactions.map((interaction: any, idx: number) => (
                          <div key={idx} className="relative pl-5 pb-3 last:pb-0 border-l-2 border-muted ml-2">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                            <div className="bg-muted/50 rounded-lg p-3 ml-3">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <p className="font-medium text-sm">{interaction.subject}</p>
                                  <Badge variant="secondary" className="text-xs mt-1 capitalize">{interaction.type}</Badge>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">{formatDate(interaction.createdAt)}</span>
                              </div>
                              {interaction.content && <p className="text-sm text-muted-foreground mt-2">{interaction.content}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm font-medium">No activity yet</p>
                        <p className="text-xs text-muted-foreground">Log calls, emails, and meetings</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Invoices Tab */}
                  <TabsContent value="invoices" className="mt-0">
                    <div className="flex justify-end mb-4">
                      <Button size="sm" variant="outline" onClick={() => navigate("/admin/billing")}>
                        <ExternalLink className="h-4 w-4 mr-1.5" />Go to Billing
                      </Button>
                    </div>

                    {billing.invoices && billing.invoices.length > 0 ? (
                      <div className="space-y-2">
                        {billing.invoices.map((invoice: any) => (
                          <div key={invoice.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <Receipt className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{invoice.number || `INV-${invoice.id?.slice(-6)}`}</p>
                                <InvoiceStatusBadge status={invoice.status} />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {invoice.dueDate ? `Due ${formatDate(invoice.dueDate)}` : "No due date"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(invoice.amount / 100)}</p>
                              {invoice.paidAt && (
                                <p className="text-xs text-green-600">Paid {formatDate(invoice.paidAt)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Receipt className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm font-medium">No invoices yet</p>
                        <p className="text-xs text-muted-foreground">Create invoices from the Billing page</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tickets Tab */}
                  <TabsContent value="tickets" className="mt-0">
                    <div className="flex justify-end mb-4">
                      <Button size="sm" variant="outline" onClick={() => navigate("/admin/tickets")}>
                        <ExternalLink className="h-4 w-4 mr-1.5" />Go to Tickets
                      </Button>
                    </div>

                    {tickets.length > 0 ? (
                      <div className="space-y-2">
                        {tickets.slice(0, 10).map((ticket: any) => (
                          <div key={ticket.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <Ticket className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">#{ticket.id} - {ticket.title}</p>
                                <TicketStatusBadge status={ticket.status} />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {ticket.timeSpent ? `${ticket.timeSpent}h logged` : "No time logged"} | {formatDate(ticket.createdAt)}
                              </p>
                            </div>
                            {ticket.status === "resolved" && !ticket.billedAt && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                Ready to bill
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Ticket className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm font-medium">No tickets yet</p>
                        <p className="text-xs text-muted-foreground">Support tickets will appear here</p>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Documents & Quick Stats */}
          <div className="space-y-6">
            {/* Ticket Stats Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Support Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{ticketStats.pending}</p>
                    <p className="text-xs text-yellow-700">Pending</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{ticketStats.inProgress}</p>
                    <p className="text-xs text-blue-700">In Progress</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{ticketStats.resolved}</p>
                    <p className="text-xs text-green-700">Resolved</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{ticketStats.total}</p>
                    <p className="text-xs text-purple-700">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </CardTitle>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Upload className="h-4 w-4 mr-1.5" />Upload</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                      <form onSubmit={handleUpload}>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>File</Label>
                            <Input type="file" className="mt-1.5" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} required />
                          </div>
                          <div>
                            <Label>Title (optional)</Label>
                            <Input name="title" className="mt-1.5" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={!uploadFile}>Upload</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {deal.documents && deal.documents.length > 0 ? (
                  <div className="space-y-2">
                    {deal.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors group">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.title || doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm font-medium">No documents</p>
                    <p className="text-xs text-muted-foreground">Upload contracts and proposals</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
