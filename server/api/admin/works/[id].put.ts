import type { Work } from '~/types'
import { queryCollection } from '@nuxt/content/server'
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

// ⚠️ 绝对禁止手写 frontmatter 的 'id' 字段：id 是 Nuxt Content 内部保留字段（主键），
// 手写会被内部覆盖成 "works/works/xxx.md" 这种怪路径导致查询失效。
function frontmatter(obj: Record<string, any>) {
  const lines: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    // 过滤掉 id（内部字段），以及任何 undefined 值
    if (k === 'id' || v === undefined) continue
    if (Array.isArray(v)) lines.push(`${k}: ${JSON.stringify(v)}`)
    else lines.push(`${k}: ${JSON.stringify(v)}`)
  }
  return `---\n${lines.join('\n')}\n---\n\n`
}

// 路由参数语义：slug（旧 slug 字符串）；用户若在表单中改了 slug 则需移动（删旧文件）
export default defineEventHandler(async (event) => {
  const oldSlug = getRouterParam(event, 'id') || ''
  const matches = (await queryCollection<Work>(event, 'works').where('slug', '=', oldSlug).limit(1).all()) as Work[]
  const old = matches[0] as any
  if (!old) throw createError({ statusCode: 404, statusMessage: 'Work not found' })

  const body = await readBody(event)

  // 初始化：继承旧值，但 id 永远扔掉（不写到 frontmatter）
  const meta: Record<string, any> = {
    title: old.title,
    slug: old.slug,
    date: old.date,
    createdAt: old.createdAt,   // ⚠️ 保留原创建时间（用户不能改）
    category: old.category,
    cover: old.cover,
    excerpt: old.excerpt,
    materials: old.materials || [],
    tools: old.tools || [],
    gallery: old.gallery || [],
    featured: !!old.featured,
    status: old.status || 'draft'
  }

  // ⚠️ 禁止用户覆盖的字段（后端说了算）
  const PROTECTED_KEYS = new Set(['id', 'createdAt', 'updatedAt'])

  // 用 body patch 覆盖
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue
    if (PROTECTED_KEYS.has(k)) continue
    switch (k) {
      case 'materials':
      case 'tools':
      case 'gallery':
        meta[k] = parseArrayField(v)
        break
      case 'featured':
        meta.featured = v === true || v === 'true'
        break
      case 'process':
        // 正文，单独处理
        break
      default:
        meta[k] = v
    }
  }

  // ⚠️ updatedAt 后端强制更新（忽略任何客户端传值）
  meta.updatedAt = new Date().toISOString()

  // 正文：优先 body.process（新名），否则沿用旧
  const processText: string =
    body.process !== undefined ? String(body.process) : (old.content || old.body || old.process || '')

  const md = frontmatter(meta) + processText + '\n'

  const deletes: { path: string }[] = []
  if (old.slug !== meta.slug) deletes.push({ path: `content/works/${old.slug}.md` })

  const result = await commitContentChanges({
    message: `edit(works): 更新作品 ${meta.title} (${meta.slug})`,
    upserts: [{ path: `content/works/${meta.slug}.md`, content: md }],
    deletes
  })

  return {
    ...(meta as Work),
    process: processText,
    sync: {
      localOnly: result.localOnly,
      commitSha: result.sha || '',
      commitHtmlUrl: result.commitHtmlUrl || '',
      actionsRunUrl: result.actionsRunUrl || '',
      savedAt: new Date().toISOString()
    }
  } as Work & Record<string, any>
})
