import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { clients, projects, projectUpdates } from '../db/schema';
import { eq } from 'drizzle-orm';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seedCRMData() {
  console.log('🌱 Seeding CRM data...\n');

  try {
    // ============================================
    // REAL CLIENT: Desert Moon Lighting
    // ============================================
    console.log('📋 Creating client: Desert Moon Lighting (REAL DATA)...');

    const desertMoonResult = await db.insert(clients).values({
      name: 'Desert Moon Lighting',
      contactName: 'Vince',
      email: 'vince@desertmoonlighting.com',
      phone: '(480) 555-0101',
      website: 'https://desertmoonlighting.com',
      industry: 'Home Services / Outdoor Lighting',
      companySize: 'small',
      status: 'active',
      source: 'referral',
      address: '123 Sonoran Way',
      city: 'Scottsdale',
      state: 'AZ',
      zipCode: '85251',
      country: 'USA',
      notes: 'Also operates Desert Mist Arizona (misting systems). Key contacts: Vince (owner), Mike (sales manager), Micah (operations).',
      tags: ['lighting', 'misting', 'outdoor', 'active-development'],
    }).returning();

    const desertMoonId = desertMoonResult[0].id;
    console.log(`   ✅ Created client ID: ${desertMoonId}`);

    // Create the CRM project for Desert Moon
    console.log('📁 Creating project: Misting & Lighting CRM (REAL DATA)...');

    const crmProjectResult = await db.insert(projects).values({
      clientId: desertMoonId,
      name: 'Misting & Lighting CRM',
      description: 'Custom CRM for proposal building, contract management, and customer tracking. Supports both Desert Moon Lighting and Desert Mist Arizona with multi-company logic.',
      type: 'development',
      status: 'active',
      priority: 'high',
      progress: 85,
      budgetType: 'hourly',
      hourlyRate: '65.00',
      budgetAmount: '5750.00', // Original + scope updates
      totalBilled: '3834.75', // Deposit + Invoice 1
      startDate: new Date('2025-06-04'),
      dueDate: new Date('2025-12-31'),
      notes: 'Original contract: $3,575. Scope updates: $2,175. Current rate: $65/hr. QuickBooks integration in progress.',
      tags: ['crm', 'proposal-builder', 'multi-company', 'signature'],
    }).returning();

    const crmProjectId = crmProjectResult[0].id;
    console.log(`   ✅ Created project ID: ${crmProjectId}`);

    // Create project updates (real development updates)
    console.log('📝 Creating project updates (REAL DATA)...');

    const updates = [
      {
        projectId: crmProjectId,
        title: 'Multi-Company Logic & Domain Setup',
        content: 'Configured Desert Moon Lighting and Desert Mist Arizona as separate entities with dynamic content and pricing logic per LLC. 6 hours @ $65/hr = $390',
        updateType: 'milestone',
        isInternal: false,
        sentToClient: true,
        sentAt: new Date('2025-10-15'),
      },
      {
        projectId: crmProjectId,
        title: 'Multi-Rep Permissions & Roles',
        content: 'Admin can view all proposals and records; standard users restricted to their own proposals only for privacy and control. 2 hours @ $65/hr = $130',
        updateType: 'milestone',
        isInternal: false,
        sentToClient: true,
        sentAt: new Date('2025-10-18'),
      },
      {
        projectId: crmProjectId,
        title: 'Remote Signature Link System',
        content: 'Email secure client signature links; automatically updates proposal and contract status on completion. Most complex feature of this sprint. 10 hours @ $65/hr = $650',
        updateType: 'deliverable',
        isInternal: false,
        sentToClient: true,
        sentAt: new Date('2025-10-28'),
      },
      {
        projectId: crmProjectId,
        title: 'QuickBooks Integration - In Progress',
        content: 'Integrates deposits and final payments with QuickBooks for real-time reconciliation. Currently under final testing. 8 hours estimated.',
        updateType: 'progress',
        isInternal: false,
        sentToClient: false,
      },
      {
        projectId: crmProjectId,
        title: 'Balance Summary: $4,937.75 Outstanding',
        content: 'Current balance breakdown:\n- Original Contract: $3,575.00\n- Scope Updates: $2,175.00\n- Deposit Received (Jun 4): -$1,787.50\n- Invoice QDANPTMD-0001 (Jun 24): -$2,047.25\n- Development (46.5 hrs @ $65/hr): $3,022.50\n\nNext: Advancement invoice for $2,000 pending approval.',
        updateType: 'general',
        isInternal: true,
        sentToClient: false,
      },
    ];

    for (const update of updates) {
      await db.insert(projectUpdates).values(update);
    }
    console.log(`   ✅ Created ${updates.length} project updates`);

    // ============================================
    // SAMPLE CLIENTS (for demo)
    // ============================================
    console.log('\n📋 Creating sample clients (SAMPLE DATA)...');

    const sampleClients = [
      {
        name: 'TechFlow Solutions',
        contactName: 'Sarah Johnson',
        email: 'sarah@techflow.sample',
        phone: '(555) 234-5678',
        industry: 'Technology',
        companySize: 'medium',
        status: 'prospect',
        source: 'website',
        city: 'Austin',
        state: 'TX',
        notes: '[SAMPLE DATA] Interested in AI workflow automation.',
        tags: ['sample', 'technology', 'automation'],
      },
      {
        name: 'Green Valley Landscaping',
        contactName: 'Mike Chen',
        email: 'mike@greenvalley.sample',
        phone: '(555) 345-6789',
        industry: 'Landscaping',
        companySize: 'small',
        status: 'lead',
        source: 'linkedin',
        city: 'Phoenix',
        state: 'AZ',
        notes: '[SAMPLE DATA] Looking for a customer management system.',
        tags: ['sample', 'landscaping', 'crm'],
      },
      {
        name: 'Sunset Realty Group',
        contactName: 'Amanda Torres',
        email: 'amanda@sunsetrealty.sample',
        phone: '(555) 456-7890',
        industry: 'Real Estate',
        companySize: 'medium',
        status: 'active',
        source: 'referral',
        city: 'San Diego',
        state: 'CA',
        notes: '[SAMPLE DATA] Using our property management integration.',
        tags: ['sample', 'real-estate', 'integration'],
      },
    ];

    for (const client of sampleClients) {
      const result = await db.insert(clients).values(client).returning();
      console.log(`   ✅ Created sample client: ${client.name}`);

      // Create sample project for active clients
      if (client.status === 'active') {
        await db.insert(projects).values({
          clientId: result[0].id,
          name: 'Property Management Integration',
          description: '[SAMPLE DATA] Integration with MLS and property management systems.',
          type: 'integration',
          status: 'active',
          priority: 'medium',
          progress: 45,
          budgetType: 'fixed',
          budgetAmount: '8500.00',
          totalBilled: '4250.00',
          startDate: new Date('2025-09-01'),
          dueDate: new Date('2026-01-15'),
          tags: ['sample', 'integration'],
        });
        console.log(`   ✅ Created sample project for: ${client.name}`);
      }
    }

    console.log('\n✅ CRM seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log('   - 1 real client (Desert Moon Lighting)');
    console.log('   - 1 real project with 5 updates');
    console.log('   - 3 sample clients');
    console.log('   - 1 sample project');

  } catch (error) {
    console.error('❌ Error seeding CRM data:', error);
  } finally {
    await pool.end();
  }
}

seedCRMData();
