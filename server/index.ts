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
  registerRoutes(app);
  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Server error:', err);
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

  try {
    server.listen(port, '0.0.0.0', () => {
      log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
      if (process.env.REPLIT_SLUG) {
        log(`Server URL: https://${process.env.REPLIT_SLUG}.replit.dev`);
      }
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use. Please use a different port.`);
      } else {
        log(`Server error: ${err.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    log(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
})();
