import { useState, useEffect, useCallback } from "react";
import {
  Users, RefreshCw, Loader2, User, Building2,
  MessageSquare, Hash, TrendingUp, ChevronDown
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface SpeakerProfile {
  id: number;
  name: string;
  aliases: string[] | null;
  company: string | null;
  role: string | null;
  topics: string[] | null;
  vocabulary: string[] | null;
  speaking_style: string | null;
  frequent_contacts: string[] | null;
  companies_discussed: string[] | null;
  recording_count: number;
  total_minutes: number;
  first_seen: string | null;
  last_seen: string | null;
  confidence_score: number;
  metadata: any;
}

interface IndexingStats {
  total_recordings: number;
  indexed_recordings: number;
  total_chunks: number;
  recordings_with_chunks: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

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

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Main Component ─────────────────────────────────────────────────

export default function MorePage() {
  const [profiles, setProfiles] = useState<SpeakerProfile[]>([]);
  const [stats, setStats] = useState<IndexingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || localStorage.getItem("authToken")}`,
    "Content-Type": "application/json",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, statsRes] = await Promise.all([
        fetch("/api/admin/speaker-profiles", { headers: getAuthHeaders() }),
        fetch("/api/admin/recordings/search/stats", { headers: getAuthHeaders() }),
      ]);
      const profilesData = await profilesRes.json();
      const statsData = await statsRes.json();
      setProfiles(profilesData.profiles || []);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Intelligence</h1>
            {!loading && profiles.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {profiles.length} speaker profile{profiles.length !== 1 ? "s" : ""}
                {stats && ` · ${stats.indexed_recordings}/${stats.total_recordings} indexed`}
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
      </div>

      {/* Indexing Stats */}
      {stats && !loading && (
        <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-primary/[0.04] border border-primary/10 p-3">
            <div className="text-2xl font-bold text-primary tabular-nums">{stats.indexed_recordings}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Recordings Indexed</div>
          </div>
          <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 p-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{profiles.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Speaker Profiles</div>
          </div>
          <div className="rounded-xl bg-violet-500/[0.04] border border-violet-500/10 p-3">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">{stats.total_chunks}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Search Chunks</div>
          </div>
          <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/10 p-3">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {stats.total_recordings > 0 ? Math.round((stats.indexed_recordings / stats.total_recordings) * 100) : 0}%
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Coverage</div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
        </div>
      )}

      {/* Speaker Profiles */}
      {!loading && (
        <div className="px-4 mt-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3 ml-0.5">
            Speaker Profiles
          </h2>
          <div className="space-y-2">
            {profiles.map((profile) => {
              const isExpanded = expandedId === profile.id;
              return (
                <div
                  key={profile.id}
                  className="rounded-2xl border bg-card overflow-hidden shadow-sm"
                >
                  {/* Profile Header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                    className="w-full text-left px-4 py-3 active:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${getSpeakerColor(profile.name)}`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[15px]">{profile.name}</span>
                          {profile.company && (
                            <span className="px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {profile.company}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground/60">
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="h-3 w-3" />
                            {profile.recording_count} recording{profile.recording_count !== 1 ? "s" : ""}
                          </span>
                          {profile.last_seen && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span>Last: {timeAgo(profile.last_seen)}</span>
                            </>
                          )}
                          {profile.confidence_score > 0 && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span>{Math.round(profile.confidence_score * 100)}%</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground/30 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border/40 px-4 py-3 space-y-3">
                      {/* Role */}
                      {profile.role && (
                        <div className="text-[13px] text-foreground/70">{profile.role}</div>
                      )}

                      {/* Topics */}
                      {profile.topics && profile.topics.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5">Topics</div>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.topics.slice(0, 12).map((t, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
                                {t}
                              </span>
                            ))}
                            {profile.topics.length > 12 && (
                              <span className="text-[10px] text-muted-foreground/50">+{profile.topics.length - 12}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Companies Discussed */}
                      {profile.companies_discussed && profile.companies_discussed.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5">Companies</div>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.companies_discussed.map((c, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                                <Building2 className="h-2.5 w-2.5" />
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Frequent Contacts */}
                      {profile.frequent_contacts && profile.frequent_contacts.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5">Talks With</div>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.frequent_contacts.map((c, i) => (
                              <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getSpeakerColor(c)}`}>
                                <User className="h-2.5 w-2.5" />
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vocabulary / Key Phrases */}
                      {profile.vocabulary && profile.vocabulary.length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5">Key Vocabulary</div>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.vocabulary.slice(0, 10).map((v, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-lg bg-primary/6 text-primary/70 text-[10px] font-mono">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Speaking Style */}
                      {profile.speaking_style && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">Style</div>
                          <p className="text-[12px] text-foreground/60 leading-relaxed">{profile.speaking_style}</p>
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground/50">
                        {profile.total_minutes > 0 && (
                          <span>{Math.round(profile.total_minutes)} min total</span>
                        )}
                        {profile.first_seen && (
                          <span>First: {new Date(profile.first_seen).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        )}
                        {profile.aliases && profile.aliases.length > 0 && (
                          <span>Aliases: {profile.aliases.join(", ")}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {profiles.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No speaker profiles yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Profiles build automatically as recordings are indexed</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
