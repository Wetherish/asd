#!/bin/sh
set -e

# Apply pending Prisma migrations to PostgreSQL.
echo "asd-server: applying database migrations (prisma migrate deploy)"
npx prisma migrate deploy

# Seed is idempotent (all upserts); run it unless explicitly disabled.
# Runs the compiled JS (dist/prisma/seed.js), not ts-node, for Node 20.19+.
if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "asd-server: seeding database"
  node dist/prisma/seed.js
fi

echo "asd-server: starting"
exec node dist/main
