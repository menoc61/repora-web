#!/bin/sh
set -e

echo "Repora Backend — Starting..."

# ── Wait for database ──
echo "Waiting for database..."
for i in $(seq 1 30); do
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
  if [ "$i" = "30" ]; then
    echo "  ERROR: Database not reachable after 60s"
    exit 1
  fi
  echo "  attempt $i/30, waiting..."
  sleep 2
done

# ── Run migrations (always, idempotent via drizzle-kit push) ──
echo "Running database migrations..."
node dist/db/migrate.js 2>/dev/null && echo "  Migrations applied" || echo "  Migration skipped"

# ── Auto-seed on first boot (only if users table is empty) ──
if node -e "
  var postgres = require('postgres');
  var url = process.env.DATABASE_URL || 'postgres://repora:repora@localhost:5432/repora';
  var sql = postgres(url, { max: 1 });
  sql.unsafe('SELECT count(*)::int as n FROM users').then(function(r) {
    sql.end();
    process.exit(r[0].n === 0 ? 0 : 1);
  }).catch(function() { sql.end(); process.exit(1); });
" 2>/dev/null; then
  echo "Empty database detected — seeding demo data..."
  npx tsx src/db/seed.ts 2>&1 | tail -5
  echo "  Seed complete"
else
  echo "  Database has data, skipping seed"
fi

# ── Start server ──
echo "Starting backend server on port ${PORT:-8000}..."
exec npx tsx dist/index.js
