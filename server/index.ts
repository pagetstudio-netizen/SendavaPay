import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { initializeAdminAccount } from "./init-admin";
import { testDatabaseConnection, isDatabaseConnected, startBackgroundReconnection } from "./db";
import { notifyStartup } from "./telegram";

const app = express();
const httpServer = createServer(app);

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
