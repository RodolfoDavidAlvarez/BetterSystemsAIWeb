import express from "express";
import { createServer } from "http";
import cors from "cors";

const app = express();
const PORT_START = 50000;
const PORT_RANGE = 20; // Try ports 50000-50019

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

let currentPort: number | null = null;

// Try ports sequentially
async function startServer() {
  for (let portOffset = 0; portOffset < PORT_RANGE; portOffset++) {
    const port = PORT_START + portOffset;
    try {
      const success = await new Promise<boolean>((resolve) => {
        const onError = (error: any) => {
          console.log(`Port ${port} is not available:`, error.message);
          server.removeAllListeners();
          resolve(false);
        };

        server.once('error', onError);

        server.listen(port, '0.0.0.0', () => {
          server.removeListener('error', onError);
          currentPort = port;
          console.log(`Server started successfully on port ${port}`);
          resolve(true);
        });
      });

      if (success) {
        return port;
      }
    } catch (error) {
      logError(error);
    }
  }

  throw new Error('No available ports found in range');
}

// Clean shutdown handling
const cleanup = () => {
  console.log('Shutting down server...');
  if (currentPort) {
    console.log(`Closing server on port ${currentPort}`);
  }
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Start the server
console.log(`Attempting to start server in port range ${PORT_START}-${PORT_START + PORT_RANGE - 1}`);
startServer()
  .then(port => {
    console.log(`Server is running on port ${port}`);
  })
  .catch(error => {
    logError(error);
    process.exit(1);
  });