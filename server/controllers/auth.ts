import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index';
import { users, insertUserSchema } from '../../db/schema';
import { eq } from 'drizzle-orm';

// JWT Secret - in production this should be in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

// Register a new admin user
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, name, email } = req.body;
    
    // Validate user input
    const parsedInput = insertUserSchema.parse({
      username,
      password: await bcrypt.hash(password, SALT_ROUNDS),
      name,
      email,
      role: 'admin',
    });
    
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    // Insert new user
    const newUser = await db.insert(users).values(parsedInput).returning();
    
    // Create JWT token
    const token = jwt.sign(
      { id: newUser[0].id, username: newUser[0].username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        name: newUser[0].name,
        email: newUser[0].email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const foundUsers = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (foundUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = foundUsers[0];
    
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // User is already authenticated by middleware
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Find user by id
    const foundUsers = await db.select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    
    if (foundUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userData = foundUsers[0];
    
    res.json({
      success: true,
      user: {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};