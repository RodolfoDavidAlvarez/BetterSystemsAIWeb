import { useEffect, useState } from "react";
import { useToast } from "../../hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { getApiBaseUrl } from "../../lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Mail, RefreshCw, Search, ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, Clock, Filter, Download, Eye } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";

interface EmailLog {
  id: number;
  resendId: string | null;
  from: string;
  to: string[];
  cc: string[] | null;
  bcc: string[] | null;
  replyTo: string | null;
  subject: string;
  htmlBody: string | null;
  textBody: string | null;
  status: string;
  lastEvent: string | null;
  category: string;
  tags: string[] | null;
  relatedClientId: number | null;
  relatedDealId: number | null;
  relatedProjectId: number | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailStats {
  total: number;
  recent: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

export default function EmailsPage() {
  useScrollToTop();
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const baseUrl = getApiBaseUrl();

  useEffect(() => {
    fetchEmails();
    fetchStats();
  }, [selectedDirection, selectedStatus, selectedCategory, searchQuery, page]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "50");
      if (selectedDirection !== "all") params.append("direction", selectedDirection);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`${baseUrl}/admin/emails?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch emails");

      const data = await response.json();
      setEmails(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast({
        title: "Error",
        description: "Failed to load emails",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin/emails/stats`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSync = async (type: "all" | "sent" | "received" = "all") => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${baseUrl}/admin/emails/sync?type=${type}&limit=100`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to sync emails");

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sync Complete",
          description: `Synced ${data.data?.totalSynced || 0} emails from Resend`,
        });
      } else if (data.data?.unsupported) {
        toast({
          title: "Sync not available",
          description: data.message || "Resend SDK does not support listing emails. Upgrade SDK or use webhooks to ingest email events.",
          variant: "destructive",
        });
      } else {
        throw new Error(data.message || "Failed to sync emails");
      }

      fetchEmails();
      fetchStats();
    } catch (error) {
      console.error("Error syncing emails:", error);
      toast({
        title: "Error",
        description: "Failed to sync emails",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      sent: { label: "Sent", variant: "default" },
      delivered: { label: "Delivered", variant: "default" },
      received: { label: "Received", variant: "default" },
      bounced: { label: "Bounced", variant: "destructive" },
      complained: { label: "Complained", variant: "destructive" },
      opened: { label: "Opened", variant: "secondary" },
      clicked: { label: "Clicked", variant: "secondary" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDirectionIcon = (category: string) => {
    return category === "outbound" ? <ArrowUpRight className="h-4 w-4 text-blue-500" /> : <ArrowDownLeft className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Logs</h1>
          <p className="text-muted-foreground">View and manage all Better Systems AI domain emails</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSync("all")} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync from Resend"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.recent} in last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outbound</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byCategory.outbound || 0}</div>
              <p className="text-xs text-muted-foreground">Sent emails</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inbound</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byCategory.inbound || 0}</div>
              <p className="text-xs text-muted-foreground">Received emails</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byStatus.delivered || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Email Logs</CardTitle>
          <CardDescription>All emails sent and received for the Better Systems AI domain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by subject, from, or to..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={selectedDirection}
              onValueChange={(value) => {
                setSelectedDirection(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="clicked">Clicked</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email List */}
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading emails...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No emails found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery || selectedDirection !== "all" || selectedStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Sync emails from Resend to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getDirectionIcon(email.category)}
                          <h3 className="font-semibold truncate">{email.subject}</h3>
                          {getStatusBadge(email.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">From:</span> {email.from}
                          </p>
                          <p>
                            <span className="font-medium">To:</span> {Array.isArray(email.to) ? email.to.join(", ") : email.to}
                          </p>
                          {email.sentAt && (
                            <p>
                              {email.category === "outbound" ? "Sent" : "Received"}: {format(new Date(email.sentAt), "PPp")} (
                              {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })})
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmail(email);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing page {page} of {totalPages} ({total} total emails)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEmail && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEmail.subject}</DialogTitle>
                <DialogDescription>Email details and content</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">From</p>
                    <p className="text-sm">{selectedEmail.from}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">To</p>
                    <p className="text-sm">{Array.isArray(selectedEmail.to) ? selectedEmail.to.join(", ") : selectedEmail.to}</p>
                  </div>
                  {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CC</p>
                      <p className="text-sm">{selectedEmail.cc.join(", ")}</p>
                    </div>
                  )}
                  {selectedEmail.replyTo && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Reply To</p>
                      <p className="text-sm">{selectedEmail.replyTo}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedEmail.status)}
                  <Badge variant="outline">{selectedEmail.category}</Badge>
                  {selectedEmail.lastEvent && <Badge variant="outline">Last: {selectedEmail.lastEvent}</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedEmail.sentAt && (
                    <div>
                      <p className="font-medium text-muted-foreground">Sent At</p>
                      <p>{format(new Date(selectedEmail.sentAt), "PPp")}</p>
                    </div>
                  )}
                  {selectedEmail.deliveredAt && (
                    <div>
                      <p className="font-medium text-muted-foreground">Delivered At</p>
                      <p>{format(new Date(selectedEmail.deliveredAt), "PPp")}</p>
                    </div>
                  )}
                  {selectedEmail.openedAt && (
                    <div>
                      <p className="font-medium text-muted-foreground">Opened At</p>
                      <p>{format(new Date(selectedEmail.openedAt), "PPp")}</p>
                    </div>
                  )}
                  {selectedEmail.clickedAt && (
                    <div>
                      <p className="font-medium text-muted-foreground">Clicked At</p>
                      <p>{format(new Date(selectedEmail.clickedAt), "PPp")}</p>
                    </div>
                  )}
                </div>
                {selectedEmail.htmlBody && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Content</p>
                    <div
                      className="border rounded-lg p-4 bg-muted/50 max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                    />
                  </div>
                )}
                {selectedEmail.textBody && !selectedEmail.htmlBody && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Content</p>
                    <div className="border rounded-lg p-4 bg-muted/50 max-h-96 overflow-y-auto whitespace-pre-wrap">{selectedEmail.textBody}</div>
                  </div>
                )}
                {selectedEmail.resendId && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resend ID</p>
                    <p className="text-sm font-mono">{selectedEmail.resendId}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
