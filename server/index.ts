import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from "cors";
import { createServer } from 'http';
import { existsSync } from 'fs';
import { registerRoutes } from './routes';

// JWT Secret Configuration with better production handling
if (!process.env.JWT_SECRET) {
  // Generate a more secure random secret for production
  if (process.env.NODE_ENV === 'production') {
    // In production, generate a random secret
    const crypto = require('crypto');
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    console.log('[Security] Generated random JWT_SECRET for production');
    console.warn('[Security] Note: JWT tokens will be invalidated on server restart due to dynamic secret');
  } else {
    // Use a constant for development to ensure consistency between server restarts
    process.env.JWT_SECRET = 'bettersystems-blog-secret-key-dev';
    console.log('[Security] Using fixed JWT_SECRET for development');
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced debug logging middleware
const requestLogger = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (process.env.NODE_ENV === 'development') {
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
};

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON body before logging
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    // Store the raw body for debugging if needed
    (req as any).rawBody = buf.toString();
  }
}));

// Add middleware to handle JSON parsing errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('[JSON Parse Error]', {
      error: err.message,
      path: req.path,
      method: req.method,
      contentType: req.headers['content-type'],
      time: new Date().toISOString()
    });
    return res.status(400).json({ 
      success: false,
      error: 'Invalid JSON',
      message: 'The request body contains invalid JSON'
    });
  }
  next(err);
});

// Apply request logger after body parsing
app.use(requestLogger);

// Static file serving with enhanced logging
const staticDir = join(dirname(__dirname), 'dist/public');
console.log(`[Static Files] Serving from: ${staticDir}`);
console.log(`[Static Files] Directory exists: ${existsSync(staticDir)}`);

app.use(express.static(staticDir));


// Health check endpoint with detailed response
app.get('/api/health', (_req, res) => {
  const health = {
    status: 'healthy',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    port: PORT,
    staticDir,
    nodeVersion: process.version,
    staticDirExists: existsSync(staticDir)
  };
  console.log('[Health Check] Response:', health);
  res.json(health);
});

// Register API routes
registerRoutes(app);

// SPA fallback with logging - exclude API routes
app.get('*', (req, res, next) => {
  // Skip API routes to avoid conflicts
  if (req.url.startsWith('/api/')) {
    return next();
  }
  console.log(`[SPA Fallback] Serving index.html for: ${req.url}`);
  res.sendFile(join(staticDir, 'index.html'));
});

// Enhanced error handling
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    time: new Date().toISOString()
  });
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    path: req.path
  });
});

// Create and start server with explicit host binding
const server = createServer(app);

try {
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Server] Process ID: ${process.pid}`);
  });
} catch (error) {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM signal. Starting graceful shutdown...');
  server.close(() => {
    console.log('[Server] Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] Received SIGINT signal. Starting graceful shutdown...');
  server.close(() => {
    console.log('[Server] Server closed successfully');
    process.exit(0);
  });
});

// Unhandled error logging
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});