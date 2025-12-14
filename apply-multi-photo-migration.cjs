const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/better_systems_ai';
const sql = postgres(connectionString);

async function applyMigration() {
  console.log('🔄 Applying multi-photo support migration to BetterSystems.AI...\n');

  try {
    // Step 1: Add new column
    console.log('📝 Step 1: Adding screenshot_urls column...');
    await sql`
      ALTER TABLE support_tickets
      ADD COLUMN IF NOT EXISTS screenshot_urls text[]
    `;
    console.log('✅ Column added\n');

    // Step 2: Migrate existing data
    console.log('📝 Step 2: Migrating existing screenshot data...');
    const migrateResult = await sql`
      UPDATE support_tickets
      SET screenshot_urls = ARRAY[screenshot_url]
      WHERE screenshot_url IS NOT NULL
        AND screenshot_url != ''
        AND screenshot_urls IS NULL
      RETURNING id
    `;
    console.log(`✅ Migrated ${migrateResult.length} records\n`);

    // Step 3: Add constraint
    console.log('📝 Step 3: Adding max 3 photos constraint...');
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'screenshot_urls_max_3'
        ) THEN
          ALTER TABLE support_tickets
          ADD CONSTRAINT screenshot_urls_max_3 CHECK (
            screenshot_urls IS NULL OR
            array_length(screenshot_urls, 1) IS NULL OR
            array_length(screenshot_urls, 1) <= 3
          );
        END IF;
      END $$
    `;
    console.log('✅ Constraint added\n');

    // Step 4: Add comment
    console.log('📝 Step 4: Adding column comment...');
    await sql`
      COMMENT ON COLUMN support_tickets.screenshot_urls IS 'Array of screenshot URLs (max 3) for the support ticket'
    `;
    console.log('✅ Comment added\n');

    // Verify
    console.log('📋 Verifying migration...');
    const result = await sql`
      SELECT id, title, screenshot_urls
      FROM support_tickets
      ORDER BY created_at DESC
      LIMIT 5
    `;

    console.log(`✅ Migration successful! Sample records:\n`);
    result.forEach((record, index) => {
      console.log(`${index + 1}. ${record.title}`);
      console.log(`   Screenshots: ${record.screenshot_urls ? JSON.stringify(record.screenshot_urls) : 'none'}\n`);
    });

    await sql.end();

    console.log('🎉 Multi-photo migration completed!\n');
    console.log('Note: The old screenshot_url column has been kept for reference.');
    console.log('It can be dropped later with: ALTER TABLE support_tickets DROP COLUMN screenshot_url;\n');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    await sql.end();
    process.exit(1);
  }
}

applyMigration().catch(console.error);
