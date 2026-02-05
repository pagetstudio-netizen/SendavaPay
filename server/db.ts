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
    max: 15,
    min: 2,
    idleTimeoutMillis: 120000,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5000,
    statement_timeout: 30000,
    query_timeout: 30000,
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

export async function testDatabaseConnection(retries = 5, delayMs = 3000): Promise<boolean> {
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
      console.log(`Database connection successful on attempt ${attempt}`);
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt}/${retries} failed:`, (error as Error).message);
      dbConnected = false;
      if (attempt < retries) {
        const backoffDelay = delayMs * Math.pow(1.5, attempt - 1);
        console.log(`Retrying in ${Math.round(backoffDelay / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  return false;
}

// Background reconnection loop - runs independently
let reconnectInterval: NodeJS.Timeout | null = null;

export function startBackgroundReconnection(): void {
  if (reconnectInterval) return;
  
  reconnectInterval = setInterval(async () => {
    if (!dbConnected && pool) {
      console.log('Attempting background database reconnection...');
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        dbConnected = true;
        console.log('Background reconnection successful!');
      } catch (err) {
        console.error('Background reconnection failed:', (err as Error).message);
      }
    }
  }, 15000);
}
