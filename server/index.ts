import express from "express";
import type { Request, Response } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite } from "./vite.js";
import { createServer } from "http";
import path from "path";
import fs from "fs";

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
    try {
      // Get the absolute path to the dist/public directory
      const publicPath = path.resolve(process.cwd(), 'dist');
      
      // Ensure the public directory exists
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
          // Set aggressive caching for assets
          if (filepath.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
          }
          // Set appropriate content type
          const contentType = path.extname(filepath);
          if (contentType === '.js') {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (contentType === '.css') {
            res.setHeader('Content-Type', 'text/css');
          }
        }
      }));

      // Handle SPA routing - serve index.html for all unmatched routes
      app.get('*', (_req, res) => {
        const indexPath = path.join(publicPath, 'index.html');
        
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
      });
    } catch (error) {
      console.error('Error setting up static file serving:', error);
      throw error;
    }
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

  // Always use PORT environment variable, letting Replit handle port mapping
  const port = parseInt(process.env.PORT || '3000', 10);
  
  // Clean up any existing connections on shutdown
  const cleanup = () => {
    server.close(() => {
      log('Server shutting down');
      process.exit(0);
    });
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);

  // Start server on the specified port
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