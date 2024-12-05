import express, { type Request, Response, NextFunction } from "express";
import path from "path";
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
  registerRoutes(app);
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Get port from environment variable, Replit sets this automatically
  const PORT = process.env.PORT || '3000';
  const numericPort = parseInt(PORT, 10);
  
  if (isNaN(numericPort)) {
    log(`Invalid PORT value: ${PORT}, using default port 3000`);
    numericPort = 3000;
  }
  
  // Always bind to all network interfaces for Replit compatibility
  const startServer = () => {
    try {
      server.listen(numericPort, '0.0.0.0', () => {
        log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
        log(`Listening on port ${numericPort}`);
        if (process.env.REPLIT_SLUG) {
          log(`Server URL: https://${process.env.REPLIT_SLUG}.replit.dev`);
        }
      });

      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`Port ${numericPort} is already in use. Trying again...`);
          setTimeout(() => {
            server.close();
            startServer();
          }, 1000);
        } else {
          log(`Failed to start server: ${err.message}`);
          process.exit(1);
        }
      });
    } catch (error) {
      log(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  };

  startServer();
})();
