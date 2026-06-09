# ==========================================
# yanbot-claw - Next.js 多阶段 Docker 构建
# ==========================================

FROM node:22-alpine AS base

# ========== 阶段 1: 安装依赖 ==========
FROM base AS deps
# libc6-compat for glibc compat; python3/make/g++ for native module compilation fallback
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
# Step 1: deterministic frozen install without running native build scripts
RUN pnpm install --frozen-lockfile --ignore-scripts
# Step 2: explicitly compile better-sqlite3 native binary (prebuild-install or node-gyp)
RUN pnpm rebuild better-sqlite3

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
# Next.js nft does not auto-trace .node native binaries; copy explicitly
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3/build/Release/ ./node_modules/better-sqlite3/build/Release/

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=10s --timeout=10s --start-period=20s --retries=6 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
