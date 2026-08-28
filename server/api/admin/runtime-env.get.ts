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
    'GITHUB_API_BASE'
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

  return {
    ok: true,
    nodeEnv: process.env.NODE_ENV || '',
    runtimeConfig: {
      adminUsername: maskValue(cfg?.adminUsername),
      adminPassword: maskValue(cfg?.adminPassword),
      sessionSecret: maskValue(cfg?.sessionSecret),
      github: {
        token: maskValue(cfg?.github?.token),
        owner: maskValue(cfg?.github?.owner),
        repo: maskValue(cfg?.github?.repo),
        branch: cfg?.github?.branch || '',
        committerName: cfg?.github?.committerName || '',
        committerEmail: cfg?.github?.committerEmail || '',
        baseUrl: cfg?.github?.baseUrl || ''
      },
      public: {
        siteName: cfg?.public?.siteName || '',
        siteUrl: cfg?.public?.siteUrl || ''
      }
    },
    env: runtimeEnv,
    checks: {
      nuxtGithubTokenInjected: !!cfg?.github?.token,
      nuxtGithubOwnerInjected: !!cfg?.github?.owner,
      nuxtGithubRepoInjected: !!cfg?.github?.repo,
      githubSourceEnvPresent: !!(process.env.NUXT_GITHUB_TOKEN || process.env.GITHUB_TOKEN),
      configSource: 'nuxt runtimeConfig + process.env'
    }
  }
})
