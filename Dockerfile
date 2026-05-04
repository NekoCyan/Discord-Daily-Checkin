# ── Deps stage (all dependencies) ────────────────────────────────────────────
FROM node:22 AS deps

WORKDIR /src

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── Dev stage (deps + source mount via compose) ───────────────────────────────
FROM deps AS dev

COPY tsconfig.json ./
COPY src/ ./src/
COPY types/ ./types/

CMD ["pnpm", "dev"]

# ── Build stage ───────────────────────────────────────────────────────────────
FROM deps AS builder

COPY tsconfig.json ./
COPY src/ ./src/
COPY types/ ./types/
RUN pnpm build

# Strip to prod deps only after build is done
RUN pnpm install --frozen-lockfile --prod

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM gcr.io/distroless/nodejs22-debian12 AS runner

WORKDIR /src

COPY --from=builder /src/dist ./dist
COPY --from=builder /src/node_modules ./node_modules
COPY --from=builder /src/package.json ./package.json

ENV NODE_ENV=production

CMD ["dist/index.js"]