import '../server/loadEnv';
import { db } from '../db/index';
import { deals, dealInteractions, clients } from '../db/schema';

async function seedDeals() {
  console.log('Seeding deals...');

  try {
    // Check if we have any clients
    const existingClients = await db.select().from(clients);

    if (existingClients.length === 0) {
      console.error('No clients found. Please seed clients first.');
      return;
    }

    // Use the first client for the deal
    const client = existingClients[0];
    console.log(`Using client: ${client.name}`);

    // Check if deals already exist
    const existingDeals = await db.select().from(deals);

    if (existingDeals.length > 0) {
      console.log('Deals already exist. Skipping seed.');
      return;
    }

    // Create Desert Moon Lighting CRM deal
    const [deal1] = await db.insert(deals).values({
      clientId: client.id,
      name: 'Desert Moon Lighting CRM',
      description: 'Custom CRM system for managing lighting installation proposals, clients, and projects',
      value: '5750',
      stage: 'active',
      priority: 'high',
      probability: 90,
      source: 'real',
      nextSteps: 'Finalize advancement invoice + integrate Stripe keys',
      notes: 'Active project with ongoing development. Phase 1 focused on billing and documents.',
    }).returning();

    console.log(`Created deal: ${deal1.name}`);

    // Add some interactions
    await db.insert(dealInteractions).values([
      {
        dealId: deal1.id,
        type: 'email',
        subject: 'Shared balance summary + next steps',
        content: 'Sent comprehensive balance summary and outlined next development phases',
        contactPerson: client.contactName || client.name,
        status: 'completed',
        emailSent: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        dealId: deal1.id,
        type: 'note',
        subject: 'Waiting on Stripe keys',
        content: 'Advancement invoice ready to send once Stripe test keys are configured',
        status: 'completed',
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        dealId: deal1.id,
        type: 'call',
        subject: 'CRM control hub walkthrough',
        content: 'Demonstrated new CRM control center and onboarding document templates',
        contactPerson: client.contactName || client.name,
        status: 'completed',
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ]);

    console.log('Added deal interactions');

    // Create a sample prospect deal
    if (existingClients.length > 1) {
      const [deal2] = await db.insert(deals).values({
        clientId: existingClients[1].id,
        name: 'Operations Automation Suite',
        description: 'Comprehensive business operations automation for growing service company',
        value: '12500',
        stage: 'prospect',
        priority: 'medium',
        probability: 65,
        source: 'sample',
        nextSteps: 'Send proposal and schedule technical demo',
        notes: 'Interested in workflow automation and client management tools',
      }).returning();

      console.log(`Created deal: ${deal2.name}`);

      await db.insert(dealInteractions).values([
        {
          dealId: deal2.id,
          type: 'email',
          subject: 'Initial discovery call',
          content: 'Discussed pain points and automation opportunities',
          contactPerson: existingClients[1].contactName || existingClients[1].name,
          status: 'completed',
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      ]);
    }

    console.log('✅ Deals seeded successfully!');
  } catch (error) {
    console.error('Error seeding deals:', error);
    throw error;
  }
}

// Run the seed function
seedDeals()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
