import 'dotenv/config';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
const items = await sql`
  SELECT id, title, company, project, priority, due_date
  FROM action_items WHERE status = 'pending'
  ORDER BY company,
    CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    due_date ASC NULLS LAST
`;
let cur = '';
for (const a of items) {
  if (a.company !== cur) { cur = a.company; console.log('\n=== ' + cur + ' ==='); }
  const due = a.due_date ? new Date(a.due_date).toLocaleDateString() : '';
  const proj = a.project || '';
  const pri = a.priority === 'urgent' ? 'URG' : a.priority === 'high' ? 'HI' : a.priority === 'medium' ? 'MED' : 'LOW';
  console.log(`[${pri}] #${a.id} ${a.title}${proj ? ' [' + proj + ']' : ''}${due ? ' — due ' + due : ''}`);
}
console.log('\n--- TOTAL: ' + items.length + ' ---');
await sql.end();
