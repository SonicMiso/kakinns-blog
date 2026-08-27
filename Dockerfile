# ---------- Build Stage ----------
# 国内镜像无法直连 Docker Hub 时，替换第一行为：
#   FROM registry.cn-hangzhou.aliyuncs.com/library/node:22-alpine AS builder
FROM node:22-alpine AS builder

ARG PNPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app

ARG PNPM_VERSION=11.24.0
RUN npm install -g pnpm@${PNPM_VERSION} \
    && npm cache clean --force \
    && pnpm --version

ENV PNPM_CONFIG_REGISTRY=${PNPM_REGISTRY}

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 拷贝源码 + content（content/ 必须参与 build 生成 Nuxt Content SQLite dump）
COPY . .

# TARGET_APP_ENV 仅作为构建环境标签
ARG TARGET_APP_ENV=production
ENV TARGET_APP_ENV=${TARGET_APP_ENV}

ARG NUXT_PUBLIC_SITE_COMMIT_SHA=""
ARG NUXT_PUBLIC_SITE_BUILD_TIME=""
ENV NUXT_PUBLIC_SITE_COMMIT_SHA=${NUXT_PUBLIC_SITE_COMMIT_SHA}
ENV NUXT_PUBLIC_SITE_BUILD_TIME=${NUXT_PUBLIC_SITE_BUILD_TIME}

RUN pnpm run build

# ---------- Runtime Stage ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", ".output/server/index.mjs"]
