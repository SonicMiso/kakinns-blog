import { Buffer } from 'node:buffer'
import { randomBytes } from 'node:crypto'
import { Octokit } from 'octokit'

type ImageConfig = {
  token: string
  owner: string
  repo: string
  branch: string
  cdnBaseUrl: string
}

type ManagedImage = {
  path: string
  url: string
  repositoryUrl: string
}

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const IMAGE_ROOT = 'uploads/'

function getImageConfig(): ImageConfig {
  const cfg = useRuntimeConfig() as any
  if (!cfg.githubToken) {
    throw createError({
      statusCode: 500,
      statusMessage: '缺少 GitHub Token：请设置 NUXT_GITHUB_TOKEN。'
    })
  }

  return {
    token: cfg.githubToken,
    owner: cfg.githubImageOwner || 'SonicMiso',
    repo: cfg.githubImageRepo || 'blog-imgs',
    branch: cfg.githubImageBranch || 'main',
    cdnBaseUrl: String(cfg.githubImageCdnBaseUrl || 'https://cdn.jsdelivr.net/gh').replace(/\/$/, '')
  }
}

function createOctokit(token: string) {
  return new Octokit({
    auth: token,
    request: { timeout: 30_000 }
  })
}

function isRefConflict(error: any): boolean {
  const status = Number(error?.status || 0)
  const message = String(error?.message || '')
  return status === 409 || status === 422 || /reference update failed|is at .* but expected|fast[- ]forward/i.test(message)
}

function normalizePath(path: string): string {
  return path.trim().replace(/^\/+/, '')
}

function isManagedImagePath(path: string): boolean {
  const normalized = normalizePath(path)
  return normalized.startsWith(IMAGE_ROOT) && /\.(jpg|png|webp|gif)$/i.test(normalized)
}

function imageUrl(cfg: ImageConfig, path: string): string {
  const encodedPath = normalizePath(path).split('/').map(encodeURIComponent).join('/')
  return `${cfg.cdnBaseUrl}/${cfg.owner}/${cfg.repo}@${cfg.branch}/${encodedPath}`
}

function repositoryUrl(cfg: ImageConfig, path: string): string {
  const encodedPath = normalizePath(path).split('/').map(encodeURIComponent).join('/')
  return `https://github.com/${cfg.owner}/${cfg.repo}/blob/${cfg.branch}/${encodedPath}`
}

export function getAllowedImageExtension(contentType: string): string | null {
  return ALLOWED_TYPES[contentType] || null
}

export function assertImageUpload(data: Buffer, contentType: string): string {
  if (!data.length) {
    throw createError({ statusCode: 400, statusMessage: '上传文件为空。' })
  }
  if (data.length > MAX_IMAGE_SIZE) {
    throw createError({ statusCode: 413, statusMessage: '图片不能超过 10 MB。' })
  }

  const extension = getAllowedImageExtension(contentType)
  if (!extension) {
    throw createError({ statusCode: 400, statusMessage: '仅支持 JPG、PNG、WebP、GIF 图片。' })
  }

  return extension
}

export async function uploadImageToGitHub(data: Buffer, contentType: string): Promise<ManagedImage & { commitSha: string }> {
  const cfg = getImageConfig()
  const extension = assertImageUpload(data, contentType)
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  const stamp = now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)
  const random = randomBytes(4).toString('hex')
  const path = `uploads/${yyyy}/${mm}/${dd}/${stamp}-${random}.${extension}`
  const octokit = createOctokit(cfg.token)

  let commitSha = ''
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: cfg.owner,
        repo: cfg.repo,
        ref: `heads/${cfg.branch}`
      })
      const baseSha = ref.object.sha
      const { data: baseCommit } = await octokit.rest.git.getCommit({
        owner: cfg.owner,
        repo: cfg.repo,
        commit_sha: baseSha
      })
      const { data: blob } = await octokit.rest.git.createBlob({
        owner: cfg.owner,
        repo: cfg.repo,
        content: data.toString('base64'),
        encoding: 'base64'
      })
      const { data: tree } = await octokit.rest.git.createTree({
        owner: cfg.owner,
        repo: cfg.repo,
        base_tree: baseCommit.tree.sha,
        tree: [{ path, mode: '100644', type: 'blob', sha: blob.sha }]
      })
      const { data: commit } = await octokit.rest.git.createCommit({
        owner: cfg.owner,
        repo: cfg.repo,
        message: `upload image: ${path}`,
        tree: tree.sha,
        parents: [baseSha]
      })
      await octokit.rest.git.updateRef({
        owner: cfg.owner,
        repo: cfg.repo,
        ref: `heads/${cfg.branch}`,
        sha: commit.sha
      })
      commitSha = commit.sha
      break
    } catch (error) {
      if (attempt < 3 && isRefConflict(error)) continue
      throw createError({
        statusCode: 502,
        statusMessage: `图片上传到 GitHub 失败：${String((error as any)?.message || 'Unknown error')}`
      })
    }
  }

  return {
    path,
    url: imageUrl(cfg, path),
    repositoryUrl: repositoryUrl(cfg, path),
    commitSha
  }
}

export async function listManagedImages(): Promise<ManagedImage[]> {
  const cfg = getImageConfig()
  const octokit = createOctokit(cfg.token)
  const { data: ref } = await octokit.rest.git.getRef({
    owner: cfg.owner,
    repo: cfg.repo,
    ref: `heads/${cfg.branch}`
  })
  const { data: tree } = await octokit.rest.git.getTree({
    owner: cfg.owner,
    repo: cfg.repo,
    tree_sha: ref.object.sha,
    recursive: 'true'
  })

  return tree.tree
    .filter(item => item.type === 'blob' && typeof item.path === 'string' && isManagedImagePath(item.path))
    .map(item => ({
      path: item.path!,
      url: imageUrl(cfg, item.path!),
      repositoryUrl: repositoryUrl(cfg, item.path!)
    }))
    .sort((a, b) => b.path.localeCompare(a.path))
}

export async function deleteManagedImage(path: string): Promise<{ path: string; commitSha: string }> {
  const cfg = getImageConfig()
  const normalized = normalizePath(path)
  if (!isManagedImagePath(normalized)) {
    throw createError({ statusCode: 400, statusMessage: '只能删除图片管理目录 uploads/ 下的图片。' })
  }

  const octokit = createOctokit(cfg.token)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: cfg.owner,
        repo: cfg.repo,
        ref: `heads/${cfg.branch}`
      })
      const baseSha = ref.object.sha
      const { data: baseCommit } = await octokit.rest.git.getCommit({
        owner: cfg.owner,
        repo: cfg.repo,
        commit_sha: baseSha
      })
      const { data: baseTree } = await octokit.rest.git.getTree({
        owner: cfg.owner,
        repo: cfg.repo,
        tree_sha: baseCommit.tree.sha,
        recursive: 'true'
      })
      const target = baseTree.tree.find(item => item.path === normalized && item.type === 'blob')
      if (!target?.sha) {
        throw createError({ statusCode: 404, statusMessage: '图片不存在。' })
      }

      const { data: newTree } = await octokit.rest.git.createTree({
        owner: cfg.owner,
        repo: cfg.repo,
        base_tree: baseCommit.tree.sha,
        tree: [{ path: normalized, mode: '100644', type: 'blob', sha: null } as any]
      })
      const { data: commit } = await octokit.rest.git.createCommit({
        owner: cfg.owner,
        repo: cfg.repo,
        message: `delete image: ${normalized}`,
        tree: newTree.sha,
        parents: [baseSha]
      })
      await octokit.rest.git.updateRef({
        owner: cfg.owner,
        repo: cfg.repo,
        ref: `heads/${cfg.branch}`,
        sha: commit.sha
      })
      return { path: normalized, commitSha: commit.sha }
    } catch (error: any) {
      if (attempt < 3 && isRefConflict(error)) continue
      if (error?.statusCode) throw error
      throw createError({
        statusCode: 502,
        statusMessage: `删除图片失败：${String(error?.message || 'Unknown error')}`
      })
    }
  }

  throw createError({ statusCode: 502, statusMessage: '删除图片失败。' })
}

export { MAX_IMAGE_SIZE }
