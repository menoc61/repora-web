#!/bin/sh
set -e

echo "Repora Backend — Starting..."

echo "Waiting for database..."
for i in $(seq 1 20); do
  if node -e "
    var net = require('net');
    var m = (process.env.DATABASE_URL || '').match(/@([^:]+):(\d+)/);
    if (!m) process.exit(1);
    var s = net.createConnection(+m[2], m[1], function() { s.end(); process.exit(0); });
    s.setTimeout(2000, function() { s.destroy(); process.exit(1); });
    s.on('error', function() { process.exit(1); });
  " 2>/dev/null; then
    echo "  Database ready"
    break
  fi
  echo "  attempt $i/20, waiting..."
  sleep 2
done

echo "Running database migrations..."
node dist/db/migrate.js 2>/dev/null && echo "  Migrations applied" || echo "  Migration skipped"

echo "Seeding database (idempotent)..."
node dist/db/seed.js 2>/dev/null && echo "  Seed complete" || echo "  Seed skipped"

echo "Starting backend server on port 8000..."
exec node dist/index.js