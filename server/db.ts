import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

let dbConnected = false;
export let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (!databaseUrl) {
  console.error("SUPABASE_DATABASE_URL is not configured. Database features will be unavailable.");
} else {
  pool = new Pool({
    connectionString: databaseUrl,
    max: 8,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    ssl: { rejectUnauthorized: false },
  });

  db = drizzle(pool, { schema });
  dbConnected = true;

  // Keep connection alive with periodic ping every 30 seconds
  setInterval(async () => {
    if (pool) {
      try {
        await pool.query("SELECT 1");
        dbConnected = true;
      } catch (err) {
        console.error("[db] keepalive ping failed:", (err as Error).message);
        dbConnected = false;
      }
    }
  }, 30000);
}

export { db };

export function isDatabaseConnected(): boolean {
  return dbConnected;
}

export async function testDatabaseConnection(): Promise<boolean> {
  if (!pool) return false;
  try {
    await pool.query("SELECT 1");
    dbConnected = true;
    console.log("[db] Connection test successful");
    return true;
  } catch (err) {
    console.error("[db] Connection test failed:", (err as Error).message);
    dbConnected = false;
    return false;
  }
}

export function startBackgroundReconnection(): void {
  const interval = setInterval(async () => {
    if (dbConnected) {
      clearInterval(interval);
      return;
    }
    console.log("[db] Attempting background reconnection...");
    const ok = await testDatabaseConnection();
    if (ok) {
      console.log("[db] Background reconnection successful");
      clearInterval(interval);
    }
  }, 15000);
}
