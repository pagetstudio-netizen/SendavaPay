import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { initializeAdminAccount } from "./init-admin";
import { testDatabaseConnection, isDatabaseConnected, startBackgroundReconnection, pool } from "./db";
import { notifyStartup } from "./telegram";

const app = express();
const httpServer = createServer(app);

async function initializePartnerTables() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE partner_status AS ENUM ('active', 'inactive', 'suspended');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE partner_log_action AS ENUM ('login', 'logout', 'profile_update', 'api_call', 'payment_received', 'error', 'system');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT,
        description TEXT,
        website TEXT,
        api_key TEXT NOT NULL UNIQUE,
        api_secret TEXT NOT NULL,
        commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 5,
        balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        status partner_status NOT NULL DEFAULT 'active',
        webhook_url TEXT,
        callback_url TEXT,
        primary_color TEXT DEFAULT '#0070F3',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_logs (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        partner_id INTEGER NOT NULL REFERENCES partners(id),
        action partner_log_action NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE api_transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_transactions (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        partner_id INTEGER NOT NULL REFERENCES partners(id),
        reference TEXT NOT NULL UNIQUE,
        amount DECIMAL(15, 2) NOT NULL,
        fee DECIMAL(15, 2) NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'XOF',
        status api_transaction_status NOT NULL DEFAULT 'pending',
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        payment_method TEXT,
        description TEXT,
        callback_url TEXT,
        redirect_url TEXT,
        metadata TEXT,
        webhook_sent BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
      );
    `);
    await client.query(`ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS partner_id INTEGER;`);
    await client.query(`ALTER TABLE payment_links ALTER COLUMN user_id DROP NOT NULL;`);
    await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS allowed_countries TEXT;`);
    await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS allowed_operators TEXT;`);
    await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS enable_deposit BOOLEAN NOT NULL DEFAULT TRUE;`);
    await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS enable_withdrawal BOOLEAN NOT NULL DEFAULT TRUE;`);
    await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS enable_payment_links BOOLEAN NOT NULL DEFAULT TRUE;`);
    log("Partner tables initialized successfully", "init");
  } catch (error) {
    log(`Partner tables initialization error: ${(error as Error).message}`, "init");
  } finally {
    client.release();
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: isDatabaseConnected() ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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

      log(logLine);
    }
  });

  next();
});

async function initializeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  name: string
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => {
        log(`${name} initialization timed out after ${timeoutMs}ms`, "init");
        resolve(null);
      }, timeoutMs);
    }),
  ]);
}

(async () => {
  const port = parseInt(process.env.PORT || "5000", 10);

  try {
    const dbConnected = await initializeWithTimeout(
      testDatabaseConnection(),
      45000,
      "Database"
    );
    
    if (dbConnected) {
      log("Database connection successful", "init");
      
      await initializeWithTimeout(
        initializePartnerTables(),
        20000,
        "Partner tables"
      );

      await initializeWithTimeout(
        initializeAdminAccount(),
        20000,
        "Admin account"
      );
    } else {
      log("Database connection failed or timed out, starting background reconnection...", "init");
    }
    
    // Always start background reconnection to recover from disconnects
    startBackgroundReconnection();
    
  } catch (error) {
    log(`Initialization error: ${(error as Error).message}`, "init");
    startBackgroundReconnection();
  }

  await registerRoutes(httpServer, app);

  app.get("/api-docs", (_req, res) => {
    res.redirect(301, "/docs");
  });
  app.get("/merchant/dashboard", (_req, res) => {
    res.redirect(301, "/dashboard/api-keys");
  });
  app.get("/merchant", (_req, res) => {
    res.redirect(301, "/dashboard/api-keys");
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      notifyStartup().catch(err => log(`Telegram startup notification failed: ${err}`, "telegram"));
    },
  );
})();
