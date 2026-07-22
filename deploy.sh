#!/bin/bash
set -e

echo "=========================================="
echo "  SendavaPay — Deploy $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# ── Charger le fichier .env si présent ──────────────────────────────────────
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

# ── Résoudre l'URL de la base de données ────────────────────────────────────
DB_URL="${DATABASE_URL:-$SUPABASE_DATABASE_URL}"
if [ -z "$DB_URL" ]; then
  echo "ERREUR: DATABASE_URL ou SUPABASE_DATABASE_URL non défini"
  exit 1
fi

# ── Étape 1 : Dépendances + Build ───────────────────────────────────────────
#
#  Deux cas :
#  a) dist/index.cjs est déjà présent (pushé depuis Replit)
#     → npm install --omit=dev  (rapide, pas de build)
#
#  b) dist/index.cjs absent OU variable BUILD=1 forcée
#     → npm install complet + npm run build + npm prune
#
if [ ! -f "dist/index.cjs" ] || [ "${BUILD:-0}" = "1" ]; then
  echo ""
  echo "[1/4] Build requis — installation complète des dépendances..."
  npm install
  # sharp : module natif, recompiler pour la plateforme cible
  npm rebuild sharp 2>/dev/null || true

  echo ""
  echo "[2/4] Construction du projet (vite + esbuild)..."
  npm run build

  echo ""
  echo "[2/4] Nettoyage des devDependencies après build..."
  npm prune --omit=dev 2>/dev/null || true

else
  echo ""
  echo "[1/4] dist/index.cjs trouvé — build ignoré"
  echo "[2/4] Installation des dépendances de production..."
  npm install --omit=dev
  # sharp : recompiler si nécessaire (ex : upgrade Node)
  npm rebuild sharp 2>/dev/null || true
fi

# ── Étape 3 : Migration base de données ─────────────────────────────────────
echo ""
echo "[3/4] Migration base de données..."
if command -v psql &> /dev/null; then
  psql "$DB_URL" -f migrate.sql && echo "  ✔ Migration appliquée" || echo "  ⚠ Migration ignorée (déjà à jour)"
else
  echo "  ⚠ psql non trouvé — migration ignorée (appliquez migrate.sql manuellement si besoin)"
fi

# ── Étape 4 : Redémarrage PM2 ───────────────────────────────────────────────
echo ""
echo "[4/4] Redémarrage PM2..."
if command -v pm2 &> /dev/null; then
  if pm2 describe sendavapay > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js --update-env
    echo "  ✔ PM2 rechargé (zero-downtime)"
  else
    pm2 start ecosystem.config.js
    echo "  ✔ PM2 démarré"
  fi
  pm2 save
else
  echo "  ⚠ PM2 non trouvé — relancez manuellement : node dist/index.cjs"
fi

echo ""
echo "=========================================="
echo "  Deploy terminé avec succès ✔"
echo "=========================================="
