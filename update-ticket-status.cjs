const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/better_systems_ai';
const sql = postgres(connectionString);

async function updateTicketStatus() {
  try {
    console.log('🔄 Updating ticket status from "open" to "pending"...\n');

    const result = await sql`
      UPDATE support_tickets
      SET status = 'pending'
      WHERE application_source = 'crm-lighting'
        AND status = 'open'
      RETURNING id, title, status
    `;

    console.log(`✅ Updated ${result.length} tickets:\n`);

    result.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.title}`);
      console.log(`   Status: ${ticket.status}\n`);
    });

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
  }
}

updateTicketStatus();
