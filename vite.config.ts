import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Les plugins Replit ne sont chargés que sur l'environnement Replit
// (REPL_ID présent) et uniquement en mode dev.
// Sur Plesk / CI / production, aucun import Replit n'est effectué.
const isReplitDev =
  typeof process.env.REPL_ID === "string" &&
  process.env.NODE_ENV !== "production";

export default defineConfig({
  plugins: [
    react(),
    ...(isReplitDev
      ? [
          (await import("@replit/vite-plugin-runtime-error-modal")).default(),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
