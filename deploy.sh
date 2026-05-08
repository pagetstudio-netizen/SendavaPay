#!/bin/bash
set -e

echo "==> Installation des dépendances..."
npm install --production=false

echo "==> Compilation du projet..."
npm run build

echo "==> Déploiement terminé avec succès."
echo "    Redémarrez maintenant l'application Node.js dans Plesk."
