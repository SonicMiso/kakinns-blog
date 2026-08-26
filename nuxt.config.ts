import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  srcDir: 'app',
  css: ['~/assets/css/tokens.css', '~/assets/css/typography.css', '~/assets/css/globals.css'],
  content: {
    // 【关键】显式声明 content sources = 项目根目录下的 content/
    // 由于设置了 srcDir = 'app'，Nuxt Content 在某些构建环境中会尝试去 app/content 找数据，
    // 导致 Docker/VPS 构建时发现 0 个 markdown 文件，SQLite dump 为空 → 前台全空。
    // 用绝对路径锁定数据源避免任何路径解析歧义。
    sources: {
      works: {
        driver: 'fs',
        base: path.resolve(__dirname, 'content/works'),
        prefix: '/works'
      },
      journal: {
        driver: 'fs',
        base: path.resolve(__dirname, 'content/journal'),
        prefix: '/journal'
      }
    },
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
    // 前台：SSR + SWR 60s，兼顾内容刷新（CI/CD rebuild 后 1 分钟内看到更新）
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
