# ---------- Build Stage ----------
# 国内镜像无法直连 Docker Hub 时，替换第一行为：
#   FROM registry.cn-hangzhou.aliyuncs.com/library/node:20-alpine AS builder
FROM node:20-alpine AS builder

ARG NPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app

# 利用缓存：先装依赖
COPY package.json package-lock.json* ./
# 国内构建时自动用 npmmirror（淘宝源）；海外环境可在 docker build --build-arg NPM_REGISTRY=https://registry.npmjs.org 覆盖
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
    && npm ci --legacy-peer-deps

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
