#!/bin/sh
set -e

echo "Repora Backend — Starting..."

echo "Waiting for database..."
for i in $(seq 1 15); do
  if node wait-for-db.js 2>/dev/null; then
    echo " Database ready"
    sleep 1
    break
  fi
  echo "  attempt $i/15, waiting..."
  sleep 2
done

echo "Running database migrations..."
npx tsx dist/db/migrate.js 2>/dev/null && echo " Migrations applied" || echo " Migration skipped"

echo "Seeding database (idempotent — safe to re-run)..."
npx tsx dist/db/seed.js 2>/dev/null && echo " Seed complete" || echo " Seed skipped"

echo "Detecting Ollama model..."
npx tsx -e "
  try {
    const res = await fetch('http://\${process.env.OLLAMA_HOST:-host.docker.internal}:11434/api/tags');
    const data = await res.json();
    if (data.models?.length > 0) {
      const model = data.models[0].name;
      console.log('Ollama model:', model);
    }
  } catch { console.log('No Ollama detected — continuing with BYOK config'); }
" 2>/dev/null || true

echo "Starting backend server on port 8000..."
exec npx tsx dist/index.js
