import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../../db/index';
import { users, insertUserSchema } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest, createAuthToken, setAuthCookie } from '../middleware/auth';

// Constants
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'bettersystems-blog-secret-key-dev';

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
    
    // Create JWT token with longer expiration for admin users
    const token = createAuthToken({
      id: newUser[0].id, 
      username: newUser[0].username, 
      role: 'admin'
    });
    
    // Set token in cookie
    setAuthCookie(res, token);
    
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
    console.log('Login attempt received:', { 
      body: req.body,
      contentType: req.headers['content-type'],
      cookies: req.cookies,
      method: req.method,
      path: req.path,
      url: req.url,
      headers: req.headers
    });
    
    const { username, password } = req.body;
    
    console.log('Environment info:', {
      nodeEnv: process.env.NODE_ENV,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      jwtSecretStart: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 5) + '...' : null,
      cookieSecretExists: !!process.env.COOKIE_SECRET,
      sessionSecretExists: !!process.env.SESSION_SECRET,
      databaseUrlExists: !!process.env.DATABASE_URL
    });
    
    if (!username || !password) {
      console.log('Missing credentials:', { username: !!username, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    console.log('Looking up user:', username);
    
    // Find user by username
    const foundUsers = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    console.log('User lookup result:', { 
      found: foundUsers.length > 0,
      userCount: foundUsers.length,
      userData: foundUsers.length > 0 ? {
        id: foundUsers[0].id,
        username: foundUsers[0].username,
        name: foundUsers[0].name,
        role: foundUsers[0].role,
        passwdLen: foundUsers[0].password.length
      } : null
    });
    
    if (foundUsers.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = foundUsers[0];
    
    // Compare passwords
    console.log('Comparing passwords');
    const passwordToCompare = password || '';
    const storedPassword = user.password || '';
    console.log('Password details:', { 
      inputLength: passwordToCompare.length,
      storedLength: storedPassword.length,
      inputStart: passwordToCompare.substring(0, 3) + '...',
      storedStart: storedPassword.substring(0, 10) + '...'
    });
    
    const isPasswordValid = await bcrypt.compare(passwordToCompare, storedPassword);
    
    console.log('Password validation result:', { isValid: isPasswordValid });
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Create JWT token
    console.log('Creating JWT token with secret length:', JWT_SECRET.length);
    console.log('JWT_SECRET first 5 chars:', JWT_SECRET.substring(0, 5) + '...');
    const token = createAuthToken({
      id: user.id,
      username: user.username,
      role: user.role
    });
    
    // Set token in cookie for better security
    setAuthCookie(res, token);
    
    console.log('Login successful, sending response with token of length:', token.length);
    console.log('Response headers that will be sent:', res.getHeaders());
    
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get current user
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // User is already authenticated by middleware
    const user = req.user;
    
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