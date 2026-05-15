import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Plus,
  Bot, ChevronDown, ChevronRight, Flag
} from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string | null;
  company: string;
  project: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  source: string | null;
  created_at: string;
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const priorityColors: Record<string, string> = {
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-blue-500",
  low: "text-gray-400",
};

function getToken() {
  return localStorage.getItem("authToken") || localStorage.getItem("token") || "";
}

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch("/api/admin/knowledge-base/actions", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function updateTask(id: number, updates: Partial<Task>): Promise<Task> {
  const res = await fetch(`/api/admin/knowledge-base/actions/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

async function createTask(task: Partial<Task>): Promise<Task> {
  const res = await fetch("/api/admin/knowledge-base/actions", {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error("Failed to create");
  return res.json();
}

// ─── Agent Status ────────────────────────────────────────────

function AgentBanner() {
  const agents = [
    { id: "B1", name: "Billie", time: "2 AM", color: "#f59e0b" },
    { id: "C1", name: "Cora", time: "3 AM", color: "#8b5cf6" },
    { id: "D1", name: "Dev 1", time: "4 AM", color: "#3b82f6" },
    { id: "A1", name: "Ace", time: "5 AM", color: "#10b981" },
  ];

  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
      {agents.map((a) => (
        <div
          key={a.id}
          style={{
            minWidth: 78,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#fff",
            border: "1px solid #e5e7eb",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: "50%", margin: "0 auto 6px",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: a.color + "18", color: a.color,
            fontSize: 11, fontWeight: 700,
          }}>
            {a.id}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{a.name}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>{a.time}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Stats ───────────────────────────────────────────────────

function StatsRow({ tasks }: { tasks: Task[] }) {
  const pending = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
  const overdue = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date() &&
    t.status !== "completed" && t.status !== "dismissed"
  ).length;
  const completed = tasks.filter(t => t.status === "completed").length;

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      {[
        { label: "Active", value: pending, bg: "#eff6ff", color: "#2563eb" },
        { label: "Overdue", value: overdue, bg: overdue > 0 ? "#fef2f2" : "#f9fafb", color: overdue > 0 ? "#dc2626" : "#9ca3af" },
        { label: "Done", value: completed, bg: "#f0fdf4", color: "#16a34a" },
      ].map((s) => (
        <div key={s.label} style={{
          flex: 1, padding: "12px 8px", borderRadius: 12,
          background: s.bg, textAlign: "center",
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Quick Add ───────────────────────────────────────────────

function QuickAdd({ onAdd }: { onAdd: (title: string, company: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("BSA");

  const submit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), company);
    setTitle("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%", padding: "14px 16px", borderRadius: 12,
          border: "2px dashed #d1d5db", background: "transparent",
          display: "flex", alignItems: "center", gap: 8,
          color: "#9ca3af", fontSize: 14, cursor: "pointer",
        }}
      >
        <Plus style={{ width: 16, height: 16 }} />
        Add task
      </button>
    );
  }

  return (
    <div style={{
      padding: 14, borderRadius: 12, background: "#fff",
      border: "1px solid #e5e7eb", marginBottom: 4,
    }}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="What needs to be done?"
        style={{
          width: "100%", border: "none", outline: "none",
          fontSize: 14, color: "#111827", marginBottom: 12,
          background: "transparent",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["BSA", "SSW"].map((c) => (
            <button
              key={c}
              onClick={() => setCompany(c)}
              style={{
                padding: "4px 10px", borderRadius: 6, border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: company === c ? (c === "BSA" ? "#dbeafe" : "#dcfce7") : "#f3f4f6",
                color: company === c ? (c === "BSA" ? "#2563eb" : "#16a34a") : "#6b7280",
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setOpen(false)} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} style={{ fontSize: 12, fontWeight: 600, color: "#2563eb", background: "none", border: "none", cursor: "pointer" }}>Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Item ───────────────────────────────────────────────

function TaskItem({ task, onToggle, onUpdate }: {
  task: Task;
  onToggle: () => void;
  onUpdate: (u: Partial<Task>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const done = task.status === "completed" || task.status === "dismissed";

  const daysOverdue = task.due_date
    ? Math.floor((Date.now() - new Date(task.due_date).getTime()) / 86400000)
    : null;

  return (
    <div style={{
      padding: "10px 12px", borderBottom: "1px solid #f3f4f6",
      opacity: done ? 0.4 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <button onClick={onToggle} style={{ marginTop: 2, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {done
            ? <CheckCircle2 style={{ width: 20, height: 20, color: "#16a34a" }} />
            : task.status === "in_progress"
              ? <Clock style={{ width: 20, height: 20, color: "#2563eb" }} />
              : <Circle style={{ width: 20, height: 20, color: "#d1d5db" }} />
          }
        </button>

        <div style={{ flex: 1, minWidth: 0 }} onClick={() => setExpanded(!expanded)}>
          <div style={{
            fontSize: 14, color: done ? "#9ca3af" : "#111827",
            textDecoration: done ? "line-through" : "none",
            lineHeight: 1.4,
          }}>
            {task.title}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {task.company && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                color: task.company === "BSA" ? "#2563eb" : "#16a34a",
              }}>
                {task.company}
              </span>
            )}
            {task.project && (
              <span style={{ fontSize: 10, color: "#9ca3af", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {task.project}
              </span>
            )}
            {task.priority && task.priority !== "medium" && (
              <Flag className={priorityColors[task.priority]} style={{ width: 12, height: 12 }} />
            )}
            {daysOverdue !== null && daysOverdue > 0 && !done && (
              <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 600 }}>{daysOverdue}d late</span>
            )}
            {task.source && task.source !== "manual" && (
              <span style={{ fontSize: 9, color: "#d1d5db", background: "#f9fafb", padding: "1px 5px", borderRadius: 4 }}>{task.source}</span>
            )}
          </div>

          {expanded && (
            <div style={{ marginTop: 10 }}>
              {task.description && (
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 8 }}>{task.description}</p>
              )}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                {["pending", "in_progress", "completed", "dismissed"].map((s) => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); onUpdate({ status: s }); }}
                    style={{
                      padding: "3px 8px", borderRadius: 4, border: "none",
                      fontSize: 10, cursor: "pointer",
                      background: task.status === s ? "#e5e7eb" : "#f9fafb",
                      color: task.status === s ? "#111827" : "#9ca3af",
                      fontWeight: task.status === s ? 600 : 400,
                    }}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["urgent", "high", "medium", "low"].map((p) => (
                  <button
                    key={p}
                    onClick={(e) => { e.stopPropagation(); onUpdate({ priority: p }); }}
                    style={{
                      padding: "3px 8px", borderRadius: 4, border: "none",
                      fontSize: 10, cursor: "pointer",
                      background: task.priority === p ? "#e5e7eb" : "#f9fafb",
                      color: task.priority === p ? "#111827" : "#9ca3af",
                      fontWeight: task.priority === p ? 600 : 400,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 2 }}>
          {expanded
            ? <ChevronDown style={{ width: 14, height: 14, color: "#9ca3af" }} />
            : <ChevronRight style={{ width: 14, height: 14, color: "#d1d5db" }} />
          }
        </button>
      </div>
    </div>
  );
}

// ─── Project Group ───────────────────────────────────────────

function ProjectGroup({ project, tasks, onToggle, onUpdate }: {
  project: string;
  tasks: Task[];
  onToggle: (id: number) => void;
  onUpdate: (id: number, u: Partial<Task>) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pending = tasks.filter(t => t.status !== "completed" && t.status !== "dismissed").length;

  return (
    <div style={{ marginBottom: 12, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "12px 14px", background: "#f9fafb", border: "none",
          borderBottom: collapsed ? "none" : "1px solid #f3f4f6",
          cursor: "pointer",
        }}
      >
        {collapsed
          ? <ChevronRight style={{ width: 14, height: 14, color: "#9ca3af" }} />
          : <ChevronDown style={{ width: 14, height: 14, color: "#9ca3af" }} />
        }
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {project}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: pending > 0 ? "#f59e0b" : "#16a34a",
          background: pending > 0 ? "#fef3c7" : "#dcfce7",
          padding: "2px 7px", borderRadius: 10,
        }}>
          {pending}
        </span>
      </button>
      {!collapsed && tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={() => onToggle(task.id)}
          onUpdate={(u) => onUpdate(task.id, u)}
        />
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────

export default function TasksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("active");
  const [companyFilter, setCompanyFilter] = useState("all");

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    refetchInterval: 30000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, u }: { id: number; u: Partial<Task> }) => updateTask(id, u),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const createMut = useMutation({
    mutationFn: (t: Partial<Task>) => createTask(t),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const toggle = (id: number) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    updateMut.mutate({ id, u: { status: t.status === "completed" ? "pending" : "completed" } });
  };

  // Filter
  let filtered = tasks;
  if (filter === "active") filtered = filtered.filter(t => t.status !== "completed" && t.status !== "dismissed");
  if (filter === "overdue") filtered = filtered.filter(t =>
    t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed" && t.status !== "dismissed"
  );
  if (filter === "completed") filtered = filtered.filter(t => t.status === "completed");
  if (companyFilter !== "all") filtered = filtered.filter(t => t.company === companyFilter);

  // Sort
  filtered.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 2;
    const pb = PRIORITY_ORDER[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    return 0;
  });

  // Group by project
  const grouped: Record<string, Task[]> = {};
  filtered.forEach(t => {
    const key = t.project || "General";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  const sorted = Object.entries(grouped).sort((a, b) => {
    const ap = a[1].filter(t => t.status !== "completed").length;
    const bp = b[1].filter(t => t.status !== "completed").length;
    return bp - ap;
  });

  return (
    <div style={{ padding: "20px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: 0 }}>Tasks</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", margin: "2px 0 16px" }}>
          {tasks.filter(t => t.status !== "completed" && t.status !== "dismissed").length} active
          {" · "}
          {tasks.filter(t => t.status === "completed").length} done
        </p>
      </div>

      {/* Agent Status */}
      <AgentBanner />

      {/* Stats */}
      <StatsRow tasks={tasks} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {[
          { key: "active", label: "Active" },
          { key: "overdue", label: "Overdue" },
          { key: "completed", label: "Done" },
          { key: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "none",
              fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              background: filter === f.key ? "#111827" : "#f3f4f6",
              color: filter === f.key ? "#fff" : "#6b7280",
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ width: 1, background: "#e5e7eb", margin: "4px 2px" }} />
        {["all", "BSA", "SSW"].map((c) => (
          <button
            key={c}
            onClick={() => setCompanyFilter(c)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "none",
              fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              background: companyFilter === c
                ? (c === "BSA" ? "#dbeafe" : c === "SSW" ? "#dcfce7" : "#111827")
                : "#f3f4f6",
              color: companyFilter === c
                ? (c === "BSA" ? "#2563eb" : c === "SSW" ? "#16a34a" : "#fff")
                : "#6b7280",
            }}
          >
            {c === "all" ? "Both" : c}
          </button>
        ))}
      </div>

      {/* Quick Add */}
      <div style={{ marginBottom: 16 }}>
        <QuickAdd onAdd={(title, company) => createMut.mutate({ title, company, priority: "medium", source: "manual" })} />
      </div>

      {/* Task List */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{
            width: 24, height: 24, border: "3px solid #e5e7eb", borderTopColor: "#6b7280",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
            margin: "0 auto",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <CheckCircle2 style={{ width: 40, height: 40, color: "#d1d5db", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            {filter === "overdue" ? "No overdue tasks" : "All clear"}
          </p>
        </div>
      ) : (
        sorted.map(([project, projectTasks]) => (
          <ProjectGroup
            key={project}
            project={project}
            tasks={projectTasks}
            onToggle={toggle}
            onUpdate={(id, u) => updateMut.mutate({ id, u })}
          />
        ))
      )}
    </div>
  );
}
