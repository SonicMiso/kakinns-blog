import type { Journal } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { commitContentChanges } from '../../../utils/github'

// ⚠️ 绝对禁止手写 frontmatter 'id' 字段
function frontmatter(obj: Record<string, any>) {
  const lines: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'id' || v === undefined) continue
    lines.push(`${k}: ${JSON.stringify(v)}`)
  }
  return `---\n${lines.join('\n')}\n---\n\n`
}

export default defineEventHandler(async (event) => {
  const oldSlug = getRouterParam(event, 'id') || ''
  const matches = (await queryCollection<Journal>(event, 'journal').where('slug', '=', oldSlug).limit(1).all()) as Journal[]
  const old = matches[0] as any
  if (!old) throw createError({ statusCode: 404, statusMessage: 'Journal not found' })

  const body = await readBody(event)

  // 继承旧数据，不写 id；createdAt 保留原值（不让前端改）
  const meta: Record<string, any> = {
    title: old.title,
    slug: old.slug,
    date: old.date,
    createdAt: old.createdAt,
    cover: old.cover,
    excerpt: old.excerpt,
    status: old.status || 'draft'
  }

  const PROTECTED_KEYS = new Set(['id', 'createdAt', 'updatedAt'])
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue
    if (PROTECTED_KEYS.has(k)) continue
    if (k === 'content') continue // 正文单独处理
    meta[k] = v
  }

  // 强制更新 updatedAt
  meta.updatedAt = new Date().toISOString()

  // 正文：优先 body.content（新名），否则沿用旧
  const contentText: string =
    body.content !== undefined ? String(body.content) : (old.content || old.body || '')

  const fm = frontmatter(meta)
  const mdContent = fm + contentText + '\n'

  const deletes: { path: string }[] = []
  if (old.slug !== meta.slug) deletes.push({ path: `content/journal/${old.slug}.md` })

  await commitContentChanges({
    message: `edit(journal): 更新日志 ${meta.title} (${meta.slug})`,
    upserts: [{ path: `content/journal/${meta.slug}.md`, content: mdContent }],
    deletes
  })

  return { ...meta, content: contentText } as Journal
})
