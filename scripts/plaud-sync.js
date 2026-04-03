#!/usr/bin/env node
/**
 * Plaud Recording Sync + Whisper Transcription
 *
 * Downloads audio from Plaud via reverse-engineered API, transcribes with
 * OpenAI Whisper, stores everything in PostgreSQL.
 *
 * Usage:
 *   node scripts/plaud-sync.js              # Sync new recordings only
 *   node scripts/plaud-sync.js --full       # Re-sync all recordings
 *   node scripts/plaud-sync.js --daemon     # Run every 5 minutes
 *   node scripts/plaud-sync.js --transcribe # Only transcribe pending recordings
 *
 * Requires in .env:
 *   PLAUD_BEARER_TOKEN  (from web.plaud.ai DevTools, expires Dec 2026)
 *   OPENAI_API_KEY      (for Whisper transcription)
 *   DATABASE_URL        (PostgreSQL connection)
 */

import 'dotenv/config';
import postgres from 'postgres';
import { gunzipSync } from 'zlib';
import { writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, '..', 'data', 'plaud-audio');

const PLAUD_API = 'https://api.plaud.ai';
const PLAUD_TOKEN = process.env.PLAUD_BEARER_TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const POLL_INTERVAL = 5 * 60 * 1000;

if (!PLAUD_TOKEN) { console.error('Missing PLAUD_BEARER_TOKEN in .env'); process.exit(1); }
if (!DATABASE_URL) { console.error('Missing DATABASE_URL in .env'); process.exit(1); }

const sql = postgres(DATABASE_URL);

const plaudHeaders = {
  'authorization': `bearer ${PLAUD_TOKEN}`,
  'app-platform': 'web',
  'edit-from': 'web',
  'origin': 'https://web.plaud.ai',
  'referer': 'https://web.plaud.ai/',
};

// ─── Plaud API ───────────────────────────────────────────────────

async function fetchRecordingsList(skip = 0, limit = 50) {
  const url = `${PLAUD_API}/file/simple/web?skip=${skip}&limit=${limit}&is_trash=2&sort_by=start_time&is_desc=true`;
  const res = await fetch(url, { headers: plaudHeaders });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  const json = await res.json();
  return json.data_file_list || [];
}

async function fetchRecordingDetail(fileId) {
  const url = `${PLAUD_API}/file/detail/${fileId}`;
  const res = await fetch(url, { headers: plaudHeaders });
  if (!res.ok) throw new Error(`Detail failed: ${res.status}`);
  return (await res.json()).data;
}

async function fetchTempUrl(fileId) {
  const url = `${PLAUD_API}/file/temp-url/${fileId}?is_opus=1`;
  const res = await fetch(url, { headers: plaudHeaders });
  if (!res.ok) throw new Error(`Temp URL failed: ${res.status}`);
  return await res.json();
}

async function downloadAudio(s3Url, filePath) {
  const res = await fetch(s3Url);
  if (!res.ok) throw new Error(`Audio download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  return buffer.length;
}

async function fetchGzippedContent(s3Url) {
  try {
    const res = await fetch(s3Url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    try { return gunzipSync(buffer).toString('utf-8'); }
    catch { return buffer.toString('utf-8'); }
  } catch { return null; }
}

// ─── Whisper Transcription ───────────────────────────────────────

async function transcribeWithWhisper(audioPath) {
  if (!OPENAI_KEY) throw new Error('Missing OPENAI_API_KEY');

  const { readFile } = await import('fs/promises');
  const audioBuffer = await readFile(audioPath);
  const fileName = audioPath.split('/').pop();

  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer]), fileName);
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper failed (${res.status}): ${err}`);
  }

  return await res.json();
}

function formatWhisperTranscript(whisperResult) {
  if (!whisperResult.segments) return whisperResult.text;
  return whisperResult.segments.map(seg => {
    const mins = Math.floor(seg.start / 60);
    const secs = Math.floor(seg.start % 60);
    const ts = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `[${ts}] ${seg.text.trim()}`;
  }).join('\n');
}

// ─── Plaud transcript parsing ────────────────────────────────────

function parsePlaudTranscript(jsonStr) {
  try {
    const segments = JSON.parse(jsonStr);
    if (!Array.isArray(segments)) return jsonStr;
    return segments.map(seg => {
      const speaker = seg.speaker || 'Unknown';
      return `[${speaker}]: ${seg.content || ''}`;
    }).join('\n\n');
  } catch { return jsonStr; }
}

// ─── DB operations ───────────────────────────────────────────────

async function getExistingPlaudIds() {
  const rows = await sql`SELECT plaud_recording_id FROM recordings WHERE plaud_recording_id IS NOT NULL`;
  return new Set(rows.map(r => r.plaud_recording_id));
}

async function upsertRecording(data) {
  const existing = await sql`SELECT id FROM recordings WHERE plaud_recording_id = ${data.plaud_recording_id}`;

  if (existing.length > 0) {
    await sql`
      UPDATE recordings SET
        title = ${data.title},
        duration_seconds = ${data.duration_seconds},
        audio_url = COALESCE(${data.audio_url}, audio_url),
        transcript = COALESCE(${data.transcript}, transcript),
        summary = COALESCE(${data.summary}, summary),
        language = COALESCE(${data.language}, language),
        transcription_status = ${data.transcription_status},
        transcribed_at = COALESCE(${data.transcribed_at}, transcribed_at),
        metadata = ${JSON.stringify(data.metadata)},
        recorded_at = ${data.recorded_at},
        updated_at = NOW()
      WHERE plaud_recording_id = ${data.plaud_recording_id}
    `;
    return { action: 'updated', id: existing[0].id };
  }

  const [row] = await sql`
    INSERT INTO recordings (
      plaud_recording_id, title, duration_seconds, audio_url, transcript, summary,
      language, transcription_status, transcribed_at, metadata, recorded_at
    ) VALUES (
      ${data.plaud_recording_id}, ${data.title}, ${data.duration_seconds},
      ${data.audio_url}, ${data.transcript}, ${data.summary}, ${data.language},
      ${data.transcription_status}, ${data.transcribed_at},
      ${JSON.stringify(data.metadata)}, ${data.recorded_at}
    ) RETURNING id
  `;
  return { action: 'created', id: row.id };
}

// ─── Sync a single recording ─────────────────────────────────────

async function syncRecording(fileInfo) {
  const fileId = fileInfo.id;
  const name = fileInfo.filename || fileId;
  const durationSec = Math.round((fileInfo.duration || 0) / 1000);
  console.log(`  📥 ${name} (${durationSec}s)`);

  // 1. Get detail for Plaud transcripts/summaries
  const detail = await fetchRecordingDetail(fileId);

  let plaudTranscript = null;
  let summaryText = null;
  let language = null;

  for (const c of (detail.content_list || [])) {
    if (c.data_type === 'transaction' && c.data_link) {
      const raw = await fetchGzippedContent(c.data_link);
      if (raw) plaudTranscript = parsePlaudTranscript(raw);
    }
    if (c.data_type === 'auto_sum_note' && c.data_link) {
      const raw = await fetchGzippedContent(c.data_link);
      if (raw) summaryText = raw;
    }
  }
  if (!summaryText && detail.pre_download_content_list) {
    for (const item of detail.pre_download_content_list) {
      if (item.data_content) { summaryText = item.data_content; break; }
    }
  }
  if (detail.extra_data?.tranConfig?.language) {
    language = detail.extra_data.tranConfig.language;
  }

  // 2. Download audio via temp-url
  let audioPath = null;
  let audioSize = 0;
  try {
    const tempUrls = await fetchTempUrl(fileId);
    const audioUrl = tempUrls.temp_url; // MP3 (universal compatibility)
    if (audioUrl) {
      audioPath = join(AUDIO_DIR, `${fileId}.mp3`);
      // Check if already downloaded
      try {
        await access(audioPath);
        console.log(`    ⏭️  Audio already exists`);
      } catch {
        audioSize = await downloadAudio(audioUrl, audioPath);
        console.log(`    💾 Audio downloaded (${(audioSize / 1024).toFixed(0)}KB)`);
      }
    }
  } catch (e) {
    console.warn(`    ⚠️  Audio download failed: ${e.message}`);
  }

  // 3. Skip OpenAI Whisper API — local-transcribe.js handles this with MLX Whisper (free)
  // Old code used OpenAI Whisper API ($0.006/min). Disabled to prevent accidental charges.

  const transcript = plaudTranscript;
  const startTime = detail.start_time || fileInfo.start_time;

  const result = await upsertRecording({
    plaud_recording_id: fileId,
    title: detail.file_name || name,
    duration_seconds: durationSec,
    audio_url: audioPath ? `data/plaud-audio/${fileId}.mp3` : null,
    transcript,
    summary: summaryText,
    language,
    transcription_status: transcript ? 'completed' : (audioPath ? 'audio_only' : 'pending'),
    transcribed_at: transcript ? new Date() : null,
    recorded_at: startTime ? new Date(startTime) : null,
    metadata: {
      plaud_scene: detail.scene,
      serial_number: detail.serial_number,
      session_id: detail.session_id,
      model: detail.extra_data?.model,
      speakers: Object.keys(detail.embeddings || {}),
      file_version: detail.file_version,
      filesize: fileInfo.filesize,
      source: plaudTranscript ? 'plaud' : null,
    },
  });

  const status = transcript ? '✅' : audioPath ? '🔇' : '❌';
  console.log(`    ${status} ${result.action} (id:${result.id})`);
  return result;
}

// ─── Large file splitting with ffmpeg ────────────────────────────

async function splitAndTranscribe(audioPath) {
  const { execSync } = await import('child_process');
  const { readFile, readdir, unlink } = await import('fs/promises');
  const { stat } = await import('fs/promises');

  const fileInfo = await stat(audioPath);
  const sizeMB = fileInfo.size / (1024 * 1024);

  // Whisper limit is 25MB. Split into ~20MB chunks by duration
  // Estimate: at 32kbps (Plaud MP3), 20MB ≈ 83 minutes
  const chunkMinutes = sizeMB > 50 ? 20 : 30; // More chunks for very large files

  const baseDir = join(AUDIO_DIR, 'chunks');
  await mkdir(baseDir, { recursive: true });
  const baseName = audioPath.split('/').pop().replace('.mp3', '');
  const chunkPattern = join(baseDir, `${baseName}_%03d.mp3`);

  console.log(`    📎 Splitting ${sizeMB.toFixed(0)}MB file into ${chunkMinutes}-min chunks...`);
  execSync(`ffmpeg -i "${audioPath}" -f segment -segment_time ${chunkMinutes * 60} -c copy "${chunkPattern}" -y 2>/dev/null`);

  // Find all chunk files
  const allFiles = await readdir(baseDir);
  const chunks = allFiles.filter(f => f.startsWith(baseName + '_')).sort();

  let allSegments = [];
  let timeOffset = 0;

  for (const chunk of chunks) {
    const chunkPath = join(baseDir, chunk);
    try {
      console.log(`    🎙️  Transcribing chunk ${chunk}...`);
      const result = await transcribeWithWhisper(chunkPath);
      // Offset timestamps by accumulated time
      if (result.segments) {
        for (const seg of result.segments) {
          allSegments.push({
            ...seg,
            start: seg.start + timeOffset,
            end: seg.end + timeOffset,
          });
        }
      }
      timeOffset += result.duration || 0;
      // Clean up chunk
      await unlink(chunkPath);
    } catch (e) {
      console.warn(`    ⚠️  Chunk ${chunk} failed: ${e.message}`);
      try { await unlink(chunkPath); } catch {}
    }
    await new Promise(r => setTimeout(r, 500));
  }

  if (allSegments.length === 0) throw new Error('All chunks failed');

  return {
    segments: allSegments,
    language: null,
    duration: timeOffset,
    text: allSegments.map(s => s.text?.trim()).join(' '),
  };
}

// ─── Transcribe-only mode ────────────────────────────────────────

async function transcribePending() {
  console.log('\n🎙️  Transcribing pending recordings...');
  const pending = await sql`
    SELECT id, plaud_recording_id, audio_url, title, duration_seconds
    FROM recordings
    WHERE transcription_status IN ('pending', 'audio_only', 'failed')
    AND audio_url IS NOT NULL
    ORDER BY recorded_at DESC
  `;

  if (pending.length === 0) { console.log('No pending recordings to transcribe.'); return; }
  console.log(`Found ${pending.length} recordings to transcribe.`);

  for (const rec of pending) {
    const audioPath = join(__dirname, '..', rec.audio_url);
    try {
      await access(audioPath);
    } catch {
      console.log(`  ⏭️  ${rec.title} — audio file missing`);
      continue;
    }

    try {
      console.log(`  🎙️  ${rec.title} (${Math.round((rec.duration_seconds || 0) / 60)}min)...`);

      // Check file size — split if > 24MB
      const { stat } = await import('fs/promises');
      const fileInfo = await stat(audioPath);
      const sizeMB = fileInfo.size / (1024 * 1024);

      let result;
      if (sizeMB > 24) {
        console.log(`    📎 File is ${sizeMB.toFixed(0)}MB — splitting for Whisper...`);
        result = await splitAndTranscribe(audioPath);
      } else {
        result = await transcribeWithWhisper(audioPath);
      }

      const transcript = formatWhisperTranscript(result);

      // Use simple metadata update (not jsonb_set which fails on scalars)
      await sql`
        UPDATE recordings SET
          transcript = ${transcript},
          language = ${result.language || null},
          transcription_status = 'completed',
          transcribed_at = NOW(),
          metadata = CASE
            WHEN metadata IS NULL OR jsonb_typeof(metadata) != 'object' THEN '{"source": "whisper"}'::jsonb
            ELSE metadata || '{"source": "whisper"}'::jsonb
          END,
          updated_at = NOW()
        WHERE id = ${rec.id}
      `;
      console.log(`  ✅ Done (${result.language || 'auto'}, ${result.duration?.toFixed(0)}s)`);
    } catch (e) {
      console.error(`  ❌ Failed: ${e.message}`);
      await sql`
        UPDATE recordings SET
          transcription_status = 'failed',
          transcription_error = ${e.message},
          metadata = CASE
            WHEN metadata IS NULL OR jsonb_typeof(metadata) != 'object' THEN '{}'::jsonb
            ELSE metadata
          END,
          updated_at = NOW()
        WHERE id = ${rec.id}
      `;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

// ─── Main sync ───────────────────────────────────────────────────

async function runSync(fullSync = false) {
  console.log(`\n[${new Date().toLocaleString()}] Plaud sync${fullSync ? ' (full)' : ''}...`);

  const existingIds = fullSync ? new Set() : await getExistingPlaudIds();
  let skip = 0;
  const limit = 50;
  let synced = 0, skipped = 0;

  while (true) {
    const recordings = await fetchRecordingsList(skip, limit);
    if (recordings.length === 0) break;

    for (const rec of recordings) {
      if (!fullSync && existingIds.has(rec.id)) { skipped++; continue; }
      try {
        await syncRecording(rec);
        synced++;
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`  ❌ ${rec.id}: ${e.message}`);
      }
    }

    if (recordings.length < limit) break;
    skip += limit;
  }

  console.log(`Done: ${synced} synced, ${skipped} already exist`);
}

// ─── Entry point ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const isDaemon = args.includes('--daemon');
const isFullSync = args.includes('--full');
const isTranscribeOnly = args.includes('--transcribe');

(async () => {
  try {
    await mkdir(AUDIO_DIR, { recursive: true });

    if (isTranscribeOnly) {
      await transcribePending();
    } else {
      await runSync(isFullSync);
    }

    if (isDaemon) {
      console.log(`\n🔄 Daemon mode: polling every ${POLL_INTERVAL / 1000}s...`);
      setInterval(async () => {
        try { await runSync(false); }
        catch (e) { console.error('Sync error:', e.message); }
      }, POLL_INTERVAL);
    } else {
      await sql.end();
      process.exit(0);
    }
  } catch (e) {
    console.error('Fatal:', e);
    await sql.end();
    process.exit(1);
  }
})();
