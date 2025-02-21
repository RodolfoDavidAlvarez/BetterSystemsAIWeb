import express from "express";
import { createServer } from "http";
import cors from "cors";
import net from "net";

const app = express();
const DEFAULT_PORT = 8080;

// Enhanced error logging
function logError(error: any) {
  console.error('Detailed error information:');
  console.error('Message:', error.message);
  console.error('Code:', error.code);
  console.error('Stack:', error.stack);
  if (error.syscall) {
    console.error('System call:', error.syscall);
  }
  if (error.address) {
    console.error('Address:', error.address);
  }
  if (error.port) {
    console.error('Port:', error.port);
  }
}

// Check if a port is available
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

// Find next available port
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    console.log(`Port ${port} is in use, trying next port...`);
    port++;
    if (port > startPort + 100) { // Don't search indefinitely
      throw new Error('No available ports found in range');
    }
  }
  return port;
}

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

// Start server with enhanced error handling
async function startServer() {
  try {
    const port = await findAvailablePort(DEFAULT_PORT);
    console.log(`Found available port: ${port}`);

    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    }).on('error', (error: any) => {
      logError(error);
      process.exit(1);
    });

    // Cleanup on process termination
    const cleanup = () => {
      console.log('Cleanup: Closing server...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

  } catch (error) {
    logError(error);
    process.exit(1);
  }
}

startServer();