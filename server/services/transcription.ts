import OpenAI from "openai";
import { db } from "../../db/index";
import { recordings } from "../../db/schema";
import { eq } from "drizzle-orm";

/**
 * Background transcription service using OpenAI Whisper API.
 * Downloads audio from URL and transcribes it, then updates the recording in DB.
 */
export async function transcribeRecording(recordingId: number): Promise<void> {
  console.log(`[Transcription] Starting transcription for recording ${recordingId}`);

  // Mark as processing
  await db.update(recordings)
    .set({ transcriptionStatus: "processing", updatedAt: new Date() })
    .where(eq(recordings.id, recordingId));

  try {
    // Get the recording
    const [recording] = await db.select()
      .from(recordings)
      .where(eq(recordings.id, recordingId))
      .limit(1);

    if (!recording) {
      throw new Error(`Recording ${recordingId} not found`);
    }

    if (!recording.audioUrl) {
      throw new Error(`Recording ${recordingId} has no audio URL`);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Download audio file
    console.log(`[Transcription] Downloading audio from: ${recording.audioUrl}`);
    const audioResponse = await fetch(recording.audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer]);

    // Determine file extension from URL or default to mp3
    const urlPath = new URL(recording.audioUrl).pathname;
    const ext = urlPath.match(/\.(mp3|mp4|mpeg|mpga|m4a|wav|webm)$/i)?.[1] || "mp3";
    const file = new File([audioBlob], `recording.${ext}`, {
      type: `audio/${ext}`,
    });

    // Check size - OpenAI limit is 25MB
    const sizeMB = audioBuffer.byteLength / (1024 * 1024);
    console.log(`[Transcription] Audio size: ${sizeMB.toFixed(1)}MB`);
    if (sizeMB > 25) {
      throw new Error(`Audio file too large for Whisper API: ${sizeMB.toFixed(1)}MB (limit: 25MB)`);
    }

    // Transcribe with OpenAI Whisper
    const openai = new OpenAI({ apiKey });
    console.log(`[Transcription] Sending to Whisper API...`);

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      response_format: "verbose_json",
    });

    const transcriptText = transcription.text;
    const duration = (transcription as any).duration
      ? Math.round((transcription as any).duration)
      : recording.durationSeconds;

    console.log(`[Transcription] Complete. ${transcriptText.length} chars, ${duration}s`);

    // Update recording with transcript
    await db.update(recordings)
      .set({
        transcript: transcriptText,
        transcriptionStatus: "completed",
        transcribedAt: new Date(),
        durationSeconds: duration || recording.durationSeconds,
        updatedAt: new Date(),
      })
      .where(eq(recordings.id, recordingId));

    console.log(`[Transcription] Recording ${recordingId} transcribed successfully`);

    // Send SMS notification via Twilio
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;
      if (accountSid && authToken && from) {
        const durationMin = duration ? Math.round(duration / 60) : null;
        const body = `New transcription: "${recording.title}"${durationMin ? ` (${durationMin}min)` : ""}`;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: "+19285501649", From: from, Body: body }),
        });
        console.log(`[SMS] Transcription notification sent for recording ${recordingId}`);
      }
    } catch (smsErr: any) {
      console.error("[SMS] Failed to send notification:", smsErr.message);
    }
  } catch (error: any) {
    console.error(`[Transcription] Failed for recording ${recordingId}:`, error.message);

    // Mark as failed
    await db.update(recordings)
      .set({
        transcriptionStatus: "failed",
        transcriptionError: error.message,
        updatedAt: new Date(),
      })
      .where(eq(recordings.id, recordingId));
  }
}

/**
 * Kick off transcription in the background (non-blocking).
 * Catches errors internally so the webhook can respond immediately.
 */
export function startBackgroundTranscription(recordingId: number): void {
  transcribeRecording(recordingId).catch((err) => {
    console.error(`[Transcription] Background job failed for ${recordingId}:`, err.message);
  });
}
