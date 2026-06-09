# ==========================================
# yanbot-claw - Next.js 多阶段 Docker 构建
# ==========================================

FROM node:22-alpine AS base

# ========== 阶段 1: 安装依赖 ==========
FROM base AS deps
# libc6-compat for glibc compat; python3/make/g++ for native module compilation fallback
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
RUN pnpm install --frozen-lockfile

# ========== 阶段 2: 构建应用 ==========
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
RUN pnpm run build

# ========== 阶段 3: 生产运行时 ==========
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

# standalone 模式输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Next.js nft cannot follow pnpm virtual-store symlinks, so better-sqlite3
# and its runtime deps are absent from the standalone node_modules trace.
# Copy them explicitly from the deps stage pnpm virtual store.
COPY --from=deps --chown=nextjs:nodejs \
  /app/node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3 \
  ./node_modules/better-sqlite3
COPY --from=deps --chown=nextjs:nodejs \
  /app/node_modules/.pnpm/bindings@1.5.0/node_modules/bindings \
  ./node_modules/bindings
COPY --from=deps --chown=nextjs:nodejs \
  /app/node_modules/.pnpm/file-uri-to-path@1.0.0/node_modules/file-uri-to-path \
  ./node_modules/file-uri-to-path

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=10s --timeout=10s --start-period=20s --retries=6 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
