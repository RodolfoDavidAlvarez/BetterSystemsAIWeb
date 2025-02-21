import express from "express";
import { createServer } from "http";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  console.log('Health check received');
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started successfully on port ${PORT}`);
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