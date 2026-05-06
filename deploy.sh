#!/bin/bash
set -e

echo "==> Installation des dépendances..."
npm install --production=false

echo "==> Build du projet..."
npm run build

echo "==> Déploiement terminé. Redémarre l'application Node.js dans Plesk."
