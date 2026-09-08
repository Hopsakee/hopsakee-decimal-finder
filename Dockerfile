# Prerequisite (built once, on the server, per hopsakee-server/base/node-static.Dockerfile):
#   docker build -t node-static-base:20 -f base/node-static.Dockerfile base/
# That base image carries the non-root user, healthcheck, and Caddy binary
# shared by every static Vite/React app ported from Lovable. See
# hopsakee-server/base/node-static.Dockerfile for why it's a separate image.

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node-static-base:20
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build --chown=appuser:appuser /app/dist /srv/app
