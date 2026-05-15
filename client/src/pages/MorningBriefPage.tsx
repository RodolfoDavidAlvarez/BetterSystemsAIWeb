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
  topics?: string[] | null;
  people?: string[] | null;
  companies?: string[] | null;
  projects?: string[] | null;
  tags?: string[] | null;
}
interface DealRecording {
  deal_key: string;
  recording_id: number;
  title: string;
  recorded_at: string;
  summary: string | null;
  people: string[] | null;
  companies: string[] | null;
  topics: string[] | null;
}
interface RoutineStatus {
  status: "running" | "completed" | "failed";
  last_run_at: string | null;
  summary: string | null;
  age_hours: number | null;
}
interface SystemsStatus {
  morning_advisor: RoutineStatus | null;
  action_items_cleaner: RoutineStatus | null;
  recording_sync: { last_recording_at: string | null; age_hours: number | null };
  imessage_sync: { last_message_at: string | null; age_hours: number | null };
  action_items: { pending: number };
  dev_tracker: { open_notes: number };
}
interface Payload {
  today: string;
  advisor_briefing: string | null;
  action_items: ActionItem[];
  deal_activity: DealActivity[];
  deal_recordings?: DealRecording[];
  recent_recordings: Recording[];
  weekly_kpis: { week_start: string; actions_closed: number; recordings_count: number };
  system_health: {
    briefing_fresh: { mtime: string; ageMinutes: number } | null;
    dev_tracker_unresolved: number;
  };
  systems_status?: SystemsStatus;
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
              const r = data.deal_recordings?.find(x => x.deal_key === d.key);
              const lastTouchIso = r?.recorded_at || a?.last_touch || null;
              const days = lastTouchIso ? daysAgo(lastTouchIso) : null;
              const urgency = days === null ? "red" : days >= 7 ? "red" : days >= 3 ? "yellow" : "green";
              return (
                <DealCard
                  key={d.key}
                  label={d.label}
                  lastTouchText={lastTouchIso ? fmtRelative(lastTouchIso) : "no recent comms"}
                  lastSource={r ? "recording" : a ? "iMessage" : null}
                  urgency={urgency}
                  cta={d.cta}
                  copyText={d.copyText}
                  recordingSummary={r?.summary || null}
                  recordingTitle={r?.title || null}
                  recordingPeople={r?.people || null}
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
              <FileText className="w-4 h-4" /> Recordings (last 7 days, {data.recent_recordings.length})
            </h2>
            <div className="space-y-2">
              {data.recent_recordings.map(r => (
                <RecordingCard key={r.id} r={r} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-6">
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

        {data.systems_status && <SystemsStatusPanel s={data.systems_status} />}

        <section className="mb-12">
          <h2 className="text-sm font-medium text-zinc-400 mb-2">Resources</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <a href="https://claude.ai/code/routines" target="_blank" rel="noreferrer"
               className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800/50">
              <span>Manage Routines</span><span className="text-xs text-zinc-500">claude.ai</span>
            </a>
            <a href="/admin/mission"
               className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded hover:bg-zinc-800/50">
              <span>Admin Mission</span><span className="text-xs text-zinc-500">private</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

function DealCard({
  label, lastTouchText, lastSource, urgency, cta, copyText,
  recordingSummary, recordingTitle, recordingPeople,
}: {
  label: string;
  lastTouchText: string;
  lastSource: "recording" | "iMessage" | null;
  urgency: "green" | "yellow" | "red";
  cta: string;
  copyText: string;
  recordingSummary: string | null;
  recordingTitle: string | null;
  recordingPeople: string[] | null;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const sourceTag = lastSource === "recording"
    ? <span className="text-[10px] opacity-60 uppercase tracking-wide">rec</span>
    : lastSource === "iMessage"
      ? <span className="text-[10px] opacity-60 uppercase tracking-wide">sms</span>
      : null;
  return (
    <div className={`rounded-lg border ${STATUS_COLOR[urgency]} bg-zinc-900/60 px-3 py-2.5`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs opacity-70 flex items-center gap-1.5">
            {lastTouchText}{sourceTag}
          </div>
        </div>
        <div className="text-xs mt-0.5 opacity-80">→ {cta}</div>
        {recordingSummary && (
          <div className="text-xs mt-1.5 opacity-75 line-clamp-2 italic">
            "{recordingSummary.slice(0, 240)}{recordingSummary.length > 240 ? "…" : ""}"
          </div>
        )}
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-current/20 space-y-2">
          {recordingTitle && (
            <div className="text-xs opacity-70">
              From: <span className="font-medium">{recordingTitle}</span>
              {recordingPeople && recordingPeople.length > 0 && (
                <span className="opacity-60"> · w/ {recordingPeople.slice(0, 3).join(", ")}</span>
              )}
            </div>
          )}
          {recordingSummary && (
            <div className="text-xs whitespace-pre-wrap opacity-85">{recordingSummary}</div>
          )}
          <div className="text-xs whitespace-pre-wrap opacity-90">{copyText}</div>
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

function SystemsStatusPanel({ s }: { s: SystemsStatus }) {
  const advisorState = pickStatus(s.morning_advisor, 26);
  const cleanerState = pickStatus(s.action_items_cleaner, 26);
  const recState = ageState(s.recording_sync.age_hours, 48, 168);
  const smsState = ageState(s.imessage_sync.age_hours, 30, 72);
  const actionsState: "green" | "yellow" | "red" = s.action_items.pending > 500 ? "red" : s.action_items.pending > 200 ? "yellow" : "green";

  return (
    <section className="mb-6">
      <h2 className="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
        <Activity className="w-4 h-4" /> Systems Status
      </h2>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        <StatusRow
          label="Morning Advisor (A1) — 6:47 AM AZ"
          status={advisorState}
          value={s.morning_advisor
            ? `${s.morning_advisor.status} · ${fmtAge(s.morning_advisor.age_hours)}`
            : "no runs yet"}
          detail={s.morning_advisor?.summary || null}
        />
        <StatusRow
          label="Action Items Cleaner (B1) — 5:00 AM AZ"
          status={cleanerState}
          value={s.action_items_cleaner
            ? `${s.action_items_cleaner.status} · ${fmtAge(s.action_items_cleaner.age_hours)}`
            : "no runs yet"}
          detail={s.action_items_cleaner?.summary || null}
        />
        <StatusRow
          label="Recording sync (Plaud)"
          status={recState}
          value={s.recording_sync.last_recording_at
            ? `last: ${fmtAge(s.recording_sync.age_hours)}`
            : "no recordings"}
        />
        <StatusRow
          label="iMessage sync (Mac)"
          status={smsState}
          value={s.imessage_sync.last_message_at
            ? `last: ${fmtAge(s.imessage_sync.age_hours)}`
            : "no messages"}
        />
        <StatusRow
          label="Pending action items"
          status={actionsState}
          value={`${s.action_items.pending}`}
        />
        <StatusRow
          label="Dev tracker open notes"
          status={s.dev_tracker.open_notes > 10 ? "yellow" : "green"}
          value={`${s.dev_tracker.open_notes} open`}
        />
      </div>
      <p className="text-[11px] text-zinc-500 mt-2">
        All routines run in Anthropic's cloud on your Claude Code subscription. No per-token API charges. No dependency on this Mac being awake.
      </p>
    </section>
  );
}

function StatusRow({ label, value, status, detail }: {
  label: string;
  value: string;
  status: "green" | "yellow" | "red";
  detail?: string | null;
}) {
  return (
    <div className="px-3 py-2 flex items-start justify-between text-sm gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-zinc-300">{label}</div>
        {detail && <div className="text-xs text-zinc-500 mt-0.5 truncate">{detail}</div>}
      </div>
      <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
        status === "green" ? "text-emerald-300" :
        status === "yellow" ? "text-amber-300" :
        "text-rose-300"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          status === "green" ? "bg-emerald-400" :
          status === "yellow" ? "bg-amber-400" :
          "bg-rose-400"
        }`} />
        <span className="text-xs">{value}</span>
      </div>
    </div>
  );
}

function pickStatus(r: RoutineStatus | null, redAfterHours: number): "green" | "yellow" | "red" {
  if (!r) return "red";
  if (r.status === "failed") return "red";
  if (r.status === "running") return "yellow";
  if (r.age_hours === null) return "yellow";
  if (r.age_hours > redAfterHours) return "red";
  return "green";
}

function ageState(hours: number | null, yellowAt: number, redAt: number): "green" | "yellow" | "red" {
  if (hours === null) return "red";
  if (hours >= redAt) return "red";
  if (hours >= yellowAt) return "yellow";
  return "green";
}

function fmtAge(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h ago`;
  const d = Math.round(hours / 24);
  return `${d}d ago`;
}

function RecordingCard({ r }: { r: Recording }) {
  const [open, setOpen] = useState(false);
  const minutes = Math.round(r.duration_seconds / 60);
  const chips = [
    ...(r.companies || []).map(c => ({ type: "company", text: c })),
    ...(r.people || []).slice(0, 4).map(p => ({ type: "person", text: p })),
    ...(r.topics || []).slice(0, 3).map(t => ({ type: "topic", text: t })),
  ];
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5">
      <button onClick={() => setOpen(!open)} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm text-zinc-200 font-medium flex-1">{r.title}</div>
          <div className="text-xs text-zinc-500 whitespace-nowrap">
            {fmtRelative(r.recorded_at)} · {minutes}m
          </div>
        </div>
        {r.summary && (
          <div className={`text-xs text-zinc-400 mt-1 ${open ? "" : "line-clamp-2"}`}>
            {r.summary}
          </div>
        )}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {chips.map((c, i) => (
              <span
                key={i}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  c.type === "company" ? "border-emerald-500/30 text-emerald-300/80 bg-emerald-500/5"
                  : c.type === "person" ? "border-blue-500/30 text-blue-300/80 bg-blue-500/5"
                  : "border-zinc-700 text-zinc-400"
                }`}
              >
                {c.text}
              </span>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}
