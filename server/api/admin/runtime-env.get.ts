import { readSession } from '../../utils/session'

function maskValue(value?: string | null) {
  const text = String(value ?? '').trim()
  if (!text) {
    return { present: false, value: '' }
  }

  if (text.length <= 4) {
    return { present: true, value: '*'.repeat(text.length) }
  }

  const visiblePrefix = text.slice(0, 4)
  const visibleSuffix = text.slice(-2)
  const hiddenLength = Math.max(4, text.length - 6)
  return {
    present: true,
    value: `${visiblePrefix}${'*'.repeat(hiddenLength)}${visibleSuffix}`
  }
}

export default defineEventHandler((event) => {
  const session = readSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: '需要先登录后台管理' })
  }

  const cfg = useRuntimeConfig(event) as any
  const envKeys = [
    'NODE_ENV',
    'NUXT_ADMIN_USERNAME',
    'NUXT_ADMIN_PASSWORD',
    'NUXT_SESSION_SECRET',
    'NUXT_GITHUB_TOKEN',
    'NUXT_GITHUB_OWNER',
    'NUXT_GITHUB_REPO',
    'NUXT_GITHUB_BRANCH',
    'NUXT_GITHUB_COMMITTER_NAME',
    'NUXT_GITHUB_COMMITTER_EMAIL',
    'NUXT_GITHUB_BASE_URL',
    'GITHUB_TOKEN',
    'GITHUB_OWNER',
    'GITHUB_REPO',
    'GITHUB_BRANCH',
    'GITHUB_API_BASE',
    'TEST_ENV'
  ]

  const runtimeEnv: Record<string, any> = {}
  for (const key of envKeys) {
    const value = process.env[key]
    runtimeEnv[key] = {
      present: !!value,
      value: maskValue(value).value,
      source: value ? 'process.env' : 'missing'
    }
  }

  const directGitEnv = {
    NUXT_GITHUB_TOKEN: maskValue(process.env.NUXT_GITHUB_TOKEN),
    GITHUB_TOKEN: maskValue(process.env.GITHUB_TOKEN),
    NUXT_GITHUB_OWNER: maskValue(process.env.NUXT_GITHUB_OWNER),
    GITHUB_OWNER: maskValue(process.env.GITHUB_OWNER),
    NUXT_GITHUB_REPO: maskValue(process.env.NUXT_GITHUB_REPO),
    GITHUB_REPO: maskValue(process.env.GITHUB_REPO)
  }

  return {
    ok: true,
    nodeEnv: process.env.NODE_ENV || '',
    runtimeConfig: {
      adminUsername: maskValue(cfg?.adminUsername),
      adminPassword: maskValue(cfg?.adminPassword),
      sessionSecret: maskValue(cfg?.sessionSecret),
      githubToken: maskValue(cfg?.githubToken),
      githubOwner: maskValue(cfg?.githubOwner),
      githubRepo: maskValue(cfg?.githubRepo),
      githubBranch: cfg?.githubBranch || '',
      githubCommitterName: cfg?.githubCommitterName || '',
      githubCommitterEmail: cfg?.githubCommitterEmail || '',
      githubBaseUrl: cfg?.githubBaseUrl || '',
      testenv: cfg?.testenv || '',
      public: {
        siteName: cfg?.public?.siteName || '',
        siteUrl: cfg?.public?.siteUrl || ''
      }
    },
    env: runtimeEnv,
    directGitEnv,
    checks: {
      nuxtGithubTokenInjected: !!cfg?.githubToken,
      nuxtGithubOwnerInjected: !!cfg?.githubOwner,
      nuxtGithubRepoInjected: !!cfg?.githubRepo,
      githubSourceEnvPresent: !!(process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN),
      configSource: 'nuxt runtimeConfig + process.env'
    }
  }
})
