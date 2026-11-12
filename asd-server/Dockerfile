# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build stage — install deps, generate the Prisma client, compile NestJS.
# Full `npm ci` (dev + prod) so the prisma CLI and ts-node are available for
# the schema/seed steps that run at container start.
# ---------------------------------------------------------------------------
FROM node:20-slim AS build

WORKDIR /app

# OpenSSL is required by the Prisma query engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first (cache-friendly layer).
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Generate the Prisma client against the schema.
RUN npx prisma generate

# Compile the NestJS app to dist/.
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Compile the seed to plain JS so it runs at runtime without ts-node
# (ts-node 10.9.x is incompatible with Node >= 20.19 ESM loading).
RUN npx tsc prisma/seed.ts --rootDir prisma --outDir dist/prisma \
  --module commonjs --target es2021 --esModuleInterop --skipLibCheck

# ---------------------------------------------------------------------------
# Runtime stage — lean image, non-root user, persistent SQLite at /data.
# ---------------------------------------------------------------------------
FROM node:20-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data \
  && chown -R node:node /app /data

COPY --chown=node:node --from=build /app/package.json ./
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/prisma ./prisma
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const n=require('net');const s=n.connect(4000,'127.0.0.1');s.on('connect',()=>process.exit(0));s.on('error',()=>process.exit(1));s.setTimeout(3000,()=>process.exit(1))"

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
