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

echo ""
echo "[1/3] Installation des dépendances..."
npm install --omit=dev
# sharp uses native binaries — must be rebuilt for the target platform
npm rebuild sharp 2>/dev/null || true

echo ""
echo "[2/3] Migration base de données..."
psql "$DB_URL" -f migrate.sql
echo "  Migration appliquée"

echo ""
echo "[3/3] Redémarrage PM2..."
if pm2 describe sendavapay > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --update-env
  echo "  PM2 rechargé (zero-downtime)"
else
  pm2 start ecosystem.config.js
  echo "  PM2 démarré"
fi

pm2 save

echo ""
echo "=========================================="
echo "  Deploy terminé avec succès"
echo "=========================================="
