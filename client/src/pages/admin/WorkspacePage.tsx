import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { getApiBaseUrl } from "../../lib/queryClient";

/**
 * Developer Workspace
 * ────────────────────
 * Editorial-brutalist landing for developers (and admin).
 * Three views: Brief (overview), Resources, Tracker (embedded).
 *
 * Aesthetic: paper-and-ink. Off-black on warm cream, electric ultramarine
 * accent, oversized Instrument Serif numerals against Geist Mono labels.
 * No drop shadows, no gradients — hairline rules and typographic hierarchy
 * carry the weight.
 */

interface DevItem {
  id: string;
  title: string;
  status: "open" | "in_flight" | "shipped" | "tested_pass" | "tested_fail" | "wont_do";
  project: string;
  version: string;
  source?: string | null;
  updated_at: string;
  notes?: { id: string; resolved_at: string | null }[];
  // Lifecycle
  delivered_at?: string | null;
  deployed_at?: string | null;
  invoiced_at?: string | null;
  paid_at?: string | null;
  invoice_number?: string | null;
}

interface CurrentUser {
  id: number;
  username?: string;
  email?: string;
  name?: string;
  role: "owner" | "admin" | "developer";
}

const STATUS_LABEL: Record<string, string> = {
  open: "Not started",
  in_flight: "Building",
  shipped: "Shipped",
  tested_pass: "Passing",
  tested_fail: "Failing",
  wont_do: "Skipped",
};

// ink swatches keyed to status
const STATUS_INK: Record<string, string> = {
  open: "#0a0a0a",
  in_flight: "#c2410c",
  shipped: "#1d3eef",
  tested_pass: "#15803d",
  tested_fail: "#b91c1c",
  wont_do: "#737373",
};

export default function WorkspacePage() {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [items, setItems] = useState<DevItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const baseUrl = getApiBaseUrl();

    Promise.all([
      fetch(`${baseUrl}/auth/me`, { headers }).then((r) => r.json()),
      fetch(`${baseUrl}/dev-tracker/items`, { headers }).then((r) => r.json()),
    ])
      .then(([meData, itemsData]) => {
        setMe(meData.user || meData);
        const flat: DevItem[] = Array.isArray(itemsData)
          ? itemsData
          : (Object.values(itemsData || {}).flat() as DevItem[]);
        setItems(flat);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: items.length,
    open: items.filter((i) => i.status === "open").length,
    in_flight: items.filter((i) => i.status === "in_flight").length,
    shipped: items.filter((i) => i.status === "shipped" || i.status === "tested_pass").length,
  };

  const nextUp = items.find((i) => i.status === "in_flight") || items.find((i) => i.status === "open");
  const recent = [...items]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const isAdmin = me?.role === "admin" || me?.role === "owner";
  const greetingName = me?.name?.split(" ")[0] || "there";
  const displayId = me?.email || me?.username;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen" style={{ background: "#f5f3ef", color: "#0a0a0a", fontFamily: "Geist, -apple-system, system-ui, sans-serif" }}>
      <style>{`
        @keyframes ws-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .ws-rise { animation: ws-rise 600ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .ws-rise-1 { animation-delay: 60ms; }
        .ws-rise-2 { animation-delay: 120ms; }
        .ws-rise-3 { animation-delay: 180ms; }
        .ws-rise-4 { animation-delay: 240ms; }
        .ws-rise-5 { animation-delay: 300ms; }
        .ws-tab[data-state="active"] { color: #0a0a0a; border-bottom-color: #1d3eef !important; }
        .ws-tab { transition: color 150ms, border-color 150ms; }
        .ws-link { background-image: linear-gradient(to right, #0a0a0a, #0a0a0a); background-position: 0 100%; background-repeat: no-repeat; background-size: 100% 1px; transition: background-size 200ms; }
        .ws-link:hover { background-size: 100% 2px; }
        .ws-num-serif { font-family: 'Instrument Serif', Georgia, serif; font-feature-settings: 'tnum'; line-height: 0.9; letter-spacing: -0.02em; }
        .ws-mono { font-family: 'Geist Mono', ui-monospace, monospace; }
      `}</style>

      {/* MASTHEAD ─────────────────────────────────── */}
      <header className="border-b" style={{ borderColor: "#0a0a0a" }}>
        <div className="max-w-[1180px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 ws-mono text-[11px] uppercase tracking-[0.18em]">
            <span className="font-bold">BSA</span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span style={{ opacity: 0.7 }}>Workspace</span>
            <span style={{ opacity: 0.4 }} className="hidden sm:inline">/</span>
            <span style={{ opacity: 0.7 }} className="hidden sm:inline">Vol. 01</span>
          </div>
          <div className="flex items-center gap-4 ws-mono text-[11px] uppercase tracking-[0.16em]">
            {!loading && displayId && (
              <span style={{ opacity: 0.55 }} className="hidden md:inline">{displayId}</span>
            )}
            <button onClick={logout} className="ws-link pb-0.5">Log out</button>
          </div>
        </div>
      </header>

      <div className="max-w-[1180px] mx-auto px-6 lg:px-10 pt-10 pb-20">
        {/* TITLE BLOCK ──────────────────────────────── */}
        <div className="grid grid-cols-12 gap-6 mb-12 items-end">
          <div className="col-span-12 md:col-span-8 ws-rise">
            <p className="ws-mono text-[11px] uppercase tracking-[0.22em] mb-3" style={{ color: "#1d3eef" }}>
              ── Issue 01 · {today}
            </p>
            <h1 className="text-[64px] md:text-[96px] font-bold leading-[0.92] tracking-[-0.04em]">
              {loading ? "…" : `Hi, ${greetingName}.`}
            </h1>
            <p className="mt-5 text-[17px] leading-snug max-w-[34ch]" style={{ color: "#3a3a3a" }}>
              {isAdmin
                ? "Full ledger across every assigned task, every contributor, every project."
                : "What's yours to ship today, and everything you need to ship it."}
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 ws-rise ws-rise-1">
            <div className="flex md:justify-end">
              <div className="border-t-2 pt-3 inline-block min-w-[200px]" style={{ borderColor: "#0a0a0a" }}>
                <p className="ws-mono text-[10px] uppercase tracking-[0.22em]" style={{ opacity: 0.55 }}>Operator</p>
                <p className="text-[18px] font-semibold mt-1">{me?.name || "—"}</p>
                <p className="ws-mono text-[10px] uppercase tracking-[0.18em] mt-1" style={{ color: "#1d3eef" }}>
                  {me?.role || "developer"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TABS ─────────────────────────────────────── */}
        <Tabs defaultValue="brief" className="w-full">
          <TabsList
            className="w-full justify-start gap-0 rounded-none p-0 h-auto bg-transparent border-b ws-rise ws-rise-2"
            style={{ borderColor: "#0a0a0a" }}
          >
            {[
              { v: "brief", label: "Brief" },
              { v: "resources", label: "Resources" },
              { v: "tracker", label: "Tracker" },
            ].map((t) => (
              <TabsTrigger
                key={t.v}
                value={t.v}
                className="ws-tab ws-mono text-[12px] uppercase tracking-[0.18em] rounded-none px-5 py-3 -mb-px border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                style={{ color: "#737373" }}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ═══ BRIEF ═══════════════════════════════ */}
          <TabsContent value="brief" className="mt-12 space-y-14 focus-visible:outline-none">
            {/* Stat numerals row */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-y-8 md:gap-y-0 md:gap-x-2">
              {[
                { idx: "01", value: stats.total, label: isAdmin ? "Total items" : "Assigned to you" },
                { idx: "02", value: stats.open, label: "Not started" },
                { idx: "03", value: stats.in_flight, label: "Building" },
                { idx: "04", value: stats.shipped, label: "Shipped" },
              ].map((s, i) => (
                <div
                  key={s.idx}
                  className={`relative pl-5 md:pl-6 md:border-l ws-rise ws-rise-${i + 1}`}
                  style={{ borderColor: "rgba(10,10,10,0.12)" }}
                >
                  <span className="absolute top-0 left-0 ws-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "#1d3eef" }}>
                    {s.idx}
                  </span>
                  <div className="ws-num-serif text-[88px] md:text-[112px] mt-2">{loading ? "·" : s.value}</div>
                  <p className="ws-mono text-[10px] uppercase tracking-[0.22em] -mt-1" style={{ opacity: 0.6 }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </section>

            <hr style={{ borderColor: "rgba(10,10,10,0.15)" }} />

            {/* Two-column: Next up + Recent log */}
            <section className="grid grid-cols-12 gap-10">
              {/* Next up — hero item */}
              <div className="col-span-12 lg:col-span-7">
                <p className="ws-mono text-[10px] uppercase tracking-[0.22em] mb-4" style={{ color: "#1d3eef" }}>
                  ▸ Next up
                </p>
                {loading ? (
                  <p className="ws-mono text-sm" style={{ opacity: 0.5 }}>Loading…</p>
                ) : !nextUp ? (
                  <div>
                    <p className="text-[28px] font-semibold tracking-tight">All clear.</p>
                    <p className="text-[15px] mt-2" style={{ opacity: 0.55 }}>
                      {isAdmin ? "Nothing in flight. Assign someone." : "No open work assigned to you."}
                    </p>
                  </div>
                ) : (
                  <article>
                    <div className="ws-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: STATUS_INK[nextUp.status] }}>
                      ● {STATUS_LABEL[nextUp.status]} — {nextUp.project} / v{nextUp.version}
                    </div>
                    <h2 className="text-[32px] md:text-[40px] leading-[1.05] font-semibold tracking-[-0.02em] max-w-[28ch]">
                      {nextUp.title}
                    </h2>
                    {nextUp.source && (
                      <p className="ws-mono text-[12px] mt-4" style={{ opacity: 0.55 }}>
                        ↳ {nextUp.source}
                      </p>
                    )}
                    <a
                      href="/dev-tracker.html"
                      className="inline-flex items-center gap-2 mt-6 ws-mono text-[12px] uppercase tracking-[0.18em] pb-1 border-b"
                      style={{ borderColor: "#0a0a0a" }}
                    >
                      Open in tracker →
                    </a>
                  </article>
                )}
              </div>

              {/* Recent log — minimalist list */}
              <div className="col-span-12 lg:col-span-5">
                <p className="ws-mono text-[10px] uppercase tracking-[0.22em] mb-4" style={{ opacity: 0.55 }}>
                  ▸ Recent log · last 5 updated
                </p>
                {loading ? (
                  <p className="ws-mono text-sm" style={{ opacity: 0.5 }}>Loading…</p>
                ) : recent.length === 0 ? (
                  <p className="text-[14px]" style={{ opacity: 0.55 }}>No activity yet.</p>
                ) : (
                  <ol className="space-y-0">
                    {recent.map((item, i) => {
                      const unresolved = (item.notes || []).filter((n) => !n.resolved_at).length;
                      const date = new Date(item.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      const lc = [
                        { on: !!item.delivered_at, color: "#15803d", label: "D", title: "Delivered" },
                        { on: !!item.deployed_at || item.status === "shipped" || item.status === "tested_pass", color: "#1d3eef", label: "S", title: "Shipped" },
                        { on: !!item.invoiced_at, color: "#c2410c", label: "I", title: "Invoiced" + (item.invoice_number ? ` (${item.invoice_number})` : "") },
                        { on: !!item.paid_at, color: "#b8860b", label: "P", title: "Paid" },
                      ];
                      return (
                        <li
                          key={item.id}
                          className="grid grid-cols-[2rem_1fr_auto_auto] items-baseline gap-3 py-3 border-b"
                          style={{ borderColor: "rgba(10,10,10,0.08)" }}
                        >
                          <span className="ws-mono text-[10px] tabular-nums" style={{ opacity: 0.4 }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[14px] truncate font-medium">{item.title}</p>
                            <p className="ws-mono text-[10px] uppercase tracking-[0.16em] mt-0.5" style={{ color: STATUS_INK[item.status] }}>
                              {STATUS_LABEL[item.status]}
                              {unresolved > 0 && <span className="ml-2" style={{ color: "#c2410c" }}>· {unresolved} unresolved</span>}
                            </p>
                          </div>
                          {/* Lifecycle mini-pills */}
                          <span className="inline-flex gap-0.5 items-center" title="Delivered → Shipped → Invoiced → Paid">
                            {lc.map((s, idx) => (
                              <span
                                key={idx}
                                title={`${s.title}${s.on ? "" : " · pending"}`}
                                className="ws-mono inline-flex items-center justify-center"
                                style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: 999,
                                  fontSize: 8,
                                  fontWeight: 700,
                                  background: s.on ? s.color : "transparent",
                                  color: s.on ? "white" : "rgba(10,10,10,0.25)",
                                  border: s.on ? `1px solid ${s.color}` : "1px solid rgba(10,10,10,0.2)",
                                }}
                              >
                                {s.label}
                              </span>
                            ))}
                          </span>
                          <span className="ws-mono text-[10px]" style={{ opacity: 0.4 }}>{date}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </section>
          </TabsContent>

          {/* ═══ RESOURCES ════════════════════════════ */}
          <TabsContent value="resources" className="mt-12 focus-visible:outline-none">
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-12 md:col-span-4">
                <p className="ws-mono text-[10px] uppercase tracking-[0.22em] mb-4" style={{ color: "#1d3eef" }}>
                  ── Resources
                </p>
                <h2 className="text-[44px] md:text-[56px] font-bold leading-[0.95] tracking-[-0.03em] max-w-[10ch]">
                  Everything you need.
                </h2>
                <p className="mt-5 text-[15px]" style={{ opacity: 0.6 }}>
                  Tools, code, comms. Bookmarked once, reachable always.
                </p>
              </div>
              <div className="col-span-12 md:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  {(
                    [
                      { num: "01", title: "Developer Tracker", desc: "Manage assigned items, status, notes", href: "/dev-tracker.html" },
                      { num: "02", title: "GitHub Repo", desc: "RodolfoDavidAlvarez / BetterSystemsAIWeb", href: "https://github.com/RodolfoDavidAlvarez/BetterSystemsAIWeb", external: true },
                      { num: "03", title: "Email Rodo", desc: "Stuck or blocked? Direct line.", href: "mailto:rodolfo@bettersystems.ai" },
                      { num: "04", title: "Onboarding Guide", desc: "How the tracker works, top to bottom", href: "/DEV_TRACKER_ONBOARDING.md", external: true },
                      ...(isAdmin
                        ? [{ num: "05", title: "Full Ops Dashboard", desc: "Clients, billing, conversations", href: "/admin/dashboard" }]
                        : []),
                    ] as { num: string; title: string; desc: string; href: string; external?: boolean }[]
                  ).map((r, i) => (
                    <a
                      key={r.num}
                      href={r.href}
                      target={r.external ? "_blank" : undefined}
                      rel={r.external ? "noreferrer" : undefined}
                      className={`group relative block py-6 px-1 border-b ws-rise ws-rise-${Math.min(i + 1, 5)}`}
                      style={{ borderColor: "rgba(10,10,10,0.12)" }}
                    >
                      <div className="flex items-baseline gap-4">
                        <span className="ws-mono text-[10px] tabular-nums tracking-[0.2em]" style={{ color: "#1d3eef" }}>
                          {r.num}
                        </span>
                        <div className="flex-1">
                          <p className="text-[18px] font-semibold tracking-[-0.01em] group-hover:underline underline-offset-4">
                            {r.title}
                            {r.external && <span className="ws-mono text-[11px] ml-2" style={{ opacity: 0.4 }}>↗</span>}
                          </p>
                          <p className="text-[13px] mt-1" style={{ opacity: 0.55 }}>{r.desc}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══ TRACKER (embedded) ═══════════════════ */}
          <TabsContent value="tracker" className="mt-8 focus-visible:outline-none">
            <div className="flex items-center justify-between mb-4">
              <p className="ws-mono text-[10px] uppercase tracking-[0.22em]" style={{ opacity: 0.55 }}>
                ▸ Live tracker · embedded
              </p>
              <a
                href="/dev-tracker.html"
                target="_blank"
                rel="noreferrer"
                className="ws-mono text-[11px] uppercase tracking-[0.18em] pb-0.5 border-b"
                style={{ borderColor: "#0a0a0a" }}
              >
                Open in new tab ↗
              </a>
            </div>
            <div className="border-2" style={{ borderColor: "#0a0a0a" }}>
              <iframe
                src="/dev-tracker.html"
                title="Developer Tracker"
                className="w-full block bg-white"
                style={{ height: "calc(100vh - 320px)", minHeight: 600 }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* COLOPHON ────────────────────────────────── */}
        <footer className="mt-20 pt-6 border-t flex items-center justify-between ws-mono text-[10px] uppercase tracking-[0.22em]" style={{ borderColor: "rgba(10,10,10,0.15)", opacity: 0.5 }}>
          <span>Better Systems AI · Workspace</span>
          <span>{today}</span>
        </footer>
      </div>
    </div>
  );
}
