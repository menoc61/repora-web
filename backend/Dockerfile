# Backend — Optimized multi-stage build (lightweight, <300MB target)
# Build context is the repo root (see docker-compose.yml) so shared
# public/assets (cover / back-cover images) can be copied into the image.
# Base stays on Alpine to keep the image small. LibreOffice is NOT baked in;
# PDF export falls back to the built-in PDFKit renderer in Docker. For
# higher-fidelity PDFs, mount a LibreOffice binary or point the container at one.
FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --prefer-offline --no-audit --no-fund

FROM deps AS builder
COPY backend/. .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

# Production-only deps (no typescript/tsx/vitest/drizzle-kit) to keep image small
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit --no-fund

# Built output + DB migrations (migrate.ts reads ./src/db/migrations)
COPY --from=builder /app/dist ./dist
COPY backend/src/db/migrations ./src/db/migrations
COPY backend/drizzle.config.ts ./
COPY backend/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && sed -i 's/\r$//' docker-entrypoint.sh

# Shared document assets (cover / back-cover backgrounds)
COPY public/assets ./public/assets

EXPOSE 8000
CMD ["sh", "./docker-entrypoint.sh"]
