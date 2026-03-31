import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

// ─── 1. Dismiss all UFE Conference items (event already passed Feb 26-28) ────
const ufe = await sql`
  UPDATE action_items SET status = 'dismissed', updated_at = NOW()
  WHERE status = 'needs_review'
  AND (title ILIKE '%ufe%' OR project ILIKE '%ufe%')
  RETURNING id
`;
console.log(`Dismissed UFE Conference: ${ufe.length}`);

// ─── 2. Dismiss junk/non-actionable items ────────────────────────────────────
const junkPatterns = [
  '%BLAUD%', '%Superbase%', '%superbase%',
  '%bring cash%', '%drop off renegade%', '%call rodo%',
  '%put vanguards in%', '%notify rodo%', '%transport%product%pickup%',
  '%bring measuring wheel%', '%show rodo%', '%pay for personnel%',
  '%call juan back%', '%call juan%', '%talk to juan%',
  '%price sam%order%', '%tell johnny to print%',
  '%call johnny about avocado%', '%ask johnny to send avocado%',
  '%call client%blend confusion%', '%call sean%juan%clarify%',
  '%follow up with rodo%extract%', '%call client regarding blend%',
  '%receive astroid%call%', '%receive astroid%questions%',
  '%receive formal partnership%',
  '%mention interest in tiger%', '%mention tiger%scots%',
  '%highlight agreements%', '%discuss communication chain%',
  '%send all incoming material%', '%reschedule meeting with jasmine%',
  '%talk to oscar%', '%check for extra water bubble%',
  '%call rodo upon arriving%', '%bring large chipper%client%',
  '%deliver extract to rodo%', '%send received quantities%',
  '%double-check vanguard%', '%send photo of%',
  '%send photos of%', '%ask simon about chicken wire%',
  '%resend baler quote%', '%send picture of ground%',
  '%reconcile tote placement%', '%redo and send baler%',
];

let junkDismissed = 0;
for (const pattern of junkPatterns) {
  const result = await sql`
    UPDATE action_items SET status = 'dismissed', updated_at = NOW()
    WHERE status = 'needs_review' AND title ILIKE ${pattern}
    RETURNING id
  `;
  junkDismissed += result.length;
}
console.log(`Dismissed junk/non-actionable: ${junkDismissed}`);

// ─── 3. Dismiss duplicates — keep lowest ID per similar title group ──────────
// For AgaveFleet: keep best 3
const agaveItems = await sql`
  SELECT id, title, priority FROM action_items
  WHERE status = 'needs_review'
  AND (title ILIKE '%agavefleet%' OR title ILIKE '%agave fleet%' OR project ILIKE '%agave%')
  ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, id ASC
`;
if (agaveItems.length > 3) {
  const dismissIds = agaveItems.slice(3).map(a => a.id);
  await sql`UPDATE action_items SET status = 'dismissed', updated_at = NOW() WHERE id = ANY(${dismissIds})`;
  console.log(`AgaveFleet: kept 3, dismissed ${dismissIds.length}`);
}

// For Mitch's Map / Brian: keep only re-forward invoice
const mitchItems = await sql`
  SELECT id, title FROM action_items
  WHERE status = 'needs_review'
  AND (title ILIKE '%mitch%' OR title ILIKE '%brian%' OR project ILIKE '%mitch%')
  ORDER BY id ASC
`;
const mitchKeep = mitchItems.find(a => a.title.toLowerCase().includes('invoice'));
const mitchDismiss = mitchItems.filter(a => a.id !== mitchKeep?.id).map(a => a.id);
if (mitchDismiss.length > 0) {
  await sql`UPDATE action_items SET status = 'dismissed', updated_at = NOW() WHERE id = ANY(${mitchDismiss})`;
  console.log(`Mitch's Map: kept "${mitchKeep?.title}", dismissed ${mitchDismiss.length}`);
}

// For Zone 9: dismiss all
const zone9 = await sql`
  UPDATE action_items SET status = 'dismissed', updated_at = NOW()
  WHERE status = 'needs_review' AND (title ILIKE '%zone 9%' OR project ILIKE '%zone 9%')
  RETURNING id
`;
console.log(`Zone 9: dismissed ${zone9.length}`);

// For Signage: keep 1
const signItems = await sql`
  SELECT id, title FROM action_items
  WHERE status = 'needs_review'
  AND (title ILIKE '%signage%' OR project ILIKE '%signage%')
  ORDER BY id ASC
`;
if (signItems.length > 1) {
  const signDismiss = signItems.slice(1).map(a => a.id);
  await sql`UPDATE action_items SET status = 'dismissed', updated_at = NOW() WHERE id = ANY(${signDismiss})`;
  console.log(`Signage: kept "${signItems[0].title}", dismissed ${signDismiss.length}`);
}

// For Gypsum: keep 1
const gypsumItems = await sql`
  SELECT id, title FROM action_items
  WHERE status = 'needs_review'
  AND (title ILIKE '%gypsum%' OR project ILIKE '%gypsum%')
  ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, id ASC
`;
if (gypsumItems.length > 1) {
  const gDismiss = gypsumItems.slice(1).map(a => a.id);
  await sql`UPDATE action_items SET status = 'dismissed', updated_at = NOW() WHERE id = ANY(${gDismiss})`;
  console.log(`Gypsum: kept "${gypsumItems[0].title}", dismissed ${gDismiss.length}`);
}

// For Extract/Pistachio: keep top 3
const extractItems = await sql`
  SELECT id, title, priority FROM action_items
  WHERE status = 'needs_review'
  AND (title ILIKE '%extract%' OR project ILIKE '%extract%' OR project ILIKE '%pistachio%'
    OR title ILIKE '%pistachio%' OR project ILIKE '%hawasi%' OR title ILIKE '%hay bale%')
  ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, id ASC
`;
if (extractItems.length > 3) {
  const eDismiss = extractItems.slice(3).map(a => a.id);
  await sql`UPDATE action_items SET status = 'dismissed', updated_at = NOW() WHERE id = ANY(${eDismiss})`;
  console.log(`Extract/Pistachio: kept 3, dismissed ${eDismiss.length}`);
}

// For Amazon: keep 2
const amazonItems = await sql`
  SELECT id, title FROM action_items
  WHERE status = 'needs_review'
  AND (title ILIKE '%amazon%' OR title ILIKE '%astroid%' OR project ILIKE '%amazon%')
  ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, id ASC
`;
if (amazonItems.length > 2) {
  const aDismiss = amazonItems.slice(2).map(a => a.id);
  await sql`UPDATE action_items SET status = 'dismissed', updated_at = NOW() WHERE id = ANY(${aDismiss})`;
  console.log(`Amazon: kept 2, dismissed ${aDismiss.length}`);
}

// For Hector/FOTG: keep 2
const hectorItems = await sql`
  SELECT id, title FROM action_items
  WHERE status = 'needs_review'
  AND (title ILIKE '%hector%' OR title ILIKE '%payment link%' OR title ILIKE '%bagged product%')
  ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, id ASC
`;
if (hectorItems.length > 2) {
  const hDismiss = hectorItems.slice(2).map(a => a.id);
  await sql`UPDATE action_items SET status = 'dismissed', updated_at = NOW() WHERE id = ANY(${hDismiss})`;
  console.log(`Hector/FOTG: kept 2, dismissed ${hDismiss.length}`);
}

// ─── 4. Promote remaining review items to pending ────────────────────────────
const promoted = await sql`
  UPDATE action_items SET status = 'pending', updated_at = NOW()
  WHERE status = 'needs_review'
  RETURNING id, title, company, project
`;
console.log(`\nPromoted to pending: ${promoted.length}`);
for (const p of promoted) {
  console.log(`  ✅ [${p.company}] ${p.title} ${p.project ? '| ' + p.project : ''}`);
}

// ─── 5. Final stats ──────────────────────────────────────────────────────────
const [stats] = await sql`
  SELECT
    count(*) FILTER (WHERE status = 'pending') as pending,
    count(*) FILTER (WHERE status = 'needs_review') as review,
    count(*) FILTER (WHERE status = 'dismissed') as dismissed,
    count(*) FILTER (WHERE status = 'completed') as completed
  FROM action_items
`;
console.log(`\n📊 Final: ${stats.pending} pending, ${stats.review} review, ${stats.dismissed} dismissed, ${stats.completed} completed`);

await sql.end();
