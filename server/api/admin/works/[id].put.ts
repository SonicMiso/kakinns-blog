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

function frontmatter(obj: Record<string, any>) {
  const lines: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    if (Array.isArray(v)) lines.push(`${k}: ${JSON.stringify(v)}`)
    else lines.push(`${k}: ${JSON.stringify(v)}`)
  }
  return `---\n${lines.join('\n')}\n---\n\n`
}

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const matches = (await queryCollection<Work>(event, 'works').where('id', '=', id).limit(1).all()) as Work[]
  const old = matches[0] as any
  if (!old) throw createError({ statusCode: 404, statusMessage: 'Work not found' })

  const body = await readBody(event)
  const meta: Record<string, any> = {
    id: old.id,
    title: old.title,
    slug: old.slug,
    date: old.date,
    category: old.category,
    cover: old.cover,
    excerpt: old.excerpt,
    materials: old.materials || [],
    tools: old.tools || [],
    gallery: old.gallery || [],
    featured: !!old.featured,
    status: old.status || 'draft',
    createdAt: old.createdAt
  }

  // 用 patch 覆盖
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue
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
  meta.updatedAt = new Date().toISOString()
  const processText: string = body.process !== undefined ? body.process : (old.content || old.body || old.process || '')

  const md = frontmatter(meta) + processText + '\n'
  const deletes: { path: string }[] = []
  if (old.slug !== meta.slug) deletes.push({ path: `content/works/${old.slug}.md` })

  await commitContentChanges({
    message: `edit(works): 更新作品 ${meta.title} (${meta.slug})`,
    upserts: [{ path: `content/works/${meta.slug}.md`, content: md }],
    deletes
  })

  return { ...meta, process: processText } as Work
})
