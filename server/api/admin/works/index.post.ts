import type { Work } from '~/types'
import { adminWorkSlugExists } from '../../../utils/adminContent'
import { commitContentChanges } from '../../../utils/github'

function parseArrayField(v: any): string[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string' && v.length > 0) {
    try {
      const parsed = JSON.parse(v)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return v.split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
    }
  }
  return []
}

// ⚠️ 绝对禁止手写 frontmatter 的 'id' 字段：id 是 Nuxt Content 内部保留字段，
// 手写会被内部覆盖成 "works/works/xxx.md" 怪路径，导致详情页 404。
function frontmatter(obj: Record<string, any>) {
  const lines: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'id' || v === undefined) continue
    if (Array.isArray(v)) {
      lines.push(`${k}: ${JSON.stringify(v)}`)
    } else if (typeof v === 'string') {
      lines.push(`${k}: ${JSON.stringify(v)}`)
    } else {
      lines.push(`${k}: ${JSON.stringify(v)}`)
    }
  }
  return `---\n${lines.join('\n')}\n---\n\n`
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const slug = String(body.slug || `work-${Date.now()}`).replace(/[^\w\u4e00-\u9fa5-]/g, '-').replace(/-+/g, '-')
  const title = body.title || '未命名作品'
  const now = new Date().toISOString()

  // ⚠️ 新建时的受保护字段：后端强制写 createdAt=updatedAt=now，
  // 即使 body 里传了 createdAt/updatedAt/id，也忽略（避免前端伪造时间）
  const meta: Record<string, any> = {
    title,
    slug,
    date: body.date || new Date().toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
    category: body.category || 'wood',
    cover: body.cover || '',
    excerpt: body.excerpt || '',
    materials: parseArrayField(body.materials),
    tools: parseArrayField(body.tools),
    gallery: parseArrayField(body.gallery),
    featured: body.featured === true || body.featured === 'true',
    status: body.status || 'draft'
  }

  // 唯一性检查：同一 collection slug 必须唯一（否则 query slug 会命中多条）
  if (await adminWorkSlugExists(event, slug)) {
    throw createError({ statusCode: 409, statusMessage: `slug ${slug} 已存在` })
  }

  const md = frontmatter(meta) + (body.process || '') + '\n'

  const result = await commitContentChanges({
    message: `feat(works): 新建作品 ${title} (${slug})`,
    upserts: [{ path: `content/works/${slug}.md`, content: md }]
  })

  return {
    ...(meta as Work),
    process: body.process || '',
    sync: {
      localOnly: result.localOnly,
      commitSha: result.sha || '',
      commitHtmlUrl: result.commitHtmlUrl || '',
      actionsRunUrl: result.actionsRunUrl || '',
      savedAt: new Date().toISOString()
    }
  } as Work & Record<string, any>
})
