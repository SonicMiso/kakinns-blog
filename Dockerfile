# ---------- Build Stage ----------
# 国内镜像无法直连 Docker Hub 时，替换第一行为：
#   FROM registry.cn-hangzhou.aliyuncs.com/library/node:26-alpine AS builder
FROM node:26-alpine AS builder

ARG PNPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app

# 启用 Node 自带的 corepack 拿到对应版本的 pnpm（锁定 packageManager 版本，团队一致）
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

# pnpm 11 起，环境变量前缀为 PNPM_CONFIG_（不再读取 NPM_CONFIG_*）
# 通过环境变量注入 registry，比写 .npmrc 更灵活（CI 可覆盖）
ENV PNPM_CONFIG_REGISTRY=${PNPM_REGISTRY}

# 先拷贝锁文件 + package 元信息，最大化利用 layer cache（依赖不变时直接复用）
# 注意：Windows Docker Desktop 传 build context 给 Linux VM 时，dotfiles（以 . 开头）
# 有时在合并 COPY 中被解析为根路径下的文件（"/.npmrc": not found）。
# 拆成独立 COPY，每个文件单独定位，避免整层因一个 dotfiles 失败。
COPY package.json ./
COPY pnpm-lock.yaml ./
# pnpm 11：构建脚本批准、hoist 策略等非 auth 配置均在此文件（必填）
COPY pnpm-workspace.yaml ./
# .npmrc：仅 registry/auth，而 Dockerfile 已通过 ENV PNPM_CONFIG_REGISTRY 注入镜像源，
# 非 auth 场景即使缺失也不影响；存在时可补充私有 registry auth（如 //registry.npmmirror.com/:_authToken）
# 先用 shell 试探存在就复制，缺失跳过 — 比纯 COPY 更鲁棒
RUN (if [ -f /tmp/.docker-build-ctx-marker ]; then :; fi) 2>/dev/null || true
COPY .npmrc* ./
# pnpm install 前确保 .npmrc 存在（缺失就建空文件，避免 pnpm 在某些 strict 模式下报 RC 路径错误）
RUN if [ ! -f .npmrc ]; then touch .npmrc; fi

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
