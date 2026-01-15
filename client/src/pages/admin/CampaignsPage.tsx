import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "../../hooks/use-toast";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Send,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Pause,
  Play,
  Trash2,
  User,
  Building2,
  Calendar,
  ChevronRight,
  Target,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { getApiBaseUrl } from "../../lib/queryClient";
import { cn } from "../../lib/utils";
import { format, formatDistanceToNow } from "date-fns";

interface Campaign {
  id: number;
  client_id: number;
  campaign_name: string;
  product_focus: string | null;
  current_step: number;
  max_steps: number;
  status: string;
  last_email_sent_at: string | null;
  next_email_due_at: string | null;
  days_between_emails: number;
  response_detected_at: string | null;
  gmail_thread_id: string | null;
  created_at: string;
  updated_at: string;
  client_name: string;
  client_email: string;
  first_name: string | null;
  industry: string | null;
}

interface CampaignStats {
  total: number;
  active: number;
  responded: number;
  completed: number;
  unactivated: number;
  at_step_1: number;
  at_step_2: number;
  at_step_3: number;
}

const statusConfig: Record<string, { color: string; bgColor: string; icon: typeof CheckCircle2; label: string }> = {
  active: {
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
    icon: Play,
    label: "Active",
  },
  responded: {
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
    icon: MessageSquare,
    label: "Responded",
  },
  completed: {
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    icon: CheckCircle2,
    label: "Completed",
  },
  unactivated: {
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900/40",
    icon: XCircle,
    label: "Unactivated",
  },
};

export default function CampaignsPage() {
  useScrollToTop();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const baseUrl = getApiBaseUrl();

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin/campaigns`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${baseUrl}/admin/campaigns/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleUpdateStatus = async (campaignId: number, newStatus: string) => {
    try {
      const response = await fetch(`${baseUrl}/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: "Updated", description: `Campaign status changed to ${newStatus}` });
        fetchCampaigns();
        fetchStats();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update campaign", variant: "destructive" });
    }
  };

  const handleDelete = async (campaignId: number, clientName: string) => {
    if (!confirm(`Remove ${clientName} from this campaign?`)) return;

    try {
      const response = await fetch(`${baseUrl}/admin/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: "Removed", description: "Campaign removed successfully" });
        if (selectedCampaign?.id === campaignId) setSelectedCampaign(null);
        fetchCampaigns();
        fetchStats();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove campaign", variant: "destructive" });
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  const getStepProgress = (current: number, max: number) => {
    return Array.from({ length: max }, (_, i) => i < current);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel - Campaign List */}
      <div
        className={cn(
          "flex flex-col border-r border-border/60 transition-all duration-300 ease-in-out",
          selectedCampaign ? "w-[60%]" : "w-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Email Campaigns</h1>
              <p className="text-sm text-muted-foreground">
                Automated outreach sequences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                fetchCampaigns();
                fetchStats();
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              className="h-8 bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20"
              onClick={() => navigate("/admin/clients")}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Contacts
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="flex items-center gap-6 px-5 py-3 border-b border-border/60 bg-muted/30">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{stats.total} total</span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{stats.active} active</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">{stats.responded} responded</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm">{stats.unactivated} unactivated</span>
            </div>
            {Number(stats.responded) > 0 && Number(stats.total) > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  {((Number(stats.responded) / Number(stats.total)) * 100).toFixed(1)}% response rate
                </span>
              </div>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-border/40">
          {["all", "active", "responded", "unactivated", "completed"].map((status) => (
            <Button
              key={status}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 text-[13px] font-normal rounded-md",
                statusFilter === status
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "All" : statusConfig[status]?.label || status}
              <span className="ml-1.5 text-[11px] text-muted-foreground">
                {status === "all"
                  ? campaigns.length
                  : campaigns.filter((c) => c.status === status).length}
              </span>
            </Button>
          ))}
        </div>

        {/* Campaign List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground/50" />
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                <Send className="h-8 w-8 text-violet-500 opacity-50" />
              </div>
              <p className="text-sm font-medium">No campaigns found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Add contacts to a campaign from the Contacts page
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate("/admin/clients")}
              >
                Go to Contacts
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredCampaigns.map((campaign) => {
                const isSelected = selectedCampaign?.id === campaign.id;
                const StatusIcon = statusConfig[campaign.status]?.icon || AlertCircle;
                const progress = getStepProgress(campaign.current_step, campaign.max_steps);

                return (
                  <div
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className={cn(
                      "px-5 py-4 cursor-pointer transition-all duration-150 group",
                      isSelected ? "bg-accent/80" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-[15px] truncate">
                            {campaign.client_name}
                          </span>
                          <span
                            className={cn(
                              "flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium",
                              statusConfig[campaign.status]?.bgColor,
                              statusConfig[campaign.status]?.color
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[campaign.status]?.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" />
                            {campaign.client_email}
                          </span>
                          {campaign.industry && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {campaign.industry}
                            </span>
                          )}
                        </div>

                        {/* Progress Steps */}
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            Step {campaign.current_step}/{campaign.max_steps}
                          </span>
                          <div className="flex items-center gap-1">
                            {progress.map((completed, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "w-6 h-1.5 rounded-full transition-colors",
                                  completed
                                    ? "bg-violet-500"
                                    : "bg-muted-foreground/20"
                                )}
                              />
                            ))}
                          </div>
                          {campaign.next_email_due_at && campaign.status === "active" && (
                            <span className="text-[11px] text-muted-foreground ml-2 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Next:{" "}
                              {formatDistanceToNow(new Date(campaign.next_email_due_at), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {campaign.status === "active" ? (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(campaign.id, "completed");
                                }}
                              >
                                <Pause className="h-3.5 w-3.5 mr-2" />
                                Pause Campaign
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(campaign.id, "active");
                                }}
                              >
                                <Play className="h-3.5 w-3.5 mr-2" />
                                Resume Campaign
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/clients?email=${campaign.client_email}`);
                              }}
                            >
                              <User className="h-3.5 w-3.5 mr-2" />
                              View Contact
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(campaign.id, campaign.client_name);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Campaign Detail */}
      {selectedCampaign && (
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          <div className="px-6 py-4 border-b border-border/60 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedCampaign.client_name}</h2>
                <p className="text-sm text-muted-foreground">{selectedCampaign.client_email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCampaign(null)}
              >
                Close
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Status Card */}
              <div className="p-4 rounded-xl border bg-card">
                <h3 className="text-sm font-medium mb-3">Campaign Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      Current Step
                    </p>
                    <p className="text-2xl font-bold text-violet-500">
                      {selectedCampaign.current_step}/{selectedCampaign.max_steps}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      Status
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium mt-1",
                        statusConfig[selectedCampaign.status]?.bgColor,
                        statusConfig[selectedCampaign.status]?.color
                      )}
                    >
                      {statusConfig[selectedCampaign.status]?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-4 rounded-xl border bg-card">
                <h3 className="text-sm font-medium mb-3">Email Timeline</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((step) => {
                    const isSent = step <= selectedCampaign.current_step;
                    const isCurrent = step === selectedCampaign.current_step + 1;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            isSent
                              ? "bg-violet-500 text-white"
                              : isCurrent
                              ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-2 border-violet-500"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isSent ? <CheckCircle2 className="h-4 w-4" /> : step}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              isSent
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            Email {step}
                            {step === 1 && " - Initial Outreach"}
                            {step === 2 && " - Follow-up"}
                            {step === 3 && " - Final Check-in"}
                          </p>
                          {isSent && (
                            <p className="text-xs text-muted-foreground">
                              Sent
                            </p>
                          )}
                          {isCurrent && selectedCampaign.next_email_due_at && (
                            <p className="text-xs text-violet-600 dark:text-violet-400">
                              Due{" "}
                              {formatDistanceToNow(
                                new Date(selectedCampaign.next_email_due_at),
                                { addSuffix: true }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-4 rounded-xl border bg-card">
                <h3 className="text-sm font-medium mb-3">Contact Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${selectedCampaign.client_email}`}
                      className="text-primary hover:underline"
                    >
                      {selectedCampaign.client_email}
                    </a>
                  </div>
                  {selectedCampaign.industry && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCampaign.industry}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Added{" "}
                      {format(new Date(selectedCampaign.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    navigate(`/admin/clients?email=${selectedCampaign.client_email}`)
                  }
                >
                  <User className="h-4 w-4 mr-2" />
                  View Contact
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    (window.location.href = `mailto:${selectedCampaign.client_email}`)
                  }
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
