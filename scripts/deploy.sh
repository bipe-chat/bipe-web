#!/bin/sh
# Copies dist/ over the Caddy site directory: into bipe-infra (so a compose sync carries the same
# files) and onto the dev node. No --delete: privacidade, termos, en/privacy, en/terms and
# .well-known belong to bipe-infra and must stay.
# The node address lives in scripts/deploy.env (git-ignored): BIPE_DEPLOY_TARGET, BIPE_DEPLOY_PORT,
# BIPE_DEPLOY_KEY. See scripts/deploy.env.example.
set -eu
cd "$(dirname "$0")/.."
test -f dist/index.html || { echo "dist/ is empty: run pnpm build" >&2; exit 1; }
test -f scripts/deploy.env || { echo "scripts/deploy.env is missing: copy scripts/deploy.env.example" >&2; exit 1; }
. scripts/deploy.env

rsync -a dist/ ../bipe-infra/compose/site/

rsync -az -e "ssh -i $BIPE_DEPLOY_KEY -o IdentitiesOnly=yes -p $BIPE_DEPLOY_PORT" \
  dist/ "$BIPE_DEPLOY_TARGET:/opt/bipe-infra/compose/site/"
echo "deployed to bipe.chat"
