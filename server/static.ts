import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // ── Fichiers statiques (JS, CSS, assets) ──────────────────────────────────
  app.use(express.static(distPath));

  const rawAdminSecret = process.env.ADMIN_SECRET_PATH?.trim();
  const adminPath = rawAdminSecret ? `/${rawAdminSecret}` : "/admin";
  const isProtected = !!rawAdminSecret && rawAdminSecret !== "admin";

  // ── Bloquer l'ancienne route /admin si un chemin secret est configuré ──────
  // Retourne une réponse 404 générique sans aucune information sur l'app.
  if (isProtected) {
    app.use(/^\/(admin)(\/.*)?$/, (_req, res) => {
      res.status(404).send("Not Found");
    });
  }

  // ── Lire index.html une seule fois, injecter le chemin admin secret ────────
  // Le secret est injecté côté serveur au moment de la requête.
  // Il n'est JAMAIS inclus dans le bundle JS compilé.
  const indexHtmlPath = path.resolve(distPath, "index.html");
  const rawIndexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
  const injectedHtml = rawIndexHtml.replace(
    "</head>",
    `<script>window.__ADMIN_PATH__="${adminPath}";</script></head>`,
  );

  // ── SPA fallback — toutes les autres routes ───────────────────────────────
  app.use("*", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(injectedHtml);
  });
}
