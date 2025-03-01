import { db } from '../db';
import { users } from '../db/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function updateAdminPassword() {
  try {
    // Check if admin user exists
    const existingAdmin = await db.select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);

    if (existingAdmin.length === 0) {
      console.log('Admin user does not exist');
      return;
    }

    // Generate new password hash
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Update admin user password
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.username, 'admin'));
    
    console.log('Admin password updated successfully');
    console.log('Username: admin');
    console.log('Password: 123456');
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    process.exit(0);
  }
}

updateAdminPassword();