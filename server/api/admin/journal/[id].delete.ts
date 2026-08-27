import type { Journal } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { commitContentChanges } from '../../../utils/github'

// 路由参数语义：slug（字符串）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id') || ''
  const matches = (await queryCollection<Journal>(event, 'journal').where('slug', '=', slug).limit(1).all()) as Journal[]
  const journal = matches[0]
  if (!journal) throw createError({ statusCode: 404, statusMessage: 'Journal not found' })

  const result = await commitContentChanges({
    message: `delete(journal): 删除日志 ${journal.title} (${journal.slug})`,
    deletes: [{ path: `content/journal/${journal.slug}.md` }]
  })
  return {
    success: true,
    sync: {
      localOnly: result.localOnly,
      commitSha: result.sha || '',
      commitHtmlUrl: result.commitHtmlUrl || '',
      actionsRunUrl: result.actionsRunUrl || '',
      savedAt: new Date().toISOString()
    }
  }
})
