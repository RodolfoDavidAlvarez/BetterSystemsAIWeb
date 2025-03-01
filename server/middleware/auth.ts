import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Using a fixed JWT Secret for development to ensure consistency between server restarts
// In production, this should be in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'bettersystems-blog-secret-key-dev';

// JWT payload interface
interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

// Authenticate middleware - verifies the user is logged in
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Add user to request
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};