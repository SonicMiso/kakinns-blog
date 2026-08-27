import { Octokit } from 'octokit'
import { Buffer } from 'node:buffer'
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import path from 'node:path'


interface CommitFile {
  path: string
  content: string // 文本内容，会自动 base64 编码
  encoding?: 'utf-8'
}

interface DeleteFile {
  path: string
}

function getOctokit() {
  const { github } = useRuntimeConfig() as any
  // 国内服务器访问 api.github.com 会卡顿/超时：支持通过自建代理或 ghproxy 反代
  // 在 nuxt.config runtimeConfig.github 或 .env GITHUB_API_BASE 里填入，例如：
  //   https://ghproxy.com/https://api.github.com   （公开代理，免费但可能限流）
  //   https://你的自建fastgithub域名/api            （自建 fastgithub/mirrorkhanh 反代）
  const baseUrl = github.baseUrl || process.env.GITHUB_API_BASE || undefined
  return new Octokit({
    auth: github.token,
    baseUrl,
    // 国内链路稳定性：放宽超时 + 重试
    request: { fetch: undefined, timeout: 30_000 }
  })
}

function assertConfig() {
  const { github } = useRuntimeConfig()
  if (!github.token || !github.owner || !github.repo) {
    throw createError({
      statusCode: 500,
      statusMessage:
        '缺少 GitHub 配置：请设置 GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO 环境变量。本地开发可跳过，直接写本地 content/ 目录。'
    })
  }
  return github
}

function isConfigured() {
  try {
    assertConfig()
    return true
  } catch {
    return false
  }
}

/** sync-status 接口用：对外暴露配置状态与 octokit 实例（复用 baseUrl/超时/鉴权配置），
 *  避免 sync-status.get.ts 重复写 createError + createInstance。*/
export function isGitHubConfigured(): boolean {
  return isConfigured()
}

export function getOctokitSafe() {
  return getOctokit()
}

/**
 * 本地写入 content/ 目录（dev 环境或 GitHub 未配置时使用，让后台保存立即能反映）
 */
function writeLocalFile(relativePath: string, content: string) {
  const full = path.resolve(process.cwd(), relativePath)
  mkdirSync(path.dirname(full), { recursive: true })
  writeFileSync(full, content, 'utf-8')
}

function deleteLocalFile(relativePath: string) {
  const full = path.resolve(process.cwd(), relativePath)
  if (existsSync(full)) unlinkSync(full)
}

/**
 * 多个文件走一次 Git commit（create/update/delete 混合）
 *
 * 返回值：
 *   - localOnly=true：未配置 GitHub，走本地文件写入兜底，无 commit sha。
 *   - localOnly=false：已成功 push 到远程分支，返回 commit sha 与 UI 跳转链接。
 */
export async function commitContentChanges(params: {
  message: string
  upserts?: CommitFile[]
  deletes?: DeleteFile[]
}): Promise<{
  committed: boolean
  sha?: string
  localOnly: boolean
  commitHtmlUrl?: string
  actionsRunUrl?: string
}> {
  const { message, upserts = [], deletes = [] } = params

  // 未配置 GitHub：开发环境可直接落盘；生产环境必须显式报错，避免“保存成功但未发布”。
  if (!isConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw createError({
        statusCode: 500,
        statusMessage: '生产环境缺少 GitHub 配置：请设置 GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO 后再保存内容。'
      })
    }
    for (const f of upserts) writeLocalFile(f.path, f.content)
    for (const f of deletes) deleteLocalFile(f.path)
    return { committed: true, localOnly: true }
  }

  const cfg = assertConfig()
  const octokit = getOctokit()
  const owner = cfg.owner
  const repo = cfg.repo
  const branch = cfg.branch
  const MAX_REF_UPDATE_RETRIES = 3

  type TreeItem = {
    path: string
    mode: '100644'
    type: 'blob'
    sha?: string | null
  }

  const isRefConflict = (e: any): boolean => {
    const status = Number(e?.status || 0)
    const msg = String(e?.message || '')
    return status === 409 || status === 422 || /reference update failed|is at .* but expected|fast[- ]forward/i.test(msg)
  }

  let committedSha = ''
  for (let attempt = 1; attempt <= MAX_REF_UPDATE_RETRIES; attempt++) {
    try {
      const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`
      })
      const baseSha = refData.object.sha

      const { data: commitData } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: baseSha
      })
      const baseTreeSha = commitData.tree.sha

      const treeItems: TreeItem[] = []
      for (const f of upserts) {
        const { data: blob } = await octokit.rest.git.createBlob({
          owner,
          repo,
          content: Buffer.from(f.content, 'utf-8').toString('base64'),
          encoding: 'base64'
        })
        treeItems.push({
          path: f.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        })
      }
      for (const f of deletes) {
        treeItems.push({
          path: f.path,
          mode: '100644',
          type: 'blob',
          sha: null
        })
      }

      const { data: newTree } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseTreeSha,
        tree: treeItems as any
      })

      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message,
        tree: newTree.sha,
        parents: [baseSha],
        committer: {
          name: cfg.committerName,
          email: cfg.committerEmail
        }
      })

      // 只有 head 没被别人推进时才会成功；冲突会在 catch 里重试。
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha
      })

      committedSha = newCommit.sha
      break
    } catch (e: any) {
      if (attempt < MAX_REF_UPDATE_RETRIES && isRefConflict(e)) continue
      throw e
    }
  }

  // 本地同步也写一份，保证开发/单容器模式下下一次构建能立刻看到
  for (const f of upserts) writeLocalFile(f.path, f.content)
  for (const f of deletes) deleteLocalFile(f.path)

  const commitHtmlUrl = `https://github.com/${owner}/${repo}/commit/${committedSha}`
  // Actions 查询页按 head_sha 过滤：方便管理员点过去看是否在跑 / 失败
  const actionsRunUrl = `https://github.com/${owner}/${repo}/actions?query=${encodeURIComponent(branch + ' ' + committedSha)}`

  return {
    committed: true,
    sha: committedSha,
    localOnly: false,
    commitHtmlUrl,
    actionsRunUrl
  }
}
