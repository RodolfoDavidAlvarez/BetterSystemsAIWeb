#!/usr/bin/env node
/**
 * Upload new audio files to Supabase Storage
 * Replaces VPS rsync — audio served directly from Supabase public bucket
 */
import 'dotenv/config';
import { readdirSync, readFileSync, statSync } from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUDIO_DIR = 'data/plaud-audio';
const MAX_SIZE = 50 * 1024 * 1024; // 50MB Supabase limit

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.log('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(0);
}

// List what's already in the bucket
const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/plaud-audio`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ limit: 1000 })
});
const existing = new Set((await listRes.json()).map(f => f.name));

const files = readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'));
const toUpload = files.filter(f => !existing.has(f) && statSync(`${AUDIO_DIR}/${f}`).size < MAX_SIZE);

if (toUpload.length === 0) {
  console.log(`Audio sync: ${existing.size} in bucket, 0 new`);
  process.exit(0);
}

console.log(`Uploading ${toUpload.length} new audio files...`);
let ok = 0;
for (const f of toUpload) {
  try {
    const data = readFileSync(`${AUDIO_DIR}/${f}`);
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/plaud-audio/${f}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'audio/mpeg' },
      body: data
    });
    if (res.ok) ok++;
  } catch {}
}
console.log(`Audio sync: ${ok}/${toUpload.length} uploaded`);
