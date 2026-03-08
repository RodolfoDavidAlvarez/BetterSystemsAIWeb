import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare, Search, Clock, ChevronDown, ChevronUp,
  Calendar, Mic, CheckCircle2, Circle, AlertCircle,
  Play, Pause, FileText, Loader2, RefreshCw, X, Check
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

  if (diffDays === 0) {
    return "Today " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function priorityColor(priority: string): string {
  switch (priority) {
    case "urgent": return "text-red-500";
    case "high": return "text-orange-500";
    case "medium": return "text-yellow-500";
    default: return "text-gray-400";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />;
    case "in_progress": return <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    case "pending": return <Circle className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
    default: return <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />;
  }
}

// ─── Audio Player Button ────────────────────────────────────────────

function AudioPlayerButton({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  // Route audio through /api/audio proxy (avoids mixed-content HTTPS→HTTP block)
  const filename = audioUrl.replace("data/plaud-audio/", "").split("/").pop() || "";
  const resolvedUrl = audioUrl.startsWith("http") ? audioUrl : `/api/audio/${filename}`;

  const togglePlay = () => {
    if (error) return;
    if (!audioRef.current) {
      const audio = new Audio(resolvedUrl);
      audioRef.current = audio;
      audio.addEventListener("ended", () => setPlaying(false));
      audio.addEventListener("error", () => {
        setPlaying(false);
        setError(true);
      });
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        setPlaying(false);
        setError(true);
      });
      setPlaying(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <button
      onClick={togglePlay}
      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm active:opacity-90 transition-opacity ${
        error ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : "bg-muted"
      }`}
      disabled={error}
      title={error ? "Audio not available in production" : playing ? "Pause" : "Listen"}
    >
      {error ? (
        <>
          <Play className="h-4 w-4 opacity-50" />
          <span className="text-xs">Audio unavailable</span>
        </>
      ) : playing ? (
        <>
          <Pause className="h-4 w-4" />
          Pause
        </>
      ) : (
        <>
          <Play className="h-4 w-4" />
          Listen
        </>
      )}
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      // Update local state immediately
      setActionItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (err) {
      console.error("Failed to update action:", err);
    }
  };

  // Filter recordings by search
  const filtered = recordings.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title?.toLowerCase().includes(q) ||
      r.summary?.toLowerCase().includes(q) ||
      r.transcript?.toLowerCase().includes(q) ||
      r.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  // Get action items for a recording
  const getRecordingActions = (recordingId: number) =>
    actionItems.filter((a) => a.recording_id === recordingId && a.status !== "dismissed" && a.status !== "completed");

  const getAllActiveActions = () =>
    actionItems.filter((a) => a.status === "pending" || a.status === "in_progress");

  const activeActions = getAllActiveActions();

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Conversations</h1>
          <button
            onClick={fetchData}
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
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Active Action Items Summary */}
      {activeActions.length > 0 && !searchQuery && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              {activeActions.length} pending action{activeActions.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-1.5">
            {activeActions.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm group">
                <button
                  onClick={() => updateActionStatus(a.id, "completed")}
                  className="flex-shrink-0 p-0.5 rounded-full hover:bg-green-500/20 active:bg-green-500/30 transition-colors"
                  title="Mark complete"
                >
                  <Circle className="h-4 w-4 text-yellow-500 group-hover:hidden" />
                  <Check className="h-4 w-4 text-green-500 hidden group-hover:block" />
                </button>
                <span className="text-foreground/80 leading-tight flex-1">{a.title}</span>
                <button
                  onClick={() => updateActionStatus(a.id, "dismissed")}
                  className="flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 active:bg-red-500/30 transition-all"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
            {activeActions.length > 5 && (
              <span className="text-xs text-muted-foreground">+{activeActions.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Recording Cards */}
      {!loading && (
        <div className="px-4 mt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{searchQuery ? "No matches found" : "No conversations yet"}</p>
            </div>
          ) : (
            filtered.map((rec) => {
              const isExpanded = expandedId === rec.id;
              const isTranscriptOpen = showTranscript === rec.id;
              const recActions = getRecordingActions(rec.id);
              const hasTranscript = rec.transcript && rec.transcript.length > 0;
              const hasSummary = rec.summary && rec.summary.length > 0;

              return (
                <div
                  key={rec.id}
                  className="rounded-xl border bg-card shadow-sm overflow-hidden"
                >
                  {/* Card Header — tappable */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                    className="w-full text-left p-4 active:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base leading-tight truncate">
                          {rec.title || "Untitled Recording"}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(rec.recorded_at || rec.created_at)}
                          </span>
                          {rec.duration_seconds > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(rec.duration_seconds)}
                            </span>
                          )}
                          {rec.recording_type && (
                            <span className="flex items-center gap-1">
                              <Mic className="h-3 w-3" />
                              {rec.recording_type}
                            </span>
                          )}
                        </div>
                        {hasSummary && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {rec.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {recActions.length > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                            {recActions.length}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {rec.tags && rec.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rec.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t">
                      {/* Action Buttons */}
                      <div className="p-4 flex gap-2">
                        {hasTranscript && (
                          <button
                            onClick={() => setShowTranscript(isTranscriptOpen ? null : rec.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm active:opacity-90 transition-opacity"
                          >
                            <FileText className="h-4 w-4" />
                            {isTranscriptOpen ? "Hide Transcript" : "View Transcript"}
                          </button>
                        )}
                        {rec.audio_url && (
                          <AudioPlayerButton audioUrl={rec.audio_url} />
                        )}
                      </div>

                      {/* Transcript */}
                      {isTranscriptOpen && hasTranscript && (
                        <div className="px-4 pb-4">
                          <div className="rounded-xl bg-muted/50 p-4 max-h-[60vh] overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground/80">
                              {rec.transcript}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Action Items for this recording */}
                      {recActions.length > 0 && (
                        <div className="px-4 pb-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Action Items
                          </h4>
                          <div className="space-y-2">
                            {recActions.map((action) => (
                              <div
                                key={action.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 group"
                              >
                                <button
                                  onClick={() => updateActionStatus(action.id, "completed")}
                                  className="flex-shrink-0 mt-0.5 p-0.5 rounded-full hover:bg-green-500/20 active:bg-green-500/30 transition-colors"
                                  title="Mark complete"
                                >
                                  {statusIcon(action.status)}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium leading-tight">{action.title}</p>
                                  {action.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {action.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {action.priority && action.priority !== "medium" && (
                                      <span className={`text-xs font-medium ${priorityColor(action.priority)}`}>
                                        {action.priority}
                                      </span>
                                    )}
                                    {action.assigned_to && (
                                      <span className="text-xs text-muted-foreground">
                                        → {action.assigned_to}
                                      </span>
                                    )}
                                    {action.due_date && (
                                      <span className="text-xs text-muted-foreground">
                                        Due {formatDate(action.due_date)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => updateActionStatus(action.id, "dismissed")}
                                  className="flex-shrink-0 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 active:bg-red-500/30 transition-all"
                                  title="Dismiss"
                                >
                                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No transcript message */}
                      {!hasTranscript && (
                        <div className="px-4 pb-4">
                          <div className="rounded-xl bg-muted/30 p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                              {rec.transcription_status === "pending"
                                ? "Transcription in progress..."
                                : "No transcript available"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {rec.metadata?.topics && (
                        <div className="px-4 pb-4">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Topics
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {(Array.isArray(rec.metadata.topics) ? rec.metadata.topics : [rec.metadata.topics]).map((topic: string, i: number) => (
                              <span key={i} className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
                                {topic}
                              </span>
                            ))}
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
