import { getApiBaseUrl } from "./queryClient";
import type { OperatorTranscriptLine, OperatorActionEvent } from "./operatorRealtime";

export interface VoiceTurnResult {
  userText: string;
  assistantText: string;
  audioBase64: string;
  actions: OperatorActionEvent[];
}

export async function sendVoiceTurn(params: {
  token: string;
  sessionId: string;
  audioBlob?: Blob;
  textMessage?: string;
  transcript: OperatorTranscriptLine[];
}): Promise<VoiceTurnResult> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append("sessionId", params.sessionId);
  formData.append("transcript", JSON.stringify(params.transcript));

  if (params.audioBlob) {
    formData.append("audio", params.audioBlob, "recording.webm");
  }
  if (params.textMessage) {
    formData.append("textMessage", params.textMessage);
  }

  const response = await fetch(`${baseUrl}/admin/operator/voice/turn`, {
    method: "POST",
    headers: { Authorization: `Bearer ${params.token}` },
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Voice turn failed");
  }

  return {
    userText: payload.userText || "",
    assistantText: payload.assistantText || "",
    audioBase64: payload.audioBase64 || "",
    actions: payload.actions || [],
  };
}

export function playAudioBase64(base64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!base64) { resolve(); return; }
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Audio playback failed")); };
    audio.play().catch(reject);
  });
}

export class MicRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: this.getSupportedMimeType() });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        reject(new Error("Not recording"));
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || "audio/webm" });
        this.cleanup();
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  private cleanup() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }

  private getSupportedMimeType(): string {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "audio/webm";
  }
}
