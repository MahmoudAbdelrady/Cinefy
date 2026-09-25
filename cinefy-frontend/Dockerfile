# ============================ Dependencies ===========================
FROM node:24.21.0-alpine3.24 AS deps

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY cinefy-ui/package.json ./cinefy-ui/
COPY cinefy-management/package.json ./cinefy-management/
COPY cinefy-client/package.json ./cinefy-client/

RUN pnpm install --frozen-lockfile

# ============================ Shared library =========================
FROM deps AS ui

COPY cinefy-ui ./cinefy-ui

RUN pnpm ui:build

# ============================ Management build =======================
FROM ui AS mgmt-build

COPY cinefy-management ./cinefy-management

RUN pnpm mgmt:build

# ============================ Client build ===========================
FROM ui AS client-build

COPY cinefy-client ./cinefy-client

RUN pnpm client:build

# ============================ Management run =========================
FROM nginx:1.31.6-alpine3.24-slim AS mgmt

RUN apk upgrade --no-cache

COPY cinefy-management/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=mgmt-build /app/cinefy-management/dist/cinefy-management/browser /usr/share/nginx/html

# ============================ Client run =============================
FROM node:24.21.0-alpine3.24 AS client

RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
    && addgroup -S -g 1001 cinefy \
    && adduser -S -u 1001 -G cinefy -H -D cinefy-app

WORKDIR /app

COPY --from=client-build --chown=cinefy-app:cinefy /app/cinefy-client/dist/cinefy-client ./dist/cinefy-client

USER cinefy-app:cinefy

CMD ["node", "dist/cinefy-client/server/server.mjs"]
