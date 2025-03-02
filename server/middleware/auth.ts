import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Using a fixed JWT Secret for development to ensure consistency between server restarts
// In production, this should be in an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'bettersystems-blog-secret-key-dev';

// Set environment-aware cookie settings
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// JWT payload interface
interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

// Create a typed request extension
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Authenticate middleware - verifies the user is logged in
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[Auth] Authenticating request:', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization,
      hasCookies: !!req.cookies,
      hasTokenCookie: !!(req.cookies && req.cookies.token),
      queryParams: Object.keys(req.query)
    });
    
    // Try to get token from multiple sources for better compatibility
    let token: string | undefined;
    let tokenSource: string = 'none';
    
    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      tokenSource = 'authorization_header';
      console.log('[Auth] Found token in Authorization header');
    }
    
    // 2. Check cookies (if header token not found)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
      tokenSource = 'cookie';
      console.log('[Auth] Found token in cookie');
    }
    
    // 3. Check query parameter (for specific cases like file downloads)
    if (!token && req.query && typeof req.query.token === 'string') {
      token = req.query.token;
      tokenSource = 'query_param';
      console.log('[Auth] Found token in query parameter');
    }
    
    // No token found anywhere
    if (!token) {
      console.log('[Auth] No authentication token found');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    console.log(`[Auth] Verifying token from ${tokenSource} (length: ${token.length})`);
    console.log(`[Auth] Using JWT_SECRET with length: ${JWT_SECRET.length}`);
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    console.log('[Auth] Token verified successfully for user:', {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    });
    
    // Add user to request with proper typing
    (req as AuthenticatedRequest).user = decoded;
    
    // Refresh token if needed (if token is close to expiry)
    try {
      const { exp } = decoded as JwtPayload & { exp?: number };
      const now = Math.floor(Date.now() / 1000);
      
      console.log('[Auth] Token expiry check:', {
        hasExpiry: !!exp,
        expiryTimestamp: exp,
        currentTimestamp: now,
        timeToExpiry: exp ? exp - now : 'unknown'
      });
      
      // If token is within 24 hours of expiry, refresh it
      if (exp && (exp - now < 24 * 60 * 60)) {
        console.log('[Auth] Refreshing token as it will expire soon');
        
        const newToken = jwt.sign(
          { id: decoded.id, username: decoded.username, role: decoded.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        // Set the new token in a cookie
        res.cookie('token', newToken, COOKIE_OPTIONS);
        
        // Also include it in response header for API clients
        res.setHeader('X-Refresh-Token', newToken);
        
        console.log('[Auth] Token refreshed successfully');
      }
    } catch (refreshError) {
      // Non-critical error, just log it
      console.warn('[Auth] Token refresh error:', refreshError);
    }
    
    next();
  } catch (error) {
    // Provide better error messages based on the type of error
    if (error instanceof jwt.TokenExpiredError) {
      console.log('[Auth] Token expired error');
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('[Auth] Invalid JWT token error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    
    console.error('[Auth] Authentication error:', error);
    console.error('[Auth] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (user.role !== 'admin') {
      console.warn(`Authorization failure: User ${user.username} (ID: ${user.id}) attempted to access admin resource`);
      return res.status(403).json({
        success: false,
        message: 'Administrator privileges required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking permissions'
    });
  }
};

// Helper function to create tokens with consistent settings
export const createAuthToken = (payload: Omit<JwtPayload, 'exp'>) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Helper to set auth cookies consistently
export const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, COOKIE_OPTIONS);
};