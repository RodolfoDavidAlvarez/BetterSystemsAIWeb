import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

const recs = await sql`
  SELECT id, transcript, metadata
  FROM recordings
  WHERE metadata->>'indexed' = 'true'
  AND metadata->'diarized_segments' IS NOT NULL
  AND metadata->>'labeled_transcript' IS NULL
`;

console.log('Recordings to label:', recs.length);
let updated = 0;

for (const r of recs) {
  const segments = r.metadata?.diarized_segments;
  if (!segments || segments.length === 0) continue;

  const segLines = segments.map(seg => {
    const ts = seg.timestamp ? `[${seg.timestamp}] ` : '';
    return `${ts}[${seg.speaker}]: ${seg.text}`;
  });

  const labeledTranscript = segLines.join('\n');
  const newMeta = { ...r.metadata, labeled_transcript: labeledTranscript };

  await sql`UPDATE recordings SET metadata = ${sql.json(newMeta)} WHERE id = ${r.id}`;
  updated++;
  if (updated % 10 === 0) console.log(`  ${updated}/${recs.length}...`);
}

console.log('Done. Updated:', updated);
await sql.end();
