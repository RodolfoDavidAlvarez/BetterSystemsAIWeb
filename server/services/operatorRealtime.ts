import crypto from "node:crypto";
import { saveOperatorSession } from "./operatorMemory";
import { getOperatorToolDefinitions } from "./operatorTools";
import type {
  OperatorActionEvent,
  OperatorFinalizePayload,
  OperatorRealtimeSession,
  OperatorSessionRecord,
  OperatorTranscriptLine,
} from "./operatorTypes";

const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-4o-mini-realtime-preview";
const OPENAI_REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE || "alloy";
const OPENAI_REALTIME_URL = process.env.OPENAI_REALTIME_URL || "https://api.openai.com/v1/realtime";
const OPENAI_REALTIME_SESSIONS_URL = process.env.OPENAI_REALTIME_SESSIONS_URL || "https://api.openai.com/v1/realtime/sessions";

const SESSION_STORE = new Map<string, OperatorSessionRecord>();

function baseInstructions() {
  return [
    "You are the internal Better Systems AI operator voice assistant.",
    "Be concise, action-focused, and execute tools automatically when useful.",
    "Persist important outcomes and tasks using available memory tools.",
    "If a tool fails, explain briefly and continue with fallback guidance.",
  ].join(" ");
}

export async function createOperatorRealtimeSession() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for operator realtime");
  }

  const sessionId = `op_${crypto.randomUUID()}`;
  const tools = getOperatorToolDefinitions();
  const instructions = baseInstructions();

  const response = await fetch(OPENAI_REALTIME_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_REALTIME_MODEL,
      voice: OPENAI_REALTIME_VOICE,
      instructions,
      modalities: ["audio", "text"],
      tool_choice: "auto",
      turn_detection: { type: "server_vad" },
      tools,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to create realtime session (${response.status}): ${detail}`);
  }

  const payload: any = await response.json();
  const clientSecret = payload?.client_secret?.value;
  if (!clientSecret) {
    throw new Error("Realtime session response missing client secret");
  }

  const session: OperatorRealtimeSession = {
    sessionId,
    model: OPENAI_REALTIME_MODEL,
    voice: OPENAI_REALTIME_VOICE,
    realtimeUrl: OPENAI_REALTIME_URL,
    clientSecret,
    instructions,
    tools,
    createdAt: new Date().toISOString(),
  };

  SESSION_STORE.set(sessionId, {
    sessionId,
    createdAt: session.createdAt,
    lastUpdatedAt: session.createdAt,
    transcript: [],
    actions: [],
    savedFiles: [],
  });

  return session;
}

export function appendOperatorTranscript(sessionId: string, lines: OperatorTranscriptLine[]) {
  const existing = SESSION_STORE.get(sessionId);
  if (!existing) return;
  existing.transcript.push(...lines);
  existing.lastUpdatedAt = new Date().toISOString();
}

export function appendOperatorActions(sessionId: string, actions: OperatorActionEvent[]) {
  const existing = SESSION_STORE.get(sessionId);
  if (!existing) return;
  existing.actions.push(...actions);
  existing.lastUpdatedAt = new Date().toISOString();
}

export function getOperatorSession(sessionId: string) {
  return SESSION_STORE.get(sessionId) || null;
}

export async function finalizeOperatorSession(payload: OperatorFinalizePayload) {
  const record = SESSION_STORE.get(payload.sessionId);
  if (record) {
    appendOperatorTranscript(payload.sessionId, payload.transcript);
    appendOperatorActions(payload.sessionId, payload.actions);
    record.summary = payload.summary;
  }

  const saved = await saveOperatorSession(payload);
  const savedFiles = Object.values(saved);

  const updated = SESSION_STORE.get(payload.sessionId);
  if (updated) {
    updated.savedFiles = Array.from(new Set([...(updated.savedFiles || []), ...savedFiles]));
    if (!payload.checkpoint) {
      updated.finalizedAt = new Date().toISOString();
    }
    updated.lastUpdatedAt = new Date().toISOString();
  }

  return { savedFiles };
}
