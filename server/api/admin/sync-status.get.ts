// 管理后台「主站同步状态」接口（需要登录）。
// 调用方法：GET /api/admin/sync-status?sinceSha=<最近一次 admin commit 的 sha>
//   - sinceSha 可选：不传则返回当前整体状态（unknown/synced），用于页面加载首屏。
//
// 返回状态机：
//   unknown：没拿到判断依据（localOnly 未 push、GitHub 未配置、所有请求失败等），提示文案会说明。
//   syncing：sinceSha 已存在于 GitHub 分支，但 Actions 仍在进行 / 主站 siteCommitSha 还没达到 sinceSha 或更新，且未超过超时阈值。
//   synced：sinceSha 与 主站 /api/meta 返回的 siteCommitSha 能对齐（相等或主站更新 >= sinceSha 前缀）。
//   failed：Actions conclusion=failure / 等待超过 FAILED_TIMEOUT_MS 且仍未同步 / GitHub 返回其它错误。
import { readSession } from '../../utils/session'
import { getOctokitSafe, isGitHubConfigured } from '../../utils/github'
import { collectContentStats } from '../../utils/contentMeta'

const FAILED_TIMEOUT_MS = 15 * 60 * 1000 // 15 分钟未同步成功判失败
const STATUS_CACHE_TTL_MS = 10 * 1000
const statusCache = new Map<string, { expiresAt: number; value: any }>()

interface ActionsRunLite {
  id: number
  name: string
  status: string
  conclusion: string | null
  html_url: string
  created_at: string | null
  updated_at: string | null
  head_sha?: string
}

/** 前缀相等（sinceSha 可能是 7 位短 sha，server 可能返回 40 位完整 sha）视为命中 */
function shaMatches(siteSha: string, sinceSha: string): boolean {
  if (!siteSha || !sinceSha) return false
  const a = siteSha.toLowerCase()
  const b = sinceSha.toLowerCase()
  return a === b || a.startsWith(b) || b.startsWith(a)
}

/** 判断 commitSince 是否在历史里是祖先，或两者本身相等 */
async function isAncestorOrSame(params: {
  octo: any
  owner: string
  repo: string
  base: string // 分支 head / 或 sinceSha
  head: string // sinceSha / 或 siteSha
}): Promise<boolean> {
  const { octo, owner, repo, base, head } = params
  if (!base || !head) return false
  if (shaMatches(base, head)) return true
  try {
    // compare base...head：ahead_by = 0 且 status = 'identical'/'behind' → 已包含
    const res = await octo.rest.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${base}...${head}`
    })
    const aheadBy = Number(res?.data?.ahead_by ?? 0)
    const status = String(res?.data?.status || '')
    // identical / behind / ahead_by=0 都说明 head 不比 base 新（即 head 已经包含在 base 或之前）
    return aheadBy === 0 || status === 'identical' || status === 'behind'
  } catch {
    // ghproxy / 网络 / 权限错误都不打断整体判断，false 让上层用前缀匹配兜底
    return false
  }
}

export default defineEventHandler(async (event) => {
  const session = readSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: '需要先登录后台管理' })
  }

  const { public: pubCfg, github: githubCfg } = useRuntimeConfig(event) as any
  const sinceShaRaw = String(getQuery(event).sinceSha || '').trim()
  const sinceSha = sinceShaRaw
  const sinceSavedAt = String(getQuery(event).sinceSavedAt || '').trim() || null
  const siteUrl = (pubCfg && String(pubCfg.siteUrl || '')) || ''
  const cacheKey = JSON.stringify({ sinceSha, sinceSavedAt, siteUrl })
  const cached = statusCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const state: any = {
    state: 'unknown' as 'unknown' | 'synced' | 'syncing' | 'failed',
    sinceSha: sinceSha || null,
    lastSavedAt: sinceSavedAt,
    siteUrl: siteUrl,
    errorMessage: '' as string | undefined
  }
  const done = (value: any) => {
    statusCache.set(cacheKey, { expiresAt: Date.now() + STATUS_CACHE_TTL_MS, value })
    return value
  }

  // 1) 先读本地 / 生产当前 instance 自己的 meta（同域回环，不需要 GitHub）
  let siteCommitSha = (pubCfg && pubCfg.siteCommitSha) || ''
  let siteBuildTime = (pubCfg && pubCfg.siteBuildTime) || ''
  const localStats = await collectContentStats(event)
  state.siteCommitSha = siteCommitSha
  state.siteBuildTime = siteBuildTime
  state.content = {
    worksCount: localStats.worksCount,
    journalCount: localStats.journalCount,
    lastUpdatedAt: localStats.lastUpdatedAt
  }

  // 2) 如果配置了远端 siteUrl，优先用远端 /api/meta（后台可能与读者主站不是一个实例）
  if (siteUrl) {
    try {
      const remote: any = await $fetch(`${siteUrl.replace(/\/$/, '')}/api/meta`, {
        method: 'GET',
        timeout: 5000,
        retry: 1
      })
      if (remote && typeof remote.siteCommitSha === 'string') siteCommitSha = remote.siteCommitSha
      if (remote && typeof remote.siteBuildTime === 'string') siteBuildTime = remote.siteBuildTime
      if (remote?.content) state.content = remote.content
      state.siteCommitSha = siteCommitSha
      state.siteBuildTime = siteBuildTime
    } catch (e: any) {
      state.errorMessage = `查询主站 /api/meta 失败（${siteUrl}）：${e?.message || 'network error'}`
    }
  }

  // 3) 如果管理员没传 sinceSha（仪表盘首屏 / 页面刚打开还没做保存操作）：
  //    - 有 commitSha 且内容正常 → 显示「已同步」（整体）
  //    - 无任何可用信息 → unknown
  if (!sinceSha) {
    if (siteCommitSha) state.state = 'synced'
    return done(state)
  }

  // 4) 有 sinceSha，先看本地 / 主站 当前 commit 是否已经 >= sinceSha
  const isSiteSyncedByPrefix = shaMatches(siteCommitSha, sinceSha)
  state.isSiteSyncedByPrefix = isSiteSyncedByPrefix

  // 5) 如果配置了 GitHub，查 Actions run 状态；否则纯靠 siteSha 判断
  let actionsRun: ActionsRunLite | undefined
  let aheadBy: number | undefined

  const ghConfigured = isGitHubConfigured()
  state.githubConfigured = ghConfigured

  if (ghConfigured) {
    const octo = getOctokitSafe()
    const owner = String(githubCfg.owner || '')
    const repo = String(githubCfg.repo || '')
    const branch = String(githubCfg.branch || 'master')

    // a. 确认 sinceSha 已经在远端分支上（防止本地 push 失败但以为在同步中）
    let pushed = await isAncestorOrSame({
      octo,
      owner,
      repo,
      base: branch,
      head: sinceSha
    })

    // b. 用 sinceSha 过滤 Actions runs
    try {
      const list = await octo.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        branch,
        head_sha: sinceSha
      })
      const runs = (list?.data?.workflow_runs || []) as ActionsRunLite[]
      // 按 created_at 倒序取最新一个
      runs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      actionsRun = runs[0]
    } catch (e: any) {
      if (!state.errorMessage) state.errorMessage = `查询 GitHub Actions 失败：${e?.message || 'unknown'}`
    }

    // c. 如果 sinceSha 还没推到分支（pushed=false），说明 octokit commitContentChanges 可能失败或分支不对
    if (!pushed) {
      // 兜底：检查 prefix 匹配（compare API 可能因 ghproxy 不支持失败）
      pushed = shaMatches(siteCommitSha, sinceSha) || !!actionsRun
    }
    state.pushed = pushed

    // d. 如果 siteCommitSha 已有但 prefix 未命中，尝试 compare API（siteCommitSha 是否 >= sinceSha）
    if (siteCommitSha && !isSiteSyncedByPrefix) {
      try {
        const cmp = await octo.rest.repos.compareCommitsWithBasehead({
          owner,
          repo,
          basehead: `${sinceSha}...${siteCommitSha}`
        })
        aheadBy = Number(cmp?.data?.ahead_by ?? 0)
        const status = String(cmp?.data?.status || '')
        state.aheadBy = aheadBy
        if (status === 'identical' || status === 'ahead' || aheadBy >= 0) {
          // 注意：ahead_by 是 siteCommitSha 比 sinceSha 新多少 commit；>=0 且 compare 未抛错说明 sinceSha 已经是 siteCommitSha 的祖先 → 已同步
          state.isSiteSyncedByCompare = true
        }
      } catch {
        // 国内代理经常不支持 compare，忽略
      }
    }
  }

  if (actionsRun) {
    state.actionsRun = {
      status: actionsRun.status,
      conclusion: actionsRun.conclusion,
      html_url: actionsRun.html_url,
      started_at: actionsRun.created_at,
      updated_at: actionsRun.updated_at
    }
  }

  // ========== 状态判定 ==========
  const isSiteSyncedFinal = isSiteSyncedByPrefix || state.isSiteSyncedByCompare === true

  // 已同步：主站 sha >= sinceSha（无论 Actions 是否 completed，只要主站已生效就算）
  if (isSiteSyncedFinal) {
    state.state = 'synced'
    return done(state)
  }

  // Actions 显式失败 → failed（不再等超时）
  if (state.actionsRun?.conclusion === 'failure' || state.actionsRun?.conclusion === 'cancelled' || state.actionsRun?.conclusion === 'skipped' || state.actionsRun?.conclusion === 'timed_out') {
    state.state = 'failed'
    if (!state.errorMessage) state.errorMessage = `GitHub Actions 执行结果：${state.actionsRun.conclusion}`
    return done(state)
  }

  // 超过 15 分钟仍未同步 → 人工处理
  if (state.lastSavedAt) {
    const savedAt = new Date(state.lastSavedAt).getTime()
    if (Number.isFinite(savedAt)) {
      const elapsed = Date.now() - savedAt
      state.elapsedMs = elapsed
      if (elapsed > FAILED_TIMEOUT_MS) {
        state.state = 'failed'
        if (!state.errorMessage) state.errorMessage = `等待超过 ${Math.round(FAILED_TIMEOUT_MS / 60000)} 分钟仍未同步，请检查 Actions / VPS 部署脚本`
        return done(state)
      }
    }
  }

  // 如果 GitHub 未配置 / localOnly 模式：sinceSha 本身是空也会走这里，
  // 且由于 localOnly=true 不会触发 Actions，因此保持 unknown（UI 显示「本地模式，无需同步」）。
  if (!ghConfigured) {
    state.state = 'unknown'
    if (!state.errorMessage) state.errorMessage = '当前未配置 NUXT_GITHUB_TOKEN/OWNER/REPO（或 compose 源变量映射），后台保存只写本地 content/，无需主站同步。'
    return done(state)
  }

  // 其余都当作「同步中」
  state.state = 'syncing'
  return done(state)
})
