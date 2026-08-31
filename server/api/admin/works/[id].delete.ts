import { getAdminWorkBySlug } from '../../../utils/adminContent'
import { commitContentChanges } from '../../../utils/github'

// 路由参数语义：slug（字符串）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id') || ''
  const work = await getAdminWorkBySlug(slug)
  if (!work) throw createError({ statusCode: 404, statusMessage: 'Work not found' })

  const result = await commitContentChanges({
    message: `delete(works): 删除作品 ${work.title} (${work.slug})`,
    deletes: [{ path: work.storagePath }]
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
