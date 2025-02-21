import express from "express";
import { createServer } from "http";
import cors from "cors";
import { registerRoutes } from "./routes";
import path from "path";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Verify static directory exists
const staticDir = path.resolve("./dist/public");
console.log(`Static directory path: ${staticDir}`);
console.log(`Static directory exists: ${require('fs').existsSync(staticDir)}`);

// Serve static files
app.use(express.static(staticDir));

// Register all routes
registerRoutes(app);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  console.log('Health check received');
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  console.log(`Fallback route hit: ${req.url}`);
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started successfully on port ${PORT}`);
  console.log(`Server bound to all interfaces (0.0.0.0)`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Clean shutdown handling
const cleanup = () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);