#!/usr/bin/env node
/**
 * Local Transcription with MLX Whisper (Apple Silicon)
 *
 * Free, local, fast. Uses mlx-community/whisper-large-v3-turbo on M1 Pro.
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
import { readFile, access, mkdir, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { statSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, '..', 'data', 'plaud-audio');
const TRANSCRIPT_DIR = join(__dirname, '..', 'data', 'transcripts');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }

let sql = postgres(DATABASE_URL);

// Reconnect to DB (pooler kills idle connections during long transcriptions)
function freshDb() {
  try { sql.end({ timeout: 1 }).catch(() => {}); } catch {}
  sql = postgres(DATABASE_URL);
  return sql;
}

const MODEL = 'mlx-community/whisper-large-v3-turbo';
const MLX_WHISPER = '/opt/homebrew/bin/mlx_whisper';

// ─── MLX Whisper Transcription ──────────────────────────────────

async function transcribeWithMLX(audioPath) {
  await mkdir(TRANSCRIPT_DIR, { recursive: true });

  const baseName = audioPath.split('/').pop().replace(/\.[^.]+$/, '');
  const jsonOut = join(TRANSCRIPT_DIR, `${baseName}.json`);

  // Clean up any previous output
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
  execSync(cmd, { stdio: 'pipe', timeout: 3600000, maxBuffer: 50 * 1024 * 1024 }); // 60 min timeout for large files
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  // Read JSON output (MLX Whisper sometimes outputs NaN which is invalid JSON)
  let raw = await readFile(jsonOut, 'utf-8');
  raw = raw.replace(/:\s*NaN/g, ': null').replace(/:\s*-NaN/g, ': null');
  const result = JSON.parse(raw);

  // Clean up JSON file (transcript lives in DB)
  try { await unlink(jsonOut); } catch {}

  return { ...result, elapsed };
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
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 10; // Default: 10 per run

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

    // Check audio file exists
    try {
      await access(audioPath);
    } catch {
      console.log(`  [${rec.id}] ${rec.title} — audio missing, skip`);
      skipped++;
      continue;
    }

    // Check file size
    const sizeMB = statSync(audioPath).size / (1024 * 1024);

    console.log(`  [${rec.id}] ${rec.title} (${durMin}min, ${sizeMB.toFixed(1)}MB)`);

    if (isTest) continue;

    try {
      const result = await transcribeWithMLX(audioPath);
      const transcript = formatTranscript(result);
      const segCount = result.segments?.length || 0;

      // Reconnect DB after long transcription (pooler may have killed idle connection)
      if (parseFloat(result.elapsed) > 60) freshDb();

      await sql`
        UPDATE recordings SET
          transcript = ${transcript},
          language = 'en',
          transcription_status = 'completed',
          transcribed_at = NOW(),
          metadata = CASE
            WHEN metadata IS NULL OR jsonb_typeof(metadata) != 'object'
              THEN ${{ source: 'mlx-whisper', model: MODEL, elapsed: result.elapsed }}::jsonb
            ELSE metadata || ${{ source: 'mlx-whisper', model: MODEL, elapsed: result.elapsed }}::jsonb
          END,
          updated_at = NOW()
        WHERE id = ${rec.id}
      `;

      console.log(`    Done in ${result.elapsed}s — ${segCount} segments\n`);
      success++;
    } catch (e) {
      console.error(`    FAILED: ${e.message}\n`);
      await sql`
        UPDATE recordings SET
          transcription_status = 'failed',
          updated_at = NOW()
        WHERE id = ${rec.id}
      `;
      failed++;
    }
  }

  console.log(`Results: ${success} transcribed, ${failed} failed, ${skipped} skipped`);
  await sql.end();
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
