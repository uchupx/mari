# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG SUWAYOMI_SERVER_URL=""
ENV SUWAYOMI_SERVER_URL=$SUWAYOMI_SERVER_URL

RUN bun run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM oven/bun:alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Bun static file server with SPA fallback
CMD ["bun", "x", "serve", "dist", "--single", "--port", "3000"]
