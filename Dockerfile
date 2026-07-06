# syntax=docker/dockerfile:1

# ---- deps: install node_modules (glibc image so better-sqlite3 uses prebuilt binaries)
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the Next.js standalone output
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: minimal production image
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/app/data

RUN groupadd --system nodejs && useradd --system --gid nodejs nextjs \
    && mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Drizzle migrations run automatically at boot (src/db/index.ts)
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000
VOLUME ["/app/data"]

CMD ["node", "server.js"]
