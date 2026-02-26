import { useMemo, useState } from "react";
import { CheckCircle2, FolderKanban, Search, Trash2, XCircle } from "lucide-react";

type Recording = {
  id: number;
  title: string;
  company: "BSA" | "SSW" | "Personal";
  duration: string;
  ago: string;
  actions: number;
};

type Project = {
  id: number;
  name: string;
  company: "BSA" | "SSW";
  open: number;
  dueToday: number;
  overdue: number;
};

type ActionItem = {
  id: number;
  title: string;
  project: string;
  company: "BSA" | "SSW";
  priority: "urgent" | "high" | "medium";
  due: string;
  status: "pending" | "done" | "dismissed";
};

const seedRecordings: Recording[] = [
  { id: 1, title: "2026-02-26 — Discussion on AI Transcription Tools", company: "BSA", duration: "7m", ago: "52m ago", actions: 0 },
  { id: 2, title: "2026-02-26 — Discussion on TikTok Campaign and Book Giveaway", company: "BSA", duration: "5m", ago: "1h ago", actions: 7 },
  { id: 3, title: "2026-02-26 — Discussion with Brian — Project Update", company: "BSA", duration: "16m", ago: "2h ago", actions: 1 },
  { id: 4, title: "2026-02-25 — Discussion on Extract Production and Gypsum", company: "SSW", duration: "32m", ago: "4h ago", actions: 6 },
];

const seedProjects: Project[] = [
  { id: 1, name: "Astroid X Amazon Strategy", company: "BSA", open: 3, dueToday: 1, overdue: 0 },
  { id: 2, name: "Parker Dairy Signage", company: "SSW", open: 4, dueToday: 2, overdue: 1 },
  { id: 3, name: "Extract Production", company: "SSW", open: 5, dueToday: 2, overdue: 0 },
];

const seedActions: ActionItem[] = [
  { id: 1, title: "Confirm extract quantity needed", project: "Extract Production", company: "SSW", priority: "urgent", due: "Today", status: "pending" },
  { id: 2, title: "Send signage pricing options", project: "Parker Dairy Signage", company: "SSW", priority: "high", due: "Today", status: "pending" },
  { id: 3, title: "Schedule meeting with Astroid X", project: "Astroid X Amazon Strategy", company: "BSA", priority: "high", due: "Mar 3", status: "pending" },
  { id: 4, title: "Send follow-up email to Steve", project: "Parker Dairy Signage", company: "SSW", priority: "medium", due: "Tomorrow", status: "pending" },
];

function badgeColor(priority: ActionItem["priority"]) {
  if (priority === "urgent") return "bg-red-100 text-red-700";
  if (priority === "high") return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-700";
}

export default function KBMobilePrototypePage() {
  const [tab, setTab] = useState<"recordings" | "projects" | "actions">("recordings");
  const [query, setQuery] = useState("");
  const [actions, setActions] = useState<ActionItem[]>(seedActions);

  const pendingActions = useMemo(() => actions.filter(a => a.status === "pending"), [actions]);

  const filteredRecordings = useMemo(() => {
    return seedRecordings.filter(r => r.title.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const filteredProjects = useMemo(() => {
    return seedProjects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  const filteredActions = useMemo(() => {
    return pendingActions.filter(a =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.project.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, pendingActions]);

  const setStatus = (id: number, status: ActionItem["status"]) => {
    setActions(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-md px-4 py-4">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-500">BETTER SYSTEMS AI</p>
          <h1 className="mt-1 text-2xl font-bold">Knowledge Base</h1>
          <p className="mt-1 text-sm text-slate-600">
            {seedRecordings.length} recordings · 9.6h captured · {pendingActions.length} pending
          </p>
        </div>

        <div className="mb-3 flex gap-2 rounded-xl bg-white p-1 shadow-sm">
          <button className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === "recordings" ? "bg-slate-900 text-white" : "text-slate-600"}`} onClick={() => setTab("recordings")}>Recordings</button>
          <button className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === "projects" ? "bg-slate-900 text-white" : "text-slate-600"}`} onClick={() => setTab("projects")}>Projects</button>
          <button className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === "actions" ? "bg-slate-900 text-white" : "text-slate-600"}`} onClick={() => setTab("actions")}>Actions</button>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {tab === "recordings" && (
          <div className="space-y-2">
            {filteredRecordings.map((r) => (
              <article key={r.id} className="rounded-xl bg-white p-4 shadow-sm">
                <h3 className="font-semibold leading-tight">{r.title}</h3>
                <p className="mt-2 text-xs text-slate-500">
                  {r.duration} · {r.ago} {r.actions > 0 ? `· ${r.actions} actions` : ""}
                </p>
              </article>
            ))}
          </div>
        )}

        {tab === "projects" && (
          <div className="space-y-2">
            {filteredProjects.map((p) => (
              <article key={p.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.company}</p>
                  </div>
                  <FolderKanban className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-100 p-2"><p className="font-bold">{p.open}</p><p>Open</p></div>
                  <div className="rounded-lg bg-amber-100 p-2"><p className="font-bold">{p.dueToday}</p><p>Due Today</p></div>
                  <div className="rounded-lg bg-red-100 p-2"><p className="font-bold">{p.overdue}</p><p>Overdue</p></div>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "actions" && (
          <div className="space-y-2">
            {filteredActions.map((a) => (
              <article key={a.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">{a.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{a.project} · {a.company} · Due {a.due}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${badgeColor(a.priority)}`}>{a.priority.toUpperCase()}</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button onClick={() => setStatus(a.id, "done")} className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </button>
                  <button onClick={() => setStatus(a.id, "dismissed")} className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-700">
                    <XCircle className="h-4 w-4" /> Dismiss
                  </button>
                  <button onClick={() => setStatus(a.id, "dismissed")} className="inline-flex items-center justify-center gap-1 rounded-lg bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
