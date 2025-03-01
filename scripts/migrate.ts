import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { blogPosts, users } from '../db/schema';
import bcrypt from 'bcrypt';

// Database connection string
const connectionString = process.env.DATABASE_URL || '';

// Create database client
const client = postgres(connectionString);
const db = drizzle(client);

// Function to run migrations
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // This will automatically create all tables
    await migrate(db, { migrationsFolder: 'drizzle' });
    
    console.log('Database migrations completed successfully.');
    
    // Check if there are any admin users already
    console.log('Checking for admin users...');
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
    
    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating default admin user...');
      
      // Create a default admin user for first-time setup
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        name: 'Admin User',
        email: 'admin@bettersystemsai.com',
        role: 'admin'
      });
      
      console.log('Default admin user created.');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('IMPORTANT: Please change the default password immediately after logging in!');
    } else {
      console.log(`Found ${adminUsers.length} existing admin users.`);
    }
    
    console.log('Migration process completed.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
runMigrations();