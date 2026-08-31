import { getAdminJournalBySlug } from '../../../utils/adminContent'
import { commitContentChanges } from '../../../utils/github'

// 路由参数语义：slug（字符串）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id') || ''
  const journal = await getAdminJournalBySlug(slug)
  if (!journal) throw createError({ statusCode: 404, statusMessage: 'Journal not found' })

  const result = await commitContentChanges({
    message: `delete(journal): 删除日志 ${journal.title} (${journal.slug})`,
    deletes: [{ path: journal.storagePath }]
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
