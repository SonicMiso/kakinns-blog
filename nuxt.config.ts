export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  srcDir: 'app',
  css: ['~/assets/css/tokens.css', '~/assets/css/typography.css', '~/assets/css/globals.css'],
  content: {
    experimental: {
      // 使用 Node.js 22.5+ 内置原生 SQLite，跳过 better-sqlite3 原生编译
      // 参见 https://content.nuxt.com/docs/getting-started/configuration#experimentalsqliteconnector
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
    // 前台走 Nuxt Content SQLite dump + 客户端 WASM，纯静态也能工作
    '/': { prerender: true },
    '/works': { prerender: true },
    '/works/**': { prerender: true },
    '/journal': { prerender: true },
    '/journal/**': { prerender: true },
    '/about': { prerender: true },
    // 后台：SSR（实时调 GitHub API 提交 commit）
    '/admin/**': { ssr: true }
  },
  runtimeConfig: {
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
    sessionSecret: process.env.SESSION_SECRET || 'kakin-studio-secret-key-please-change',
    // GitHub 凭据：后台写内容时通过 octokit 把变更 commit 到仓库，触发 CI 重建
    github: {
      token: process.env.GITHUB_TOKEN || '',
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || '',
      branch: process.env.GITHUB_BRANCH || 'main',
      committerName: process.env.GITHUB_COMMITTER_NAME || 'Kakin Studio Bot',
      committerEmail: process.env.GITHUB_COMMITTER_EMAIL || 'bot@kakin.studio'
    },
    public: {
      siteName: 'Kakin Studio',
      siteDescription: '手工艺个人工作室'
    }
  },
  nitro: {
    // 移除旧的 fs storage 配置，不再存 server/data
  }
})
