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

# Preflight: some local networks cannot reach the SaveinCloud gate while the site is up for everyone
# else (14 October 2026, Cirion AS11415 route). Say which case it is, instead of a 75 s rsync timeout.
host=${BIPE_DEPLOY_TARGET#*@}
# macOS nc limits the connect time with -G; -w there only limits idle time after connect.
if [ "$(uname)" = Darwin ]; then wait_flag=-G; else wait_flag=-w; fi
if ! nc -z "$wait_flag" 8 "$host" "$BIPE_DEPLOY_PORT" 2>/dev/null; then
  echo "cannot reach $host:$BIPE_DEPLOY_PORT from this network." >&2
  if curl -fsS -m 10 -o /dev/null https://bipe.chat/; then
    echo "bipe.chat answers from here, so only the deploy gate is blocked." >&2
  else
    echo "bipe.chat does not answer from here either. Check from outside: https://check-host.net/check-http?host=https://bipe.chat" >&2
  fi
  echo "Deploy from GitHub instead (ships main only): gh workflow run deploy.yml -R bipe-chat/bipe-web" >&2
  exit 1
fi

rsync -az -e "ssh -i $BIPE_DEPLOY_KEY -o IdentitiesOnly=yes -p $BIPE_DEPLOY_PORT" \
  dist/ "$BIPE_DEPLOY_TARGET:/opt/bipe-infra/compose/site/"
echo "deployed to bipe.chat"
