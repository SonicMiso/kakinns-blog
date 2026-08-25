import type { Journal } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { commitContentChanges } from '../../../utils/github'

function frontmatter(obj: Record<string, any>) {
  const lines: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    if (typeof v === 'string') lines.push(`${k}: ${JSON.stringify(v)}`)
    else lines.push(`${k}: ${JSON.stringify(v)}`)
  }
  return `---\n${lines.join('\n')}\n---\n\n`
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const slug = String(body.slug || `journal-${Date.now()}`).replace(/[^\w\u4e00-\u9fa5-]/g, '-').replace(/-+/g, '-')
  const title = body.title || '未命名日志'
  const now = new Date().toISOString()

  const all = (await queryCollection<Journal>(event, 'journal').all()) as Journal[]
  const maxId = all.reduce((m, j) => Math.max(m, j.id || 0), 0)

  const journal: Journal = {
    id: maxId + 1,
    title,
    slug,
    date: body.date || new Date().toISOString().split('T')[0],
    cover: body.cover || '',
    excerpt: body.excerpt || '',
    status: body.status || 'draft',
    createdAt: now,
    updatedAt: now,
    content: body.content || ''
  }

  const fm = frontmatter({
    id: journal.id,
    title: journal.title,
    slug: journal.slug,
    date: journal.date,
    cover: journal.cover,
    excerpt: journal.excerpt,
    status: journal.status,
    createdAt: journal.createdAt,
    updatedAt: journal.updatedAt
  })
  const mdContent = fm + (journal.content || '') + '\n'

  await commitContentChanges({
    message: `feat(journal): 新建日志 ${title} (${slug})`,
    upserts: [{ path: `content/journal/${slug}.md`, content: mdContent }]
  })

  return journal
})
