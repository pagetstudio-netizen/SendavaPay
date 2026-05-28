import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { initializeAdminAccount } from "./init-admin";
import { initializeOmnipayServices } from "./init-omnipay";
import { testDatabaseConnection, isDatabaseConnected, startBackgroundReconnection, pool } from "./db";
import { notifySystemError, notifyDailyReport } from "./telegram";
import { storage } from "./storage";
import { loadCredentialsFromDb, getCredential } from "./credentials";

const app = express();
const httpServer = createServer(app);

async function initializePartnerTables() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    try {
      await client.query(`ALTER TYPE withdrawal_request_status ADD VALUE IF NOT EXISTS 'processing';`);
    } catch (e) { /* already exists */ }
    try {
      await client.query(`ALTER TYPE withdrawal_request_status ADD VALUE IF NOT EXISTS 'failed';`);
    } catch (e) { /* already exists */ }
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
    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS admin_note TEXT;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS api_sdk_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS api_redirect_enabled BOOLEAN NOT NULL DEFAULT FALSE;`);
    await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS api_type TEXT NOT NULL DEFAULT 'redirect';`);
    log("Partner tables initialized successfully", "init");
  } catch (error) {
    log(`Partner tables initialization error: ${(error as Error).message}`, "init");
  } finally {
    client.release();
  }
}

async function initializeSecurityTables() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        ip_address TEXT NOT NULL UNIQUE,
        reason TEXT,
        blocked_by INTEGER,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email_or_phone TEXT NOT NULL,
        ip_address TEXT,
        success BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id INTEGER,
        type TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    // ── otp_codes_v2 : table OTP avec schéma correct, créée proprement ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_codes_v2 (
        id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id    INTEGER NOT NULL,
        code       TEXT    NOT NULL,
        type       TEXT    NOT NULL,
        token      TEXT    NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at    TIMESTAMP,
        ip_address TEXT,
        metadata   TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_otpv2_token   ON otp_codes_v2(token);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_otpv2_expires ON otp_codes_v2(expires_at);`);
    await client.query(`ALTER TABLE otp_codes_v2 ADD COLUMN IF NOT EXISTS used_at    TIMESTAMP;`);
    await client.query(`ALTER TABLE otp_codes_v2 ADD COLUMN IF NOT EXISTS ip_address TEXT;`);
    await client.query(`ALTER TABLE otp_codes_v2 ADD COLUMN IF NOT EXISTS metadata   TEXT;`);
    log("Security tables initialized successfully (otp_codes_v2)", "init");
  } catch (error) {
    log(`Security tables initialization error: ${(error as Error).message}`, "init");
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
  let timerId: NodeJS.Timeout;
  const timeoutPromise = new Promise<null>((resolve) => {
    timerId = setTimeout(() => {
      log(`${name} initialization timed out after ${timeoutMs}ms`, "init");
      resolve(null);
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId!);
  });
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
        loadCredentialsFromDb((key) => storage.getSetting(key)),
        10000,
        "Credentials"
      );

      await initializeWithTimeout(
        initializeSecurityTables(),
        20000,
        "Security tables"
      );

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

      await initializeWithTimeout(
        initializeOmnipayServices(),
        20000,
        "OmniPay services"
      );

      // Backfill default wallets for all existing users (idempotent)
      initializeWithTimeout(
        (async () => {
          const allUsers = await storage.getAllUsers();
          const nonAdmins = allUsers.filter(u => u.role !== "admin");
          let created = 0;
          for (const u of nonAdmins) {
            const wallets = await storage.createDefaultWallets(u.id);
            created += wallets.length;
          }
          log(`Default wallets backfill: ${nonAdmins.length} users processed`, "init");
        })(),
        60000,
        "Wallet backfill"
      ).catch(err => log(`Wallet backfill error: ${err}`, "init"));

      // Backfill default wallets for all existing partners (idempotent)
      initializeWithTimeout(
        (async () => {
          const allPartners = await storage.getAllPartners();
          for (const p of allPartners) {
            await storage.createDefaultPartnerWallets(p.id);
          }
          log(`Default partner wallets backfill: ${allPartners.length} partners processed`, "init");
        })(),
        60000,
        "Partner wallet backfill"
      ).catch(err => log(`Partner wallet backfill error: ${err}`, "init"));

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

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ===== Arrêt gracieux — permet à Plesk/PM2 de redémarrer proprement =====
  let isShuttingDown = false;

  async function gracefulShutdown(signal: string) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    log(`${signal} reçu — arrêt gracieux en cours...`, "init");

    // Stoppe les nouvelles connexions HTTP
    httpServer.close(() => {
      log("Serveur HTTP fermé proprement", "init");
    });

    // Ferme le pool de connexions DB
    if (pool) {
      pool.end().catch((err: Error) => log(`Erreur fermeture pool DB: ${err.message}`, "init"));
    }

    // Force l'arrêt après 5 secondes — sans .unref() pour que ça s'exécute vraiment
    setTimeout(() => {
      log("Arrêt forcé après timeout", "init");
      process.exit(0);
    }, 5000);
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT",  () => gracefulShutdown("SIGINT"));

  // ===== Alertes erreurs système — ne pas crasher sur exceptions non gérées =====
  process.on("uncaughtException", (err) => {
    try {
      log(`Uncaught exception: ${err.message}`, "error");
      notifySystemError("uncaughtException", err.message || String(err));
    } catch (_) {}
  });

  process.on("unhandledRejection", (reason) => {
    try {
      const msg = reason instanceof Error ? reason.message : String(reason);
      log(`Unhandled rejection: ${msg}`, "error");
      notifySystemError("unhandledRejection", msg);
    } catch (_) {}
  });
  // Note: le keepalive DB est déjà géré dans db.ts (ping toutes les 30s) — pas besoin d'un second ici

  // ===== Daily report scheduler (T006) =====
  function scheduleDailyReport() {
    const lomeNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lome" }));
    const lomeMidnight = new Date(lomeNow);
    lomeMidnight.setDate(lomeMidnight.getDate() + 1);
    lomeMidnight.setHours(0, 0, 0, 0);
    const delayMs = lomeMidnight.getTime() - lomeNow.getTime();

    setTimeout(async () => {
      try {
        const stats = await storage.getStats();
        const platformBalance = await storage.getPlatformBalance();
        await notifyDailyReport({
          totalUsers: stats.totalUsers,
          totalDeposits: stats.totalDeposits,
          totalWithdrawals: stats.totalWithdrawals,
          totalTransactionsCount: stats.totalTransactionsCount,
          totalTransactionsAmount: stats.totalTransactionsAmount,
          totalCommissions: stats.totalCommissions,
          platformBalance: platformBalance?.totalBalance,
        });
        log("Daily report sent to Telegram", "telegram");
      } catch (err) {
        log(`Daily report error: ${err}`, "telegram");
      }
      scheduleDailyReport();
    }, delayMs);

    const hours = Math.floor(delayMs / 3600000);
    const minutes = Math.floor((delayMs % 3600000) / 60000);
    log(`Daily report scheduled in ${hours}h${minutes}m`, "telegram");
  }

  // ===== Register Telegram webhook (T006) =====
  async function registerTelegramWebhook() {
    const token = getCredential("TELEGRAM_BOT_TOKEN");
    if (!token) return;
    try {
      const siteUrl = (process.env.SITE_URL || process.env.APP_URL || "https://sendavapay.com").replace(/\/$/, "");
      const webhookUrl = `${siteUrl}/api/webhook/telegram`;
      const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message", "callback_query"] }),
      });
      const data = await res.json() as { ok: boolean; description?: string };
      if (data.ok) {
        log("Telegram webhook registered: " + webhookUrl, "telegram");
      } else {
        log("Telegram webhook registration failed: " + data.description, "telegram");
      }
    } catch (err) {
      log(`Telegram webhook registration error: ${err}`, "telegram");
    }
  }

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      scheduleDailyReport();
      registerTelegramWebhook().catch(err => log(`Telegram webhook setup error: ${err}`, "telegram"));
    },
  );
})();
