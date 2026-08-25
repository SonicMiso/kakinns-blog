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

  const all = (await queryCollection<Work>(event, 'works').all()) as Work[]
  const maxId = all.reduce((m, w) => Math.max(m, (w as any).id || 0), 0)

  const meta = {
    id: maxId + 1,
    title,
    slug,
    date: body.date || new Date().toISOString().split('T')[0],
    category: body.category || 'wood',
    cover: body.cover || '',
    excerpt: body.excerpt || '',
    materials: parseArrayField(body.materials),
    tools: parseArrayField(body.tools),
    gallery: parseArrayField(body.gallery),
    featured: body.featured === true || body.featured === 'true',
    status: body.status || 'draft',
    createdAt: now,
    updatedAt: now
  }
  const md = frontmatter(meta) + (body.process || '') + '\n'

  await commitContentChanges({
    message: `feat(works): 新建作品 ${title} (${slug})`,
    upserts: [{ path: `content/works/${slug}.md`, content: md }]
  })

  return { ...meta, process: body.process || '' } as Work
})
