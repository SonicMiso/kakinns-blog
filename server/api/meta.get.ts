// 公开站点元信息接口（HTTP GET /api/meta）
// 被后台 sync-status 调用（对比 commit sha 与内容更新时间判断主站是否同步完成），
// 也可以被第三方监控脚本复用；不需要鉴权，SWR 30s 防止打爆。
import { execSync } from 'node:child_process'
import { collectContentStats } from '../utils/contentMeta'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()

  // commit sha：优先 runtimeConfig.public.siteCommitSha（构建注入），
  // 其次 process.env.GITHUB_SHA，再其次本地 git rev-parse HEAD；全失败给空串。
  let siteCommitSha = (cfg.public as any)?.siteCommitSha || ''
  if (!siteCommitSha && process.env.GITHUB_SHA) {
    siteCommitSha = String(process.env.GITHUB_SHA)
  }
  if (!siteCommitSha) {
    try {
      // --git-dir 方式避免 git 行为受 CWD 影响；stdout 可能结尾有换行
      siteCommitSha = String(execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }) || '').trim().slice(0, 40)
    } catch {
      siteCommitSha = ''
    }
  }

  // build time：同样走 runtimeConfig → env → 当前时间兜底
  let siteBuildTime = (cfg.public as any)?.siteBuildTime || ''
  if (!siteBuildTime && process.env.BUILD_TIME) siteBuildTime = String(process.env.BUILD_TIME)
  if (!siteBuildTime) siteBuildTime = new Date().toISOString()

  const stats = await collectContentStats(event)

  return {
    siteCommitSha,
    siteBuildTime,
    content: {
      worksCount: stats.worksCount,
      journalCount: stats.journalCount,
      lastUpdatedAt: stats.lastUpdatedAt,
      collections: stats.collections
    }
  }
})
