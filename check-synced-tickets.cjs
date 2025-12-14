const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/better_systems_ai';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function checkTickets() {
  try {
    const result = await sql`
      SELECT
        id, title, priority, page, status,
        application_source, external_ticket_id,
        submitter_email, created_at
      FROM support_tickets
      WHERE application_source = 'crm-lighting'
      ORDER BY created_at DESC
    `;

    console.log(`\n📊 Total CRM Lighting tickets: ${result.length}\n`);

    result.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.title}`);
      console.log(`   Priority: ${ticket.priority} | Page: ${ticket.page || 'N/A'} | Status: ${ticket.status}`);
      console.log(`   Email: ${ticket.submitter_email}`);
      console.log(`   External ID: ${ticket.external_ticket_id}`);
      console.log(`   Created: ${ticket.created_at}\n`);
    });

    await sql.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTickets();
