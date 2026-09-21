# ── Base: alpine variant = smallest bun image ─────────────────────────────────
FROM oven/bun:1-alpine AS base
WORKDIR /app

# ── Deps: install only prod+dev deps needed for build ─────────────────────────
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install

# ── Build: compile TypeScript + bundle assets ─────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ── Runner: only bun binary + static files + tiny serve script ────────────────
# No node_modules, no vite, no dev tools → very small final image
FROM oven/bun:1-alpine AS runner
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.ts ./

# Run as non-root for security / lower attack surface
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 4173
ENV PORT=4173

CMD ["bun", "run", "server.ts"]
