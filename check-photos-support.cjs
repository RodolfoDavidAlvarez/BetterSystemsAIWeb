const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/better_systems_ai');

async function checkPhotoSupport() {
  console.log('🔍 Checking multi-photo support in database...\n');
  
  try {
    // Check if screenshot_urls column exists
    const columnCheck = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'support_tickets' 
      AND column_name IN ('screenshot_url', 'screenshot_urls')
      ORDER BY column_name
    `;
    
    console.log('📋 Columns found:');
    columnCheck.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check recent tickets
    const recentTickets = await sql`
      SELECT id, title, screenshot_urls, created_at
      FROM support_tickets
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('\n📊 Recent tickets:');
    recentTickets.forEach(ticket => {
      const photoCount = ticket.screenshot_urls ? ticket.screenshot_urls.length : 0;
      console.log(`  #${ticket.id}: ${ticket.title} - ${photoCount} photo(s)`);
    });
    
    await sql.end();
    console.log('\n✅ Multi-photo support is active!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
  }
}

checkPhotoSupport();
