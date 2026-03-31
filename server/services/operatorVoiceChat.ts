import OpenAI from "openai";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getOperatorToolDefinitions, executeOperatorTool, createOperatorActionEvent } from "./operatorTools";
import type { OperatorTranscriptLine, OperatorActionEvent } from "./operatorTypes";

const execFileAsync = promisify(execFile);
const CHAT_ENGINE = process.env.OPERATOR_CHAT_ENGINE || "openclaw"; // "openclaw", "claude", or "openai"
const CLAUDE_MODEL = process.env.OPERATOR_CLAUDE_MODEL || "claude-sonnet-4-5-20250929";
const OPENAI_CHAT_MODEL = process.env.OPERATOR_CHAT_MODEL || "gpt-4o-mini";
const TTS_MODEL = process.env.OPERATOR_TTS_MODEL || "tts-1";
const TTS_VOICE = (process.env.OPERATOR_TTS_VOICE || "alloy") as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
const MAX_TOOL_ROUNDS = 4;
const WORKSPACE_DIR = path.resolve(process.env.OPENCLAW_WORKSPACE_DIR || path.join(__dirname, "../../OpenClaw-VPS-Setup/workspace"));

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required");
  return new OpenAI({ apiKey });
}

function loadWorkspaceFile(filename: string): string {
  try {
    return fs.readFileSync(path.join(WORKSPACE_DIR, filename), "utf-8").slice(0, 2000);
  } catch {
    return "";
  }
}

function buildSystemPrompt() {
  const soul = loadWorkspaceFile("SOUL.md");
  const memory = loadWorkspaceFile("memory/session.md");
  const tasks = loadWorkspaceFile("memory/tasks.md");

  return `You are the Better Systems AI operator assistant — Rodo Alvarez's executive AI.

## Your Role
You are a hyper-effective business assistant for Better Systems AI (BSA), a one-person AI automation agency. You take real actions: send emails, manage CRM, create invoices, track tasks, search inbox. You are NOT a chatbot — you are an operator.

## How to Behave
- Be concise. 1-3 sentences max in responses (these are spoken aloud).
- Take action first, explain after. Don't ask "would you like me to..." — just do it when the intent is clear.
- For destructive actions (sending emails, creating invoices), confirm the details once before executing.
- Use tools proactively. If asked about a client, search the CRM. If asked about money, check billing.
- When starting a session, use get_business_context to load current state.

## Business Context
- **Company**: Better Systems AI (bettersystems.ai)
- **Owner**: Rodo Alvarez (rodolfo@bettersystems.ai)
- **Rate**: $65/hr
- **Active Clients**: Desert Moon Lighting (CRM, $2,752 outstanding), Brian Mitchell (New Build Watch, $2,003.50 due Mar 10), Agave Fleet (fleet mgmt SaaS, $242.20 invoice NOT SENT)
- **Products**: Justtap.net (wholesale platform), CompostDeveloper.com (SaaS)
- **Pipeline**: Desert Moon Water Solutions ($2,750 proposal sent), USCC Database Initiative (early research)
- **Outstanding Money**: ~$4,997.70 total

## Key Contacts
- Desert Moon: Micah Izquierdo (micah@independentsolar.com), billing: Mike Mazick (mmazick@nssaz.com)
- Brian Mitchell: brian.mitchell38@gmail.com
- Agave Fleet: Alexandra Rosales (alexandra.rosales@agave-inc.com), billing: Victoria Rosales (victoria.rosales@agave-inc.com)
- Desert Moon Water: Linda Johnson (lj419johnson@gmail.com)

## Available Tools
You have 16 tools. Use them. The user expects action, not conversation.
${soul ? `\n## Identity\n${soul.slice(0, 800)}` : ""}
${tasks ? `\n## Current Tasks\n${tasks.slice(0, 600)}` : ""}
${memory ? `\n## Recent Session Memory\n${memory.slice(-600)}` : ""}`;
}

function toolDefsToOpenAI(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return getOperatorToolDefinitions().map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters as Record<string, unknown>,
    },
  }));
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const client = getOpenAIClient();
  const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
  const tmpPath = path.join("/tmp", `op_audio_${Date.now()}.${ext}`);
  fs.writeFileSync(tmpPath, audioBuffer);
  try {
    const file = fs.createReadStream(tmpPath);
    const result = await client.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "en",
    });
    return result.text?.trim() || "";
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

// ─── Claude Chat Engine ──────────────────────────────────────────────

function toolDefsToAnthropic() {
  return getOperatorToolDefinitions().map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));
}

async function chatWithClaude(
  userMessage: string,
  transcript: OperatorTranscriptLine[],
  sessionId: string,
): Promise<{ responseText: string; actions: OperatorActionEvent[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY required for Claude engine");

  const tools = toolDefsToAnthropic();
  const actions: OperatorActionEvent[] = [];
  const systemPrompt = buildSystemPrompt();

  const contextLines = transcript
    .slice(-12)
    .map((line) => `${line.role === "user" ? "User" : "Assistant"}: ${line.text}`)
    .join("\n");

  const messages: any[] = [];
  if (contextLines) {
    messages.push({ role: "user", content: `[Context - recent conversation]\n${contextLines}\n\n[Current request]\n${userMessage}` });
  } else {
    messages.push({ role: "user", content: userMessage });
  }

  for (let round = 0; round < MAX_TOOL_ROUNDS + 1; round++) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages,
      }),
    });

    const payload: any = await response.json();
    if (!response.ok) {
      const errMsg = payload?.error?.message || JSON.stringify(payload);
      throw new Error(`Claude API error: ${errMsg}`);
    }

    // Process response content blocks
    const contentBlocks = payload.content || [];
    let textResponse = "";
    const toolUses: any[] = [];

    for (const block of contentBlocks) {
      if (block.type === "text") {
        textResponse += block.text;
      } else if (block.type === "tool_use") {
        toolUses.push(block);
      }
    }

    // If there are tool calls, execute them
    if (toolUses.length > 0 && round < MAX_TOOL_ROUNDS) {
      // Add assistant message with tool use
      messages.push({ role: "assistant", content: contentBlocks });

      const toolResults: any[] = [];
      for (const tu of toolUses) {
        const args = tu.input || {};
        const utteranceId = `utt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        console.log(`[Operator][Claude][Tool] Calling ${tu.name}`, JSON.stringify(args).slice(0, 100));

        const result = await executeOperatorTool({
          sessionId,
          utteranceId,
          toolName: tu.name,
          arguments: args,
        });

        actions.push(createOperatorActionEvent({
          sessionId,
          utteranceId,
          toolName: tu.name,
          arguments: args,
          success: result.success,
          result: result.result,
          error: result.error,
          durationMs: result.durationMs,
        }));

        console.log(`[Operator][Claude][Tool] ${tu.name} → ${result.success ? "OK" : "FAIL"} (${result.durationMs}ms)`);

        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify({ success: result.success, result: result.result, error: result.error }),
        });
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // No tool calls - return text response
    return { responseText: textResponse.trim() || "Done.", actions };
  }

  return { responseText: "Done. Hit the tool execution limit.", actions };
}

// ─── OpenAI Chat Engine ──────────────────────────────────────────────

async function chatWithOpenAI(
  userMessage: string,
  transcript: OperatorTranscriptLine[],
  sessionId: string,
): Promise<{ responseText: string; actions: OperatorActionEvent[] }> {
  const client = getOpenAIClient();
  const tools = toolDefsToOpenAI();
  const actions: OperatorActionEvent[] = [];

  const contextLines = transcript
    .slice(-12)
    .map((line) => `${line.role === "user" ? "User" : "Assistant"}: ${line.text}`)
    .join("\n");

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
  ];
  if (contextLines) {
    messages.push({ role: "system", content: `Recent conversation:\n${contextLines}` });
  }
  messages.push({ role: "user", content: userMessage });

  for (let round = 0; round < MAX_TOOL_ROUNDS + 1; round++) {
    const completion = await client.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
      temperature: 0.3,
      max_tokens: 400,
    });

    const choice = completion.choices[0];
    if (!choice) break;

    const msg = choice.message;
    messages.push(msg);

    if (msg.tool_calls && msg.tool_calls.length > 0 && round < MAX_TOOL_ROUNDS) {
      for (const tc of msg.tool_calls) {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}

        const utteranceId = `utt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        console.log(`[Operator][OpenAI][Tool] Calling ${tc.function.name}`, JSON.stringify(args).slice(0, 100));

        const result = await executeOperatorTool({
          sessionId,
          utteranceId,
          toolName: tc.function.name,
          arguments: args,
        });

        actions.push(createOperatorActionEvent({
          sessionId,
          utteranceId,
          toolName: tc.function.name,
          arguments: args,
          success: result.success,
          result: result.result,
          error: result.error,
          durationMs: result.durationMs,
        }));

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify({ success: result.success, result: result.result, error: result.error }),
        });
      }
      continue;
    }

    const text = msg.content?.trim() || "Done.";
    return { responseText: text, actions };
  }

  return { responseText: "Done. Hit the tool execution limit.", actions };
}

// ─── OpenClaw Engine ──────────────────────────────────────────────────

const OPENCLAW_BIN = process.env.OPENCLAW_BIN || `${process.env.HOME}/.npm-global/bin/openclaw`;
const OPENCLAW_TIMEOUT = Number(process.env.OPENCLAW_TIMEOUT || "45");

function buildToolCallPrompt(): string {
  const toolDefs = getOperatorToolDefinitions();
  return toolDefs.map(t => {
    const params = (t.parameters as any)?.properties || {};
    const required = (t.parameters as any)?.required || [];
    const paramDesc = Object.entries(params).map(([k, v]: [string, any]) =>
      `    ${k}${required.includes(k) ? " (required)" : ""}: ${v.description || v.type || "string"}`
    ).join("\n");
    return `- **${t.name}**: ${t.description}\n${paramDesc}`;
  }).join("\n\n");
}

async function runOpenClawAgent(sessionId: string, message: string): Promise<string> {
  // Ensure Homebrew node (v22+) comes first - older /usr/local/bin/node doesn't support --disable-warning
  const envForOC = {
    ...process.env,
    PATH: `/opt/homebrew/bin:${process.env.HOME}/.npm-global/bin:${process.env.HOME}/.local/bin:${process.env.PATH}`,
  };

  try {
    const { stdout, stderr } = await execFileAsync(OPENCLAW_BIN, [
      "agent",
      "--session-id", sessionId,
      "--message", message,
      "--json",
      "--timeout", String(OPENCLAW_TIMEOUT),
    ], {
      timeout: (OPENCLAW_TIMEOUT + 5) * 1000,
      maxBuffer: 2 * 1024 * 1024,
      env: envForOC,
    });

    // Parse JSON from stdout (skip any non-JSON prefix lines from stderr leaking)
    const jsonStart = stdout.indexOf("{");
    if (jsonStart === -1) throw new Error(`No JSON in OpenClaw response: ${stdout.slice(0, 200)}`);
    const result = JSON.parse(stdout.slice(jsonStart));
    const text = result.payloads?.[0]?.text || "";

    if (stderr) {
      const important = stderr.split("\n").filter((l: string) =>
        !l.includes("pairing required") && !l.includes("falling back") &&
        !l.includes("Gateway target") && !l.includes("Source:") &&
        !l.includes("Config:") && !l.includes("Bind:") && l.trim()
      );
      if (important.length > 0) console.log(`[Operator][OpenClaw] stderr: ${important.join("; ").slice(0, 200)}`);
    }

    console.log(`[Operator][OpenClaw] model=${result.meta?.agentMeta?.model || "?"} duration=${result.meta?.durationMs || "?"}ms`);
    return text;
  } catch (err: any) {
    if (err.killed) throw new Error("OpenClaw agent timed out");
    // Log the full error for debugging
    console.error(`[Operator][OpenClaw] Error:`, err.stderr?.slice(0, 500) || err.message?.slice(0, 500));
    throw new Error(`OpenClaw agent error: ${err.message?.slice(0, 200)}`);
  }
}

async function chatWithOpenClaw(
  userMessage: string,
  transcript: OperatorTranscriptLine[],
  sessionId: string,
): Promise<{ responseText: string; actions: OperatorActionEvent[] }> {
  const actions: OperatorActionEvent[] = [];
  const ocSessionId = `op_${sessionId}`;

  // Keep the message concise - OpenClaw has its own workspace context
  const recentContext = transcript.slice(-6).map(l =>
    `${l.role === "user" ? "You" : "Me"}: ${l.text}`
  ).join(" | ");

  // First round: user message with minimal framing (OpenClaw workspace provides identity)
  let currentMessage = recentContext
    ? `[Operator voice mode. Be concise, 1-3 sentences - spoken aloud. BSA context: $4,997 outstanding across Desert Moon $2,752, Brian Mitchell $2,003.50, Agave Fleet $242.20] Recent: ${recentContext} --- ${userMessage}`
    : `[Operator voice mode. Be concise, 1-3 sentences - spoken aloud. BSA context: $4,997 outstanding across Desert Moon $2,752, Brian Mitchell $2,003.50, Agave Fleet $242.20] ${userMessage}`;

  for (let round = 0; round < MAX_TOOL_ROUNDS + 1; round++) {
    const responseText = await runOpenClawAgent(ocSessionId, currentMessage);

    if (!responseText) {
      return { responseText: "I didn't get a response. Try again.", actions };
    }

    // Check for tool calls in the response (OpenClaw might use exec or its own tools)
    const toolCallMatch = responseText.match(/<TOOL_CALL>\s*(\{[\s\S]*?\})\s*<\/TOOL_CALL>/);

    if (toolCallMatch && round < MAX_TOOL_ROUNDS) {
      try {
        const toolCall = JSON.parse(toolCallMatch[1]);
        const toolName = toolCall.name || toolCall.tool || "";
        const toolArgs = toolCall.args || toolCall.arguments || {};

        console.log(`[Operator][OpenClaw][Tool] Calling ${toolName}`, JSON.stringify(toolArgs).slice(0, 100));

        const utteranceId = `utt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const toolResult = await executeOperatorTool({
          sessionId,
          utteranceId,
          toolName,
          arguments: toolArgs,
        });

        actions.push(createOperatorActionEvent({
          sessionId,
          utteranceId,
          toolName,
          arguments: toolArgs,
          success: toolResult.success,
          result: toolResult.result,
          error: toolResult.error,
          durationMs: toolResult.durationMs,
        }));

        console.log(`[Operator][OpenClaw][Tool] ${toolName} → ${toolResult.success ? "OK" : "FAIL"} (${toolResult.durationMs}ms)`);

        const resultSummary = JSON.stringify({
          success: toolResult.success,
          result: toolResult.result,
          error: toolResult.error,
        }).slice(0, 1500);

        currentMessage = `Tool ${toolName} result: ${resultSummary} --- Give a brief spoken response.`;
        continue;
      } catch (parseErr) {
        console.log(`[Operator][OpenClaw] Tool call parse failed:`, parseErr);
      }
    }

    // Clean any markup from the response for TTS
    const cleanText = responseText
      .replace(/<TOOL_CALL>[\s\S]*?<\/TOOL_CALL>/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\*\*/g, "")
      .replace(/\n{2,}/g, " ")
      .trim();

    return { responseText: cleanText || "Done.", actions };
  }

  return { responseText: "Done. Hit the tool execution limit.", actions };
}

// ─── Router ──────────────────────────────────────────────────────────

export async function chatWithTools(
  userMessage: string,
  transcript: OperatorTranscriptLine[],
  sessionId: string,
): Promise<{ responseText: string; actions: OperatorActionEvent[] }> {
  const engine = CHAT_ENGINE;
  console.log(`[Operator] Chat engine: ${engine}`);

  if (engine === "openclaw") {
    return chatWithOpenClaw(userMessage, transcript, sessionId);
  }
  if (engine === "claude") {
    return chatWithClaude(userMessage, transcript, sessionId);
  }
  return chatWithOpenAI(userMessage, transcript, sessionId);
}

export async function textToSpeech(text: string): Promise<Buffer> {
  const client = getOpenAIClient();
  const response = await client.audio.speech.create({
    model: TTS_MODEL,
    voice: TTS_VOICE,
    input: text,
    response_format: "mp3",
    speed: 1.05,
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function handleVoiceTurn(params: {
  audioBuffer?: Buffer;
  mimeType?: string;
  textMessage?: string;
  transcript: OperatorTranscriptLine[];
  sessionId: string;
}): Promise<{
  userText: string;
  assistantText: string;
  audioBase64: string;
  actions: OperatorActionEvent[];
}> {
  let userText = params.textMessage || "";

  if (params.audioBuffer && params.audioBuffer.length > 0) {
    userText = await transcribeAudio(params.audioBuffer, params.mimeType || "audio/webm");
  }

  if (!userText.trim()) {
    return { userText: "", assistantText: "I didn't catch that. Could you try again?", audioBase64: "", actions: [] };
  }

  const { responseText, actions } = await chatWithTools(userText, params.transcript, params.sessionId);
  const audioBuffer = await textToSpeech(responseText);
  const audioBase64 = audioBuffer.toString("base64");

  return { userText, assistantText: responseText, audioBase64, actions };
}
