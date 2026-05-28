#!/bin/bash
set -e

echo "=========================================="
echo "  SendavaPay — Deploy $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

echo ""
echo "[1/3] Installation des dépendances..."
npm install --include=dev

echo ""
echo "[2/3] Build de l'application..."
npm run build

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
