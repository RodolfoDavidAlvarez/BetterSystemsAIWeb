import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from "cors";
import { createServer } from 'http';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(express.json());
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

// SPA fallback with logging
app.get('*', (req, res) => {
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