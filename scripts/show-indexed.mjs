import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

const recs = await sql`
  SELECT id, title, recorded_at, duration_seconds, speakers, topics, metadata
  FROM recordings WHERE metadata @> '{"indexed":true}'::jsonb
  ORDER BY recorded_at ASC
`;

for (const r of recs) {
  const d = new Date(r.recorded_at).toISOString().split('T')[0];
  const dur = Math.round(r.duration_seconds / 60);
  const m = r.metadata || {};
  const sp = (r.speakers || []).filter(s => s !== 'Rodo' && !s.startsWith('Unknown')).join(', ');
  const tp = (r.topics || []).slice(0, 5).join(', ');
  const dec = (m.key_decisions || []).slice(0, 2);
  const num = (m.key_numbers || []).slice(0, 3);
  const urg = m.urgency === 'action-needed' ? ' [ACTION]' : '';

  console.log('---');
  console.log(d + ' | ' + r.title + ' (' + dur + 'm)' + urg);
  if (sp) console.log('  With: ' + sp);
  if (tp) console.log('  Topics: ' + tp);
  if (m.summary) console.log('  ' + m.summary.substring(0, 280));
  if (dec.length) console.log('  DECISIONS: ' + dec.join(' | '));
  if (num.length) console.log('  NUMBERS: ' + num.join(' | '));
}

console.log('---');
console.log('Total indexed: ' + recs.length);
await sql.end();
