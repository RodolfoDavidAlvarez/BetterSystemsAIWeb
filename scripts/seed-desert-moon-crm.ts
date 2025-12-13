import { db } from '../db';
import { clients, projects, deals, dealInteractions, invoices, stripeCustomers } from '../db/schema';

async function seedDesertMoonCRM() {
  console.log('🌙 Seeding Desert Moon Lighting CRM data...');

  try {
    // 1. Create/Update Client
    console.log('Creating Desert Moon Lighting client...');
    const [client] = await db
      .insert(clients)
      .values({
        name: 'Desert Moon Lighting',
        contactName: 'Vince, Mike & Micah',
        email: 'info@desertmoonlighting.com',
        phone: '(555) 123-4567',
        status: 'active',
        source: 'referral',
        industry: 'Lighting & Misting Installation',
        companySize: 'small',
        notes: 'Multi-company operation: Desert Moon Lighting and Desert Mist Arizona. Specializes in outdoor lighting and misting systems for residential and commercial properties.',
        tags: ['lighting', 'misting', 'arizona', 'crm-development'],
      })
      .onConflictDoUpdate({
        target: clients.email,
        set: {
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`✅ Client created: ${client.name} (ID: ${client.id})`);

    // 2. Create Project
    console.log('Creating CRM Development project...');
    const [project] = await db
      .insert(projects)
      .values({
        clientId: client.id,
        name: 'Desert Moon Lighting CRM System',
        description: 'Custom CRM system for proposal generation, contract management, QuickBooks integration, and client workflow automation.',
        type: 'development',
        status: 'active',
        priority: 'high',
        progress: 85,
        budgetType: 'hourly',
        hourlyRate: '65.00',
        budgetAmount: '5750.00',
        totalBilled: '8772.50',
        startDate: new Date('2025-06-04'),
        dueDate: new Date('2025-12-31'),
        notes: 'Original contract: $3,575. Scope increased by $2,175 for new features. Development hours tracked: 46.5 hours @ $65/hr = $3,022.50',
        tags: ['crm', 'web-development', 'quickbooks', 'stripe'],
      })
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Project created: ${project.name} (ID: ${project.id})`);

    // 3. Create Deal
    console.log('Creating CRM Deal...');
    const [deal] = await db
      .insert(deals)
      .values({
        clientId: client.id,
        name: 'Desert Moon Lighting CRM - Development & Support',
        description: 'Comprehensive CRM system with proposal builder, contract generation, multi-company support, QuickBooks integration, and payment processing.',
        value: '8772.50',
        stage: 'active',
        priority: 'high',
        probability: 100,
        expectedCloseDate: new Date('2025-12-31'),
        source: 'real',
        nextSteps: 'Complete QuickBooks integration testing, advancement invoice payment',
        notes: 'Active development project with ongoing enhancements. Client requests new features regularly. Excellent communication and collaboration.',
        tags: ['crm', 'development', 'active-project'],
      })
      .onConflictDoNothing()
      .returning();

    console.log(`✅ Deal created: ${deal.name} (ID: ${deal.id})`);

    // 4. Create Deal Interactions
    console.log('Creating deal interactions...');

    const interactions = [
      {
        dealId: deal.id,
        type: 'meeting',
        subject: 'Project Kickoff Meeting',
        content: 'Discussed requirements for multi-company CRM system. Covered proposal builder, contract generation, and QuickBooks integration needs.',
        contactPerson: 'Vince, Mike, Micah',
        scheduledAt: new Date('2025-06-04'),
        completedAt: new Date('2025-06-04'),
        status: 'completed',
      },
      {
        dealId: deal.id,
        type: 'email',
        subject: 'Development Progress Update - Multi-Company Logic Complete',
        content: 'Completed multi-company logic and domain setup. Desert Moon Lighting vs. Desert Mist Arizona with dynamic content & domains. 6 hours logged.',
        contactPerson: 'Vince',
        completedAt: new Date('2025-10-15'),
        status: 'completed',
        emailSent: true,
      },
      {
        dealId: deal.id,
        type: 'email',
        subject: 'Remote Signature Feature Deployed',
        content: 'Email secure client-sign links feature is now live. Status auto-updates on completion. 10 hours development time.',
        contactPerson: 'Vince',
        completedAt: new Date('2025-10-25'),
        status: 'completed',
        emailSent: true,
      },
      {
        dealId: deal.id,
        type: 'meeting',
        subject: 'QuickBooks Integration Planning',
        content: 'Discussed QuickBooks payment collection workflow. Reviewed deposits/final payments reconciliation requirements.',
        contactPerson: 'Vince',
        scheduledAt: new Date('2025-11-05'),
        completedAt: new Date('2025-11-05'),
        status: 'completed',
      },
      {
        dealId: deal.id,
        type: 'note',
        subject: 'Feature Request - Deal Management Workflow',
        content: 'Micah requested deal management and install-close workflow with timeline, install date picker, and completion schedule. 7 hours estimated.',
        contactPerson: 'Micah',
        completedAt: new Date('2025-10-20'),
        status: 'completed',
      },
      {
        dealId: deal.id,
        type: 'email',
        subject: 'Balance Summary & Progress Report Sent',
        content: 'Sent comprehensive balance summary showing current balance $4,937.75, paid $3,834.75. Included development progress breakdown (46.5 hrs).',
        contactPerson: 'All',
        completedAt: new Date('2025-11-10'),
        status: 'completed',
        emailSent: true,
      },
    ];

    await db.insert(dealInteractions).values(interactions);
    console.log(`✅ Created ${interactions.length} deal interactions`);

    // 5. Summary
    console.log('\n📊 Seed Summary:');
    console.log(`   Client: ${client.name}`);
    console.log(`   Project: ${project.name}`);
    console.log(`   Deal Value: $${deal.value}`);
    console.log(`   Interactions: ${interactions.length}`);
    console.log('\n✅ Desert Moon Lighting CRM data seeded successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed script
seedDesertMoonCRM();
