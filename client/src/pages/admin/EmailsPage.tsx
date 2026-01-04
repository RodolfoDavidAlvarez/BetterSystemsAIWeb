import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import { usePersistedState } from "../../hooks/usePersistedState";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { getApiBaseUrl } from "../../lib/queryClient";
import {
  Mail,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Reply,
  Forward,
  Archive,
  Star,
  MoreHorizontal,
  Send,
  Tag,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";

interface EmailLog {
  id: number;
  resendId: string | null;
  gmailId: string | null;
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
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);
  const [activeTab, setActiveTab] = usePersistedState<string>("admin:emails:tab", "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const baseUrl = getApiBaseUrl();

  // Navigate to contacts page with the email pre-selected
  const navigateToContact = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/admin/clients?email=${encodeURIComponent(email)}`);
  };

  useEffect(() => {
    fetchEmails();
    fetchStats();
  }, [activeTab, searchQuery, page]);

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
      params.append("limit", "100");
      if (activeTab === "inbox") params.append("direction", "inbound");
      if (activeTab === "sent") params.append("direction", "outbound");
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

  const handleGmailSync = async () => {
    setIsSyncingGmail(true);
    try {
      const response = await fetch(`${baseUrl}/admin/emails/sync/gmail?limit=100`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to sync Gmail emails");

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Gmail Sync Complete",
          description: data.message || `Synced ${data.data?.totalSynced || 0} emails`,
        });
      } else {
        throw new Error(data.message || "Failed to sync Gmail emails");
      }

      fetchEmails();
      fetchStats();
    } catch (error) {
      console.error("Error syncing Gmail:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sync Gmail emails",
        variant: "destructive",
      });
    } finally {
      setIsSyncingGmail(false);
    }
  };

  const parseEmailAddress = (email: string): { name: string; address: string } => {
    const match = email.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].trim().replace(/^"|"$/g, ""), address: match[2].trim() };
    }
    return { name: email.split("@")[0], address: email };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case "bounced":
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case "opened":
        return <Mail className="h-3.5 w-3.5 text-blue-500" />;
      case "clicked":
        return <ExternalLink className="h-3.5 w-3.5 text-purple-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (email: string) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-emerald-500 to-emerald-600",
      "from-violet-500 to-violet-600",
      "from-amber-500 to-amber-600",
      "from-rose-500 to-rose-600",
      "from-cyan-500 to-cyan-600",
      "from-indigo-500 to-indigo-600",
      "from-pink-500 to-pink-600",
    ];
    const index = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isToday) {
      return format(date, "h:mm a");
    } else if (isThisYear) {
      return format(date, "MMM d");
    }
    return format(date, "MMM d, yyyy");
  };

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        {/* Left Panel - Email List */}
        <div className={cn("flex flex-col border-r transition-all duration-200", selectedEmail ? "w-[50%]" : "w-full")}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-5">
              <h1 className="text-xl font-semibold tracking-tight">Emails</h1>
              <div className="flex items-center gap-2 text-[13px]">
                <span className="text-muted-foreground">{total} emails</span>
                {stats && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{stats.byCategory.inbound || 0} received</span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="text-blue-600 dark:text-blue-400">{stats.byCategory.outbound || 0} sent</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-[13px]" disabled={isSyncingGmail || isSyncing}>
                    <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", (isSyncingGmail || isSyncing) && "animate-spin")} />
                    Sync
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleGmailSync} disabled={isSyncingGmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Gmail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSync("all")} disabled={isSyncing}>
                    <Send className="h-4 w-4 mr-2" />
                    Resend
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/60 bg-muted/30">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex items-center ml-auto">
              {["all", "inbox", "sent"].map((tab, idx) => (
                <Button
                  key={tab}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 text-[13px] font-normal rounded-none border-b-2 border-transparent",
                    activeTab === tab
                      ? "border-b-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    idx === 0 && "rounded-l-md",
                    idx === 2 && "rounded-r-md"
                  )}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                >
                  {tab === "all" ? "All" : tab === "inbox" ? "Inbox" : "Sent"}
                </Button>
              ))}
            </div>
          </div>

          {/* Email Table Header */}
          <div className="grid grid-cols-[auto_1fr_2fr_100px_32px] gap-2 px-4 py-1.5 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
            <div className="w-5"></div>
            <div>From / To</div>
            <div>Subject</div>
            <div className="text-right">Date</div>
            <div></div>
          </div>

          {/* Email List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Mail className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No emails found</p>
              </div>
            ) : (
              <div>
                {emails.map((email) => {
                  const { name, address } = parseEmailAddress(email.from);
                  const isSelected = selectedEmail?.id === email.id;
                  const isInbound = email.category === "inbound";
                  const toAddr = Array.isArray(email.to) ? parseEmailAddress(email.to[0] || "") : { name: "", address: "" };

                  return (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={cn(
                        "grid grid-cols-[auto_1fr_2fr_100px_32px] gap-2 px-4 py-2 cursor-pointer border-b border-border/50 hover:bg-accent/50 transition-colors items-center",
                        isSelected && "bg-accent"
                      )}
                    >
                      {/* Direction Icon */}
                      <div className="w-5 flex justify-center">
                        {isInbound ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                        )}
                      </div>

                      {/* From/To */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-sm font-medium truncate text-primary hover:underline cursor-pointer"
                            onClick={(e) => navigateToContact(isInbound ? address : toAddr.address, e)}
                            title={`View contact: ${isInbound ? address : toAddr.address}`}
                          >
                            {isInbound ? name || address : `To: ${toAddr.name || toAddr.address}`}
                          </span>
                          {getStatusIcon(email.status)}
                        </div>
                        <div
                          className="text-xs text-muted-foreground truncate hover:text-primary hover:underline cursor-pointer"
                          onClick={(e) => navigateToContact(isInbound ? address : parseEmailAddress(email.from).address, e)}
                          title={isInbound ? `View contact: ${address}` : `View sender: ${parseEmailAddress(email.from).address}`}
                        >
                          {isInbound ? address : email.from.includes("<") ? parseEmailAddress(email.from).address : email.from}
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="min-w-0">
                        <div className="text-sm truncate">{email.subject || "(no subject)"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(email.textBody || (email.htmlBody ? stripHtml(email.htmlBody) : "")).slice(0, 80)}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="text-xs text-muted-foreground text-right">
                        {formatDate(email.sentAt)}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Reply className="h-4 w-4 mr-2" />Reply</DropdownMenuItem>
                            <DropdownMenuItem><Forward className="h-4 w-4 mr-2" />Forward</DropdownMenuItem>
                            <DropdownMenuItem><Archive className="h-4 w-4 mr-2" />Archive</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-2 border-t bg-card/50 text-xs">
            <span className="text-muted-foreground">
              {total} emails {stats && `(${stats.byCategory.inbound || 0} in, ${stats.byCategory.outbound || 0} out)`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground mr-2">Page {page}/{totalPages}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Email Preview */}
        {selectedEmail && (
          <div className="flex-1 flex flex-col bg-card overflow-hidden">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <Button variant="ghost" size="sm" className="h-7" onClick={() => setSelectedEmail(null)}>
                <X className="h-3.5 w-3.5 mr-1" />
                Close
              </Button>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Reply className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reply</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Forward className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Forward</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Archive</TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Star className="h-4 w-4 mr-2" />Star</DropdownMenuItem>
                    <DropdownMenuItem><Tag className="h-4 w-4 mr-2" />Add Label</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Email Content */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Subject + Status */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h2 className="text-lg font-semibold">{selectedEmail.subject || "(no subject)"}</h2>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant={selectedEmail.status === "delivered" ? "default" : selectedEmail.status === "bounced" ? "destructive" : "secondary"} className="text-xs">
                      {selectedEmail.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedEmail.category === "inbound" ? "Received" : "Sent"}
                    </Badge>
                  </div>
                </div>

                {/* Sender Info - Compact */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                  {(() => {
                    const { name, address } = parseEmailAddress(selectedEmail.from);
                    return (
                      <>
                        <div
                          className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:ring-2 hover:ring-primary/50 shadow-sm",
                            getAvatarColor(selectedEmail.from)
                          )}
                          onClick={(e) => navigateToContact(address, e)}
                          title={`View contact: ${address}`}
                        >
                          {getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-medium text-sm text-primary hover:underline cursor-pointer"
                              onClick={(e) => navigateToContact(address, e)}
                              title={`View contact: ${address}`}
                            >
                              {name}
                            </span>
                            <span
                              className="text-xs text-muted-foreground hover:text-primary hover:underline cursor-pointer"
                              onClick={(e) => navigateToContact(address, e)}
                            >
                              &lt;{address}&gt;
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {selectedEmail.sentAt && format(new Date(selectedEmail.sentAt), "MMM d, yyyy h:mm a")}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            To:{" "}
                            {Array.isArray(selectedEmail.to) ? (
                              selectedEmail.to.map((toEmail, idx) => {
                                const parsed = parseEmailAddress(toEmail);
                                return (
                                  <span key={toEmail}>
                                    <span
                                      className="hover:text-primary hover:underline cursor-pointer"
                                      onClick={(e) => navigateToContact(parsed.address, e)}
                                    >
                                      {toEmail}
                                    </span>
                                    {idx < selectedEmail.to.length - 1 && ", "}
                                  </span>
                                );
                              })
                            ) : (
                              <span
                                className="hover:text-primary hover:underline cursor-pointer"
                                onClick={(e) => navigateToContact(selectedEmail.to as unknown as string, e)}
                              >
                                {selectedEmail.to}
                              </span>
                            )}
                            {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                              <span className="ml-2">Cc: {selectedEmail.cc.join(", ")}</span>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Email Body */}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {selectedEmail.htmlBody ? (
                    <div
                      className="email-content"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                    />
                  ) : selectedEmail.textBody ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm">{selectedEmail.textBody}</pre>
                  ) : (
                    <p className="text-muted-foreground italic">No content available</p>
                  )}
                </div>

                {/* Metadata Footer */}
                {(selectedEmail.resendId || selectedEmail.gmailId) && (
                  <div className="mt-6 pt-3 border-t text-xs text-muted-foreground flex items-center gap-4">
                    {selectedEmail.gmailId && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        Gmail: {selectedEmail.gmailId.slice(0, 12)}...
                      </span>
                    )}
                    {selectedEmail.resendId && (
                      <span className="flex items-center gap-1.5">
                        <Send className="h-3 w-3" />
                        Resend: {selectedEmail.resendId.slice(0, 12)}...
                      </span>
                    )}
                    {selectedEmail.openedAt && (
                      <span className="flex items-center gap-1.5 text-blue-600">
                        <Mail className="h-3 w-3" />
                        Opened {formatDistanceToNow(new Date(selectedEmail.openedAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
