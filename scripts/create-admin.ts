import { db } from '../db';
import { users } from '../db/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user with default password
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    });
    
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: 123456');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();