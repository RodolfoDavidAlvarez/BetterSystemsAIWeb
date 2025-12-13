import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Upload,
  Send,
  FileText,
  MessageSquare,
  Download,
  Briefcase,
  DollarSign,
  User,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Sheet, SheetContent } from "../ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import { useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface DealPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: number;
  onDealUpdated?: () => void;
}

type Deal = {
  id: number;
  name: string;
  description?: string;
  value: string;
  stage: string;
  priority: string;
  probability: number;
  nextSteps?: string;
  notes?: string;
  source: "real" | "sample";
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientStatus: string;
  createdAt: string;
  updatedAt: string;
  interactionsCount: number;
  documentsCount: number;
  billing?: {
    total: number;
    paid: number;
    outstanding: number;
  };
  interactions?: any[];
  documents?: any[];
  projects?: any[];
  invoices?: any[];
};

function currency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    lead: "bg-amber-100 text-amber-800 border-amber-200",
    prospect: "bg-blue-100 text-blue-800 border-blue-200",
    proposal: "bg-indigo-100 text-indigo-800 border-indigo-200",
    negotiation: "bg-purple-100 text-purple-800 border-purple-200",
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    won: "bg-green-100 text-green-800 border-green-200",
    lost: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <Badge className={`${map[stage] || "bg-gray-100 text-gray-800"} border px-2.5 py-1 text-xs font-semibold capitalize`}>
      {stage}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-slate-100 text-slate-800 border-slate-200",
  };
  return (
    <Badge variant="outline" className={`${map[priority] || ""} text-xs capitalize`}>
      {priority}
    </Badge>
  );
}

export default function DealPreview({ open, onOpenChange, dealId, onDealUpdated }: DealPreviewProps) {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Fetch deal details
  const { data: dealData, isLoading } = useQuery<{ success: boolean; data: Deal }>({
    queryKey: [`/api/admin/deals/${dealId}`],
    enabled: open && !!dealId,
  });

  const deal = dealData?.data;

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/admin/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      toast({ title: "Success", description: "Document uploaded successfully" });
      setUploadDialogOpen(false);
      setUploadFile(null);
      onDealUpdated?.();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to upload document", variant: "destructive" });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: { subject: string; content: string }) => {
      const response = await fetch(`/api/admin/deals/${dealId}/send-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...emailData, includeDocuments: false, documentIds: [] }),
      });
      if (!response.ok) throw new Error("Failed to send email");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deals/${dealId}`] });
      toast({ title: "Success", description: "Email sent successfully" });
      setEmailDialogOpen(false);
      onDealUpdated?.();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send email", variant: "destructive" });
    },
  });

  const handleUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uploadFile || !deal) return;

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("entityType", "deal");
    formData.append("entityId", deal.id.toString());
    formData.append("category", "general");

    const form = event.currentTarget;
    const titleInput = form.elements.namedItem("title") as HTMLInputElement;
    const descInput = form.elements.namedItem("description") as HTMLTextAreaElement;

    if (titleInput.value) formData.append("title", titleInput.value);
    if (descInput.value) formData.append("description", descInput.value);

    uploadMutation.mutate(formData);
  };

  const handleSendEmail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const subjectInput = form.elements.namedItem("subject") as HTMLInputElement;
    const contentInput = form.elements.namedItem("content") as HTMLTextAreaElement;

    sendEmailMutation.mutate({
      subject: subjectInput.value,
      content: contentInput.value,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : deal ? (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StageBadge stage={deal.stage} />
                    <PriorityBadge priority={deal.priority} />
                  </div>
                  <h2 className="text-xl font-bold truncate">{deal.name}</h2>
                  <p className="text-sm text-muted-foreground">{deal.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{currency(deal.value)}</p>
                  <p className="text-xs text-muted-foreground">{deal.probability}% probability</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-4">
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Email Update</DialogTitle>
                      <DialogDescription>Send an email to {deal.clientName}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendEmail}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input id="subject" name="subject" placeholder={`Update on ${deal.name}`} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="content">Message</Label>
                          <Textarea id="content" name="content" rows={6} placeholder="Enter your message..." required />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={sendEmailMutation.isPending}>
                          <Send className="mr-2 h-4 w-4" />
                          {sendEmailMutation.isPending ? "Sending..." : "Send"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                      <DialogDescription>Upload a document for this deal</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpload}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="file">File</Label>
                          <Input
                            id="file"
                            type="file"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="title">Title (optional)</Label>
                          <Input id="title" name="title" placeholder="Document title" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description (optional)</Label>
                          <Textarea id="description" name="description" rows={3} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={!uploadFile || uploadMutation.isPending}>
                          <Upload className="mr-2 h-4 w-4" />
                          {uploadMutation.isPending ? "Uploading..." : "Upload"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold">{deal.interactionsCount}</p>
                  <p className="text-xs text-muted-foreground">Interactions</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold">{deal.documentsCount}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-center">
                  <p className="text-2xl font-bold">{deal.projects?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
              </div>

              {/* Client Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{deal.clientName}</span>
                    <Badge variant="outline" className="capitalize">{deal.clientStatus}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{deal.clientEmail}</p>
                </CardContent>
              </Card>

              {/* Deal Details */}
              {(deal.description || deal.nextSteps) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deal.description && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{deal.description}</p>
                      </div>
                    )}
                    {deal.nextSteps && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Next Steps</p>
                        <div className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{deal.nextSteps}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Billing Summary */}
              {deal.billing && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold">{currency(deal.billing.total)}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-600">{currency(deal.billing.paid)}</p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-600">{currency(deal.billing.outstanding)}</p>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                      </div>
                    </div>
                    {deal.billing.total > 0 && (
                      <div className="mt-3">
                        <Progress value={(deal.billing.paid / deal.billing.total) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          {Math.round((deal.billing.paid / deal.billing.total) * 100)}% collected
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              {deal.interactions && deal.interactions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {deal.interactions.slice(0, 3).map((interaction: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{interaction.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {interaction.type} • {new Date(interaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {deal.documents && deal.documents.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {deal.documents.slice(0, 3).map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{doc.title}</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Footer Actions */}
              <div className="pt-4 border-t">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    navigate(`/admin/deals/${deal.id}`);
                    onOpenChange(false);
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Full Details
                </Button>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>Created: {new Date(deal.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(deal.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12 h-full text-muted-foreground">
            Deal not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
