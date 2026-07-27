import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, cp } from "fs/promises";

// server deps to bundle — bundle everything that is pure-JS so the
// resulting dist/index.cjs is fully self-contained and works on any
// host without running `npm install`.
const allowlist = [
  "@google/generative-ai",
  "@google-cloud/storage",
  "@supabase/supabase-js",  // bundlé pour éviter les crashes si npm install échoue
  "axios",
  "bcryptjs",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pdfkit",
  "pg",
  "@getbrevo/brevo",
  "resend",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
  // sharp est intentionnellement absent (module natif, non bundlable)
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // PDFKit charge ses polices (.afm) et son profil ICC depuis le dossier
  // "data" adjacent à son module. Une fois bundlé dans dist/index.cjs,
  // il les cherche dans dist/data/ — on copie donc ce dossier.
  console.log("copying pdfkit data files → dist/data/ ...");
  await cp(
    "node_modules/pdfkit/js/data",
    "dist/data",
    { recursive: true }
  );
  console.log("done.");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
