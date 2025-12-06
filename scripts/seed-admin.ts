import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { users } from '../db/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const { Pool } = pg;

// Create a direct database connection for the seed script
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

const SALT_ROUNDS = 10;

async function seedAdminUser() {
  console.log('🔐 Creating admin user...');

  const adminData = {
    username: 'rodolfo',
    email: 'rodolfo@bettersystems.ai',
    password: 'password123',
    name: 'Rodolfo Alvarez',
    role: 'admin' as const,
  };

  try {
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, adminData.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('⚠️  Admin user already exists, skipping...');
      console.log(`   Username: ${existingUser[0].username}`);
      console.log(`   Email: ${existingUser[0].email}`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, SALT_ROUNDS);

    // Create user
    const newUser = await db.insert(users).values({
      username: adminData.username,
      email: adminData.email,
      password: hashedPassword,
      name: adminData.name,
      role: adminData.role,
    }).returning();

    console.log('✅ Admin user created successfully!');
    console.log(`   Username: ${newUser[0].username}`);
    console.log(`   Email: ${newUser[0].email}`);
    console.log(`   Password: password123 (for development only)`);
    console.log('');
    console.log('🔑 You can now login at /admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

seedAdminUser();
