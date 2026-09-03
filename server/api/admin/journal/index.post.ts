import type { Journal } from '~/types'
import { adminJournalSlugExists } from '../../../utils/adminContent'
import { commitContentChanges } from '../../../utils/github'

// ⚠️ 绝对禁止手写 frontmatter 'id' 字段
function frontmatter(obj: Record<string, any>) {
  const lines: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'id' || v === undefined) continue
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

  const meta: Record<string, any> = {
    title,
    slug,
    date: body.date || new Date().toISOString().split('T')[0],
    createdAt: now,    // ⚠️ 后端强制
    updatedAt: now,    // ⚠️ 后端强制
    cover: body.cover || '',
    excerpt: body.excerpt || '',
    status: body.status || 'draft'
  }

  // slug 唯一性检查
  if (await adminJournalSlugExists(event, slug)) {
    throw createError({ statusCode: 409, statusMessage: `slug ${slug} 已存在` })
  }

  const fm = frontmatter(meta)
  const mdContent = fm + (body.content || '') + '\n'

  const result = await commitContentChanges({
    message: `feat(journal): 新建日志 ${title} (${slug})`,
    upserts: [{ path: `content/journal/${slug}.md`, content: mdContent }]
  })

  return {
    ...(meta as Journal),
    content: body.content || '',
    sync: {
      localOnly: result.localOnly,
      commitSha: result.sha || '',
      commitHtmlUrl: result.commitHtmlUrl || '',
      actionsRunUrl: result.actionsRunUrl || '',
      savedAt: new Date().toISOString()
    }
  } as Journal & Record<string, any>
})
