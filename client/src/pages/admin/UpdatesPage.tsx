import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Megaphone, Send, Plus, Users, Clock, CheckCircle2, Mail, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useScrollToTop } from "@/hooks/useScrollToTop";

type Deal = {
  id: number;
  name: string;
  clientName: string;
  clientEmail: string;
  stage: string;
};

type SupportTicket = {
  id: number;
  title: string;
  status: string;
  priority: string | null;
  resolution: string | null;
  applicationSource: string;
  dealId: number | null;
  deal?: { name?: string };
};

type Update = {
  id: number;
  title: string;
  content: string;
  category: string;
  sentAt: string | null;
  recipientCount: number;
  createdAt: string;
};

export default function UpdatesPage() {
  useScrollToTop();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("resolved");
  const [selectAll, setSelectAll] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftCategory, setDraftCategory] = useState("announcement");

  // Fetch all deals for recipient selection
  const { data: dealsData, isLoading: dealsLoading } = useQuery<{ success: boolean; data: Deal[] }>({
    queryKey: ["/api/admin/deals"],
  });

  const deals = dealsData?.data || [];

  // Fetch resolved support tickets for result selection
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<{ success: boolean; tickets: SupportTicket[] }>({
    queryKey: ["/api/admin/tickets?limit=200"],
  });

  const tickets = ticketsData?.tickets || [];

  const filteredTickets = useMemo(() => {
    if (ticketStatusFilter === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === ticketStatusFilter);
  }, [tickets, ticketStatusFilter]);

  // Fetch sent updates history
  const { data: updatesData, isLoading: updatesLoading } = useQuery<{ success: boolean; data: Update[] }>({
    queryKey: ["/api/admin/updates"],
  });

  const updates = updatesData?.data || [];

  // Send update mutation
  const sendUpdateMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; dealIds: number[]; ticketIds: number[] }) => {
      const response = await fetch("/api/admin/updates/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to send update");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/updates"] });
      toast({
        title: "Update Sent",
        description: `Successfully sent update to ${selectedDeals.length} deal administrator(s)`,
      });
      setComposeOpen(false);
      setSelectedDeals([]);
      setSelectedTicketIds([]);
      setSelectAll(false);
      setDraftTitle("");
      setDraftContent("");
      setDraftCategory("announcement");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send update",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedDeals(deals.map((d) => d.id));
    } else {
      setSelectedDeals([]);
    }
  };

  const handleDealSelect = (dealId: number, checked: boolean) => {
    if (checked) {
      setSelectedDeals([...selectedDeals, dealId]);
    } else {
      setSelectedDeals(selectedDeals.filter((id) => id !== dealId));
      setSelectAll(false);
    }
  };

  const handleTicketSelect = (ticketId: number, checked: boolean) => {
    if (checked) {
      setSelectedTicketIds([...selectedTicketIds, ticketId]);
    } else {
      setSelectedTicketIds(selectedTicketIds.filter((id) => id !== ticketId));
    }
  };

  const handleSendUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedDeals.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one deal to send the update to",
        variant: "destructive",
      });
      return;
    }

    if (!draftTitle.trim() || !draftContent.trim()) {
      toast({
        title: "Missing details",
        description: "Please include a title and message for the update",
        variant: "destructive",
      });
      return;
    }

    sendUpdateMutation.mutate({
      title: draftTitle,
      content: draftContent,
      category: draftCategory || "announcement",
      dealIds: selectedDeals,
      ticketIds: selectedTicketIds,
    });
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      feature: "bg-emerald-100 text-emerald-800 border-emerald-200",
      announcement: "bg-blue-100 text-blue-800 border-blue-200",
      maintenance: "bg-amber-100 text-amber-800 border-amber-200",
      update: "bg-purple-100 text-purple-800 border-purple-200",
      fixes: "bg-red-100 text-red-800 border-red-200",
      mocks: "bg-cyan-100 text-cyan-800 border-cyan-200",
      progress: "bg-slate-100 text-slate-800 border-slate-200",
    };
    return <Badge className={`${styles[category] || "bg-gray-100 text-gray-800"} px-2.5 py-1 text-xs font-medium`}>{category}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
      in_progress: "bg-amber-100 text-amber-800 border-amber-200",
      pending: "bg-gray-100 text-gray-800 border-gray-200",
      billed: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return <Badge className={`${styles[status] || "bg-gray-100 text-gray-800"} text-[11px] font-medium`}>{status.replace("_", " ")}</Badge>;
  };

  const selectedTicketObjects = tickets.filter((t) => selectedTicketIds.includes(t.id));
  const selectedDealObjects = deals.filter((d) => selectedDeals.includes(d.id));

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-5">
          <h1 className="text-xl font-semibold tracking-tight">Updates & Announcements</h1>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-muted-foreground">{updates.length} sent</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-emerald-600 dark:text-emerald-400">{deals.length} potential recipients</span>
          </div>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-[13px] shadow-sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Compose Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Compose Update</DialogTitle>
              <DialogDescription>Send an update or announcement to selected deal administrators</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendUpdate} className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="space-y-4 py-2">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" value={draftCategory} onValueChange={setDraftCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="feature">New Feature</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="fixes">Bug Fixes & Repairs</SelectItem>
                      <SelectItem value="mocks">Mocks / UX Improvements</SelectItem>
                      <SelectItem value="progress">Progress Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Update title"
                    required
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Message</Label>
                  <Textarea
                    id="content"
                    name="content"
                    rows={7}
                    placeholder="Share the changes, fixes, and results..."
                    required
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                  />
                </div>

                {/* Result items from support tickets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <Label>Results & Repairs</Label>
                      <p className="text-xs text-muted-foreground">Pick resolved or in-progress support tickets to reference in this update.</p>
                    </div>
                    <Select value={ticketStatusFilter} onValueChange={setTicketStatusFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="in_progress">In progress</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="all">All tickets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border rounded-lg max-h-44 overflow-y-auto">
                    {ticketsLoading ? (
                      <div className="p-4 text-sm text-muted-foreground">Loading tickets...</div>
                    ) : filteredTickets.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No tickets found for this filter</div>
                    ) : (
                      <div className="divide-y">
                        {filteredTickets.map((ticket) => (
                          <label key={ticket.id} className="flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                            <Checkbox
                              id={`ticket-${ticket.id}`}
                              checked={selectedTicketIds.includes(ticket.id)}
                              onCheckedChange={(checked) => handleTicketSelect(ticket.id, checked as boolean)}
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{ticket.title}</span>
                                {getStatusBadge(ticket.status)}
                                {ticket.priority && (
                                  <Badge variant="outline" className="text-[11px]">
                                    Priority: {ticket.priority}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {ticket.deal?.name ? `${ticket.deal.name} • ` : ""}
                                Source: {ticket.applicationSource}
                              </p>
                              {ticket.resolution && <p className="text-xs text-muted-foreground">Resolution: {ticket.resolution}</p>}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedTicketIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      <ListChecks className="inline h-4 w-4 mr-1" />
                      {selectedTicketIds.length} result item(s) selected
                    </p>
                  )}
                </div>

                {/* Recipients */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Recipients</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox id="selectAll" checked={selectAll} onCheckedChange={(checked) => handleSelectAll(checked as boolean)} />
                      <Label htmlFor="selectAll" className="text-sm font-normal cursor-pointer">
                        Select All Deals
                      </Label>
                    </div>
                  </div>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {dealsLoading ? (
                      <div className="p-4 text-sm text-muted-foreground">Loading deals...</div>
                    ) : deals.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">No deals available</div>
                    ) : (
                      <div className="divide-y">
                        {deals.map((deal) => (
                          <div key={deal.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                            <Checkbox
                              id={`deal-${deal.id}`}
                              checked={selectedDeals.includes(deal.id)}
                              onCheckedChange={(checked) => handleDealSelect(deal.id, checked as boolean)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={`deal-${deal.id}`} className="font-medium cursor-pointer">
                                {deal.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {deal.clientName} • {deal.clientEmail}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {deal.stage}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedDeals.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      <Users className="inline h-4 w-4 mr-1" />
                      {selectedDeals.length} recipient(s) selected
                    </p>
                  )}
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sendUpdateMutation.isPending || selectedDeals.length === 0}>
                    <Send className="mr-2 h-4 w-4" />
                    {sendUpdateMutation.isPending ? "Sending..." : "Send Update"}
                  </Button>
                </DialogFooter>
              </div>

              {/* Live Preview */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Preview</CardTitle>
                  <CardDescription>See how the update will read for recipients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(draftCategory)}
                    <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{draftTitle || "Untitled update"}</h3>
                    <div className="rounded-md border bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {draftContent || "Your message will appear here. Add details, results, and context for recipients."}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recipients</h4>
                    {selectedDealObjects.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedDealObjects.map((deal) => (
                          <Badge key={deal.id} variant="secondary">
                            {deal.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recipients selected yet</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Results & Repairs</h4>
                    {selectedTicketObjects.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTicketObjects.map((ticket) => (
                          <div key={ticket.id} className="rounded-md border bg-background p-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{ticket.title}</span>
                              {getStatusBadge(ticket.status)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {ticket.deal?.name ? `${ticket.deal.name} • ` : ""}
                              Source: {ticket.applicationSource}
                            </p>
                            {ticket.resolution && <p className="text-xs text-muted-foreground mt-1">Resolution: {ticket.resolution}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Selected ticket results will appear here</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Stats Cards */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="bg-card border border-border/60 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Total Sent</span>
              <Megaphone className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="text-2xl font-semibold mt-1">{updates.length}</div>
          </div>
          <div className="bg-card border border-border/60 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Active Deals</span>
              <Users className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="text-2xl font-semibold mt-1">{deals.length}</div>
          </div>
          <div className="bg-card border border-border/60 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Last Update</span>
              <Clock className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="text-lg font-semibold mt-1">
              {updates.length > 0 ? new Date(updates[0].createdAt).toLocaleDateString() : "—"}
            </div>
            <p className="text-[12px] text-muted-foreground truncate">{updates.length > 0 ? updates[0].title : "No updates yet"}</p>
          </div>
        </div>

      {/* Updates History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Sent Updates
          </CardTitle>
          <CardDescription>History of updates and announcements sent to deal administrators</CardDescription>
        </CardHeader>
        <CardContent>
          {updatesLoading ? (
            <p className="text-sm text-muted-foreground">Loading updates...</p>
          ) : updates.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-dashed">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No updates sent yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start by composing your first update to deal administrators.</p>
              <Button onClick={() => setComposeOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Compose Update
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Recipients</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {updates.map((update) => (
                    <TableRow key={update.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(update.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{update.title}</TableCell>
                      <TableCell>{getCategoryBadge(update.category)}</TableCell>
                      <TableCell className="text-right">{update.recipientCount}</TableCell>
                      <TableCell>
                        {update.sentAt ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
