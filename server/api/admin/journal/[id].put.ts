import type { Journal } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { commitContentChanges } from '../../../utils/github'

function frontmatter(obj: Record<string, any>) {
  const lines: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    lines.push(`${k}: ${JSON.stringify(v)}`)
  }
  return `---\n${lines.join('\n')}\n---\n\n`
}

/**
 * 从 Markdown 内容里剥离 frontmatter，返回 body 正文
 */
function stripFrontmatter(md: string): string {
  const m = md.match(/^---\s*\n[\s\S]*?\n---\s*\n?([\s\S]*)$/)
  return m ? m[1] : md
}

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const matches = (await queryCollection<Journal>(event, 'journal').where('id', '=', id).limit(1).all()) as Journal[]
  const old = matches[0]
  if (!old) throw createError({ statusCode: 404, statusMessage: 'Journal not found' })

  const body = await readBody(event)

  // queryCollection 返回的对象可能没有 content（或 body 字段），
  // 这里如果用户没改正文就沿用 old.content；否则用 body.content
  const updated: Journal = { ...old, ...body }
  // 因为 collection 是 type:'page'，Nuxt Content 可能把正文放 body 字段
  const contentText: string =
    body.content !== undefined ? body.content : (old as any).content || (old as any).body || ''
  updated.updatedAt = new Date().toISOString()
  ;(updated as any).content = contentText

  const fm = frontmatter({
    id: updated.id,
    title: updated.title,
    slug: updated.slug,
    date: updated.date,
    cover: updated.cover,
    excerpt: updated.excerpt,
    status: updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  })
  const mdContent = fm + contentText + '\n'

  const deletes: { path: string }[] = []
  if (old.slug !== updated.slug) deletes.push({ path: `content/journal/${old.slug}.md` })

  void stripFrontmatter
  await commitContentChanges({
    message: `edit(journal): 更新日志 ${updated.title} (${updated.slug})`,
    upserts: [{ path: `content/journal/${updated.slug}.md`, content: mdContent }],
    deletes
  })
  return updated
})
