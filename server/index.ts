import express, { type Request, Response } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Register regular routes first
  registerRoutes(app);
  const server = createServer(app);

  // Setup static file serving or development server
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Error handling middleware should be last
  app.use((error: any, _req: Request, res: Response, next: Function) => {
    console.error('Server error:', error);
    
    // If headers already sent, delegate to Express's default error handler
    if (res.headersSent) {
      return next(error);
    }

    // Handle specific error types
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    
    try {
      res.status(status).json({
        error: true,
        message: message,
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
      });
    } catch (err) {
      console.error('Error in error handler:', err);
      res.status(500).send('Internal Server Error');
    }
  });

  // Get port from environment variable, defaulting to 3000 for local development
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  
  // Clean up any existing connections on shutdown
  const cleanup = () => {
    server.close(() => {
      log('Server shutting down');
      process.exit(0);
    });
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  // Function to start server
  const startServer = (retryPort?: number) => {
    const finalPort = retryPort || port;
    try {
      server.listen(finalPort, '0.0.0.0', () => {
        log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${finalPort}`);
        if (process.env.REPLIT_SLUG) {
          log(`Server URL: https://${process.env.REPLIT_SLUG}.replit.dev`);
        }
      });

      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          // If port 80 fails, try port 3000
          if (finalPort === 80 && !retryPort) {
            log(`Port 80 is not available, falling back to port 3000`);
            startServer(3000);
          } else {
            log(`Port ${finalPort} is already in use. Please check your configuration.`);
            process.exit(1);
          }
        } else {
          log(`Server error: ${err.message}`);
          process.exit(1);
        }
      });
    } catch (error) {
      log(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  };

  // Start the server
  startServer();
})();
