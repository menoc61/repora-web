#!/bin/sh
set -e

echo "Repora Backend — Starting..."

echo "Running database migrations..."
npx drizzle-kit push 2>/dev/null || echo " Migration push skipped (DB may not be ready yet)"

echo "Seeding database (idempotent — safe to re-run)..."
npx tsx dist/db/seed.js 2>/dev/null || echo " Seed skipped (DB may not be ready yet)"

echo "Starting backend server on port 8000..."
exec npx tsx dist/index.js
