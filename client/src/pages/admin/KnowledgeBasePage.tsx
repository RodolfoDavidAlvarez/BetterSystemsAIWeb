import { useState, useEffect, useCallback, useMemo } from "react";
import { useScrollToTop } from "../../hooks/useScrollToTop";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Search, Plus, Clock, ChevronRight,
  Calendar, FileText, X, Check,
  Circle, Pause, Archive, Eye, EyeOff,
  MoreHorizontal, Copy, CheckCheck
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface Recording {
  id: number;
  title: string;
  duration_seconds: number;
  transcription_status: string;
  transcript: string | null;
  summary: string | null;
  language: string | null;
  recorded_at: string | null;
  created_at: string;
  tags: string[] | null;
  metadata: any;
}

interface KBEntry {
  id: number;
  title: string;
  content: string;
  content_type: string;
  company: string;
  project: string | null;
  category: string | null;
  tags: string[] | null;
  source: string;
  status: string;
  pinned: boolean;
  event_date: string | null;
  created_at: string;
}

interface ActionItem {
  id: number;
  title: string;
  description: string | null;
  assigned_to: string | null;
  company: string;
  project: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  recording_id: number | null;
  source: string;
  created_at: string;
}

type TabType = "recordings" | "knowledge" | "actions";

// Action statuses with labels
const ACTION_STATUSES = [
  { value: "pending", label: "Active", icon: Circle },
  { value: "in_progress", label: "In Progress", icon: Clock },
  { value: "snoozed", label: "Later", icon: Pause },
  { value: "completed", label: "Done", icon: Check },
  { value: "dismissed", label: "Dismiss", icon: EyeOff },
] as const;

const API_BASE = "/api/admin/knowledge-base";

// ─── Helpers ────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function extractPeople(metadata: any): string[] {
  if (!metadata) return [];
  const items = Array.isArray(metadata) ? metadata : [metadata];
  const people = new Set<string>();
  for (const item of items) {
    const obj = typeof item === "string" ? (() => { try { return JSON.parse(item); } catch { return null; } })() : item;
    if (!obj) continue;
    if (obj.people) {
      for (const p of obj.people) {
        if (p && !p.startsWith("Speaker ") && p !== "Rodo") people.add(p);
      }
    }
    if (obj.speakers) {
      for (const s of obj.speakers) {
        if (s && !s.startsWith("Speaker ")) people.add(s);
      }
    }
  }
  return Array.from(people).slice(0, 6);
}

function extractTopics(metadata: any): string[] {
  if (!metadata) return [];
  const items = Array.isArray(metadata) ? metadata : [metadata];
  for (const item of items) {
    const obj = typeof item === "string" ? (() => { try { return JSON.parse(item); } catch { return null; } })() : item;
    if (obj?.topics) return obj.topics.slice(0, 4);
  }
  return [];
}

function guessCompany(title: string, topics: string[]): string[] {
  const text = (title + " " + topics.join(" ")).toLowerCase();
  const companies: string[] = [];
  const sswKeywords = ["compost", "soil", "pistachio", "orchard", "extract", "gypsum", "alfalfa", "potting", "wood chip", "fba", "amazon", "backhaul", "worm", "ssw", "seed", "water"];
  const bsaKeywords = ["crm", "website", "api", "fleet", "invoice", "stripe", "bsa", "better systems", "cold outreach", "compost developer", "newsletter"];
  const personalKeywords = ["household", "personal", "chores", "expense", "communication"];
  if (sswKeywords.some(k => text.includes(k))) companies.push("SSW");
  if (bsaKeywords.some(k => text.includes(k))) companies.push("BSA");
  if (personalKeywords.some(k => text.includes(k))) companies.push("Personal");
  return companies.length > 0 ? companies : [];
}

// ─── Main Component ─────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  useScrollToTop();

  const [activeTab, setActiveTab] = useState<TabType>("recordings");
  const [searchQuery, setSearchQuery] = useState("");
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [kbEntries, setKbEntries] = useState<KBEntry[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("active"); // active | all | snoozed | completed | dismissed

  // Forms
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", content: "", content_type: "note", company: "bsa", project: "", category: "" });
  const [showNewAction, setShowNewAction] = useState(false);
  const [newAction, setNewAction] = useState({ title: "", description: "", company: "bsa", project: "", priority: "medium", assigned_to: "", due_date: "" });

  const token = localStorage.getItem("authToken") || localStorage.getItem("token");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [recRes, kbRes, actRes] = await Promise.all([
        fetch("/api/admin/recordings", { headers }),
        fetch(`${API_BASE}/entries`, { headers }),
        fetch(`${API_BASE}/actions`, { headers }),
      ]);

      if (recRes.ok) {
        const d = await recRes.json();
        setRecordings(Array.isArray(d) ? d : (d.recordings || []));
      }
      if (kbRes.ok) {
        const d = await kbRes.json();
        setKbEntries(Array.isArray(d) ? d : (d.entries || []));
      }
      if (actRes.ok) {
        const d = await actRes.json();
        setActionItems(Array.isArray(d) ? d : (d.actions || []));
      }
    } catch (e) {
      console.error("Failed to fetch:", e);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { fetchData(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─── CRUD ──────────────────────────────────────────────────

  const createKBEntry = async () => {
    if (!newEntry.title.trim()) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/entries`, { method: "POST", headers, body: JSON.stringify(newEntry) });
    if (res.ok) { setNewEntry({ title: "", content: "", content_type: "note", company: "bsa", project: "", category: "" }); setShowNewEntry(false); fetchData(); }
  };

  const createActionItem = async () => {
    if (!newAction.title.trim()) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/actions`, { method: "POST", headers, body: JSON.stringify({ ...newAction, due_date: newAction.due_date || null }) });
    if (res.ok) { setNewAction({ title: "", description: "", company: "bsa", project: "", priority: "medium", assigned_to: "", due_date: "" }); setShowNewAction(false); fetchData(); }
  };

  const updateActionStatus = async (id: number, status: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    await fetch(`${API_BASE}/actions/${id}`, { method: "PUT", headers, body: JSON.stringify({ status }) });
    setActionMenuId(null);
    fetchData();
  };

  // ─── Computed ──────────────────────────────────────────────

  const sortedRecordings = useMemo(() =>
    [...recordings].sort((a, b) => {
      const dateA = a.recorded_at ? new Date(a.recorded_at).getTime() : 0;
      const dateB = b.recorded_at ? new Date(b.recorded_at).getTime() : 0;
      return dateB - dateA;
    }),
  [recordings]);

  const filtered = {
    recordings: sortedRecordings.filter(r =>
      !searchQuery || r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.transcript?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    knowledge: kbEntries.filter(k =>
      !searchQuery || k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    actions: actionItems.filter(a =>
      !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.project?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  };

  // Filter actions by status tab
  const filteredActions = useMemo(() => {
    let items = filtered.actions;
    switch (actionFilter) {
      case "active": return items.filter(a => a.status === "pending" || a.status === "in_progress");
      case "snoozed": return items.filter(a => a.status === "snoozed");
      case "completed": return items.filter(a => a.status === "completed");
      case "dismissed": return items.filter(a => a.status === "dismissed");
      default: return items;
    }
  }, [filtered.actions, actionFilter]);

  const actionsByRecording = useMemo(() => {
    const map = new Map<number, ActionItem[]>();
    for (const a of actionItems) {
      if (a.recording_id) {
        const list = map.get(a.recording_id) || [];
        list.push(a);
        map.set(a.recording_id, list);
      }
    }
    return map;
  }, [actionItems]);

  const stats = {
    totalRecordings: recordings.length,
    transcribed: recordings.filter(r => r.transcription_status === "completed").length,
    totalHours: Math.round(recordings.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / 3600 * 10) / 10,
    kbEntries: kbEntries.length,
    pendingActions: actionItems.filter(a => a.status === "pending" || a.status === "in_progress").length,
    completedActions: actionItems.filter(a => a.status === "completed").length,
    snoozedActions: actionItems.filter(a => a.status === "snoozed").length,
    dismissedActions: actionItems.filter(a => a.status === "dismissed").length,
  };

  const activeActionCount = stats.pendingActions;

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 max-w-[1200px] mx-auto" onClick={() => actionMenuId && setActionMenuId(null)}>

      {/* ── Header ── */}
      <div className="mb-5 sm:mb-8">
        <h1 className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.02em] text-foreground">
          Knowledge Base
        </h1>
        <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5">
          {stats.totalRecordings} recordings &middot; {stats.totalHours}h captured &middot; {stats.pendingActions} pending
        </p>
      </div>

      {/* ── Tabs + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 border-b border-border/60 mb-4 sm:mb-6">
        <div className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar">
          {([
            { key: "recordings" as TabType, label: "Recordings", count: filtered.recordings.length },
            { key: "knowledge" as TabType, label: "Knowledge", count: filtered.knowledge.length },
            { key: "actions" as TabType, label: "Actions", count: activeActionCount },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-[13px] sm:text-[13px] font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 text-muted-foreground/60">{tab.count}</span>
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-foreground rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="sm:ml-auto relative pb-3 sm:pb-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 sm:top-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-9 sm:h-8 w-full sm:w-48 pl-8 pr-7 rounded-md bg-muted/40 border-0 text-[14px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-border"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-5 w-5 border-[1.5px] border-muted-foreground/20 border-t-foreground/60 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ═══════════ RECORDINGS ═══════════ */}
          {activeTab === "recordings" && (
            <div>
              {filtered.recordings.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground/50">
                  <p className="text-[13px]">No recordings found</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filtered.recordings.map(rec => {
                    const people = extractPeople(rec.metadata);
                    const topics = extractTopics(rec.metadata);
                    const companies = guessCompany(rec.title || "", topics);
                    const recActions = actionsByRecording.get(rec.id) || [];
                    const isExpanded = expandedId === rec.id;
                    const activeRecActions = recActions.filter(a => a.status === "pending" || a.status === "in_progress");

                    return (
                      <div key={rec.id} className="group">
                        {/* Row */}
                        <div
                          className="flex items-start gap-2.5 sm:gap-4 py-3.5 sm:py-4 cursor-pointer select-none hover:bg-muted/20 -mx-2 sm:-mx-3 px-2 sm:px-3 rounded-lg transition-colors active:bg-muted/30"
                          onClick={() => { setExpandedId(isExpanded ? null : rec.id); setShowTranscript(false); }}
                        >
                          {/* Chevron */}
                          <ChevronRight className={`h-4 w-4 text-muted-foreground/30 mt-0.5 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Title row */}
                            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                              <h3 className="text-[13px] sm:text-[14px] font-medium text-foreground leading-snug line-clamp-2 sm:truncate sm:max-w-[560px]">
                                {rec.title || `Recording #${rec.id}`}
                              </h3>
                              {companies.map(c => (
                                <span key={c} className="text-[9px] sm:text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">{c}</span>
                              ))}
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-[11px] sm:text-[12px] text-muted-foreground/60 flex-wrap">
                              <span>{formatDuration(rec.duration_seconds)}</span>
                              <span className="text-muted-foreground/20">/</span>
                              <span>{timeAgo(rec.recorded_at)}</span>
                              {rec.language && (
                                <>
                                  <span className="hidden sm:inline text-muted-foreground/20">/</span>
                                  <span className="hidden sm:inline uppercase text-[10px] tracking-wider">{rec.language === "english" ? "EN" : rec.language === "auto" ? "EN" : rec.language?.substring(0, 2).toUpperCase()}</span>
                                </>
                              )}
                              {activeRecActions.length > 0 && (
                                <>
                                  <span className="text-muted-foreground/20">/</span>
                                  <span className="text-foreground/50">{activeRecActions.length} action{activeRecActions.length !== 1 ? "s" : ""}</span>
                                </>
                              )}
                            </div>

                            {/* People */}
                            {people.length > 0 && (
                              <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 flex-wrap">
                                {people.map(p => (
                                  <span key={p} className="text-[10px] sm:text-[11px] text-muted-foreground/70 bg-muted/50 px-1.5 py-px rounded">{p}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Status dot */}
                          <div className="shrink-0 mt-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${
                              rec.transcription_status === "completed" ? "bg-emerald-400/60" : "bg-amber-400/60"
                            }`} />
                          </div>
                        </div>

                        {/* Expanded */}
                        {isExpanded && (
                          <div className="pl-4 sm:pl-8 pr-1 sm:pr-3 pb-4 sm:pb-5 space-y-3 sm:space-y-4">
                            {/* Topics */}
                            {topics.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {topics.map(t => (
                                  <span key={t} className="text-[11px] text-muted-foreground/50 border border-border/40 px-2 py-0.5 rounded-full">{t}</span>
                                ))}
                              </div>
                            )}

                            {/* Action items for recording */}
                            {recActions.length > 0 && (
                              <div>
                                <div className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-2">
                                  Actions
                                </div>
                                <div className="space-y-1">
                                  {recActions.map(a => (
                                    <div key={a.id} className="flex items-center gap-2.5 py-1 group/action">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); updateActionStatus(a.id, a.status === "completed" ? "pending" : "completed"); }}
                                        className={`shrink-0 h-[15px] w-[15px] rounded-[4px] border transition-all flex items-center justify-center ${
                                          a.status === "completed"
                                            ? "bg-foreground/80 border-foreground/80"
                                            : a.status === "dismissed" || a.status === "snoozed"
                                            ? "border-border/40 bg-muted/30"
                                            : "border-border/60 hover:border-foreground/30"
                                        }`}
                                      >
                                        {a.status === "completed" && <Check className="h-2.5 w-2.5 text-background" />}
                                      </button>
                                      <span className={`text-[13px] flex-1 ${
                                        a.status === "completed" ? "line-through text-muted-foreground/30" :
                                        a.status === "dismissed" ? "text-muted-foreground/30" :
                                        a.status === "snoozed" ? "text-muted-foreground/50 italic" :
                                        "text-foreground/80"
                                      }`}>
                                        {a.title}
                                      </span>
                                      {a.priority === "urgent" && a.status === "pending" && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-400/70 shrink-0" />
                                      )}
                                      {a.priority === "high" && a.status === "pending" && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400/50 shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Summary */}
                            {rec.summary && (
                              <div>
                                <div className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-2">
                                  Summary
                                </div>
                                <p className="text-[13px] leading-relaxed text-foreground/60 max-h-36 overflow-y-auto">
                                  {typeof rec.summary === "string" && rec.summary.startsWith("{") ? (() => {
                                    try { const s = JSON.parse(rec.summary); return s.ai_content || rec.summary; } catch { return rec.summary; }
                                  })() : rec.summary}
                                </p>
                              </div>
                            )}

                            {/* Transcript */}
                            {rec.transcript && (
                              <div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShowTranscript(!showTranscript); }}
                                    className="text-[11px] font-medium text-muted-foreground/40 uppercase tracking-widest hover:text-muted-foreground/60 transition-colors flex items-center gap-1.5"
                                  >
                                    {showTranscript ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    {showTranscript ? "Hide transcript" : "Show transcript"}
                                    <span className="normal-case tracking-normal font-normal">({Math.round(rec.transcript.length / 1000)}k chars)</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(rec.transcript || "").then(() => {
                                        setCopiedId(rec.id);
                                        setTimeout(() => setCopiedId(null), 2000);
                                      });
                                    }}
                                    className="text-[11px] font-medium text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors flex items-center gap-1 uppercase tracking-widest"
                                  >
                                    {copiedId === rec.id ? (
                                      <>
                                        <CheckCheck className="h-3 w-3 text-emerald-400/70" />
                                        <span className="text-emerald-400/70 normal-case tracking-normal">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                                {showTranscript && (
                                  <pre className="mt-2 text-[12px] font-mono leading-relaxed text-foreground/40 whitespace-pre-wrap max-h-80 overflow-y-auto bg-muted/20 rounded-lg p-4 border border-border/20">
                                    {rec.transcript}
                                  </pre>
                                )}
                              </div>
                            )}

                            {!rec.summary && !rec.transcript && (
                              <p className="text-[13px] text-muted-foreground/30">No transcript or summary available.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ KNOWLEDGE ═══════════ */}
          {activeTab === "knowledge" && (
            <div>
              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewEntry(!showNewEntry)}
                  className="text-[12px] text-muted-foreground hover:text-foreground h-7 px-2.5"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add entry
                </Button>
              </div>

              {showNewEntry && (
                <div className="mb-6 p-3 sm:p-4 rounded-lg border border-border/40 bg-muted/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <Input placeholder="Title" value={newEntry.title} onChange={e => setNewEntry({ ...newEntry, title: e.target.value })} className="h-9 sm:h-8 text-[14px] sm:text-[13px] bg-transparent" />
                    <select className="h-9 sm:h-8 rounded-md border border-border/40 bg-transparent px-2 text-[14px] sm:text-[13px] text-foreground" value={newEntry.content_type} onChange={e => setNewEntry({ ...newEntry, content_type: e.target.value })}>
                      <option value="note">Note</option>
                      <option value="project_log">Project Log</option>
                      <option value="meeting_notes">Meeting Notes</option>
                      <option value="brainstorm">Brainstorm</option>
                      <option value="decision">Decision</option>
                    </select>
                    <select className="h-9 sm:h-8 rounded-md border border-border/40 bg-transparent px-2 text-[14px] sm:text-[13px] text-foreground" value={newEntry.company} onChange={e => setNewEntry({ ...newEntry, company: e.target.value })}>
                      <option value="bsa">BSA</option>
                      <option value="ssw">SSW</option>
                      <option value="personal">Personal</option>
                    </select>
                    <Input placeholder="Project" value={newEntry.project} onChange={e => setNewEntry({ ...newEntry, project: e.target.value })} className="h-9 sm:h-8 text-[14px] sm:text-[13px] bg-transparent" />
                  </div>
                  <Textarea placeholder="Content..." rows={3} value={newEntry.content} onChange={e => setNewEntry({ ...newEntry, content: e.target.value })} className="text-[13px] bg-transparent mb-3" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={createKBEntry} className="h-7 text-[12px] px-3">Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewEntry(false)} className="h-7 text-[12px] px-3 text-muted-foreground">Cancel</Button>
                  </div>
                </div>
              )}

              {filtered.knowledge.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground/50">
                  <p className="text-[13px]">No entries yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filtered.knowledge.map(entry => (
                    <div key={entry.id} className="py-4">
                      <div className="flex items-baseline gap-2 flex-wrap mb-1">
                        <h3 className="text-[14px] font-medium text-foreground">{entry.title}</h3>
                        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">{entry.content_type.replace("_", " ")}</span>
                        <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">{entry.company}</span>
                        {entry.project && (
                          <span className="text-[11px] text-muted-foreground/50">{entry.project}</span>
                        )}
                        {entry.pinned && (
                          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">pinned</span>
                        )}
                      </div>
                      <p className="text-[13px] text-foreground/50 line-clamp-2 leading-relaxed">{entry.content}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground/30">
                        <span>{timeAgo(entry.event_date || entry.created_at)}</span>
                        {entry.source !== "manual" && <span>via {entry.source}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════ ACTIONS ═══════════ */}
          {activeTab === "actions" && (
            <div>
              {/* Action sub-filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
                <div className="flex items-center gap-0.5 sm:gap-1 bg-muted/30 rounded-md p-0.5 overflow-x-auto no-scrollbar">
                  {([
                    { key: "active", label: "Active", count: stats.pendingActions },
                    { key: "snoozed", label: "Later", count: stats.snoozedActions },
                    { key: "completed", label: "Done", count: stats.completedActions },
                    { key: "dismissed", label: "Dismissed", count: stats.dismissedActions },
                    { key: "all", label: "All", count: filtered.actions.length },
                  ]).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setActionFilter(f.key)}
                      className={`text-[11px] sm:text-[11px] px-2 sm:px-2.5 py-1.5 sm:py-1 rounded transition-colors whitespace-nowrap ${
                        actionFilter === f.key
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground/50 hover:text-muted-foreground"
                      }`}
                    >
                      {f.label}
                      {f.count > 0 && <span className="ml-1 text-muted-foreground/30">{f.count}</span>}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewAction(!showNewAction)}
                  className="text-[12px] text-muted-foreground hover:text-foreground h-7 px-2.5 self-end sm:self-auto"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add action
                </Button>
              </div>

              {showNewAction && (
                <div className="mb-6 p-3 sm:p-4 rounded-lg border border-border/40 bg-muted/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <Input placeholder="Action item title" value={newAction.title} onChange={e => setNewAction({ ...newAction, title: e.target.value })} className="sm:col-span-2 h-9 sm:h-8 text-[14px] sm:text-[13px] bg-transparent" />
                    <select className="h-9 sm:h-8 rounded-md border border-border/40 bg-transparent px-2 text-[14px] sm:text-[13px] text-foreground" value={newAction.priority} onChange={e => setNewAction({ ...newAction, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <select className="h-9 sm:h-8 rounded-md border border-border/40 bg-transparent px-2 text-[14px] sm:text-[13px] text-foreground" value={newAction.company} onChange={e => setNewAction({ ...newAction, company: e.target.value })}>
                      <option value="bsa">BSA</option>
                      <option value="ssw">SSW</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    <Input placeholder="Project" value={newAction.project} onChange={e => setNewAction({ ...newAction, project: e.target.value })} className="h-9 sm:h-8 text-[14px] sm:text-[13px] bg-transparent" />
                    <Input placeholder="Assigned to" value={newAction.assigned_to} onChange={e => setNewAction({ ...newAction, assigned_to: e.target.value })} className="h-9 sm:h-8 text-[14px] sm:text-[13px] bg-transparent" />
                    <Input type="date" value={newAction.due_date} onChange={e => setNewAction({ ...newAction, due_date: e.target.value })} className="h-9 sm:h-8 text-[14px] sm:text-[13px] bg-transparent" />
                  </div>
                  <Textarea placeholder="Description..." rows={2} value={newAction.description} onChange={e => setNewAction({ ...newAction, description: e.target.value })} className="text-[13px] bg-transparent mb-3" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={createActionItem} className="h-7 text-[12px] px-3">Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewAction(false)} className="h-7 text-[12px] px-3 text-muted-foreground">Cancel</Button>
                  </div>
                </div>
              )}

              {filteredActions.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground/50">
                  <p className="text-[13px]">
                    {actionFilter === "active" ? "No active actions" :
                     actionFilter === "snoozed" ? "Nothing snoozed" :
                     actionFilter === "completed" ? "Nothing completed yet" :
                     actionFilter === "dismissed" ? "Nothing dismissed" :
                     "No action items"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredActions.map(action => {
                    const isOverdue = action.due_date && new Date(action.due_date) < new Date() && action.status !== "completed" && action.status !== "dismissed";
                    const isDimmed = action.status === "completed" || action.status === "dismissed";
                    const isSnoozed = action.status === "snoozed";
                    const menuOpen = actionMenuId === action.id;

                    return (
                      <div key={action.id} className={`py-3 sm:py-3.5 flex items-start gap-2.5 sm:gap-3 ${isDimmed ? "opacity-35" : isSnoozed ? "opacity-50" : ""}`}>
                        {/* Checkbox */}
                        <button
                          onClick={() => updateActionStatus(action.id, action.status === "completed" ? "pending" : "completed")}
                          className={`shrink-0 mt-[3px] h-[18px] w-[18px] sm:h-[16px] sm:w-[16px] rounded-[4px] border transition-all flex items-center justify-center ${
                            action.status === "completed"
                              ? "bg-foreground/70 border-foreground/70"
                              : "border-border/50 hover:border-foreground/30"
                          }`}
                        >
                          {action.status === "completed" && <Check className="h-2.5 w-2.5 text-background" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                            <h3 className={`text-[13px] sm:text-[14px] font-medium leading-snug ${
                              action.status === "completed" ? "line-through text-muted-foreground" :
                              isSnoozed ? "italic text-foreground/70" :
                              "text-foreground"
                            }`}>
                              {action.title}
                            </h3>
                            {/* Priority — just a tiny dot for urgent/high */}
                            {action.priority === "urgent" && !isDimmed && (
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400/80 shrink-0" />
                            )}
                            {action.priority === "high" && !isDimmed && (
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60 shrink-0" />
                            )}
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground/35 uppercase tracking-wider">{action.company}</span>
                            {action.project && (
                              <span className="text-[10px] sm:text-[11px] text-muted-foreground/40">{action.project}</span>
                            )}
                          </div>
                          {action.description && (
                            <p className="text-[11px] sm:text-[12px] text-foreground/35 mt-0.5 line-clamp-1">{action.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-[11px] text-muted-foreground/30 flex-wrap">
                            {action.assigned_to && <span>{action.assigned_to}</span>}
                            {action.due_date && (
                              <span className={isOverdue ? "text-red-400/70" : ""}>
                                {formatDate(action.due_date)}{isOverdue ? " overdue" : ""}
                              </span>
                            )}
                            <span>{timeAgo(action.created_at)}</span>
                            {isSnoozed && <span className="italic">snoozed</span>}
                          </div>
                        </div>

                        {/* Status menu */}
                        <div className="relative shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionMenuId(menuOpen ? null : action.id); }}
                            className="h-8 w-8 sm:h-7 sm:w-7 flex items-center justify-center rounded-md hover:bg-muted/40 active:bg-muted/50 transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground/30" />
                          </button>

                          {menuOpen && (
                            <div
                              className="absolute right-0 top-9 sm:top-8 z-50 w-44 sm:w-40 rounded-lg border border-border/50 bg-background shadow-lg py-1"
                              onClick={e => e.stopPropagation()}
                            >
                              {ACTION_STATUSES.map(s => {
                                const Icon = s.icon;
                                const isActive = action.status === s.value;
                                return (
                                  <button
                                    key={s.value}
                                    onClick={() => updateActionStatus(action.id, s.value)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 sm:py-1.5 text-[13px] sm:text-[12px] text-left transition-colors ${
                                      isActive
                                        ? "text-foreground bg-muted/40"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                                    }`}
                                  >
                                    <Icon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                                    {s.label}
                                    {isActive && <Check className="h-3 w-3 sm:h-2.5 sm:w-2.5 ml-auto" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
