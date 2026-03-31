import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Send, Wrench, X, Volume2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  finalizeOperatorSession,
  type OperatorActionEvent,
  type OperatorTranscriptLine,
} from "../../lib/operatorRealtime";
import { MicRecorder, sendVoiceTurn } from "../../lib/operatorVoiceChat";

type SessionState = "idle" | "ready" | "recording" | "processing" | "speaking";

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function OperatorVoicePage() {
  const [state, setState] = useState<SessionState>("idle");
  const [transcript, setTranscript] = useState<OperatorTranscriptLine[]>([]);
  const [actions, setActions] = useState<OperatorActionEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [lastAssistant, setLastAssistant] = useState("");
  const [lastUser, setLastUser] = useState("");
  const recorderRef = useRef(new MicRecorder());
  const sessionIdRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef<SessionState>("idle");
  const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";

  stateRef.current = state;

  const addLine = useCallback((role: "user" | "assistant" | "system", text: string) => {
    setTranscript((prev) => [...prev, { id: makeId(), role, text, createdAt: new Date().toISOString() }]);
    if (role === "assistant") setLastAssistant(text);
    if (role === "user") setLastUser(text);
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const playAudio = useCallback((base64: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!base64) { resolve(); return; }
      stopAudio();
      const bytes = atob(base64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; resolve(); };
      audio.play().catch(() => resolve());
    });
  }, [stopAudio]);

  const processTurn = useCallback(async (audioBlob?: Blob, textMessage?: string) => {
    if (!token) { setError("Missing auth token. Re-login."); return; }
    setState("processing");
    setError(null);
    if (textMessage) addLine("user", textMessage);

    try {
      const result = await sendVoiceTurn({
        token,
        sessionId: sessionIdRef.current,
        audioBlob,
        textMessage,
        transcript,
      });

      if (result.userText && !textMessage) addLine("user", result.userText);
      addLine("assistant", result.assistantText);
      if (result.actions.length > 0) setActions((prev) => [...result.actions, ...prev]);

      if (result.audioBase64) {
        setState("speaking");
        await playAudio(result.audioBase64);
      }
    } catch (err: any) {
      setError(err?.message || "Voice turn failed");
    }
    setState((prev) => prev === "recording" ? "recording" : "ready");
  }, [token, transcript, addLine, playAudio]);

  const startRecording = useCallback(async () => {
    stopAudio();
    try {
      setError(null);
      await recorderRef.current.start();
      setState("recording");
    } catch {
      setError("Mic access denied.");
    }
  }, [stopAudio]);

  const stopRecording = useCallback(async () => {
    try {
      const blob = await recorderRef.current.stop();
      await processTurn(blob);
    } catch (err: any) {
      setError(err?.message || "Recording failed");
      setState("ready");
    }
  }, [processTurn]);

  const handleMicClick = useCallback(async () => {
    if (state === "idle") {
      setTranscript([]);
      setActions([]);
      setError(null);
      setLastAssistant("");
      setLastUser("");
      sessionIdRef.current = `vs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setState("processing");
      try {
        const result = await sendVoiceTurn({
          token,
          sessionId: sessionIdRef.current,
          textMessage: "Hello, give me a quick status on my business today.",
          transcript: [],
        });
        addLine("assistant", result.assistantText);
        if (result.actions.length > 0) setActions((prev) => [...result.actions, ...prev]);
        if (result.audioBase64) {
          setState("speaking");
          await playAudio(result.audioBase64);
        }
        setState("ready");
      } catch (err: any) {
        setError(err?.message || "Failed to start");
        setState("idle");
      }
    } else if (state === "ready") {
      await startRecording();
    } else if (state === "recording") {
      await stopRecording();
    } else if (state === "speaking") {
      stopAudio();
      setState("ready");
      await startRecording();
    }
  }, [state, token, addLine, playAudio, startRecording, stopRecording, stopAudio]);

  // Spacebar push-to-talk
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (stateRef.current === "ready") startRecording();
        else if (stateRef.current === "speaking") {
          // Interrupt and record
          if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
          startRecording();
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        if (stateRef.current === "recording") stopRecording();
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [startRecording, stopRecording]);

  const endSession = async () => {
    stopAudio();
    recorderRef.current.cancel();
    try {
      await finalizeOperatorSession(token, {
        sessionId: sessionIdRef.current,
        transcript, actions,
        summary: `Voice session. turns=${transcript.filter(l => l.role === "user").length}, actions=${actions.length}`,
      });
    } catch {}
    setState("idle");
    setLastAssistant("");
    setLastUser("");
  };

  const sendText = async () => {
    const text = textInput.trim();
    if (!text || state !== "ready") return;
    setTextInput("");
    await processTurn(undefined, text);
  };

  // Visual config per state
  const ringColor =
    state === "recording" ? "ring-red-500/60" :
    state === "speaking" ? "ring-blue-400/40" :
    state === "processing" ? "ring-amber-400/30" :
    "ring-white/10";

  const pulseClass =
    state === "recording" ? "animate-pulse" :
    state === "speaking" ? "animate-[pulse_2s_ease-in-out_infinite]" :
    "";

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-background/95 overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${state === "idle" ? "bg-zinc-500" : state === "recording" ? "bg-red-500 animate-pulse" : state === "speaking" ? "bg-blue-400 animate-pulse" : state === "processing" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <span className="text-sm font-medium tracking-tight">
            {state === "idle" ? "Operator" : state === "recording" ? "Listening..." : state === "speaking" ? "Speaking" : state === "processing" ? "Thinking..." : "Ready"}
          </span>
          {state !== "idle" && (
            <span className="text-[10px] text-muted-foreground/60 font-mono">OpenClaw</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {actions.length > 0 && (
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <Wrench className="h-3 w-3" />
              {actions.length}
            </button>
          )}
          {transcript.length > 0 && (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showTranscript ? "Hide" : "Log"}
            </button>
          )}
          {state !== "idle" && (
            <button onClick={endSession} className="text-xs text-muted-foreground hover:text-red-400 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-5 mb-2 px-3 py-2 text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-lg">{error}</div>
      )}

      {/* Actions panel */}
      {showActions && actions.length > 0 && (
        <div className="mx-5 mb-2 max-h-32 overflow-y-auto rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-3">
          {actions.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
              <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground/80">{a.toolName}</span>
              <span className={`text-[10px] px-1 rounded ${a.success ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
                {a.success ? "ok" : "fail"}
              </span>
              <span className="text-muted-foreground/50 text-[10px]">{a.durationMs}ms</span>
            </div>
          ))}
        </div>
      )}

      {/* Full transcript panel (collapsible) */}
      {showTranscript && (
        <div className="mx-5 mb-2 max-h-60 overflow-y-auto rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-3 space-y-2">
          {transcript.map((line) => (
            <div key={line.id} className={`text-xs ${line.role === "user" ? "text-blue-300/80" : "text-foreground/70"}`}>
              <span className="font-semibold text-muted-foreground/50 mr-1.5">{line.role === "user" ? "You" : "AI"}</span>
              {line.text}
            </div>
          ))}
        </div>
      )}

      {/* Center area — floating subtitles */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative">

        {/* Idle state */}
        {state === "idle" && transcript.length === 0 && (
          <div className="text-center space-y-3">
            <div className="text-5xl mb-4 opacity-20">
              <Mic className="h-16 w-16 mx-auto" />
            </div>
            <p className="text-lg font-semibold text-foreground/40">Tap to start</p>
            <p className="text-xs text-muted-foreground/40">OpenClaw + GPT-5.3 Codex</p>
          </div>
        )}

        {/* Last user message — small, above */}
        {lastUser && state !== "idle" && (
          <p className="text-sm text-muted-foreground/50 mb-4 max-w-lg text-center italic">
            "{lastUser}"
          </p>
        )}

        {/* Last assistant response — big floating subtitle */}
        {lastAssistant && state !== "idle" && (
          <div className="max-w-2xl text-center px-4">
            <p className="text-xl md:text-2xl font-bold leading-relaxed text-foreground/90 tracking-tight">
              {lastAssistant}
            </p>
          </div>
        )}

        {/* Processing indicator */}
        {state === "processing" && (
          <div className="mt-8 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Speaking wave indicator */}
        {state === "speaking" && (
          <div className="mt-6 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-blue-400/60 rounded-full animate-[wave_1s_ease-in-out_infinite]"
                style={{
                  height: `${12 + Math.random() * 16}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Recording pulse ring */}
        {state === "recording" && (
          <div className="mt-6 flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400/70 font-medium">Recording</span>
          </div>
        )}
      </div>

      {/* Bottom input area */}
      <div className="px-5 pb-4 pt-2 z-10">
        {/* Text input row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <Input
              placeholder={state === "idle" ? "Start a session first..." : state === "ready" ? "Type a message..." : ""}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendText(); }}
              disabled={state !== "ready"}
              className="rounded-full px-4 h-10 bg-muted/30 border-border/40 text-sm"
            />
          </div>
          {textInput.trim() && state === "ready" && (
            <button
              onClick={sendText}
              className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mic button — centered, prominent */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleMicClick}
            disabled={state === "processing"}
            className={`
              relative h-16 w-16 rounded-full text-white flex items-center justify-center
              transition-all duration-200 shrink-0 shadow-lg
              ${state === "idle" ? "bg-zinc-700 hover:bg-zinc-600" : ""}
              ${state === "ready" ? "bg-primary hover:bg-primary/90 hover:scale-105" : ""}
              ${state === "recording" ? "bg-red-500 hover:bg-red-600 scale-110" : ""}
              ${state === "speaking" ? "bg-blue-500 hover:bg-blue-600" : ""}
              ${state === "processing" ? "bg-zinc-600 cursor-wait opacity-50" : ""}
              ${pulseClass}
              ring-4 ${ringColor}
            `}
          >
            {state === "recording" ? (
              <Square className="h-5 w-5" />
            ) : state === "speaking" ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground/50 tracking-wide">
            {state === "idle" ? "TAP TO START" :
             state === "recording" ? "TAP TO SEND" :
             state === "speaking" ? "TAP TO INTERRUPT" :
             state === "processing" ? "THINKING..." :
             "TAP TO TALK"}
            {state !== "idle" && state !== "processing" && " · SPACE = HOLD"}
          </p>
        </div>
      </div>

      {/* CSS for wave animation */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  );
}
