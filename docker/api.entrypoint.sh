#!/bin/sh
set -e
echo "==> Prisma db push..."
pnpm --filter @washer/db exec prisma db push --accept-data-loss
echo "==> Seed database..."
pnpm --filter @washer/db seed || echo "Seed skipped or already done"
echo "==> Starting API..."
exec node apps/api/dist/main.js
