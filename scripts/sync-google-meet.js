#!/usr/bin/env node
/**
 * Sync Google Meet Transcripts → Supabase recordings table
 *
 * Searches Google Drive for "Notes by Gemini" docs, reads content,
 * and inserts into recordings table with source: "google-meet".
 * Deduplicates by storing google_doc_id in metadata.
 *
 * Auth: Uses same OAuth client as SSW Gmail (gen-lang-client-0097625727)
 *       Tokens stored at ~/.config/google-meet-sync/tokens.json
 *
 * Usage:
 *   node scripts/sync-google-meet.js            # Sync new transcripts
 *   node scripts/sync-google-meet.js --auth      # Run OAuth flow
 *   node scripts/sync-google-meet.js --all       # Re-sync all (ignore already imported)
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { exec } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
const sql = postgres(DATABASE_URL);

const TOKEN_DIR = join(process.env.HOME, '.config', 'google-meet-sync');
const TOKEN_PATH = join(TOKEN_DIR, 'tokens.json');
const OAUTH_PATH = join(process.env.HOME, '.soilseed-mcp', 'gcp-oauth.keys.json');

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
];

const args = process.argv.slice(2);
const DO_AUTH = args.includes('--auth');
const SYNC_ALL = args.includes('--all');

// ─── OAuth Helpers ──────────────────────────────────────────────────

async function loadOAuthClient() {
  const raw = JSON.parse(await readFile(OAUTH_PATH, 'utf8'));
  const { client_id, client_secret } = raw.installed;
  return { client_id, client_secret, redirect_uri: 'http://localhost:3333/oauth2callback' };
}

async function loadTokens() {
  try {
    return JSON.parse(await readFile(TOKEN_PATH, 'utf8'));
  } catch { return null; }
}

async function saveTokens(tokens) {
  await mkdir(TOKEN_DIR, { recursive: true });
  await writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

async function refreshAccessToken(client, tokens) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client.client_id,
      client_secret: client.client_secret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  tokens.access_token = data.access_token;
  tokens.expiry_date = Date.now() + (data.expires_in * 1000);
  await saveTokens(tokens);
  return tokens;
}

async function getAccessToken() {
  const client = await loadOAuthClient();
  let tokens = await loadTokens();
  if (!tokens) {
    console.error('No tokens found. Run with --auth first.');
    process.exit(1);
  }
  if (tokens.expiry_date && Date.now() > tokens.expiry_date - 60000) {
    tokens = await refreshAccessToken(client, tokens);
  }
  return tokens.access_token;
}

async function runAuthFlow() {
  const client = await loadOAuthClient();
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${client.client_id}&redirect_uri=${encodeURIComponent(client.redirect_uri)}` +
    `&response_type=code&scope=${encodeURIComponent(SCOPES.join(' '))}&access_type=offline&prompt=consent`;

  console.log('\nOpen this URL in your browser:\n');
  console.log(authUrl);
  console.log('\nWaiting for callback...');

  exec(`open "${authUrl}"`);

  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url, 'http://localhost:3333');
      const code = url.searchParams.get('code');
      if (!code) { res.end('No code'); return; }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: client.client_id,
          client_secret: client.client_secret,
          redirect_uri: client.redirect_uri,
          grant_type: 'authorization_code',
        }),
      });
      const tokens = await tokenRes.json();
      tokens.expiry_date = Date.now() + (tokens.expires_in * 1000);
      await saveTokens(tokens);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>Authenticated! You can close this tab.</h2>');
      server.close();
      console.log('✅ Tokens saved to', TOKEN_PATH);
      resolve();
    });
    server.listen(3333);
  });
}

// ─── Google Drive / Docs API ────────────────────────────────────────

async function driveSearch(accessToken, query) {
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,modifiedTime,mimeType)',
    orderBy: 'modifiedTime desc',
    pageSize: '50',
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Drive search failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.files || [];
}

async function getDocContent(accessToken, docId) {
  // Export as plain text
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=text/plain`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`Doc export failed: ${res.status}`);
  return await res.text();
}

// ─── Parse Meeting Date from Title ──────────────────────────────────

function parseMeetingDate(title) {
  // Pattern: "Title - 2026/02/25 16:44 MST - Notes by Gemini"
  const match = title.match(/(\d{4}\/\d{2}\/\d{2})\s+(\d{2}:\d{2})\s+(\w+)/);
  if (match) {
    const [_, date, time, tz] = match;
    const isoDate = date.replace(/\//g, '-');
    // MST = UTC-7
    return new Date(`${isoDate}T${time}:00-07:00`);
  }
  return null;
}

function cleanTitle(title) {
  // Remove " - Notes by Gemini" and date portion
  return title
    .replace(/\s*-\s*Notes by Gemini$/i, '')
    .replace(/\s*-\s*\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}\s+\w+\s*/, ' — ')
    .replace(/\s+—\s*$/, '')
    .trim();
}

// ─── Main Sync ──────────────────────────────────────────────────────

async function syncGoogleMeet() {
  const accessToken = await getAccessToken();

  console.log('🔍 Searching Google Drive for meeting transcripts...');
  const files = await driveSearch(accessToken,
    "fullText contains 'Notes by Gemini' and mimeType = 'application/vnd.google-apps.document'"
  );
  console.log(`  Found ${files.length} "Notes by Gemini" docs\n`);

  if (files.length === 0) return;

  // Get already-imported doc IDs from DB
  const existing = await sql`
    SELECT metadata->>'google_doc_id' as doc_id
    FROM recordings
    WHERE metadata->>'source' = 'google-meet'
    AND metadata->>'google_doc_id' IS NOT NULL
  `;
  const importedIds = new Set(existing.map(r => r.doc_id));

  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    if (!SYNC_ALL && importedIds.has(file.id)) {
      skipped++;
      continue;
    }

    const meetingDate = parseMeetingDate(file.name) || new Date(file.modifiedTime);
    const title = cleanTitle(file.name) || file.name;

    console.log(`  📥 Importing: ${title} (${meetingDate.toLocaleDateString()})`);

    try {
      const content = await getDocContent(accessToken, file.id);

      // Estimate duration from content length (rough: ~150 words/min speaking)
      const wordCount = content.split(/\s+/).length;
      const estimatedMinutes = Math.max(5, Math.round(wordCount / 100));

      const metadata = {
        source: 'google-meet',
        google_doc_id: file.id,
        google_doc_url: `https://docs.google.com/document/d/${file.id}/edit`,
        call_type: 'video_meeting',
        original_title: file.name,
      };

      if (SYNC_ALL && importedIds.has(file.id)) {
        // Update existing
        await sql`
          UPDATE recordings SET
            title = ${title},
            transcript = ${content},
            metadata = ${sql.json(metadata)},
            transcription_status = 'completed',
            updated_at = NOW()
          WHERE metadata->>'google_doc_id' = ${file.id}
        `;
      } else {
        // Insert new
        await sql`
          INSERT INTO recordings (title, transcript, recorded_at, duration_seconds,
            transcription_status, metadata, created_at, updated_at)
          VALUES (
            ${title},
            ${content},
            ${meetingDate.toISOString()},
            ${estimatedMinutes * 60},
            'completed',
            ${sql.json(metadata)},
            NOW(), NOW()
          )
        `;
      }
      imported++;
    } catch (err) {
      console.error(`    ❌ Failed: ${err.message}`);
    }
  }

  console.log(`\n✅ Done: ${imported} imported, ${skipped} already in DB`);
}

// ─── Entry Point ────────────────────────────────────────────────────

async function main() {
  try {
    if (DO_AUTH) {
      await runAuthFlow();
    } else {
      await syncGoogleMeet();
    }
  } finally {
    await sql.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
