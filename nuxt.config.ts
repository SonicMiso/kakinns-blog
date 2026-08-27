export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  srcDir: 'app',
  css: ['~/assets/css/tokens.css', '~/assets/css/typography.css', '~/assets/css/globals.css'],
  content: {
    experimental: {
      sqliteConnector: 'native'
    },
    build: {
      markdown: {
        highlight: {
          theme: 'github-light'
        }
      }
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '手工艺个人工作室 — 记录木作、陶瓷与织物的制作过程' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },
  routeRules: {
    '/': { ssr: true, swr: 60 },
    '/works': { ssr: true, swr: 60 },
    '/works/**': { ssr: true, swr: 60 },
    '/journal': { ssr: true, swr: 60 },
    '/journal/**': { ssr: true, swr: 60 },
    '/about': { ssr: true, swr: 60 },
    '/admin/**': { ssr: false }
  },
  runtimeConfig: {
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin',
    sessionSecret: process.env.SESSION_SECRET || 'kakin-studio-secret-key-please-change',
    github: {
      token: process.env.GITHUB_TOKEN || '',
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || '',
      branch: process.env.GITHUB_BRANCH || 'main',
      committerName: process.env.GITHUB_COMMITTER_NAME || 'Kakin Studio Bot',
      committerEmail: process.env.GITHUB_COMMITTER_EMAIL || 'bot@kakin.studio',
      baseUrl: process.env.GITHUB_API_BASE || ''
    },
    public: {
      siteName: 'Kakin Studio',
      siteDescription: '手工艺个人工作室',
      // ===== 主站构建元信息（给后台同步状态芯片用）=====
      // GitHub Actions / Dockerfile 构建时通过 build-args 注入：
      //   --build-arg GITHUB_SHA=${{ github.sha }} BUILD_TIME=${{ github.run_started_at }}
      // 开发模式未配置时，meta API 会 fallback 读本地 `git rev-parse HEAD` 与 Date.now()。
      siteCommitSha: process.env.NUXT_PUBLIC_SITE_COMMIT_SHA || process.env.GITHUB_SHA || '',
      siteBuildTime: process.env.NUXT_PUBLIC_SITE_BUILD_TIME || process.env.BUILD_TIME || '',
      // 后台 sync-status 接口查询「远端主站 /api/meta」时用的 base URL；
      // 部署时通过环境变量 NUXT_PUBLIC_SITE_URL 指定（例如 http://47.122.106.135:3000）。
      // 留空 = 使用当前请求的 origin（同域回环），开发模式 & 单站点够用。
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || ''
    }
  },
  nitro: {}
})