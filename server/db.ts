import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

const databaseUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;

let dbConnected = false;
export let pool: mysql.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (!databaseUrl) {
  console.error("MYSQL_DATABASE_URL is not configured. Database features will be unavailable.");
} else {
  pool = mysql.createPool({
    uri: databaseUrl,
    waitForConnections: true,
    connectionLimit: 8,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 5000,
    connectTimeout: 15000,
    multipleStatements: false,
  });

  db = drizzle(pool, { schema, mode: "default" });
  dbConnected = true;

  // Keep connection alive with periodic ping every 30 seconds
  setInterval(async () => {
    if (pool) {
      try {
        const conn = await pool.getConnection();
        await conn.query("SELECT 1");
        conn.release();
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
    const conn = await pool.getConnection();
    await conn.query("SELECT 1");
    conn.release();
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
