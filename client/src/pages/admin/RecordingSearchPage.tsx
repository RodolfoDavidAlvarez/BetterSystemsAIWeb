import { useState, useCallback, useRef, useEffect } from "react";
import {
  Search, Mic, Users, Tag, MessageSquare, Clock,
  ChevronDown, ChevronUp, Loader2, Sparkles, BarChart3,
  Send, Bot, Building2, FolderOpen, User, Hash
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface SearchChunk {
  content: string;
  speaker: string | null;
  similarity: number;
  chunk_index: number;
}

interface SearchResult {
  recording_id: number;
  title: string;
  recorded_at: string;
  duration_seconds: number;
  speakers: string[] | null;
  topics: string[] | null;
  people: string[] | null;
  best_similarity: number;
  chunks: SearchChunk[];
}

interface SearchResponse {
  query: string;
  total_chunks: number;
  recordings: SearchResult[];
}

interface AskResponse {
  question: string;
  answer: string;
  sources: {
    title: string;
    date: string;
    speaker: string | null;
    similarity: number;
    excerpt: string;
  }[];
}

interface IndexedRecording {
  id: number;
  title: string;
  speakers: string[] | null;
  topics: string[] | null;
  people: string[] | null;
  recorded_at: string;
  summary: string | null;
  urgency: string | null;
  decisions: any[] | null;
  numbers: any[] | null;
  diarized_segments: any[] | null;
}

interface Stats {
  total_recordings: number;
  indexed_recordings: number;
  total_chunks: number;
  recordings_with_chunks: number;
  top_speakers: { speaker: string; chunk_count: number }[];
  top_topics: { topic: string; mentions: number }[];
  recent_indexed: IndexedRecording[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    timeZone: "America/Phoenix"
  });
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let result = text;
  for (const word of words) {
    const regex = new RegExp(`(${word})`, "gi");
    result = result.replace(regex, "**$1**");
  }
  return result;
}

// ─── Components ─────────────────────────────────────────────────────

function SimilarityBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "text-emerald-400" : pct >= 55 ? "text-amber-400" : "text-zinc-500";
  return <span className={`text-xs font-mono ${color}`}>{pct}%</span>;
}

function TagPill({ label, icon: Icon, color = "zinc" }: { label: string; icon?: any; color?: string }) {
  const colors: Record<string, string> = {
    zinc: "bg-zinc-800 text-zinc-300 border-zinc-700",
    blue: "bg-blue-950 text-blue-300 border-blue-800",
    purple: "bg-purple-950 text-purple-300 border-purple-800",
    emerald: "bg-emerald-950 text-emerald-300 border-emerald-800",
    amber: "bg-amber-950 text-amber-300 border-amber-800",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${colors[color] || colors.zinc}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function RecordingSearchPage() {
  const [mode, setMode] = useState<"search" | "ask" | "explore">("search");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [askResult, setAskResult] = useState<AskResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRecording, setExpandedRecording] = useState<number | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<IndexedRecording | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load stats on mount
  useEffect(() => {
    fetch("/api/admin/recordings/search/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearchResults(null);
    setAskResult(null);

    try {
      if (mode === "ask") {
        const res = await fetch("/api/admin/recordings/search/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: query }),
        });
        const data = await res.json();
        setAskResult(data);
      } else {
        const res = await fetch(`/api/admin/recordings/search/semantic?q=${encodeURIComponent(query)}&limit=20`);
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, mode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Recording Intelligence</h1>
              <p className="text-xs text-zinc-500">
                {stats ? `${stats.indexed_recordings}/${stats.total_recordings} recordings indexed · ${stats.total_chunks} searchable chunks` : "Loading..."}
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-1 mb-3">
            {[
              { id: "search" as const, label: "Search", icon: Search },
              { id: "ask" as const, label: "Ask AI", icon: Bot },
              { id: "explore" as const, label: "Explore", icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  mode === tab.id
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          {mode !== "explore" && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={mode === "ask"
                    ? "Ask a question about your recordings..."
                    : "Search recordings semantically..."
                  }
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "ask" ? <Send className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                {mode === "ask" ? "Ask" : "Search"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Ask AI Result */}
        {askResult && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-violet-950/50 to-indigo-950/50 border border-violet-800/50 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <Bot className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-violet-400 mb-2">AI Answer</p>
                  <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {askResult.answer}
                  </div>
                </div>
              </div>
              {askResult.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-violet-800/30">
                  <p className="text-xs text-zinc-500 mb-2">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {askResult.sources.map((s, i) => (
                      <span key={i} className="text-xs bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-400">
                        {s.title} ({formatDate(s.date)}) · <SimilarityBadge value={s.similarity} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div>
            <p className="text-xs text-zinc-500 mb-4">
              {searchResults.total_chunks} matches across {searchResults.recordings.length} recordings
            </p>
            <div className="space-y-3">
              {searchResults.recordings.map(rec => (
                <div key={rec.recording_id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  {/* Header */}
                  <button
                    className="w-full px-4 py-3 flex items-start justify-between text-left hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setExpandedRecording(expandedRecording === rec.recording_id ? null : rec.recording_id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <SimilarityBadge value={rec.best_similarity} />
                        <span className="text-sm font-medium text-white truncate">{rec.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(rec.recorded_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mic className="w-3 h-3" /> {formatDuration(rec.duration_seconds)}
                        </span>
                        {rec.speakers && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {rec.speakers.slice(0, 3).join(", ")}
                            {rec.speakers.length > 3 && ` +${rec.speakers.length - 3}`}
                          </span>
                        )}
                      </div>
                      {/* Topic tags */}
                      {rec.topics && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.topics.slice(0, 5).map(t => (
                            <TagPill key={t} label={t} color="purple" />
                          ))}
                        </div>
                      )}
                    </div>
                    {expandedRecording === rec.recording_id ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500 mt-1 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500 mt-1 shrink-0" />
                    )}
                  </button>

                  {/* Expanded: show matching chunks */}
                  {expandedRecording === rec.recording_id && (
                    <div className="border-t border-zinc-800 px-4 py-3 space-y-3">
                      {rec.chunks.map((chunk, i) => (
                        <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <SimilarityBadge value={chunk.similarity} />
                            {chunk.speaker && (
                              <span className="text-xs text-indigo-400 font-medium">{chunk.speaker}</span>
                            )}
                            <span className="text-xs text-zinc-600">chunk #{chunk.chunk_index}</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {chunk.content.substring(0, 500)}
                            {chunk.content.length > 500 && "..."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explore Mode */}
        {mode === "explore" && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Indexed", value: stats.indexed_recordings, sub: `of ${stats.total_recordings}`, icon: Mic },
                { label: "Chunks", value: stats.total_chunks, sub: "searchable", icon: Hash },
                { label: "Speakers", value: stats.top_speakers.length, sub: "identified", icon: Users },
                { label: "Topics", value: stats.top_topics.length, sub: "tracked", icon: Tag },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <s.icon className="w-4 h-4 text-violet-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-zinc-500">{s.label} <span className="text-zinc-600">{s.sub}</span></div>
                </div>
              ))}
            </div>

            {/* Top Speakers + Topics side by side */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-400" /> Top Speakers
                </h3>
                <div className="space-y-2">
                  {stats.top_speakers.slice(0, 10).map(s => (
                    <div key={s.speaker} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-300">{s.speaker}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${(s.chunk_count / stats.top_speakers[0].chunk_count) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 w-8 text-right">{s.chunk_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-violet-400" /> Top Topics
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {stats.top_topics.slice(0, 15).map(t => (
                    <button
                      key={t.topic}
                      onClick={() => { setQuery(t.topic); setMode("search"); }}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full px-2.5 py-1 text-xs text-zinc-300 transition-colors"
                    >
                      {t.topic} <span className="text-zinc-500">({t.mentions})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Indexed Recordings */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Mic className="w-4 h-4 text-violet-400" /> Recently Indexed
              </h3>
              <div className="space-y-2">
                {stats.recent_indexed.map(rec => (
                  <div
                    key={rec.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 cursor-pointer hover:border-zinc-600 transition-colors"
                    onClick={() => setSelectedRecording(selectedRecording?.id === rec.id ? null : rec)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-white">{rec.title}</span>
                      <span className="text-xs text-zinc-500 shrink-0 ml-2">{formatDate(rec.recorded_at)}</span>
                    </div>

                    {rec.summary && (
                      <p className="text-xs text-zinc-400 mb-2">{rec.summary}</p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {rec.speakers?.slice(0, 4).map(s => (
                        <TagPill key={s} label={s} icon={User} color="blue" />
                      ))}
                      {rec.topics?.slice(0, 3).map(t => (
                        <TagPill key={t} label={t} color="purple" />
                      ))}
                      {rec.urgency === "action-needed" && (
                        <TagPill label="Action Needed" color="amber" />
                      )}
                    </div>

                    {/* Expanded details */}
                    {selectedRecording?.id === rec.id && (
                      <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
                        {rec.decisions && rec.decisions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-emerald-400 mb-1">Decisions</p>
                            <ul className="text-xs text-zinc-400 space-y-0.5">
                              {rec.decisions.map((d: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-emerald-600 mt-0.5">-</span> {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {rec.numbers && rec.numbers.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-amber-400 mb-1">Key Numbers</p>
                            <ul className="text-xs text-zinc-400 space-y-0.5">
                              {rec.numbers.slice(0, 10).map((n: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-amber-600 mt-0.5">#</span> {n}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {rec.diarized_segments && rec.diarized_segments.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-indigo-400 mb-1">Key Dialogue</p>
                            <div className="space-y-1">
                              {rec.diarized_segments.slice(0, 8).map((seg: any, i: number) => (
                                <div key={i} className="text-xs">
                                  <span className="text-indigo-400 font-medium">{seg.speaker}:</span>{" "}
                                  <span className="text-zinc-400">{seg.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {mode !== "explore" && !searchResults && !askResult && !loading && (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm mb-2">
              {mode === "ask"
                ? "Ask any question about your recordings"
                : "Search across all your recordings semantically"
              }
            </p>
            <p className="text-zinc-600 text-xs">
              Try: "What did Frank say about pricing?" or "trucking costs California"
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">
              {mode === "ask" ? "Analyzing recordings..." : "Searching..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
