export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  srcDir: 'app',
  css: ['~/assets/css/tokens.css', '~/assets/css/typography.css', '~/assets/css/globals.css'],
  content: {
    experimental: {
      // 使用 Node.js 22.5+ 内置原生 SQLite，跳过 better-sqlite3 原生编译
      // NOTE: 依赖升级（如 pnpm 11）后 better-sqlite3 需重编译，原生方案更稳定
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
    // 前台：SSR + SWR 60s
    // 不是 prerender（prerender 会冻结构建时数据快照，后台改内容 rebuild 后 SWR 1 分钟内刷新）
    '/': { ssr: true, swr: 60 },
    '/works': { ssr: true, swr: 60 },
    '/works/**': { ssr: true, swr: 60 },
    '/journal': { ssr: true, swr: 60 },
    '/journal/**': { ssr: true, swr: 60 },
    '/about': { ssr: true, swr: 60 },
    // 后台：纯客户端渲染（CSR），避免 SSR cookie 转发的竞态问题
    '/admin/**': { ssr: false }
  },
  runtimeConfig: {
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin',
    sessionSecret: process.env.SESSION_SECRET || 'kakin-studio-secret-key-please-change',
    // GitHub 凭据：后台写内容时通过 octokit 把变更 commit 到仓库，触发 CI 重建
    github: {
      token: process.env.GITHUB_TOKEN || '',
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || '',
      branch: process.env.GITHUB_BRANCH || 'main',
      committerName: process.env.GITHUB_COMMITTER_NAME || 'Kakin Studio Bot',
      committerEmail: process.env.GITHUB_COMMITTER_EMAIL || 'bot@kakin.studio',
      // 国内服务器：https://api.github.com 常被墙/超时，填反向代理地址
      // 示例1（公开 ghproxy）：https://ghproxy.com/https://api.github.com
      // 示例2（自建 fastgithub）：https://gh.yourdomain.com/api
      baseUrl: process.env.GITHUB_API_BASE || ''
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
