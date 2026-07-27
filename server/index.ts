import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, loadBlockedUsersCache } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { initializeAdminAccount } from "./init-admin";
import { initializeOmnipayServices } from "./init-omnipay";
import { testDatabaseConnection, isDatabaseConnected, startBackgroundReconnection, pool } from "./db";
import { notifySystemError, notifyDailyReport } from "./telegram";
import { sendDailyBackupReport } from "./backup-report";
import { refreshBlacklistCache } from "./blacklist-check";
import { storage } from "./storage";
import { getCredential } from "./credentials";
import { blockSensitivePaths } from "./security";

const app = express();
const httpServer = createServer(app);

async function initializePartnerTables() {
  if (!pool) return;
  const client = await pool.getConnection();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name TEXT NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT,
        slug VARCHAR(255) NOT NULL UNIQUE,
        logo TEXT,
        description TEXT,
        website TEXT,
        api_key VARCHAR(255) NOT NULL UNIQUE,
        api_secret TEXT NOT NULL,
        commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 5,
        balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
        webhook_url TEXT,
        callback_url TEXT,
        primary_color VARCHAR(50) DEFAULT '#0070F3',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMP NULL
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partner_id INT NOT NULL REFERENCES partners(id),
        action ENUM('login','logout','profile_update','api_call','payment_received','error','system') NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partner_id INT NOT NULL REFERENCES partners(id),
        reference VARCHAR(255) NOT NULL UNIQUE,
        amount DECIMAL(15, 2) NOT NULL,
        fee DECIMAL(15, 2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
        status ENUM('pending','queued','processing','provider_pending','completed','failed','reversed','cancelled') NOT NULL DEFAULT 'pending',
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
        completed_at TIMESTAMP NULL
      )
    `);
    try { await client.query(`ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS partner_id INT;`); } catch (_) {}
    try { await client.query(`ALTER TABLE payment_links MODIFY COLUMN user_id INT NULL;`); } catch (_) {}
    try { await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS allowed_countries TEXT;`); } catch (_) {}
    try { await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS allowed_operators TEXT;`); } catch (_) {}
    try { await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS enable_deposit BOOLEAN NOT NULL DEFAULT TRUE;`); } catch (_) {}
    try { await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS enable_withdrawal BOOLEAN NOT NULL DEFAULT TRUE;`); } catch (_) {}
    try { await client.query(`ALTER TABLE partners ADD COLUMN IF NOT EXISTS enable_payment_links BOOLEAN NOT NULL DEFAULT TRUE;`); } catch (_) {}
    try { await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS admin_note TEXT;`); } catch (_) {}
    try { await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS api_sdk_enabled BOOLEAN NOT NULL DEFAULT FALSE;`); } catch (_) {}
    try { await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS api_redirect_enabled BOOLEAN NOT NULL DEFAULT FALSE;`); } catch (_) {}
    try { await client.query(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS api_type VARCHAR(50) NOT NULL DEFAULT 'redirect';`); } catch (_) {}
    try { await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_deposit_fee_rate DECIMAL(5,2);`); } catch (_) {}
    try { await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_withdrawal_fee_rate DECIMAL(5,2);`); } catch (_) {}
    try { await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_api_payment_fee_rate DECIMAL(5,2);`); } catch (_) {}
    try { await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_api_sdk_fee_rate DECIMAL(5,2);`); } catch (_) {}
    try { await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_personal_fee_rate DECIMAL(5,2);`); } catch (_) {}
    try { await client.query(`ALTER TABLE leekpay_payments ADD COLUMN IF NOT EXISTS payer_country TEXT;`); } catch (_) {}
    try { await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payer_country TEXT;`); } catch (_) {}
    try { await client.query(`ALTER TABLE api_transactions ADD COLUMN IF NOT EXISTS payer_country TEXT;`); } catch (_) {}
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partner_id INT NOT NULL REFERENCES partners(id),
        country_code VARCHAR(10) NOT NULL,
        country_name TEXT NOT NULL,
        currency VARCHAR(10) NOT NULL,
        balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_wallet_exchanges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partner_id INT NOT NULL REFERENCES partners(id),
        from_wallet_id INT NOT NULL REFERENCES partner_wallets(id),
        to_wallet_id INT NOT NULL REFERENCES partner_wallets(id),
        from_country_code TEXT NOT NULL,
        to_country_code TEXT NOT NULL,
        currency VARCHAR(10) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        fee_rate DECIMAL(5, 2),
        fee_amount DECIMAL(15, 2),
        net_amount DECIMAL(15, 2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    log("Partner tables initialized successfully", "init");
  } catch (error) {
    log(`Partner tables initialization error: ${(error as Error).message}`, "init");
  } finally {
    client.release();
  }
}

async function initializeSecurityTables() {
  if (!pool) return;
  const client = await pool.getConnection();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL UNIQUE,
        reason TEXT,
        blocked_by INT,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email_or_phone TEXT NOT NULL,
        ip_address TEXT,
        success BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        type TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_codes_v2 (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        code       TEXT NOT NULL,
        type       TEXT NOT NULL,
        token      VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at    TIMESTAMP NULL,
        ip_address TEXT,
        metadata   TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    try { await client.query(`CREATE INDEX idx_otpv2_token   ON otp_codes_v2(token)`); } catch (_) {}
    try { await client.query(`CREATE INDEX idx_otpv2_expires ON otp_codes_v2(expires_at)`); } catch (_) {}
    try { await client.query(`ALTER TABLE otp_codes_v2 ADD COLUMN IF NOT EXISTS used_at    TIMESTAMP NULL;`); } catch (_) {}
    try { await client.query(`ALTER TABLE otp_codes_v2 ADD COLUMN IF NOT EXISTS ip_address TEXT;`); } catch (_) {}
    try { await client.query(`ALTER TABLE otp_codes_v2 ADD COLUMN IF NOT EXISTS metadata   TEXT;`); } catch (_) {}
    log("Security tables initialized successfully (otp_codes_v2)", "init");
  } catch (error) {
    log(`Security tables initialization error: ${(error as Error).message}`, "init");
  } finally {
    client.release();
  }
}

async function initializeAuthTables() {
  if (!pool) return;
  const client = await pool.getConnection();
  try {
    try { await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;`); } catch (_) {}
    // Backfill : marquer les utilisateurs existants (sans OTP en attente) comme vérifiés
    await client.query(`
      UPDATE users u SET email_verified = true
      WHERE u.email_verified = false
        AND NOT EXISTS (
          SELECT 1 FROM otp_codes_v2 o
          WHERE o.user_id = u.id AND o.type = 'email_verification'
        )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS trusted_devices (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id      INT NOT NULL,
        device_token VARCHAR(255) NOT NULL UNIQUE,
        user_agent   TEXT,
        ip_address   TEXT,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    try { await client.query(`CREATE INDEX idx_trusted_devices_user  ON trusted_devices(user_id)`); } catch (_) {}
    try { await client.query(`CREATE INDEX idx_trusted_devices_token ON trusted_devices(device_token)`); } catch (_) {}
    log("Auth tables initialized (email_verified, trusted_devices)", "init");
  } catch (error) {
    log(`Auth tables initialization error: ${(error as Error).message}`, "init");
  } finally {
    client.release();
  }
}

async function initializeBlacklistTables() {
  if (!pool) return;
  const client = await pool.getConnection();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS phone_blacklist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(50) NOT NULL UNIQUE,
        reason TEXT,
        added_by INT REFERENCES users(id),
        added_by_name TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    try { await client.query(`CREATE INDEX idx_blacklist_phone ON phone_blacklist(phone_number)`); } catch (_) {}
    await client.query(`
      CREATE TABLE IF NOT EXISTS blacklist_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        admin_id INT,
        admin_name TEXT,
        ip_address TEXT,
        details TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    try { await client.query(`ALTER TABLE kyc_requests ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL;`); } catch (_) {}
    try { await client.query(`ALTER TABLE kyc_requests ADD COLUMN IF NOT EXISTS archived_by INT;`); } catch (_) {}
    await refreshBlacklistCache();
    log("Blacklist tables initialized successfully", "init");
  } catch (error) {
    log(`Blacklist tables initialization error: ${(error as Error).message}`, "init");
  } finally {
    client.release();
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ── Block access to source code / config files — must be FIRST ──────────────
app.use(blockSensitivePaths);

// ── Security headers on every response (including /api/health and static) ──
app.use((_req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.setHeader("Server", "sendavapay");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  next();
});

// ── CORS — Bloquer les requêtes cross-origin non autorisées ──────────────────
// Les webhooks passerelles (PayDunya, SoleasPay, etc.) sont des appels
// serveur-à-serveur : ils n'envoient pas d'en-tête Origin → non concernés.
const CORS_ALLOWED_ORIGINS = new Set([
  "https://sendavapay.com",
  "https://www.sendavapay.com",
]);

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (!origin) return next(); // appel serveur-à-serveur (webhook, curl) — aucun Origin

  const isDev = process.env.NODE_ENV !== "production";
  const isAllowed =
    CORS_ALLOWED_ORIGINS.has(origin) ||
    (isDev && (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.endsWith(".replit.dev") ||
      origin.endsWith(".repl.co")
    ));

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Vary", "Origin");
  } else {
    console.warn(`[CORS] ⛔ Origine bloquée: ${origin} → ${req.method} ${req.path}`);
    // On ne positionne pas Access-Control-Allow-Origin → le navigateur bloque la réponse
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(isAllowed ? 204 : 403);
  }

  next();
});

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
        initializeSecurityTables(),
        20000,
        "Security tables"
      );

      await initializeWithTimeout(
        initializeAuthTables(),
        20000,
        "Auth tables"
      );

      await initializeWithTimeout(
        initializePartnerTables(),
        20000,
        "Partner tables"
      );

      await initializeWithTimeout(
        initializeBlacklistTables(),
        20000,
        "Blacklist tables"
      );

      await initializeWithTimeout(
        loadBlockedUsersCache(),
        10000,
        "Blocked users cache"
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
      // Envoi du rapport PDF de sauvegarde à minuit
      try {
        await sendDailyBackupReport();
      } catch (err) {
        log(`Backup PDF error: ${err}`, "backup");
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
