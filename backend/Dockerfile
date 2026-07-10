FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY drizzle.config.ts ./
COPY --from=builder /app/src/db/schema.ts ./src/db/schema.ts
COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && sed -i 's/\r$//' docker-entrypoint.sh
EXPOSE 8000
CMD ["sh", "./docker-entrypoint.sh"]
