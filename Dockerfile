# ─────────────────────────────────────────────
# Stage 1: Builder
# Installs ALL deps (dev + prod) and compiles TS
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# OpenSSL is required by the Prisma schema engine binary
RUN apk add --no-cache openssl

# Copy manifests first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Production
# Lean image — only prod deps + compiled output
# ─────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling in containers
# Install openssl — required by Prisma schema-engine at runtime (migrate deploy)
RUN apk add --no-cache dumb-init openssl

# Copy manifests and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Generate Prisma client (needs the schema)
COPY src/prisma ./src/prisma
RUN npx prisma generate

# Copy compiled application from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 5000

# Run Prisma migrations then start the app
# dumb-init ensures signals (SIGTERM) propagate correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
