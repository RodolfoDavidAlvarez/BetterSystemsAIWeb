import express from "express";
import type { Request, Response } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite } from "./vite.js";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import cors from "cors";

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

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : process.env.ALLOWED_ORIGINS?.split(',') || false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
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
  let activeConnections = new Set<any>();

  // Register API routes first
  registerRoutes(app);
  const server = createServer(app);

  // Track active connections for graceful shutdown
  server.on('connection', connection => {
    activeConnections.add(connection);
    connection.on('close', () => {
      activeConnections.delete(connection);
    });
  });

  // Setup static file serving or development server
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    try {
      const publicPath = path.resolve(process.cwd(), 'client', 'dist');

      if (!fs.existsSync(publicPath)) {
        log(`Error: Build directory not found at ${publicPath}`);
        throw new Error(`Build directory not found. Please ensure the application is built before starting the server.`);
      }

      log(`Serving static files from: ${publicPath}`);

      // Serve static files with optimized caching
      app.use(express.static(publicPath, {
        maxAge: '1d',
        etag: true,
        index: false,
        setHeaders: (res, filepath) => {
          if (filepath.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
          }
          if (filepath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (filepath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
          }
        }
      }));

      // Handle all routes for SPA
      app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
          return next();
        }

        // Skip actual files
        if (path.extname(req.path)) {
          return next();
        }

        const indexPath = path.join(publicPath, 'index.html');

        try {
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            log(`Error: index.html not found at ${indexPath}`);
            res.status(404).json({
              error: 'Application not ready',
              message: 'The application is still building. Please try again in a moment.',
              path: publicPath
            });
          }
        } catch (error) {
          console.error('Error serving index.html:', error);
          next(error);
        }
      });

    } catch (error) {
      console.error('Error setting up static file serving:', error);
      throw error;
    }
  }

  // Improved error handling middleware
  app.use((error: any, req: Request, res: Response, next: Function) => {
    console.error('Server error:', error);

    if (res.headersSent) {
      return next(error);
    }

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    // Don't expose stack traces in production
    const errorResponse = {
      error: true,
      message: message,
      ...(process.env.NODE_ENV === 'development' ? { 
        stack: error.stack,
        details: error.details || undefined
      } : {})
    };

    try {
      res.status(status).json(errorResponse);
    } catch (err) {
      console.error('Error in error handler:', err);
      res.status(500).send('Internal Server Error');
    }
  });

  const port = parseInt(process.env.PORT || '3000', 10);

  // Improved cleanup function with timeout
  const cleanup = (signal: string) => {
    log(`Received ${signal}. Starting graceful shutdown...`);

    // Set a timeout for the graceful shutdown
    const forcedShutdownTimeout = setTimeout(() => {
      log('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);

    server.close(() => {
      clearTimeout(forcedShutdownTimeout);
      log('Server closed successfully');

      // Close all remaining connections
      activeConnections.forEach(conn => {
        conn.destroy();
      });

      process.exit(0);
    });

    // Stop accepting new connections
    activeConnections.forEach(conn => {
      conn.end();
    });
  };

  process.on('SIGTERM', () => cleanup('SIGTERM'));
  process.on('SIGINT', () => cleanup('SIGINT'));

  try {
    server.listen(port, '0.0.0.0', () => {
      log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
      if (process.env.REPLIT_SLUG) {
        log(`Replit deployment URL: https://${process.env.REPLIT_SLUG}.replit.dev`);
      }
    }).on('error', (error: any) => {
      log(`Server error: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    log(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
})();