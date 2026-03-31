import { getApiBaseUrl } from "./queryClient";

export interface OperatorToolSchema {
  type: "function";
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface OperatorSessionResponse {
  sessionId: string;
  model: string;
  voice: string;
  realtimeUrl: string;
  clientSecret: string;
  instructions: string;
  tools: OperatorToolSchema[];
  createdAt: string;
}

export interface OperatorTranscriptLine {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: string;
}

export interface OperatorActionEvent {
  id: string;
  sessionId: string;
  utteranceId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  success: boolean;
  result: unknown;
  error?: string;
  durationMs: number;
  createdAt: string;
}

interface StartOptions {
  token: string;
  onStatus: (status: "connecting" | "connected" | "disconnected") => void;
  onMicState: (state: "idle" | "listening" | "speaking") => void;
  onTranscript: (line: OperatorTranscriptLine) => void;
  onAssistantDelta: (deltaText: string) => void;
  onAction: (action: OperatorActionEvent) => void;
  onEvent?: (eventType: string) => void;
  onError: (message: string) => void;
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function sendResponseCreate(dc: RTCDataChannel | null) {
  if (!dc || dc.readyState !== "open") return;
  // Don't override modalities — let the session config handle it
  dc.send(JSON.stringify({ type: "response.create" }));
}

function extractAssistantTextFromEvent(event: any): string {
  const candidates: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) candidates.push(v.trim());
  };

  push(event?.text);
  push(event?.delta);
  push(event?.transcript);

  const content = event?.item?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      push(part?.text);
      push(part?.transcript);
      push(part?.content);
    }
  }

  const output = event?.response?.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      if (Array.isArray(item?.content)) {
        for (const part of item.content) {
          push(part?.text);
          push(part?.transcript);
          push(part?.content);
        }
      }
    }
  }

  return candidates.join(" ").trim();
}

async function createSession(token: string): Promise<OperatorSessionResponse> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/admin/operator/realtime/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Failed to create operator session");
  }
  return payload.session as OperatorSessionResponse;
}

async function executeTool(token: string, data: { sessionId: string; utteranceId: string; toolName: string; arguments: Record<string, unknown> }) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/admin/operator/tools/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Tool execution failed");
  }
  return payload;
}

export interface OperatorRealtimeController {
  sessionId: string;
  sendText: (text: string) => void;
  disconnect: () => Promise<void>;
}

export async function startOperatorRealtime(options: StartOptions): Promise<OperatorRealtimeController> {
  options.onStatus("connecting");
  const session = await createSession(options.token);
  const pc = new RTCPeerConnection();
  const audioEl = document.createElement("audio");
  audioEl.autoplay = true;
  audioEl.muted = false;
  audioEl.playsInline = true;
  audioEl.style.display = "none";
  document.body.appendChild(audioEl);
  let dc: RTCDataChannel | null = null;
  let mediaStream: MediaStream | null = null;
  let connected = false;
  let responseInFlight = false;
  let lastResponseRequestedAt = 0;

  const requestResponse = () => {
    if (!dc || dc.readyState !== "open") return;
    const now = Date.now();
    if (responseInFlight) return;
    if (now - lastResponseRequestedAt < 500) return;
    lastResponseRequestedAt = now;
    responseInFlight = true;
    sendResponseCreate(dc);
  };

  pc.ontrack = (event) => {
    audioEl.srcObject = event.streams[0];
    void audioEl.play().catch(() => {
      // Browser may still block autoplay; audio can start after user interaction.
    });
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
      options.onError(`Realtime peer connection ${pc.connectionState}`);
    }
  };

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaStream.getTracks().forEach((track) => pc.addTrack(track, mediaStream as MediaStream));

  const flushAssistantLine = (text: string) => {
    if (!text.trim()) return;
    options.onTranscript({
      id: makeId(),
      role: "assistant",
      text,
      createdAt: nowIso(),
    });
    // Audio is streamed via WebRTC from OpenAI Realtime — no browser TTS needed.
  };

  let assistantBuffer = "";
  dc = pc.createDataChannel("oai-events");
  dc.onopen = () => {
    connected = true;
    options.onStatus("connected");
    options.onMicState("listening");
    try {
      dc?.send(
        JSON.stringify({
          type: "session.update",
          session: {
            input_audio_transcription: { model: "whisper-1" },
            instructions: `${session.instructions} Always produce textual answer content, even when audio is used.`,
          },
        })
      );
      dc?.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "Say a short hello and ask what task to run." }],
          },
        })
      );
      requestResponse();
    } catch (error: any) {
      options.onError(error?.message || "Failed to send startup prompt");
    }
  };
  dc.onclose = () => {
    options.onStatus("disconnected");
    options.onMicState("idle");
  };
  dc.onerror = () => {
    options.onError("Operator realtime data channel error");
  };
  dc.onmessage = async (evt) => {
    try {
      const event = JSON.parse(String(evt.data));
      const etype = String(event.type || "unknown");
      options.onEvent?.(etype);

      // Log all non-audio-chunk events with details
      if (!etype.startsWith("response.audio.delta")) {
        const extra: string[] = [];
        if (event.delta) extra.push(`delta="${String(event.delta).slice(0, 40)}"`);
        if (event.transcript) extra.push(`transcript="${String(event.transcript).slice(0, 40)}"`);
        if (event.text) extra.push(`text="${String(event.text).slice(0, 40)}"`);
        if (event.response?.status) extra.push(`resp_status=${event.response.status}`);
        if (event.response?.status_details) extra.push(`details=${JSON.stringify(event.response.status_details).slice(0, 80)}`);
        if (event.error) extra.push(`error=${JSON.stringify(event.error).slice(0, 80)}`);
        console.log(`[RT] ${etype}`, extra.join(" | "));
      }

      if (etype === "input_audio_buffer.speech_started") {
        options.onMicState("listening");
      }
      if (etype === "input_audio_buffer.speech_stopped") {
        options.onMicState("listening");
      }

      if (etype === "response.created") {
        responseInFlight = true;
        options.onMicState("speaking");
      }

      if (etype === "response.done") {
        responseInFlight = false;
        options.onMicState("listening");

        // Check for response failure
        const respStatus = event.response?.status;
        const respDetails = event.response?.status_details;
        if (respStatus && respStatus !== "completed") {
          const reason = respDetails?.error?.message || respDetails?.reason || JSON.stringify(respDetails) || respStatus;
          console.error("[RT] Response failed:", respStatus, respDetails);
          options.onError(`Response ${respStatus}: ${reason}`);
        }

        // If no transcript was collected via deltas, try to extract from response.done payload
        if (!assistantBuffer.trim()) {
          const fallback = extractAssistantTextFromEvent(event);
          if (fallback) assistantBuffer = fallback;
        }
        if (assistantBuffer.trim()) {
          flushAssistantLine(assistantBuffer);
        }
        assistantBuffer = "";
      }

      // Transcription failure detail
      if (etype === "conversation.item.input_audio_transcription.failed") {
        const errMsg = event.error?.message || JSON.stringify(event.error) || "unknown transcription error";
        console.error("[RT] Transcription failed:", event.error);
        options.onError(`Transcription failed: ${errMsg}`);
      }

      // User speech transcription (from Whisper)
      if (etype === "conversation.item.input_audio_transcription.completed") {
        const text = String(event.transcript || "").trim();
        if (text) {
          console.log("[RT] User said:", text);
          options.onTranscript({ id: makeId(), role: "user", text, createdAt: nowIso() });
        }
      }

      // Assistant audio transcript deltas (streaming subtitles)
      if (etype === "response.audio_transcript.delta") {
        const delta = String(event.delta || "");
        if (delta) {
          assistantBuffer += delta;
          options.onAssistantDelta(assistantBuffer);
        }
      }

      // Assistant audio transcript complete
      if (etype === "response.audio_transcript.done") {
        const text = String(event.transcript || "").trim();
        if (text) {
          console.log("[RT] Assistant said:", text);
          assistantBuffer = text;
          options.onAssistantDelta(assistantBuffer);
        }
      }

      // Text-only response deltas
      if (etype === "response.text.delta" || etype === "response.output_text.delta") {
        const delta = String(event.delta || "");
        if (delta) {
          assistantBuffer += delta;
          options.onAssistantDelta(assistantBuffer);
        }
      }
      if (etype === "response.output_text.done") {
        const text = String(event.text || "");
        if (text) {
          assistantBuffer = text;
          options.onAssistantDelta(assistantBuffer);
        }
      }

      // Completed message item — flush transcript line
      if (etype === "response.output_item.done" && event.item?.type === "message") {
        const text = extractAssistantTextFromEvent(event);
        if (text && text !== assistantBuffer) {
          assistantBuffer = text;
          options.onAssistantDelta(assistantBuffer);
        }
        if (assistantBuffer.trim()) {
          flushAssistantLine(assistantBuffer);
          assistantBuffer = "";
        }
      }

      if (event.type === "response.output_item.done" && event.item?.type === "function_call") {
        const utteranceId = String(event.response_id || event.item.call_id || makeId());
        const toolName = String(event.item.name || "");
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(event.item.arguments || "{}");
        } catch {
          parsedArgs = {};
        }

        const toolPayload = await executeTool(options.token, {
          sessionId: session.sessionId,
          utteranceId,
          toolName,
          arguments: parsedArgs,
        });

        if (toolPayload.actionEvent) {
          options.onAction(toolPayload.actionEvent as OperatorActionEvent);
        }

        dc?.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: event.item.call_id,
              output: JSON.stringify({
                success: Boolean(toolPayload.success),
                result: toolPayload.result,
                error: toolPayload.error,
              }),
            },
          })
        );

        requestResponse();
      }
    } catch (error: any) {
      responseInFlight = false;
      options.onError(error?.message || "Realtime event parsing failed");
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const sdpResponse = await fetch(`${session.realtimeUrl}?model=${encodeURIComponent(session.model)}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${session.clientSecret}`,
      "Content-Type": "application/sdp",
    },
  });

  if (!sdpResponse.ok) {
    const message = await sdpResponse.text();
    throw new Error(`Realtime SDP exchange failed: ${message}`);
  }

  const answerSdp = await sdpResponse.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

  const sendText = (text: string) => {
    const content = text.trim();
    if (!content || !dc || dc.readyState !== "open") return;
    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: content }],
        },
      })
    );
    requestResponse();
  };

  const disconnect = async () => {
    if (connected && dc && dc.readyState === "open") {
      try {
        dc.send(JSON.stringify({ type: "session.close" }));
      } catch {
        // no-op
      }
    }
    pc.getSenders().forEach((sender) => sender.track?.stop());
    mediaStream?.getTracks().forEach((track) => track.stop());
    try {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    } catch {
      // no-op
    }
    try {
      dc?.close();
    } catch {
      // no-op
    }
    try {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
    } catch {
      // no-op
    }
    pc.close();
    options.onStatus("disconnected");
    options.onMicState("idle");
  };

  return {
    sessionId: session.sessionId,
    sendText,
    disconnect,
  };
}

export async function finalizeOperatorSession(
  token: string,
  body: {
    sessionId: string;
    transcript: OperatorTranscriptLine[];
    actions: OperatorActionEvent[];
    summary: string;
    checkpoint?: boolean;
  }
) {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/admin/operator/session/finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Failed to finalize operator session");
  }
  return payload;
}
