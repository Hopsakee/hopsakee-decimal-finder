#!/bin/bash
# Reference copy. The script that actually runs on the server is
# hopsakee-server/server_setup/deploy-hopsakee-decimal-finder.sh — keep the two
# in sync; this one exists so the deploy contract lives next to the app it
# deploys, per CLAUDE.md.
ADIR="$HOME/apps"
IDIR="$ADIR/hopsakee-decimal-finder"
CDIR="$HOME/hopsakee-server/config/hopsakee-decimal-finder"

source "$HOME/hopsakee-server/server_setup/utils.sh"

if [ -d "$IDIR" ]; then
  git -C "$IDIR" fetch origin && git -C "$IDIR" reset --hard "${DEPLOY_SHA:-origin/main}"
else
  cd "$ADIR" && git clone https://github.com/Hopsakee/hopsakee-decimal-finder.git
fi

# Prerequisite, once per box (or whenever base/node-static.Dockerfile changes):
#   cd "$HOME/hopsakee-server" && docker build -t node-static-base:20 -f base/node-static.Dockerfile base/

cd "$CDIR" || { echo "deploy-hopsakee-decimal-finder: cannot cd to $CDIR" >&2; exit 1; }
docker compose up --build -d
wait_healthy

reload_caddy
