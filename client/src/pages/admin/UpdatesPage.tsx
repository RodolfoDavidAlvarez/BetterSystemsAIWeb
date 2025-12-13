import { useState } from "react";
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
import { Megaphone, Send, Plus, Users, Clock, CheckCircle2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useScrollToTop } from "@/hooks/useScrollToTop";

type Deal = {
  id: number;
  name: string;
  clientName: string;
  clientEmail: string;
  stage: string;
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
  const [selectAll, setSelectAll] = useState(false);

  // Fetch all deals for recipient selection
  const { data: dealsData, isLoading: dealsLoading } = useQuery<{ success: boolean; data: Deal[] }>({
    queryKey: ["/api/admin/deals"],
  });

  const deals = dealsData?.data || [];

  // Fetch sent updates history
  const { data: updatesData, isLoading: updatesLoading } = useQuery<{ success: boolean; data: Update[] }>({
    queryKey: ["/api/admin/updates"],
  });

  const updates = updatesData?.data || [];

  // Send update mutation
  const sendUpdateMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string; dealIds: number[] }) => {
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
      setSelectAll(false);
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

    const form = event.currentTarget;
    const titleInput = form.elements.namedItem("title") as HTMLInputElement;
    const contentInput = form.elements.namedItem("content") as HTMLTextAreaElement;
    const categorySelect = form.elements.namedItem("category") as HTMLSelectElement;

    sendUpdateMutation.mutate({
      title: titleInput.value,
      content: contentInput.value,
      category: categorySelect?.value || "announcement",
      dealIds: selectedDeals,
    });
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      feature: "bg-emerald-100 text-emerald-800 border-emerald-200",
      announcement: "bg-blue-100 text-blue-800 border-blue-200",
      maintenance: "bg-amber-100 text-amber-800 border-amber-200",
      update: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return <Badge className={`${styles[category] || "bg-gray-100 text-gray-800"} px-2.5 py-1 text-xs font-medium`}>{category}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Communication</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Updates & Announcements</h1>
          </div>
          <p className="text-muted-foreground">Send updates about new changes and features to deal administrators.</p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Compose Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose Update</DialogTitle>
              <DialogDescription>Send an update or announcement to selected deal administrators</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendUpdate}>
              <div className="space-y-4 py-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="announcement">
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="feature">New Feature</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="Update title" required />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Message</Label>
                  <Textarea id="content" name="content" rows={6} placeholder="Write your update message here..." required />
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sendUpdateMutation.isPending || selectedDeals.length === 0}>
                  <Send className="mr-2 h-4 w-4" />
                  {sendUpdateMutation.isPending ? "Sending..." : "Send Update"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Updates Sent</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{updates.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
            <p className="text-xs text-muted-foreground">Potential recipients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {updates.length > 0 ? new Date(updates[0].createdAt).toLocaleDateString() : "—"}
            </div>
            <p className="text-xs text-muted-foreground">{updates.length > 0 ? updates[0].title : "No updates yet"}</p>
          </CardContent>
        </Card>
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
  );
}
