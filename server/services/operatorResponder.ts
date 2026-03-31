import OpenAI from "openai";
import type { OperatorTranscriptLine } from "./operatorTypes";

const MODEL = process.env.OPERATOR_TEXT_MODEL || "gpt-4o-mini";

function buildMessages(message: string, transcript: OperatorTranscriptLine[]) {
  const contextLines = transcript
    .slice(-10)
    .map((line) => `${line.role.toUpperCase()}: ${line.text}`)
    .join("\n");

  const system = [
    "You are the Better Systems AI internal operator assistant.",
    "Be concise and action-focused.",
    "When asked to execute tasks, confirm what was done and what is next.",
    "Return plain text only.",
  ].join(" ");

  return [
    { role: "system" as const, content: system },
    ...(contextLines ? [{ role: "system" as const, content: `Conversation context:\n${contextLines}` }] : []),
    { role: "user" as const, content: message },
  ];
}

export async function generateOperatorReply(message: string, transcript: OperatorTranscriptLine[]) {
  const openAiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const messages = buildMessages(message, transcript);

  if (openAiKey) {
    try {
      const client = new OpenAI({ apiKey: openAiKey });
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 240,
      });
      const text = completion.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (error: any) {
      const messageText = String(error?.message || "");
      if (!/429|quota|insufficient/i.test(messageText)) {
        throw error;
      }
      // Fall through to Anthropic on OpenAI quota failures.
    }
  }

  if (anthropicKey) {
    try {
      const prompt = messages
        .filter((m) => m.role !== "system")
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.OPERATOR_ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
          max_tokens: 220,
          system: "You are the Better Systems AI internal operator assistant. Be concise and operational.",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const payload: any = await response.json();
      if (response.ok) {
        const text = payload?.content?.find((c: any) => c?.type === "text")?.text?.trim();
        if (text) return text;
      }
    } catch {
      // Fall through to deterministic fallback.
    }
  }

  const normalized = message.toLowerCase();
  const contextHint = transcript.length > 0 ? ` We still have ${transcript.length} lines of session context saved.` : "";
  if (/hello|hi|hey/.test(normalized)) {
    return `Hello. I am online in fallback mode and ready to execute tasks.${contextHint}`;
  }
  if (/task|todo|next step|follow up/.test(normalized)) {
    return `I can capture this as an actionable task now and keep tracking it in memory/tasks.md.${contextHint}`;
  }
  return `I received your request: "${message}". I am running in fallback mode due provider limits, but I can still log tasks, notes, and continue operation.${contextHint}`;
}
