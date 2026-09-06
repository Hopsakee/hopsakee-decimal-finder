# Deploy contract — hopsakee-decimal-finder

This is "Johnny Decimal Finder" (formerly the `findjd` Lovable project /
`Hopsakee/findjd` repo), ported off Lovable hosting onto the hopsakee.top
Hetzner box. It is the Tier-A (static, zero-backend) pilot from
`lovable-porting/MIGRATION-PLAN.md`.

## What this app is

- Vite + React + TypeScript + shadcn/ui, `vite-plugin-pwa` (installable PWA).
- **Zero backend.** All data lives in the browser's `localStorage`. The only
  network call the app makes at runtime is an *optional* direct
  `api.github.com` call (`src/lib/githubSync.ts`) using a GitHub Personal
  Access Token the user pastes in themselves — that token never touches this
  server, and there is no Supabase, no database, nothing to migrate.
- No `VITE_*` build-time env vars are used anywhere in this app (verified:
  `grep -rn "import.meta.env"` and `grep -rn "VITE_"` both come up empty). The
  "Vite bakes env vars in at build time" trap in PORTING-PLAYBOOK.md does not
  apply to this app — don't assume it's been exercised by this port.
- `lovable-tagger` (dev-only Vite plugin, gated behind `mode === "development"`
  in `vite.config.ts`) resolves fine from the public npm registry outside
  Lovable's platform — verified via a clean `npm install`.

## Build

```bash
# once per box, or whenever hopsakee-server/base/node-static.Dockerfile changes
cd ~/hopsakee-server && docker build -t node-static-base:20 -f base/node-static.Dockerfile base/

# this app
docker build -t hopsakee-decimal-finder .
```

Two-stage Dockerfile: a throwaway `node:22-slim` stage runs `npm ci && npm run
build`, then the static `dist/` is copied into `node-static-base:20` (Caddy,
non-root UID 1001, healthcheck — all defined once in hopsakee-server/base/,
not repeated per app).

## Serving

Caddy inside the container (`Caddyfile` at repo root) serves `/srv/app` on
`:8080`:
- `/index.html`, `/sw.js`, `/manifest.webmanifest`, `/registerSW.js`, and `/`
  itself get `Cache-Control: no-cache` — required for the PWA service worker
  (`registerType: autoUpdate`) to pick up a new deploy instead of serving a
  stale shell to a returning visitor. **Caddy's `path` matcher checks the
  original request URI, not what `try_files` rewrites it to** — `/` must be
  listed explicitly alongside `/index.html`, or root requests silently skip
  the header. Verified by curl; see Caddyfile comment.
- `/assets/*` (Vite's content-hashed JS/CSS) get a 1-year immutable
  Cache-Control — safe, since their filename changes whenever their content
  does.
- `*.wasm` gets `Content-Type: application/wasm` explicitly. **Unexercised by
  this app** — it doesn't ship any `.wasm` — so this is defensive, not
  verified end-to-end here.
- `try_files {path} /index.html` — SPA fallback for `BrowserRouter`. The app
  only really has one route (`/`, everything else is a client-side 404), so
  this matters more for correctness than for any real deep link.

## Deploy on the server

`hopsakee-server/server_setup/deploy-hopsakee-decimal-finder.sh`, wired into
`server-deploy.sh`'s "can fail independently" block. Public app — Caddy block
has no `authelia_forward_auth`/`logout` import (see `caddy-snippet.txt`).

**Naming note**, since it isn't obvious: the GitHub repo, container/service
name, and deploy-script name are all `hopsakee-decimal-finder` (matching the
pkw-web precedent, where the repo/container name and the public subdomain are
allowed to differ), but the public subdomain is the shorter `hd.hopsakee.top`
— that was an explicit choice by Jelle during this port, not the
`<repo-name>.hopsakee.top` default in PORTING-PLAYBOOK.md.

## Known limitations from this port

- Docker build/run/healthcheck were verified in a sandboxed CI-like session
  whose egress proxy TLS-intercepts all container-internal traffic; a
  temporary CA-trust layer (never committed) was needed to get `npm ci`
  working inside the build container there. The real Hetzner box has
  ordinary, non-intercepted internet access and does not need this — see
  `lovable-porting/learnings/hopsakee-decimal-finder.md` for the full story.
