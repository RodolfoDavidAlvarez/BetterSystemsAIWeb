import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  RefreshCw, Loader2, AlertTriangle, CheckCircle2,
  Target, TrendingUp, Activity, ChevronDown, ChevronUp, FileText, Lock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────
interface ActionItem {
  id: number;
  title: string;
  company: string | null;
  project: string | null;
  priority: string;
  due_date: string | null;
  status: string;
  created_at: string;
}
interface DealActivity {
  deal_key: string;
  last_touch: string;
  msg_count: number;
}
interface Recording {
  id: number;
  title: string;
  recorded_at: string;
  duration_seconds: number;
  summary: string | null;
}
interface Payload {
  today: string;
  advisor_briefing: string | null;
  action_items: ActionItem[];
  deal_activity: DealActivity[];
  recent_recordings: Recording[];
  weekly_kpis: { week_start: string; actions_closed: number; recordings_count: number };
  system_health: {
    briefing_fresh: { mtime: string; ageMinutes: number } | null;
    dev_tracker_unresolved: number;
  };
}

// ─── Active deals (matches the cloud routine's deal list) ─────────────────
const DEALS: { key: string; label: string; cta: string; copyText: string }[] = [
  {
    key: "Heritage Headquarters",
    label: "Heritage HQ (Caroline)",
    cta: "Confirm next event timeline",
    copyText: "Hi Caroline, circling back on next event date and what you need from me. Rodo",
  },
  {
    key: "Fernando deal",
    label: "Fernando",
    cta: "Identify which Fernando + last status",
    copyText: "Hi Fernando, wanted to check in on where we landed. Anything I should be doing on my end? Rodo",
  },
  {
    key: "Testal × Desert Moonlighting",
    label: "Testal × Desert Moon (Linda)",
    cta: "Follow up on water proposal",
    copyText: "Hi Linda, want to make sure the water proposal is still front of mind. Any questions or do we lock a path forward? Rodo",
  },
  {
    key: "Brian Mitchell",
    label: "Brian Mitchell (New Build Watch)",
    cta: "Check house-close status + 2.3+2.4 bundle",
    copyText: "Hey Brian, hope the closing is moving smoothly. Quick note that 2.3 + 2.4 + launch are bundled at the 1,900 mark, ready when you are. Rodo",
  },
  {
    key: "Hiring Sabrina",
    label: "Hiring Sabrina (SSW)",
    cta: "Lock cash arrangement + signed comp",
    copyText: "Sabrina, let's finalize the comp paperwork so you can fully focus on the work. I'll send the doc today. Rodo",
  },
  {
    key: "Waste diversion ops",
    label: "Waste Diversion (SSW)",
    cta: "Sync with Mike on salchicha plan",
    copyText: "Mike, want to land on the waste diversion approach this week. Got 15 min? Rodo",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function daysAgo(iso: string) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
}
function fmtRelative(iso: string) {
  const d = daysAgo(iso);
  if (d === 0) return "today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

const STATUS_COLOR = {
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  yellow: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  red: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

// ─── Page ─────────────────────────────────────────────────────────────────
export default function MorningBriefPage() {
  const [location] = useLocation();
  const urlKey = new URLSearchParams(window.location.search).get("key");
  const storedKey = typeof window !== "undefined" ? localStorage.getItem("mb_key") : null;
  const [key, setKey] = useState<string | null>(urlKey || storedKey);
  const [input, setInput] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefingOpen, setBriefingOpen] = useState(true);

  const load = async (k: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/morning-brief?key=${encodeURIComponent(k)}`);
      if (r.status === 401) {
        localStorage.removeItem("mb_key");
        setKey(null);
        throw new Error("Wrong passcode");
      }
      if (!r.ok) throw new Error(`API ${r.status}`);
      const json = await r.json();
      setData(json);
      localStorage.setItem("mb_key", k);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (key) load(key);
  }, [key, location]);

  // Passcode gate
  if (!key) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-zinc-400" />
            <h1 className="font-medium">Morning Brief</h1>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Enter your passcode to open today's briefing.</p>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            type="password"
            placeholder="Passcode"
            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm focus:outline-none focus:border-zinc-600"
            onKeyDown={e => { if (e.key === "Enter" && input) setKey(input); }}
          />
          <button
            onClick={() => { if (input) setKey(input); }}
            disabled={!input}
            className="mt-3 w-full px-3 py-2 rounded bg-zinc-200 text-zinc-900 text-sm font-medium disabled:opacity-30"
          >
            Unlock
          </button>
          {error && <div className="mt-3 text-xs text-rose-400">{error}</div>}
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (error && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-2xl mx-auto bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 mb-2 text-rose-400" />
          <div className="text-rose-200 font-medium">{error}</div>
          <button
            onClick={() => key && load(key)}
            className="mt-3 px-3 py-1.5 text-sm bg-rose-500/20 border border-rose-500/40 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Morning Brief — {data.today}</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {data.system_health.briefing_fresh
                ? `Updated ${data.system_health.briefing_fresh.ageMinutes} min ago`
                : "Waiting on today's brief"}
            </p>
          </div>
          <button onClick={() => key && load(key)} className="p-2 rounded hover:bg-zinc-800 transition" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <section className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setBriefingOpen(!briefingOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">Today's Briefing</span>
            </div>
            {briefingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {briefingOpen && (
            <div className="px-4 pb-4 pt-2 border-t border-zinc-800">
              {data.advisor_briefing ? (
                <pre className="whitespace-pre-wrap text-sm text-zinc-200 font-sans leading-relaxed">
                  {data.advisor_briefing}
                </pre>
              ) : (
                <div className="text-sm text-zinc-400 py-2">
                  No briefing yet — the morning routine runs at 6:47 AM AZ.
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Active Deals
          </h2>
          <div className="space-y-2">
            {DEALS.map(d => {
              const a = data.deal_activity.find(x => x.deal_key === d.key);
              const days = a ? daysAgo(a.last_touch) : null;
              const urgency = days === null ? "red" : days >= 7 ? "red" : days >= 3 ? "yellow" : "green";
              return (
                <DealCard
                  key={d.key}
                  label={d.label}
                  lastTouchText={a ? fmtRelative(a.last_touch) : "no recent comms"}
                  urgency={urgency}
                  cta={d.cta}
                  copyText={d.copyText}
                />
              );
            })}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Action Items ({data.action_items.length})
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {data.action_items.slice(0, 15).map(item => {
              const overdue = item.due_date && new Date(item.due_date) < new Date();
              return (
                <div key={item.id} className="px-3 py-2 border-b border-zinc-800/50 last:border-0 text-sm flex items-start gap-2">
                  <span className={`inline-block w-2 h-2 mt-1.5 rounded-full ${
                    item.priority === "urgent" || overdue ? "bg-rose-400"
                    : item.priority === "high" ? "bg-amber-400"
                    : "bg-zinc-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-200">{item.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {item.company || "—"} · {item.project || "—"}
                      {item.due_date && <> · due {new Date(item.due_date).toLocaleDateString()}</>}
                      {overdue && <span className="text-rose-400 ml-1">overdue</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {data.action_items.length > 15 && (
              <div className="px-3 py-2 text-xs text-zinc-500 text-center">
                +{data.action_items.length - 15} more
              </div>
            )}
          </div>
        </section>

        {data.recent_recordings.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Last 48h Recordings
            </h2>
            <div className="space-y-1.5">
              {data.recent_recordings.map(r => (
                <div key={r.id} className="text-sm bg-zinc-900 border border-zinc-800 rounded px-3 py-2">
                  <div className="text-zinc-200">{r.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {new Date(r.recorded_at).toLocaleString()} · {Math.round(r.duration_seconds / 60)}m
                  </div>
                  {r.summary && (
                    <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{r.summary}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> This Week
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
              <div className="text-xs text-zinc-500">Actions closed</div>
              <div className="text-xl font-semibold">{data.weekly_kpis.actions_closed}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5">
              <div className="text-xs text-zinc-500">Recordings</div>
              <div className="text-xl font-semibold">{data.weekly_kpis.recordings_count}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DealCard({
  label, lastTouchText, urgency, cta, copyText,
}: {
  label: string;
  lastTouchText: string;
  urgency: "green" | "yellow" | "red";
  cta: string;
  copyText: string;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className={`rounded-lg border ${STATUS_COLOR[urgency]} bg-zinc-900/60 px-3 py-2.5`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs opacity-70">{lastTouchText}</div>
        </div>
        <div className="text-xs mt-0.5 opacity-80">→ {cta}</div>
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-current/20">
          <div className="text-xs whitespace-pre-wrap opacity-90 mb-2">{copyText}</div>
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition"
          >
            {copied ? "Copied ✓" : "Copy message"}
          </button>
        </div>
      )}
    </div>
  );
}
