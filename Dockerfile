# ---------- Build Stage ----------
# 国内镜像无法直连 Docker Hub 时，替换第一行为：
#   FROM registry.cn-hangzhou.aliyuncs.com/library/node:26-alpine AS builder
FROM node:26-alpine AS builder

ARG PNPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app

# 安装与 package.json 中 packageManager 字段一致版本的 pnpm
# 说明：node:26-alpine 镜像不预装 corepack（精简版为减小体积剔除了非核心 CLI），
# 直接用 npm 全局安装 pnpm 更稳定，且无需额外 RUN apk 层或 corepack enable/prepare 两步调用
ARG PNPM_VERSION=11.24.0
RUN npm install -g pnpm@${PNPM_VERSION} \
    && npm cache clean --force \
    && pnpm --version

# pnpm 11 起，环境变量前缀为 PNPM_CONFIG_（不再读取 NPM_CONFIG_*）
# 通过环境变量注入 registry，比写 .npmrc 更灵活（CI 可覆盖）
ENV PNPM_CONFIG_REGISTRY=${PNPM_REGISTRY}

# 先拷贝锁文件 + package 元信息 + workspace 配置，最大化利用 layer cache
# pnpm 11：构建脚本批准、hoist 策略等均在 pnpm-workspace.yaml 中声明
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
# --frozen-lockfile：如果 lock 缺失/不匹配直接失败（避免 CI 偷偷改）
# 不做 --prod 因为 nuxt build 需要 devDependencies（nuxt/content 全在 devDeps 也能跑，但这里统一 dev 安装）
RUN pnpm install --frozen-lockfile

# 再拷贝源码 + content 数据并构建（content/ 必须进来才能生成 SQLite dump）
COPY . .
RUN pnpm run build

# ---------- Runtime Stage ----------
FROM node:26-alpine AS runner

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
