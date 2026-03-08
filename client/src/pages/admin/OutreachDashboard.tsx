import { useState, useEffect, useMemo } from "react";
import { useToast } from "../../hooks/use-toast";
import {
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Check,
  X,
  Circle,
  MessageSquare,
  Mail,
  Loader2,
  Send,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  company: string;
  company_website: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  employee_count: number | null;
  source: string | null;
  status: string;
  outreach_step: number;
  last_email_sent: string | null;
  last_reply_at: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

interface Metrics {
  total: number;
  new_leads: number;
  contacted: number;
  replied: number;
  bounced: number;
  not_emailed: number;
  step_1: number;
  step_2: number;
  step_3_complete: number;
  sent_today: number;
}

interface Activity {
  sent_today: Lead[];
  queued_next: Lead[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}`,
    "Content-Type": "application/json",
  };
}

function stepLabel(step: number): string {
  if (step === 0) return "Not emailed";
  if (step === 1) return "Email 1";
  if (step === 2) return "Email 2";
  return "Complete";
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

// ─── Main Component ─────────────────────────────────────────────────

export default function OutreachDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterStep, setFilterStep] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [leadsRes, metricsRes, activityRes] = await Promise.all([
        fetch("/api/admin/cold-outreach/new-leads", { headers: getAuthHeaders() }),
        fetch("/api/admin/cold-outreach/new-leads/metrics", { headers: getAuthHeaders() }),
        fetch("/api/admin/leads/activity", { headers: getAuthHeaders() }),
      ]);

      const leadsData = await leadsRes.json();
      const metricsData = await metricsRes.json();

      if (leadsData.success) setLeads(leadsData.leads);
      if (metricsData.success) setMetrics(metricsData.metrics);

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        if (activityData.success) setActivity(activityData);
      }
    } catch (err) {
      console.error("Failed to fetch outreach data:", err);
      toast({ title: "Error", description: "Failed to load outreach data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateLead = async (id: number, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data.lead } : l)));
        // Refresh metrics
        const metricsRes = await fetch("/api/admin/cold-outreach/new-leads/metrics", {
          headers: getAuthHeaders(),
        });
        const metricsData = await metricsRes.json();
        if (metricsData.success) setMetrics(metricsData.metrics);
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update lead", variant: "destructive" });
    }
  };

  // Filtered leads
  const filtered = useMemo(() => {
    let result = leads;
    if (filterStatus) result = result.filter((l) => l.status === filterStatus);
    if (filterStep !== null) result = result.filter((l) => l.outreach_step === filterStep);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.first_name?.toLowerCase().includes(q) ||
          l.last_name?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.state?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, filterStatus, filterStep, searchQuery]);

  const replies = leads.filter((l) => l.status === "replied");
  const bounces = leads.filter((l) => l.status === "bounced");
  const sentToday = activity?.sent_today || [];
  const queuedNext = activity?.queued_next || [];

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Outreach</h1>
          <button
            onClick={fetchAll}
            className="p-2 rounded-full hover:bg-muted active:bg-muted/80 transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <div className="px-4 mt-4 space-y-4">
          {/* Metrics Row */}
          {metrics && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border bg-card p-3">
                <span className="text-xs text-muted-foreground">Total</span>
                <div className="text-2xl font-bold">{metrics.total}</div>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <span className="text-xs text-muted-foreground">Contacted</span>
                <div className="text-2xl font-bold">{metrics.contacted}</div>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <span className="text-xs text-muted-foreground">Today</span>
                <div className="text-2xl font-bold">{metrics.sent_today}</div>
              </div>
            </div>
          )}

          {/* Pipeline */}
          {metrics && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex">
                {[
                  { step: 0, label: "New", count: Number(metrics.not_emailed) },
                  { step: 1, label: "Email 1", count: Number(metrics.step_1) },
                  { step: 2, label: "Email 2", count: Number(metrics.step_2) },
                  { step: 3, label: "Done", count: Number(metrics.step_3_complete) },
                ].map((stage, i) => {
                  const isActive = filterStep === stage.step;
                  return (
                    <button
                      key={stage.step}
                      onClick={() => setFilterStep(isActive ? null : stage.step)}
                      className={`flex-1 py-3 text-center transition-colors ${
                        i > 0 ? "border-l border-border" : ""
                      } ${isActive ? "bg-primary/10" : "hover:bg-muted/50 active:bg-muted"}`}
                    >
                      <div className="text-lg font-bold">{stage.count}</div>
                      <div className="text-[11px] text-muted-foreground">{stage.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Replies Alert */}
          {replies.length > 0 && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </span>
              </div>
              <div className="space-y-1.5">
                {replies.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/80">
                      {lead.first_name} {lead.last_name}
                      <span className="text-muted-foreground ml-1.5">- {lead.company}</span>
                    </span>
                    {lead.last_reply_at && (
                      <span className="text-xs text-muted-foreground">{timeAgo(lead.last_reply_at)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bounces Alert */}
          {bounces.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <X className="h-4 w-4 text-red-500" />
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {bounces.length} bounced
                </span>
              </div>
              <div className="space-y-1">
                {bounces.map((lead) => (
                  <div key={lead.id} className="text-sm text-muted-foreground">
                    {lead.email} — {lead.company}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Activity */}
          {(sentToday.length > 0 || queuedNext.length > 0) && (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              {sentToday.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Send className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Sent today ({sentToday.length})
                    </span>
                  </div>
                  {sentToday.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="text-sm py-0.5 text-foreground/80">
                      {lead.first_name} {lead.last_name}
                      <span className="text-muted-foreground ml-1.5">- {lead.company}</span>
                    </div>
                  ))}
                </div>
              )}

              {queuedNext.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Next up ({queuedNext.length})
                    </span>
                  </div>
                  {queuedNext.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="text-sm py-0.5 text-foreground/80">
                      {lead.first_name} {lead.last_name}
                      <span className="text-muted-foreground ml-1.5">
                        - {lead.company}, {lead.state}
                      </span>
                    </div>
                  ))}
                  {queuedNext.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{queuedNext.length - 5} more</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Filters */}
          <div className="flex flex-wrap gap-1.5">
            {(["new", "contacted", "replied", "bounced", "unsubscribed", "client"] as const).map((s) => {
              const count = leads.filter((l) => l.status === s).length;
              if (count === 0) return null;
              const isActive = filterStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(isActive ? null : s)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s} ({count})
                </button>
              );
            })}
            {(filterStatus || filterStep !== null) && (
              <button
                onClick={() => { setFilterStatus(null); setFilterStep(null); }}
                className="px-2.5 py-1 rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Count */}
          <span className="text-xs text-muted-foreground">{filtered.length} leads</span>

          {/* Lead List */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{searchQuery ? "No matches" : "No leads loaded"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((lead) => {
                const isExpanded = expandedId === lead.id;
                return (
                  <div key={lead.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    {/* Row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                      className="w-full text-left p-4 active:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base leading-tight truncate">
                            {lead.first_name} {lead.last_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{lead.company}</span>
                            {lead.state && (
                              <>
                                <span className="opacity-30">|</span>
                                <span>{lead.state}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              lead.status === "replied"
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : lead.status === "bounced"
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : lead.status === "contacted"
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : "bg-muted text-muted-foreground"
                            }`}>
                              {stepLabel(lead.outreach_step)}
                            </span>
                            {lead.last_email_sent && (
                              <div className="text-[10px] text-muted-foreground mt-1">
                                {timeAgo(lead.last_email_sent)}
                              </div>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t space-y-3">
                        {/* Details */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-3 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Email</span>
                            <div className="truncate">{lead.email}</div>
                          </div>
                          {lead.phone && (
                            <div>
                              <span className="text-muted-foreground text-xs">Phone</span>
                              <div>{lead.phone}</div>
                            </div>
                          )}
                          {lead.title && (
                            <div>
                              <span className="text-muted-foreground text-xs">Title</span>
                              <div className="truncate">{lead.title}</div>
                            </div>
                          )}
                          {lead.city && (
                            <div>
                              <span className="text-muted-foreground text-xs">Location</span>
                              <div>{lead.city}, {lead.state}</div>
                            </div>
                          )}
                          {lead.industry && (
                            <div>
                              <span className="text-muted-foreground text-xs">Industry</span>
                              <div className="truncate">{lead.industry}</div>
                            </div>
                          )}
                          {lead.employee_count && (
                            <div>
                              <span className="text-muted-foreground text-xs">Employees</span>
                              <div>{lead.employee_count}</div>
                            </div>
                          )}
                          {lead.company_website && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground text-xs">Website</span>
                              <div className="truncate">
                                <a
                                  href={lead.company_website.startsWith("http") ? lead.company_website : `https://${lead.company_website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {lead.company_website}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {editingNote === lead.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add a note..."
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  updateLead(lead.id, { notes: noteText });
                                  setEditingNote(null);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingNote(null)}
                                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : lead.notes ? (
                          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                            {lead.notes}
                          </div>
                        ) : null}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {lead.status !== "replied" && (
                            <button
                              onClick={() => updateLead(lead.id, { status: "replied" })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 active:bg-green-500/30 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Replied
                            </button>
                          )}
                          {lead.status !== "bounced" && (
                            <button
                              onClick={() => updateLead(lead.id, { status: "bounced" })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                              Bounced
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingNote(lead.id);
                              setNoteText(lead.notes || "");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted active:bg-muted/80 transition-colors"
                          >
                            <Circle className="h-3.5 w-3.5" />
                            {lead.notes ? "Edit note" : "Add note"}
                          </button>
                        </div>

                        <div className="text-[10px] text-muted-foreground pt-1">
                          Added {format(new Date(lead.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
