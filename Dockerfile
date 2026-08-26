# ---------- Build Stage ----------
# 国内镜像无法直连 Docker Hub 时，替换第一行为：
#   FROM registry.cn-hangzhou.aliyuncs.com/library/node:26-alpine AS builder
FROM node:26-alpine AS builder

ARG PNPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app

# 安装与 package.json 中 packageManager 字段一致版本的 pnpm
ARG PNPM_VERSION=11.24.0
RUN npm install -g pnpm@${PNPM_VERSION} \
    && npm cache clean --force \
    && pnpm --version

ENV PNPM_CONFIG_REGISTRY=${PNPM_REGISTRY}

# 先拷贝锁文件 + package 元信息 + workspace 配置，最大化利用 layer cache
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 再拷贝源码 + content 数据并构建（content/ 必须进来才能生成 SQLite dump）
COPY . .

# 【关键】构建内存参数必须适配目标 VPS 的物理内存（1GB 机型）
# - VITE_WORKER_COUNT=1 + VITE_WORKER_PLUGINS_MODE=inline：禁用 Vite 多 worker 并行，
#   避免 transform 阶段同时启动多个 Vite/ESBuild 子进程导致 RSS 爆掉
# - ESBUILD_CONCURRENCY=1：串行化 esbuild 转换，减少瞬时分配
# - NODE_OPTIONS max-old-space-size=512：**必须低于物理内存 1GB**（否则被内核 OOM killer 杀掉）
#   若设为 1536 会导致 Nuxt Content 生成 SQLite dump 中途猝死、最终内容为空。
ENV VITE_WORKER_COUNT=1 \
    VITE_WORKER_PLUGINS_MODE=inline \
    ESBUILD_CONCURRENCY=1 \
    NODE_OPTIONS="--max-old-space-size=512"

RUN pnpm run build

# ---------- Runtime Stage ----------
FROM node:26-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    # 运行阶段同样限制：1GB VPS 给 Node 堆 512MB，留出约 512MB 给系统/文件缓存
    NODE_OPTIONS="--max-old-space-size=512 --no-expose-gc"

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
