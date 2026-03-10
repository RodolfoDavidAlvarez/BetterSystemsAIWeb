import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare, Search, ChevronDown,
  Mic, AlertCircle,
  Play, Pause, FileText, Loader2, RefreshCw, X, Copy, ClipboardCheck,
  Volume2, Users, Lightbulb, DollarSign, Building2, Sparkles,
  User, FolderOpen
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
  audio_url: string | null;
  recording_type: string | null;
  speakers: string[] | null;
  topics: string[] | null;
  people: string[] | null;
  companies: string[] | null;
  projects: string[] | null;
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
  recording_id: number | null;
  source: string;
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[d.getDay()];
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const shortDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (diffDays === 0) return `Today ${time}`;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${dayName} · ${diffDays}d ago · ${time}`;
  return `${dayName} ${shortDate} · ${diffDays}d ago`;
}

function cleanTitle(title: string | null): string {
  if (!title) return "Untitled Recording";
  return title
    .replace(/^\d{4}-\d{2}-\d{2}\s*[-—–]\s*/, "")
    .replace(/^\d{2}-\d{2}\s*/, "")
    .trim() || "Untitled Recording";
}

type CompanyInfo = { label: string; color: string; accent: string };
function getCompanyLabel(rec: Recording): CompanyInfo | null {
  const company = rec.metadata?.company;
  const title = (rec.title || "").toLowerCase();
  if (company === "SSW" || /\bssw\b|soil|compost|mulch|delivery|farm|blend|extract|kerry|sabrina|simon|jonathan/i.test(title))
    return { label: "SSW", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", accent: "border-l-emerald-500" };
  if (company === "BSA" || /\bbsa\b|agave|fleet|crm|website|outreach|desert moon|danny|alex/i.test(title))
    return { label: "BSA", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400", accent: "border-l-blue-500" };
  if (/personal|family|political|ufc|mommy/i.test(title))
    return { label: "Pers", color: "bg-violet-500/12 text-violet-500 dark:text-violet-400", accent: "border-l-violet-400" };
  return null;
}

function priorityBadge(priority: string) {
  switch (priority) {
    case "urgent": return <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 text-[10px] font-bold uppercase">Urgent</span>;
    case "high": return <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-500 text-[10px] font-bold uppercase">High</span>;
    default: return null;
  }
}

function getUrgency(rec: Recording): { level: string; color: string } | null {
  const u = rec.metadata?.tags?.urgency;
  if (!u || u === "low" || u === "none") return null;
  if (u === "urgent") return { level: "URGENT", color: "bg-red-500/15 text-red-500" };
  if (u === "high") return { level: "HIGH", color: "bg-orange-500/15 text-orange-500" };
  if (u === "medium") return { level: "MED", color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400" };
  return null;
}

function getSpeakerColor(name: string): string {
  const colors = [
    "bg-blue-500/12 text-blue-600 dark:text-blue-400 border-blue-500/20",
    "bg-purple-500/12 text-purple-600 dark:text-purple-400 border-purple-500/20",
    "bg-teal-500/12 text-teal-600 dark:text-teal-400 border-teal-500/20",
    "bg-pink-500/12 text-pink-600 dark:text-pink-400 border-pink-500/20",
    "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/20",
    "bg-cyan-500/12 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    "bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/20",
    "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

// ─── Skeleton Loader ────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border bg-card p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-40 bg-muted rounded-md" />
        <div className="h-4 w-10 bg-muted rounded" />
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-3 w-28 bg-muted/60 rounded" />
        <div className="h-3 w-12 bg-muted/60 rounded" />
      </div>
      <div className="h-4 w-full bg-muted/40 rounded" />
    </div>
  );
}

// ─── Waveform Audio Player ──────────────────────────────────────────

function WaveformPlayer({ audioUrl, duration }: { audioUrl: string; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);

  const filename = audioUrl.replace("data/plaud-audio/", "").split("/").pop() || "";
  const resolvedUrl = audioUrl.startsWith("http") ? audioUrl : `/api/audio/${filename}`;

  const BAR_COUNT = 120;
  const BAR_WIDTH = 2.5;
  const BAR_GAP = 1.5;

  const generateWaveform = useCallback(async (url: string) => {
    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) throw new Error("fetch failed");
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const blockSize = Math.floor(channelData.length / BAR_COUNT);
      const bars: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[start + j] || 0);
        }
        bars.push(sum / blockSize);
      }
      const max = Math.max(...bars, 0.01);
      const normalized = bars.map((b) => Math.max(b / max, 0.06));
      setWaveformData(normalized);
      setAudioDuration(audioBuffer.duration);
      audioContext.close();
    } catch {
      const fake = Array.from({ length: BAR_COUNT }, (_, i) => {
        const x = i / BAR_COUNT;
        return 0.08 + Math.sin(x * 12) * 0.3 + Math.sin(x * 37) * 0.2 + Math.random() * 0.25;
      });
      setWaveformData(fake);
    } finally {
      setLoading(false);
    }
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const progress = audioDuration > 0 ? currentTime / audioDuration : 0;
    const playedBars = Math.floor(progress * waveformData.length);
    const centerY = rect.height / 2;
    const maxBarH = rect.height * 0.88;
    const isDark = document.documentElement.classList.contains("dark");
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() || "#6366f1";

    for (let i = 0; i < waveformData.length; i++) {
      const barH = waveformData[i] * maxBarH;
      const x = i * (BAR_WIDTH + BAR_GAP);
      const yTop = centerY - barH / 2;

      if (i < playedBars) {
        ctx.fillStyle = primaryColor;
      } else if (i === playedBars) {
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)";
      } else {
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
      }
      ctx.beginPath();
      ctx.roundRect(x, yTop, BAR_WIDTH, barH, 1.25);
      ctx.fill();
    }
  }, [waveformData, currentTime, audioDuration]);

  useEffect(() => {
    if (playing && audioRef.current) {
      const tick = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animFrameRef.current);
    }
  }, [playing]);

  useEffect(() => { drawWaveform(); }, [drawWaveform]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => drawWaveform());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawWaveform]);

  const loadAndPlay = async () => {
    if (!loaded) { await generateWaveform(resolvedUrl); setLoaded(true); }
    if (!audioRef.current) {
      const audio = new Audio(resolvedUrl);
      audioRef.current = audio;
      audio.addEventListener("ended", () => { setPlaying(false); setCurrentTime(0); });
      audio.addEventListener("error", () => { setPlaying(false); setError(true); });
      audio.addEventListener("loadedmetadata", () => setAudioDuration(audio.duration));
    }
    return audioRef.current;
  };

  const togglePlay = async () => {
    if (error) return;
    try {
      const audio = await loadAndPlay();
      if (playing) { audio.pause(); setPlaying(false); }
      else { await audio.play(); setPlaying(true); }
    } catch { setError(true); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !audioRef.current || audioDuration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const totalWidth = waveformData.length * (BAR_WIDTH + BAR_GAP);
    const ratio = Math.max(0, Math.min(1, x / totalWidth));
    audioRef.current.currentTime = ratio * audioDuration;
    setCurrentTime(ratio * audioDuration);
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-muted/30 text-muted-foreground/60 text-sm">
        <Volume2 className="h-4 w-4 opacity-40" />
        <span className="text-xs">Audio unavailable</span>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-muted/30 border border-border/40 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={togglePlay}
          className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-all ${
            playing
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
              : "bg-primary/90 text-primary-foreground hover:bg-primary active:scale-95"
          }`}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : playing ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div ref={containerRef} className="w-full overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: "touch" }}>
            <canvas
              ref={canvasRef}
              onClick={handleSeek}
              className="h-11 cursor-pointer"
              style={{ width: `${Math.max(waveformData.length * (BAR_WIDTH + BAR_GAP), 100)}px`, minWidth: "100%" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground/70 tabular-nums px-0.5 -mt-0.5">
            <span>{fmtTime(currentTime)}</span>
            <span>{audioDuration > 0 ? fmtTime(audioDuration) : "--:--"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Copy Button ────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`sticky top-0 float-right ml-2 mb-1 p-2 rounded-lg transition-all z-10 ${
        copied
          ? "bg-emerald-500/15 text-emerald-500 scale-110"
          : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground active:scale-95"
      }`}
      title={copied ? "Copied!" : "Copy transcript"}
    >
      {copied ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function ConversationsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState<number | null>(null);
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [dismissingIds, setDismissingIds] = useState<Set<number>>(new Set());
  const [highlightedRecId, setHighlightedRecId] = useState<number | null>(null);
  const recordingRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const jumpToRecording = (recordingId: number | null) => {
    if (!recordingId) return;
    setSearchQuery("");
    setExpandedId(recordingId);
    setActionsExpanded(false);
    setHighlightedRecId(recordingId);
    setTimeout(() => setHighlightedRecId(null), 2500);
    setTimeout(() => {
      const el = recordingRefs.current[recordingId];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, actRes] = await Promise.all([
        fetch("/api/admin/recordings?limit=100", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}` },
        }),
        fetch("/api/admin/knowledge-base/actions", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}` },
        }),
      ]);
      const recData = await recRes.json();
      const actData = await actRes.json();
      setRecordings(recData.recordings || []);
      setActionItems(Array.isArray(actData) ? actData : []);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}`,
    "Content-Type": "application/json",
  });

  const updateActionStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/admin/knowledge-base/actions/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      setActionItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err) {
      console.error("Failed to update action:", err);
    }
  };

  const filtered = recordings.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.summary?.toLowerCase().includes(q) ||
      r.transcript?.toLowerCase().includes(q) ||
      r.tags?.some((t) => t.toLowerCase().includes(q)) ||
      r.speakers?.some((s) => s.toLowerCase().includes(q)) ||
      r.people?.some((p) => p.toLowerCase().includes(q)) ||
      r.companies?.some((c) => c.toLowerCase().includes(q)) ||
      r.projects?.some((p) => p.toLowerCase().includes(q)) ||
      r.topics?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const getRecordingActions = (recordingId: number) =>
    actionItems.filter((a) => a.recording_id === recordingId && a.status !== "dismissed" && a.status !== "completed");

  const getAllActiveActions = () =>
    actionItems.filter((a) => a.status === "pending" || a.status === "in_progress" || a.status === "needs_review");

  const activeActions = getAllActiveActions();

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Conversations</h1>
            {!loading && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {recordings.length} recording{recordings.length !== 1 ? "s" : ""}
                {(() => {
                  const indexed = recordings.filter(r => r.metadata?.indexed).length;
                  return indexed > 0 ? ` · ${indexed} indexed` : "";
                })()}
                {activeActions.length > 0 && ` · ${activeActions.length} action${activeActions.length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl hover:bg-muted active:bg-muted/80 transition-colors"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-muted/60 transition-all"
          />
        </div>
      </div>

      {/* Action Items Panel */}
      {activeActions.length > 0 && !searchQuery && (
        <div className="mx-4 mt-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/15 overflow-hidden">
          <button
            onClick={() => setActionsExpanded(!actionsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3.5 active:bg-amber-500/5 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {activeActions.length} action{activeActions.length !== 1 ? "s" : ""} pending
                </span>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-amber-500/60 transition-transform duration-200 ${actionsExpanded ? "rotate-180" : ""}`} />
          </button>

          {/* Collapsed preview */}
          {!actionsExpanded && (
            <div className="px-4 pb-3 space-y-1.5">
              {activeActions.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 flex-shrink-0" />
                  <span className="text-foreground/60 leading-tight truncate text-[13px]">{a.title}</span>
                </div>
              ))}
              {activeActions.length > 3 && (
                <p className="text-[11px] text-amber-500/50 pl-3.5">+ {activeActions.length - 3} more</p>
              )}
            </div>
          )}

          {/* Expanded list */}
          {actionsExpanded && (
            <div className="border-t border-amber-500/10">
              <div className="max-h-[60vh] overflow-y-auto">
                {activeActions.map((a, idx) => {
                  const isDismissing = dismissingIds.has(a.id);
                  return (
                    <div
                      key={a.id}
                      className={`flex items-start gap-2.5 px-4 py-3 transition-all duration-300 ${
                        isDismissing ? "opacity-0 -translate-x-4" : ""
                      } ${idx !== activeActions.length - 1 ? "border-b border-amber-500/[0.06]" : ""}`}
                    >
                      <button
                        onClick={() => updateActionStatus(a.id, "completed")}
                        className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 border-amber-500/40 active:bg-emerald-500/30 active:border-emerald-500 transition-colors"
                        title="Complete"
                      />
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => a.recording_id && jumpToRecording(a.recording_id)}
                          className={`text-left text-[13px] font-medium leading-snug ${a.recording_id ? "active:text-primary" : ""}`}
                        >
                          {a.title}
                          {a.recording_id && (
                            <Mic className="inline-block h-3 w-3 ml-1 opacity-30" />
                          )}
                        </button>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {priorityBadge(a.priority)}
                          {a.company && (
                            <span className="text-[10px] text-muted-foreground/60 font-medium">{a.company}</span>
                          )}
                          {a.assigned_to && a.assigned_to !== "Rodo" && (
                            <span className="text-[10px] text-muted-foreground/60">→ {a.assigned_to}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setDismissingIds((prev) => new Set(prev).add(a.id));
                          setTimeout(() => updateActionStatus(a.id, "dismissed"), 200);
                        }}
                        className="flex-shrink-0 p-1.5 -mr-1 rounded-lg active:bg-red-500/15 transition-colors"
                        title="Dismiss"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="px-4 mt-4 space-y-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {/* Recording Cards */}
      {!loading && (
        <div className="px-4 mt-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">{searchQuery ? "No matches found" : "No conversations yet"}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {searchQuery ? "Try different keywords" : "Recordings will appear here once synced"}
              </p>
            </div>
          ) : (
            filtered.map((rec) => {
              const isExpanded = expandedId === rec.id;
              const isTranscriptOpen = showTranscript === rec.id;
              const recActions = getRecordingActions(rec.id);
              const hasTranscript = rec.transcript && rec.transcript.length > 0;
              const hasSummary = rec.summary && rec.summary.length > 0;
              const company = getCompanyLabel(rec);

              return (
                <div
                  key={rec.id}
                  ref={(el) => { recordingRefs.current[rec.id] = el; }}
                  className={`rounded-2xl border bg-card overflow-hidden transition-all duration-500 ${
                    company ? `border-l-[3px] ${company.accent}` : ""
                  } ${highlightedRecId === rec.id ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background shadow-lg" : "shadow-sm"}`}
                >
                  {/* Card Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                    className="w-full text-left px-4 py-3.5 active:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Title row */}
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[15px] leading-tight truncate">
                            {cleanTitle(rec.title)}
                          </h3>
                          {company && (
                            <span className={`flex-shrink-0 px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wider ${company.color}`}>
                              {company.label}
                            </span>
                          )}
                          {rec.metadata?.indexed && (
                            <span title="AI Indexed"><Sparkles className="flex-shrink-0 h-3.5 w-3.5 text-primary/50" /></span>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground/60">
                          <span>{formatDate(rec.recorded_at || rec.created_at)}</span>
                          {rec.duration_seconds > 0 && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span>{formatDuration(rec.duration_seconds)}</span>
                            </>
                          )}
                          {(rec.speakers?.length || 0) > 0 && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="flex items-center gap-0.5">
                                <Users className="h-3 w-3 opacity-50" />
                                {rec.speakers!.length}
                              </span>
                            </>
                          )}
                          {hasTranscript && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <FileText className="h-3 w-3 opacity-40" />
                            </>
                          )}
                          {(() => {
                            const urg = getUrgency(rec);
                            return urg ? (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className={`px-1.5 py-px rounded text-[9px] font-bold ${urg.color}`}>
                                  {urg.level}
                                </span>
                              </>
                            ) : null;
                          })()}
                        </div>

                        {/* Summary preview */}
                        {(hasSummary || rec.metadata?.summary) && !isExpanded && (
                          <p className="mt-1.5 text-[13px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
                            {rec.metadata?.summary || rec.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                        {recActions.length > 0 && (
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">
                            {recActions.length}
                          </span>
                        )}
                        <ChevronDown className={`h-4 w-4 text-muted-foreground/30 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border/40">
                      {/* Full Summary */}
                      {(hasSummary || rec.metadata?.summary) && (
                        <div className="px-4 pt-3.5 pb-1">
                          <p className="text-[13px] text-foreground/75 leading-relaxed">
                            {rec.metadata?.summary || rec.summary}
                          </p>
                        </div>
                      )}

                      {/* ── Recording Intelligence ── */}
                      {(() => {
                        const speakers = rec.speakers || rec.metadata?.speakers?.map((s: any) => s.name) || rec.metadata?.people || [];
                        const topics = rec.topics || rec.metadata?.tags?.topics || rec.metadata?.topics || [];
                        const companies = rec.companies || rec.metadata?.tags?.companies || [];
                        const projects = rec.projects || rec.metadata?.tags?.projects || [];
                        const keyDecisions = rec.metadata?.tags?.key_decisions || [];
                        const keyNumbers = rec.metadata?.tags?.key_numbers || [];
                        const diarizedSegments = rec.metadata?.diarized_segments || [];
                        const hasIntel = speakers.length > 0 || topics.length > 0 || companies.length > 0 || keyDecisions.length > 0 || keyNumbers.length > 0;

                        return hasIntel ? (
                          <div className="px-4 pt-2 pb-1 space-y-2.5">
                            {/* Speakers */}
                            {speakers.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Users className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                                {speakers.map((s: string, i: number) => (
                                  <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${getSpeakerColor(s)}`}>
                                    <User className="h-2.5 w-2.5" />
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Topics + Companies + Projects row */}
                            {(topics.length > 0 || companies.length > 0 || projects.length > 0) && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {companies.map((c: string, i: number) => (
                                  <span key={`co${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                                    <Building2 className="h-2.5 w-2.5" />
                                    {c}
                                  </span>
                                ))}
                                {projects.map((p: string, i: number) => (
                                  <span key={`pr${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-medium">
                                    <FolderOpen className="h-2.5 w-2.5" />
                                    {p}
                                  </span>
                                ))}
                                {topics.slice(0, 6).map((t: string, i: number) => (
                                  <span key={`tp${i}`} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
                                    {t}
                                  </span>
                                ))}
                                {topics.length > 6 && (
                                  <span className="text-[10px] text-muted-foreground/50">+{topics.length - 6}</span>
                                )}
                              </div>
                            )}

                            {/* Key Decisions */}
                            {keyDecisions.length > 0 && (
                              <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/10 p-2.5">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Key Decisions</span>
                                </div>
                                <ul className="space-y-1">
                                  {keyDecisions.map((d: string, i: number) => (
                                    <li key={i} className="text-[12px] text-foreground/70 leading-snug pl-1 flex items-start gap-1.5">
                                      <span className="text-amber-500/50 mt-0.5 flex-shrink-0">-</span>
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Key Numbers */}
                            {keyNumbers.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-500/60 flex-shrink-0" />
                                {keyNumbers.map((n: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 rounded-lg bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-medium border border-emerald-500/15">
                                    {n}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Diarized Segments (top dialogue snippets) */}
                            {diarizedSegments.length > 0 && (
                              <details className="group">
                                <summary className="flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors">
                                  <MessageSquare className="h-3 w-3" />
                                  Key Dialogue ({diarizedSegments.length} segments)
                                  <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                                </summary>
                                <div className="mt-2 space-y-1 max-h-[40vh] overflow-y-auto">
                                  {diarizedSegments.slice(0, 15).map((seg: any, i: number) => (
                                    <div key={i} className="flex items-start gap-2 text-[12px]">
                                      <span className="text-[10px] text-muted-foreground/40 tabular-nums flex-shrink-0 w-10 text-right mt-px">
                                        {seg.timestamp || ""}
                                      </span>
                                      <span className={`flex-shrink-0 px-1.5 py-px rounded text-[10px] font-medium ${getSpeakerColor(seg.speaker || "Unknown")}`}>
                                        {seg.speaker || "?"}
                                      </span>
                                      <span className="text-foreground/65 leading-snug">{seg.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        ) : null;
                      })()}

                      {/* Audio Player */}
                      <div className="px-4 pt-3 pb-1">
                        {rec.audio_url && (
                          <WaveformPlayer audioUrl={rec.audio_url} duration={rec.duration_seconds} />
                        )}
                      </div>

                      {/* Transcript Toggle */}
                      {hasTranscript && (
                        <div className="px-4 pt-2 pb-1">
                          <button
                            onClick={() => setShowTranscript(isTranscriptOpen ? null : rec.id)}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                              isTranscriptOpen
                                ? "bg-primary/10 text-primary"
                                : "bg-muted/40 text-muted-foreground hover:bg-muted/60 active:bg-muted"
                            }`}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {isTranscriptOpen ? "Hide Transcript" : "View Transcript"}
                          </button>
                        </div>
                      )}

                      {/* Transcript */}
                      {isTranscriptOpen && hasTranscript && (
                        <div className="px-4 pt-2 pb-3">
                          <div className="relative rounded-xl bg-muted/30 border border-border/30 p-3.5 max-h-[60vh] overflow-y-auto">
                            <CopyButton text={rec.transcript || ""} />
                            <pre className="text-[12px] whitespace-pre-wrap font-mono leading-relaxed text-foreground/70">
                              {rec.transcript}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Action Items for this recording */}
                      {recActions.length > 0 && (
                        <div className="px-4 pt-2 pb-3">
                          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2 ml-0.5">
                            Action Items
                          </h4>
                          <div className="space-y-1.5">
                            {recActions.map((action) => (
                              <div
                                key={action.id}
                                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/25 border border-border/30"
                              >
                                <button
                                  onClick={() => updateActionStatus(action.id, "completed")}
                                  className="flex-shrink-0 mt-0.5 w-4.5 h-4.5 rounded-full border-2 border-muted-foreground/20 active:bg-emerald-500/30 active:border-emerald-500 transition-colors"
                                  title="Complete"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium leading-tight">{action.title}</p>
                                  {action.description && (
                                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-2 leading-relaxed">
                                      {action.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    {priorityBadge(action.priority)}
                                    {action.assigned_to && action.assigned_to !== "Rodo" && (
                                      <span className="text-[10px] text-muted-foreground/50">→ {action.assigned_to}</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => updateActionStatus(action.id, "dismissed")}
                                  className="flex-shrink-0 p-1.5 rounded-lg active:bg-red-500/15 transition-colors"
                                  title="Dismiss"
                                >
                                  <X className="h-3.5 w-3.5 text-muted-foreground/30" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No transcript */}
                      {!hasTranscript && (
                        <div className="px-4 pb-4 pt-2">
                          <div className="rounded-xl bg-muted/20 p-4 text-center">
                            <Loader2 className={`h-4 w-4 mx-auto mb-1.5 text-muted-foreground/40 ${rec.transcription_status === "pending" ? "animate-spin" : ""}`} />
                            <p className="text-xs text-muted-foreground/50">
                              {rec.transcription_status === "pending" ? "Transcribing..." : "No transcript"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
