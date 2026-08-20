#!/usr/bin/env sh
set -eu

# À configurer une seule fois dans « Additional deployment actions » sur Plesk :
# sh scripts/plesk-deploy.sh
#
# Le bundle dist/ est versionné : le serveur n'a donc pas besoin des outils de
# build (Vite/tsx) pour démarrer après un Pull & Deploy.
npm ci --omit=dev
test -f dist/index.cjs

echo "Dépendances de production installées et bundle de production vérifié."