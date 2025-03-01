import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

// Enhanced database connection handling
const getDatabaseConnection = () => {
  // Check if we have a database URL
  if (!process.env.DATABASE_URL) {
    console.error("WARNING: DATABASE_URL is not set");
    
    // Check if we're in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        "DATABASE_URL must be set in production environment. Database connection failed."
      );
    } else {
      // For development/testing, warn but continue
      console.warn(
        "Running with limited functionality. Some database features may not work."
      );
      // Return a connection string that points to a local Postgres
      // This is just a fallback and won't actually work without a real DB
      return "postgres://postgres:postgres@localhost:5432/postgres";
    }
  }
  
  return process.env.DATABASE_URL;
};

// Initialize database with enhanced error handling
let connectionString: string;
try {
  connectionString = getDatabaseConnection();
  console.log(`[Database] Connecting to database at ${connectionString.substring(0, 10)}...`);
} catch (error: any) {
  console.error("[Database] Failed to get database connection:", error);
  // Re-throw but with a clearer message
  throw new Error(`Database connection failed: ${error.message}`);
}

// Create the database connection
export const db = drizzle({
  connection: connectionString,
  schema,
  ws: ws,
});

console.log("[Database] Database connection initialized successfully");
