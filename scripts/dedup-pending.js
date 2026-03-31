import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

// Word overlap function
function wordOverlap(a, b) {
  if (!a || !b) return 0;
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const wordsA = new Set(normalize(a));
  const wordsB = new Set(normalize(b));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) { if (wordsB.has(w)) overlap++; }
  return overlap / Math.min(wordsA.size, wordsB.size);
}

const items = await sql`
  SELECT id, title, company, project, priority
  FROM action_items WHERE status = 'pending'
  ORDER BY id ASC
`;

const keep = new Set();
const dismiss = [];

for (let i = 0; i < items.length; i++) {
  if (dismiss.some(d => d.id === items[i].id)) continue;
  keep.add(items[i].id);

  for (let j = i + 1; j < items.length; j++) {
    if (dismiss.some(d => d.id === items[j].id)) continue;
    const overlap = wordOverlap(items[i].title, items[j].title);
    if (overlap >= 0.6) {
      dismiss.push({ id: items[j].id, title: items[j].title, dupOf: items[i].title });
    }
  }
}

if (dismiss.length > 0) {
  const ids = dismiss.map(d => d.id);
  await sql`UPDATE action_items SET status = 'dismissed', updated_at = NOW() WHERE id = ANY(${ids})`;
  console.log(`Deduped: dismissed ${dismiss.length} duplicates`);
  for (const d of dismiss) {
    console.log(`  #${d.id} "${d.title}" ≈ "${d.dupOf}"`);
  }
}

// Also dismiss vague pending items with no project and generic titles
const vague = await sql`
  UPDATE action_items SET status = 'dismissed', updated_at = NOW()
  WHERE status = 'pending'
  AND project IS NULL
  AND (
    title ILIKE 'call %' AND length(title) < 25
    OR title ILIKE 'talk to %' AND length(title) < 25
    OR title ILIKE '%transport%pickup%'
    OR title ILIKE '%bring cash%'
  )
  RETURNING id, title
`;
if (vague.length > 0) {
  console.log(`\nDismissed vague items: ${vague.length}`);
  for (const v of vague) console.log(`  #${v.id} "${v.title}"`);
}

const [stats] = await sql`
  SELECT count(*) as cnt FROM action_items WHERE status = 'pending'
`;
console.log(`\nFinal pending count: ${stats.cnt}`);

await sql.end();
