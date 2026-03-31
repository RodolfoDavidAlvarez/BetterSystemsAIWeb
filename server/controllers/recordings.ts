import type { Request, Response } from "express";
import { db } from "../../db/index";
import { recordings, clients, deals } from "../../db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { startBackgroundTranscription, transcribeRecording } from "../services/transcription";
import crypto from "crypto";

// ==================== PLAUD WEBHOOK ====================

/**
 * POST /api/webhooks/plaud
 * Receives Plaud recording webhook, stores in DB, kicks off Whisper transcription.
 */
export async function handlePlaudWebhook(req: Request, res: Response) {
  console.log("[Plaud Webhook] Received data");
  console.log("[Plaud Webhook] Payload keys:", Object.keys(req.body || {}));

  try {
    const payload = req.body;

    // Verify HMAC-SHA256 signature if secret is configured
    const secret = process.env.PLAUD_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers["x-signature"] as string;
      if (!signature) {
        console.warn("[Plaud Webhook] Missing x-signature header");
        return res.status(401).json({ error: "Missing signature" });
      }

      // Sort payload keys alphabetically and build source string
      const sortedKeys = Object.keys(payload).sort();
      const sourceString = sortedKeys.map((k) => `${k}=${typeof payload[k] === "object" ? JSON.stringify(payload[k]) : payload[k]}`).join("&");

      const computed = crypto
        .createHmac("sha256", secret)
        .update(sourceString)
        .digest("hex");

      if (!crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))) {
        console.warn("[Plaud Webhook] Invalid signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    // Extract recording data from Plaud payload
    // Plaud webhook formats may vary — handle common structures
    const eventType = payload.event_type || payload.type || "recording";
    const eventData = payload.event_data || payload.data || payload;

    const plaudRecordingId = eventData.recording_id || eventData.id || eventData.transcription_id || null;
    const audioUrl = eventData.audio_url || eventData.file_url || eventData.url || null;
    const title = eventData.title || eventData.name || eventData.summary || `Plaud Recording ${new Date().toLocaleString("en-US", { timeZone: "America/Phoenix" })}`;
    const duration = eventData.duration || eventData.duration_seconds || eventData.call_duration_secs || null;
    const recordedAt = eventData.recorded_at || eventData.created_at || eventData.timestamp || null;

    // Plaud may also include its own transcript
    const plaudTranscript = eventData.transcript || eventData.text || null;

    console.log(`[Plaud Webhook] Event: ${eventType}, Recording: ${plaudRecordingId}, Audio URL: ${audioUrl ? "present" : "missing"}`);

    // Store in database
    const [newRecording] = await db.insert(recordings).values({
      plaudRecordingId,
      plaudTaskId: eventData.task_id || eventData.transcription_id || null,
      title,
      audioUrl,
      durationSeconds: duration ? Math.round(Number(duration)) : null,
      transcriptionStatus: audioUrl ? "pending" : (plaudTranscript ? "completed" : "pending"),
      transcript: plaudTranscript || null,
      transcribedAt: plaudTranscript ? new Date() : null,
      recordingType: eventData.type || "meeting",
      metadata: payload, // Store full payload for debugging
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    }).returning();

    console.log(`[Plaud Webhook] Stored recording ${newRecording.id}`);

    // Kick off background transcription if we have audio and no transcript yet
    if (audioUrl && !plaudTranscript) {
      console.log(`[Plaud Webhook] Starting background transcription for recording ${newRecording.id}`);
      startBackgroundTranscription(newRecording.id);
    }

    res.json({
      success: true,
      recordingId: newRecording.id,
      transcriptionStatus: newRecording.transcriptionStatus,
    });
  } catch (error: any) {
    console.error("[Plaud Webhook] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}

// ==================== ADMIN API ENDPOINTS ====================

/**
 * GET /api/admin/recordings
 * List all recordings with optional filters.
 */
export async function getAllRecordings(req: Request, res: Response) {
  try {
    const { status, clientId, dealId, limit: limitParam } = req.query;
    const limit = Math.min(parseInt(String(limitParam || "50"), 10), 200);

    // Use raw SQL to get all columns including summary, language, metadata
    // (those columns were added via SQL and aren't in the Drizzle schema)
    const results = await db.execute(sql`
      SELECT id, plaud_recording_id, title, audio_url, duration_seconds,
             transcription_status, transcript, summary, language, metadata,
             client_id, deal_id, recording_type, tags, recorded_at, transcribed_at, created_at
      FROM recordings ORDER BY recorded_at DESC NULLS LAST LIMIT ${limit}
    `);

    res.json({ success: true, recordings: results.rows });
  } catch (error: any) {
    console.error("[Recordings] List error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch recordings" });
  }
}

/**
 * GET /api/admin/recordings/:id
 * Get a single recording with full details.
 */
export async function getRecordingById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const [recording] = await db.select()
      .from(recordings)
      .where(eq(recordings.id, id))
      .limit(1);

    if (!recording) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    res.json({ success: true, recording });
  } catch (error: any) {
    console.error("[Recordings] Get error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch recording" });
  }
}

/**
 * PUT /api/admin/recordings/:id
 * Update recording — link to client/deal, add tags, edit title.
 */
export async function updateRecording(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, clientId, dealId, tags, recordingType } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (clientId !== undefined) updates.clientId = clientId;
    if (dealId !== undefined) updates.dealId = dealId;
    if (tags !== undefined) updates.tags = tags;
    if (recordingType !== undefined) updates.recordingType = recordingType;

    const [updated] = await db.update(recordings)
      .set(updates)
      .where(eq(recordings.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    res.json({ success: true, recording: updated });
  } catch (error: any) {
    console.error("[Recordings] Update error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update recording" });
  }
}

/**
 * POST /api/admin/recordings/:id/retranscribe
 * Re-trigger transcription for a failed or pending recording.
 */
export async function retranscribeRecording(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const [recording] = await db.select()
      .from(recordings)
      .where(eq(recordings.id, id))
      .limit(1);

    if (!recording) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    if (!recording.audioUrl) {
      return res.status(400).json({ success: false, message: "No audio URL available" });
    }

    // Reset status and kick off transcription
    await db.update(recordings)
      .set({ transcriptionStatus: "pending", transcriptionError: null, updatedAt: new Date() })
      .where(eq(recordings.id, id));

    startBackgroundTranscription(id);

    res.json({ success: true, message: "Transcription restarted" });
  } catch (error: any) {
    console.error("[Recordings] Retranscribe error:", error.message);
    res.status(500).json({ success: false, message: "Failed to restart transcription" });
  }
}

/**
 * DELETE /api/admin/recordings/:id
 */
export async function deleteRecording(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const [deleted] = await db.delete(recordings)
      .where(eq(recordings.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Recording not found" });
    }

    res.json({ success: true, message: "Recording deleted" });
  } catch (error: any) {
    console.error("[Recordings] Delete error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete recording" });
  }
}
