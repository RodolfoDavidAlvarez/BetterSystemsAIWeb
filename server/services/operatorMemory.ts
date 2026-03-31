import fs from "node:fs/promises";
import path from "node:path";
import type { OperatorActionEvent, OperatorFinalizePayload, OperatorTranscriptLine } from "./operatorTypes";

interface TaskEntry {
  key: string;
  title: string;
  status: "todo" | "in-progress" | "done" | "deferred";
  details?: string;
  updatedAt: string;
}

function resolveWorkspacePath() {
  return process.env.OPENCLAW_WORKSPACE_DIR || path.resolve(process.cwd(), "..", "OpenClaw-VPS-Setup", "workspace");
}

function normalizeTaskKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function nowIso() {
  return new Date().toISOString();
}

async function ensureMemoryDirs() {
  const workspacePath = resolveWorkspacePath();
  const memoryDir = path.join(workspacePath, "memory");
  const transcriptDir = path.join(memoryDir, "transcripts");
  await fs.mkdir(transcriptDir, { recursive: true });
  return { workspacePath, memoryDir, transcriptDir };
}

async function readText(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function formatTranscript(lines: OperatorTranscriptLine[]) {
  if (!lines.length) return "_No transcript lines captured._";
  return lines.map((line) => `- [${line.createdAt}] **${line.role}**: ${line.text}`).join("\n");
}

function formatActions(actions: OperatorActionEvent[]) {
  if (!actions.length) return "_No tool actions captured._";
  return actions
    .map((a) => {
      const outcome = a.success ? "success" : `error: ${a.error || "unknown"}`;
      return `- [${a.createdAt}] \`${a.toolName}\` (${a.durationMs}ms) -> ${outcome}`;
    })
    .join("\n");
}

function extractTaskTitles(actions: OperatorActionEvent[], transcript: OperatorTranscriptLine[]) {
  const fromTools = actions
    .filter((a) => a.toolName === "tasks_upsert" && a.success)
    .map((a) => String((a.arguments.title as string) || "").trim())
    .filter(Boolean);

  const fromTranscript = transcript
    .filter((line) => line.role !== "assistant")
    .map((line) => line.text)
    .filter((line) => /todo|task|follow up|next step|remind/i.test(line))
    .slice(-3);

  return [...fromTools, ...fromTranscript];
}

async function upsertManagedTask(taskFilePath: string, input: Omit<TaskEntry, "key" | "updatedAt"> & { key?: string }) {
  const content = await readText(taskFilePath);
  const markerStart = "<!-- OPERATOR_TASKS_START -->";
  const markerEnd = "<!-- OPERATOR_TASKS_END -->";

  const key = input.key || normalizeTaskKey(input.title);
  const updatedAt = nowIso();
  const parsed = new Map<string, TaskEntry>();

  const managedBlockMatch = content.match(/<!-- OPERATOR_TASKS_START -->([\s\S]*?)<!-- OPERATOR_TASKS_END -->/);
  const managedBlock = managedBlockMatch ? managedBlockMatch[1] : "";
  const lines = managedBlock
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^- \[(.*?)\] \((.*?)\) (.*?) \| key:(.*?) \| updated:(.*?)$/);
    if (!match) continue;
    parsed.set(match[4], {
      status: (match[1] as TaskEntry["status"]) || "todo",
      details: match[2] || undefined,
      title: match[3],
      key: match[4],
      updatedAt: match[5],
    });
  }

  parsed.set(key, {
    key,
    title: input.title,
    status: input.status,
    details: input.details,
    updatedAt,
  });

  const ordered = Array.from(parsed.values()).sort((a, b) => a.title.localeCompare(b.title));
  const newManagedBlock = [
    markerStart,
    ...ordered.map((task) => `- [${task.status}] (${task.details || "n/a"}) ${task.title} | key:${task.key} | updated:${task.updatedAt}`),
    markerEnd,
  ].join("\n");

  let nextContent = content;
  if (managedBlockMatch) {
    nextContent = content.replace(/<!-- OPERATOR_TASKS_START -->([\s\S]*?)<!-- OPERATOR_TASKS_END -->/, newManagedBlock);
  } else {
    const prefix = content.trim() ? `${content.trim()}\n\n` : "# Task Memory\n\nTrack task state:\n- todo\n- in-progress\n- done\n- deferred\n\n";
    nextContent = `${prefix}${newManagedBlock}\n`;
  }

  await fs.writeFile(taskFilePath, nextContent, "utf8");
  return key;
}

export async function saveOperatorSession(payload: OperatorFinalizePayload) {
  const { memoryDir, transcriptDir } = await ensureMemoryDirs();
  const sessionFile = path.join(memoryDir, "session.md");
  const taskFile = path.join(memoryDir, "tasks.md");
  const transcriptFile = path.join(transcriptDir, `${payload.sessionId}.md`);
  const timestamp = nowIso();

  const transcriptContent = [
    `# Operator Session ${payload.sessionId}`,
    "",
    `- savedAt: ${timestamp}`,
    `- checkpoint: ${payload.checkpoint ? "yes" : "no"}`,
    "",
    "## Summary",
    payload.summary || "_No summary provided._",
    "",
    "## Transcript",
    formatTranscript(payload.transcript),
    "",
    "## Actions",
    formatActions(payload.actions),
    "",
  ].join("\n");
  await fs.writeFile(transcriptFile, transcriptContent, "utf8");

  const sessionAppend = [
    `\n## ${timestamp} | Session ${payload.sessionId}`,
    `- objective: ${payload.summary || "Operator realtime session"}`,
    `- actions completed: ${payload.actions.filter((a) => a.success).length}`,
    `- blockers: ${payload.actions.filter((a) => !a.success).length ? "yes" : "none"}`,
    `- next action: review tasks.md and continue operator flow`,
    "",
  ].join("\n");
  await fs.appendFile(sessionFile, sessionAppend, "utf8");

  const taskCandidates = extractTaskTitles(payload.actions, payload.transcript);
  for (const taskTitle of taskCandidates) {
    await upsertManagedTask(taskFile, { title: taskTitle, status: "todo", details: "captured-from-session" });
  }

  return {
    transcriptFile,
    sessionFile,
    taskFile,
  };
}

export async function saveMemoryNote(section: "session" | "tasks" | "general", content: string) {
  const { memoryDir } = await ensureMemoryDirs();
  const target = section === "tasks" ? path.join(memoryDir, "tasks.md") : path.join(memoryDir, "session.md");
  const line = `\n- ${nowIso()} :: ${content}\n`;
  await fs.appendFile(target, line, "utf8");
  return { file: target };
}

export async function upsertOperatorTask(args: { title: string; status?: string; details?: string }) {
  const { memoryDir } = await ensureMemoryDirs();
  const taskFile = path.join(memoryDir, "tasks.md");
  const status = (args.status || "todo") as TaskEntry["status"];
  const key = await upsertManagedTask(taskFile, {
    title: args.title,
    status: ["todo", "in-progress", "done", "deferred"].includes(status) ? status : "todo",
    details: args.details,
  });
  return { file: taskFile, taskKey: key };
}
