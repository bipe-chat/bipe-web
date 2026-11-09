#!/bin/sh
# Deploys bipe.chat when web, shared or app main changes, including parity-only registry updates.
# Runs on mini4p from launchd (scripts/auto-deploy.plist, every 30 minutes) because the GitHub deploy workflow
# cannot reach the gate. launchd runs the copy on origin/main (see the plist), not a checkout.
# Folder: $BIPE_AUTODEPLOY_ROOT (default ~/Dev/Bipe/.site-deploy) holds detached worktrees of bipe-web, bipe-shared,
# bipe-app and bipe-infra at origin/main; the script makes them again when a prune removed them.
# deploy.env: $BIPE_DEPLOY_ENV (default ~/.config/bipe/deploy.env), copied in for the deploy and deleted after.
# After the deploy it records compose/site in a bipe-infra PR and merges it. --force deploys without a change.
set -eu

bipe=${BIPE_HOME:-$HOME/Dev/Bipe}
root=${BIPE_AUTODEPLOY_ROOT:-$bipe/.site-deploy}
env_file=${BIPE_DEPLOY_ENV:-$HOME/.config/bipe/deploy.env}
state=${XDG_STATE_HOME:-$HOME/.local/state}/bipe-site-autodeploy
lock="$state/lock"
mkdir -p "$state" "$root"

# One run at a time. A lock older than 2 hours belongs to a run that died.
if ! mkdir "$lock" 2>/dev/null; then
  if [ -n "$(find "$lock" -maxdepth 0 -mmin +120 2>/dev/null)" ]; then
    rmdir "$lock" && mkdir "$lock"
  else
    echo "$(date '+%F %T') another run holds $lock"
    exit 0
  fi
fi
artifact=
trap 'rm -f "${root:?}/bipe-web/scripts/deploy.env"; if [ -n "$artifact" ]; then rm -rf "$artifact"; fi; rmdir "$lock"' EXIT

for repo in bipe-web bipe-shared bipe-app bipe-infra; do
  # --force: bipe-app moves the mac-preview tag on each preview, and a plain --tags fetch refuses a moved tag.
  git -C "$bipe/$repo" fetch -q --force origin main --tags
  if [ -e "$root/$repo/.git" ]; then
    git -C "$root/$repo" checkout -q --force --detach origin/main
    git -C "$root/$repo" clean -q -fd
  else
    git -C "$bipe/$repo" worktree prune
    git -C "$bipe/$repo" worktree add -q --detach "$root/$repo" origin/main
  fi
done

key=$(node "$root/bipe-web/scripts/site-artifact.mjs" --key)
if [ "${1:-}" != "--force" ] && [ "$key" = "$(cat "$state/deployed" 2>/dev/null)" ]; then
  exit 0
fi
echo "$(date '+%F %T') source changes: $key"

test -f "$env_file" || { echo "missing $env_file (copy of scripts/deploy.env)" >&2; exit 1; }
cd "$root/bipe-web"
artifact=$(mktemp -d "$root/site-artifact.XXXXXX")
node scripts/site-artifact.mjs --out "$artifact"
# This folder belongs to the deployment job. Replace only its generated output.
rm -rf dist
cp -R "$artifact/dist" dist
cp "$env_file" scripts/deploy.env
sh scripts/deploy.sh
rm -f scripts/deploy.env

# Record what the node now serves (bipe-infra holds compose/site).
web=$(git rev-parse --short HEAD)
cd "$root/bipe-infra"
git add -A compose/site
if ! git diff --cached --quiet; then
  branch="site-deploy-$web-$(date +%Y%m%d%H%M)"
  git switch -q -c "$branch"
  git commit -q -s -m "Site: deploy bipe-web $web (source update)" -m "scripts/auto-deploy.sh on $(hostname -s)."
  git push -q origin "$branch"
  gh pr create -R bipe-chat/bipe-infra --base main --head "$branch" \
    --title "Site: deploy bipe-web $web (source update)" \
    --body "Records the CI-built bipe.chat deploy after web, shared or app main changed. Sources: $key."
  gh pr merge "$branch" -R bipe-chat/bipe-infra --squash --delete-branch
  git checkout -q --detach origin/main
  git branch -q -D "$branch"
fi

echo "$key" > "$state/deployed"
echo "$(date '+%F %T') deployed"
