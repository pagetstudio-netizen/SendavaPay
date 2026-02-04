import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.SUPABASE_DATABASE_URL;

let dbConnected = false;
let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (!databaseUrl) {
  console.error("SUPABASE_DATABASE_URL is not configured. Database features will be unavailable.");
} else {
  pool = new Pool({ 
    connectionString: databaseUrl,
    max: 10,
    min: 2,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Database pool error:', err.message);
    dbConnected = false;
  });

  pool.on('connect', () => {
    dbConnected = true;
  });

  db = drizzle(pool, { schema });
  
  dbConnected = true;
  
  // Keep connection alive with periodic ping every 30 seconds
  setInterval(async () => {
    if (pool) {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        dbConnected = true;
      } catch (err) {
        console.error('Database keepalive failed:', (err as Error).message);
        dbConnected = false;
      }
    }
  }, 30000);
}

export { pool, db };

export function isDatabaseConnected(): boolean {
  return pool !== null && dbConnected;
}

export function setDatabaseConnected(connected: boolean): void {
  dbConnected = connected;
}

export async function testDatabaseConnection(retries = 3, delayMs = 2000): Promise<boolean> {
  if (!pool) {
    console.error('Database pool not initialized - SUPABASE_DATABASE_URL may be missing');
    dbConnected = false;
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbConnected = true;
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt}/${retries} failed:`, (error as Error).message);
      dbConnected = false;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  return false;
}
