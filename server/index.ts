/**
 * EXPRESS API SERVER
 * ==================
 * This server runs on port 3001 and handles ALL /api/* routes.
 *
 * DEVELOPMENT: Access the app at http://localhost:5173 (Vite)
 *              Vite proxies /api/* requests to this server automatically.
 *              DO NOT access port 3001 directly in the browser.
 *
 * PRODUCTION:  This server serves both API routes AND static files.
 */

import "./loadEnv";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { existsSync } from "fs";
import { registerRoutes } from "./routes";

// JWT Secret Configuration with better production handling
if (!process.env.JWT_SECRET) {
  // Generate a more secure random secret for production
  if (process.env.NODE_ENV === "production") {
    // In production, generate a random secret
    const crypto = require("crypto");
    process.env.JWT_SECRET = crypto.randomBytes(64).toString("hex");
    console.log("[Security] Generated random JWT_SECRET for production");
    console.warn("[Security] Note: JWT tokens will be invalidated on server restart due to dynamic secret");
  } else {
    // Use a constant for development to ensure consistency between server restarts
    process.env.JWT_SECRET = "bettersystems-blog-secret-key-dev";
    console.log("[Security] Using fixed JWT_SECRET for development");
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration - MUST be first middleware to handle preflight requests
const corsOptions = {
  origin: function (origin, callback) {
    // In development/testing, allow all origins for maximum compatibility
    // Only log CORS in debug mode to reduce terminal noise
    if (process.env.DEBUG_CORS === "true") {
      console.log(`[CORS] Request from origin: ${origin || "no origin"}`);
    }
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Cookie"],
  exposedHeaders: ["Content-Length", "X-Refresh-Token", "Set-Cookie"],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight requests for all routes
app.options("*", cors(corsOptions));

// Enhanced debug logging middleware - reduced verbosity to prevent terminal flooding
const requestLogger = (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  // Only log essential request info to reduce terminal noise
  const timestamp = new Date().toISOString();

  // Skip logging for health checks and OPTIONS requests to reduce noise
  if (req.path === "/api/health" || req.method === "OPTIONS") {
    return next();
  }

  // Simple, single-line log for most requests
  console.log(`[${timestamp}] ${req.method} ${req.path}`);

  // Only show detailed logs if DEBUG_VERBOSE is enabled
  if (process.env.DEBUG_VERBOSE === "true") {
    if (Object.keys(req.query).length > 0) {
      console.log(`  Query:`, req.query);
    }
    if (req.method !== "GET" && req.method !== "OPTIONS" && req.body && Object.keys(req.body).length > 0) {
      // Only log body for non-GET requests, and limit size
      const bodyStr = JSON.stringify(req.body);
      if (bodyStr.length < 500) {
        console.log(`  Body:`, req.body);
      } else {
        console.log(`  Body: [too large to log, ${bodyStr.length} chars]`);
      }
    }
  }

  next();
};

// Parse cookies
app.use(cookieParser());

// Parse JSON body - skip for OPTIONS requests
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      // Store the raw body for debugging if needed
      (req as any).rawBody = buf.toString();
    },
  })
);

// Add middleware to handle JSON parsing errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && "body" in err) {
    console.error("[JSON Parse Error]", {
      error: err.message,
      path: req.path,
      method: req.method,
      contentType: req.headers["content-type"],
      time: new Date().toISOString(),
    });
    return res.status(400).json({
      success: false,
      error: "Invalid JSON",
      message: "The request body contains invalid JSON",
    });
  }
  next(err);
});

// Apply request logger after body parsing
app.use(requestLogger);

// Development vs Production static file serving
const isDevelopment = process.env.NODE_ENV !== "production";
const staticDir = join(dirname(__dirname), "dist/public");

if (isDevelopment) {
  // In development, Vite handles the frontend and proxies /api requests to this server
  // The server should ONLY handle API requests - users access the app via Vite at port 5173
  console.log(`[Development Mode] Server handles API requests only`);
  console.log(`[Development Mode] Access the app at http://localhost:5173`);
} else {
  // Production: serve static files
  console.log(`[Production Mode] Serving static files from: ${staticDir}`);
  console.log(`[Static Files] Directory exists: ${existsSync(staticDir)}`);
  app.use(express.static(staticDir));
}

// Health check endpoint with detailed response
app.get("/api/health", (_req, res) => {
  const health = {
    status: "healthy",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    port: PORT,
    nodeVersion: process.version,
    ...(isDevelopment ? {} : { staticDir, staticDirExists: existsSync(staticDir) }),
  };
  res.json(health);
});

// Register API routes
registerRoutes(app);

// SPA fallback only needed in production (development uses Vite proxy)
if (!isDevelopment) {
  app.get("*", (req, res, next) => {
    // Skip API routes to avoid conflicts
    if (req.url.startsWith("/api/")) {
      return next();
    }
    res.sendFile(join(staticDir, "index.html"));
  });
}

// Enhanced error handling
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server Error]", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    time: new Date().toISOString(),
  });
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    path: req.path,
  });
});

// Create and start server with explicit host binding
const server = createServer(app);

try {
  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Server] Process ID: ${process.pid}`);
  });
} catch (error) {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Server] Received SIGTERM signal. Starting graceful shutdown...");
  server.close(() => {
    console.log("[Server] Server closed successfully");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[Server] Received SIGINT signal. Starting graceful shutdown...");
  server.close(() => {
    console.log("[Server] Server closed successfully");
    process.exit(0);
  });
});

// Unhandled error logging
process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
});
