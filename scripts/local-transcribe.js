#!/usr/bin/env node
/**
 * Local Transcription with MLX Whisper (Apple Silicon)
 *
 * Free, local, fast. Uses mlx-community/whisper-large-v3-turbo on M1 Pro.
 *
 * Smart split for long recordings:
 *   - Recordings > 45 min get silence-stripped (removes dead air > 2 min)
 *   - After stripping, if still > 30 min, split into 30-min chunks
 *   - Each chunk transcribed separately, transcripts stitched with timestamps
 *   - Handles "forgot to stop recording" gracefully
 *
 * Usage:
 *   node scripts/local-transcribe.js              # Transcribe all pending
 *   node scripts/local-transcribe.js --test       # Dry run
 *   node scripts/local-transcribe.js --id 123     # Specific recording
 *   node scripts/local-transcribe.js --limit 5    # Max 5 recordings per run
 */

import 'dotenv/config';
import postgres from 'postgres';
import { execSync } from 'child_process';
import { readFile, access, mkdir, unlink, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { statSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, '..', 'data', 'plaud-audio');
const TRANSCRIPT_DIR = join(__dirname, '..', 'data', 'transcripts');
const CHUNKS_DIR = join(__dirname, '..', 'data', 'chunks');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }

let sql = postgres(DATABASE_URL);

function freshDb() {
  try { sql.end({ timeout: 1 }).catch(() => {}); } catch {}
  sql = postgres(DATABASE_URL);
  return sql;
}

const MODEL = 'mlx-community/whisper-large-v3-turbo';
const MLX_WHISPER = '/opt/homebrew/bin/mlx_whisper';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';

const LONG_RECORDING_THRESHOLD = 45 * 60;  // 45 min — trigger smart split
const CHUNK_DURATION = 30 * 60;            // 30 min — max chunk size
const SILENCE_THRESHOLD = '-30dB';         // silence detection sensitivity
const SILENCE_MIN_DURATION = 120;          // 2 min — minimum silence gap to strip

// ─── Smart Split: strip silence + chunk long recordings ─────────

async function smartSplit(audioPath, durationSec) {
  await mkdir(CHUNKS_DIR, { recursive: true });
  const baseName = audioPath.split('/').pop().replace(/\.[^.]+$/, '');

  // Step 1: Strip silence > 2 min
  const strippedPath = join(CHUNKS_DIR, `${baseName}_stripped.mp3`);
  console.log(`    Stripping silence (>${SILENCE_MIN_DURATION}s at ${SILENCE_THRESHOLD})...`);

  try {
    execSync(
      `${FFMPEG} -i "${audioPath}" -af "silenceremove=stop_periods=-1:stop_duration=${SILENCE_MIN_DURATION}:stop_threshold=${SILENCE_THRESHOLD}" -y "${strippedPath}" 2>/dev/null`,
      { stdio: 'pipe', timeout: 300000 }
    );
  } catch {
    // If silence removal fails, use original
    console.log(`    Silence strip failed, using original`);
    execSync(`cp "${audioPath}" "${strippedPath}"`, { stdio: 'pipe' });
  }

  const strippedSize = statSync(strippedPath).size;
  const originalSize = statSync(audioPath).size;
  const savedPct = Math.round((1 - strippedSize / originalSize) * 100);

  // Get actual duration of stripped file
  let strippedDuration;
  try {
    const probe = execSync(
      `${FFMPEG} -i "${strippedPath}" 2>&1 | grep "Duration" | head -1`,
      { stdio: 'pipe', encoding: 'utf-8' }
    );
    const match = probe.match(/Duration:\s*(\d+):(\d+):(\d+)/);
    strippedDuration = match ? parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) : durationSec;
  } catch {
    strippedDuration = durationSec;
  }

  console.log(`    Stripped: ${Math.round(durationSec / 60)}min → ${Math.round(strippedDuration / 60)}min (${savedPct}% silence removed)`);

  // Step 2: If still long, split into chunks
  if (strippedDuration > CHUNK_DURATION) {
    const chunkPattern = join(CHUNKS_DIR, `${baseName}_chunk_%03d.mp3`);
    console.log(`    Splitting into ${Math.ceil(strippedDuration / CHUNK_DURATION)} chunks of ${CHUNK_DURATION / 60}min...`);

    execSync(
      `${FFMPEG} -i "${strippedPath}" -f segment -segment_time ${CHUNK_DURATION} -c copy "${chunkPattern}" -y 2>/dev/null`,
      { stdio: 'pipe', timeout: 120000 }
    );

    // Clean up stripped file
    try { await unlink(strippedPath); } catch {}

    // Return chunk paths in order
    const allFiles = await readdir(CHUNKS_DIR);
    const chunks = allFiles
      .filter(f => f.startsWith(`${baseName}_chunk_`) && f.endsWith('.mp3'))
      .sort()
      .map(f => join(CHUNKS_DIR, f));

    return { chunks, stripped: true, savedPct, originalMin: Math.round(durationSec / 60), strippedMin: Math.round(strippedDuration / 60) };
  }

  // Single file after stripping — return as one "chunk"
  return { chunks: [strippedPath], stripped: true, savedPct, originalMin: Math.round(durationSec / 60), strippedMin: Math.round(strippedDuration / 60) };
}

// ─── MLX Whisper Transcription ──────────────────────────────────

async function transcribeWithMLX(audioPath) {
  await mkdir(TRANSCRIPT_DIR, { recursive: true });

  const baseName = audioPath.split('/').pop().replace(/\.[^.]+$/, '');
  const jsonOut = join(TRANSCRIPT_DIR, `${baseName}.json`);

  try { await unlink(jsonOut); } catch {}

  const cmd = [
    MLX_WHISPER,
    `"${audioPath}"`,
    `--model ${MODEL}`,
    '--language en',
    '--output-format json',
    `--output-dir "${TRANSCRIPT_DIR}"`,
    `--output-name "${baseName}"`,
    '--temperature 0',
    '--hallucination-silence-threshold 1',
    '--verbose False',
  ].join(' ');

  const start = Date.now();
  execSync(cmd, { stdio: 'pipe', timeout: 3600000, maxBuffer: 50 * 1024 * 1024 });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  let raw = await readFile(jsonOut, 'utf-8');
  raw = raw.replace(/:\s*NaN/g, ': null').replace(/:\s*-NaN/g, ': null');
  const result = JSON.parse(raw);

  try { await unlink(jsonOut); } catch {}

  return { ...result, elapsed };
}

// ─── Transcribe with smart split for long recordings ────────────

async function transcribeRecording(audioPath, durationSec) {
  const isLong = durationSec > LONG_RECORDING_THRESHOLD;

  if (!isLong) {
    // Short recording — direct transcription
    return transcribeWithMLX(audioPath);
  }

  // Long recording — smart split
  console.log(`    Long recording detected (${Math.round(durationSec / 60)}min) — smart split`);
  const { chunks, savedPct, originalMin, strippedMin } = await smartSplit(audioPath, durationSec);

  let allSegments = [];
  let timeOffset = 0;
  let totalElapsed = 0;

  for (let i = 0; i < chunks.length; i++) {
    console.log(`    Transcribing chunk ${i + 1}/${chunks.length}...`);
    const result = await transcribeWithMLX(chunks[i]);
    totalElapsed += parseFloat(result.elapsed);

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

    // Clean up chunk file
    try { await unlink(chunks[i]); } catch {}
  }

  return {
    segments: allSegments,
    text: allSegments.map(s => s.text?.trim()).join(' '),
    language: 'en',
    duration: timeOffset,
    elapsed: totalElapsed.toFixed(1),
    smart_split: { originalMin, strippedMin, savedPct, chunks: chunks.length },
  };
}

// ─── Format transcript with timestamps ──────────────────────────

function formatTranscript(result) {
  if (!result.segments || result.segments.length === 0) return result.text || '';
  return result.segments.map(seg => {
    const mins = Math.floor(seg.start / 60);
    const secs = Math.floor(seg.start % 60);
    const ts = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `[${ts}] ${seg.text.trim()}`;
  }).join('\n');
}

// ─── Main ───────────────────────────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const isTest = args.includes('--test');
  const idIdx = args.indexOf('--id');
  const limitIdx = args.indexOf('--limit');
  const specificId = idIdx !== -1 ? parseInt(args[idIdx + 1]) : null;
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 10;

  console.log(`[${new Date().toLocaleString()}] Local transcription (MLX Whisper)`);

  let pending;
  if (specificId) {
    pending = await sql`
      SELECT id, plaud_recording_id, audio_url, title, duration_seconds
      FROM recordings WHERE id = ${specificId}
    `;
  } else {
    pending = await sql`
      SELECT id, plaud_recording_id, audio_url, title, duration_seconds
      FROM recordings
      WHERE transcription_status IN ('pending', 'audio_only', 'failed')
        AND audio_url IS NOT NULL
      ORDER BY recorded_at DESC
      LIMIT ${limit}
    `;
  }

  if (pending.length === 0) {
    console.log('Nothing to transcribe.');
    await sql.end();
    return;
  }

  console.log(`${pending.length} recording(s) queued${isTest ? ' (dry run)' : ''}\n`);

  let success = 0, failed = 0, skipped = 0;

  for (const rec of pending) {
    const audioPath = join(__dirname, '..', rec.audio_url);
    const durMin = Math.round((rec.duration_seconds || 0) / 60);

    try {
      await access(audioPath);
    } catch {
      console.log(`  [${rec.id}] ${rec.title} — audio missing, skip`);
      skipped++;
      continue;
    }

    const sizeMB = statSync(audioPath).size / (1024 * 1024);
    const isLong = (rec.duration_seconds || 0) > LONG_RECORDING_THRESHOLD;
    console.log(`  [${rec.id}] ${rec.title} (${durMin}min, ${sizeMB.toFixed(1)}MB)${isLong ? ' ⚡SMART SPLIT' : ''}`);

    if (isTest) continue;

    try {
      const result = await transcribeRecording(audioPath, rec.duration_seconds || 0);
      const transcript = formatTranscript(result);
      const segCount = result.segments?.length || 0;

      if (parseFloat(result.elapsed) > 60) freshDb();

      const meta = {
        source: 'mlx-whisper',
        model: MODEL,
        elapsed: result.elapsed,
        ...(result.smart_split ? { smart_split: result.smart_split } : {}),
      };

      await sql`
        UPDATE recordings SET
          transcript = ${transcript},
          language = 'en',
          transcription_status = 'completed',
          transcribed_at = NOW(),
          metadata = CASE
            WHEN metadata IS NULL OR jsonb_typeof(metadata) != 'object'
              THEN ${meta}::jsonb
            ELSE metadata || ${meta}::jsonb
          END,
          updated_at = NOW()
        WHERE id = ${rec.id}
      `;

      const splitInfo = result.smart_split ? ` (${result.smart_split.originalMin}min→${result.smart_split.strippedMin}min, ${result.smart_split.savedPct}% silence removed, ${result.smart_split.chunks} chunks)` : '';
      console.log(`    Done in ${result.elapsed}s — ${segCount} segments${splitInfo}\n`);
      success++;
    } catch (e) {
      console.error(`    FAILED: ${e.message}\n`);
      try {
        freshDb();
        await sql`
          UPDATE recordings SET
            transcription_status = 'failed',
            updated_at = NOW()
          WHERE id = ${rec.id}
        `;
      } catch {}
      failed++;
    }
  }

  console.log(`Results: ${success} transcribed, ${failed} failed, ${skipped} skipped`);
  await sql.end();
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
