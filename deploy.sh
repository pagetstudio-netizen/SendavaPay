#!/bin/bash
set -e

echo "=========================================="
echo "  SendavaPay — Deploy $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

echo ""
echo "[1/2] Installation des dépendances..."
npm install --omit=dev

echo ""
echo "[2/2] Redémarrage PM2..."
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
