# ---------- Build Stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 利用缓存：先装依赖
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# 再拷贝源码+content 数据并构建（content/ 必须进来才能生成 SQLite dump）
COPY . .
RUN npm run build

# ---------- Runtime Stage ----------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ > /dev/null 2>&1 || exit 1

CMD ["node", ".output/server/index.mjs"]
