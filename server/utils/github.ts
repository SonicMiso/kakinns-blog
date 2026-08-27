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
 */
export async function commitContentChanges(params: {
  message: string
  upserts?: CommitFile[]
  deletes?: DeleteFile[]
}): Promise<{ committed: boolean; sha?: string; localOnly: boolean }> {
  const { message, upserts = [], deletes = [] } = params

  // 开发环境兜底：未配置 GitHub 时，直接写本地文件 + 立刻反映
  if (!isConfigured()) {
    for (const f of upserts) writeLocalFile(f.path, f.content)
    for (const f of deletes) deleteLocalFile(f.path)
    return { committed: true, localOnly: true }
  }

  const cfg = assertConfig()
  const octokit = getOctokit()
  const owner = cfg.owner
  const repo = cfg.repo
  const branch = cfg.branch

  // 1. 取分支最新 commit
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`
  })
  const baseSha = refData.object.sha

  // 2. 取最新 tree
  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha
  })
  const baseTreeSha = commitData.tree.sha

  // 3. 构建新的 tree 项（upsert 要先 blob 化，delete 用 sha=null）
  type TreeItem = {
    path: string
    mode: '100644'
    type: 'blob'
    sha?: string | null
  }
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

  // 4. 创建新 tree
  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: treeItems as any
  })

  // 5. 创建 commit
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

  // 6. 更新分支
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha
  })

  // 本地同步也写一份，保证开发/单容器模式下下一次构建能立刻看到
  for (const f of upserts) writeLocalFile(f.path, f.content)
  for (const f of deletes) deleteLocalFile(f.path)

  return { committed: true, sha: newCommit.sha, localOnly: false }
}
