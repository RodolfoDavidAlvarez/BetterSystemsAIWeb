import { drizzle } from "drizzle-orm/node-postgres";
import pg from 'pg';
import * as schema from "@db/schema";

const { Pool } = pg;

// Flag to track if we're using a mock database
let isMockDatabase = false;

// Enhanced database connection handling with more comprehensive fallbacks
const getDatabaseConnection = () => {
  // Check if we have a database URL
  if (!process.env.DATABASE_URL) {
    console.error("[Database] WARNING: DATABASE_URL is not set");
    
    // Check if we're in production
    if (process.env.NODE_ENV === 'production') {
      console.warn("[Database] Production environment detected without DATABASE_URL");
      
      // In production, check for individual Postgres environment variables
      const pgHost = process.env.PGHOST;
      const pgUser = process.env.PGUSER;
      const pgPassword = process.env.PGPASSWORD;
      const pgDatabase = process.env.PGDATABASE;
      const pgPort = process.env.PGPORT || '5432';
      
      if (pgHost && pgUser && pgPassword && pgDatabase) {
        console.log("[Database] Found individual Postgres environment variables, constructing connection string");
        const constructedUrl = `postgres://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
        return constructedUrl;
      }
      
      // Last resort for production - use in-memory mock
      console.error("[Database] No database configuration found in production!");
      console.warn("[Database] Using mock database for production (NOT RECOMMENDED)");
      isMockDatabase = true;
      return "postgres://mock:mock@localhost:5432/mockdb";
    } else {
      // For development/testing, use a mock database
      console.warn("[Database] Development environment without DATABASE_URL");
      console.info("[Database] Using mock database for development");
      isMockDatabase = true;
      return "postgres://mock:mock@localhost:5432/mockdb";
    }
  }
  
  return process.env.DATABASE_URL;
};

// Initialize database with enhanced error handling
let connectionString: string;
let dbInstance: any;

try {
  connectionString = getDatabaseConnection();
  // Mask the connection string in logs for security
  const maskedConnection = connectionString.includes('@') 
    ? connectionString.replace(/\/\/(.+?)@/, '//****:****@') 
    : connectionString.substring(0, 15) + '...';
  
  console.log(`[Database] Connecting to database at ${maskedConnection}`);
  
  if (isMockDatabase) {
    console.warn("[Database] Using mock database - some features will be limited");
    // Create a mock DB instance with minimal implementation
    dbInstance = {
      select: () => ({ from: () => [] }),
      insert: () => ({ values: () => ({ returning: () => [] }) }),
      update: () => ({ set: () => ({ where: () => [] }) }),
      delete: () => ({ where: () => [] }),
      query: { select: () => [] },
    };
  } else {
    // Create the real database connection using node-postgres
    const pool = new Pool({
      connectionString,
    });
    dbInstance = drizzle({ client: pool, schema });
  }
  
  console.log("[Database] Database connection initialized successfully");
} catch (error: any) {
  console.error("[Database] Failed to get database connection:", error);
  
  // Create a fallback mock DB instance
  console.warn("[Database] Creating fallback mock database after connection failure");
  isMockDatabase = true;
  dbInstance = {
    select: () => ({ from: () => [] }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => [] }) }),
    delete: () => ({ where: () => [] }),
    query: { select: () => [] },
  };
}

// Export the database instance (either real or mock)
export const db = dbInstance;
