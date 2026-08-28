export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  compatibilityDate: '2024-04-03',
  srcDir: 'app',
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
  // 生产环境的机密配置必须通过 NUXT_* 环境变量在运行时注入。
  // 不要在这里读取 process.env，否则值会在 build-time 被固化到 .output。
  runtimeConfig: {
    adminUsername: 'admin',
    adminPassword: 'admin',
    sessionSecret: 'kakin-studio-secret-key-please-change',
    githubToken: '',
    githubOwner: '',
    githubRepo: '',
    githubBranch: 'master',
    githubCommitterName: 'Kakin Studio Bot',
    githubCommitterEmail: 'bot@kakin.studio',
    githubBaseUrl: '',
    testenv: '',
    public: {
      siteName: 'Kakin Studio',
      siteDescription: '手工艺个人工作室',
      siteCommitSha: '',
      siteBuildTime: '',
      siteUrl: ''
    }
  },
  nitro: {}
})