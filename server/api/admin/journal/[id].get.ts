import { getAdminJournalBySlug } from '../../../utils/adminContent'

// 路由参数语义：slug（字符串）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id') || ''
  const journal = await getAdminJournalBySlug(event, slug)
  if (!journal) throw createError({ statusCode: 404, statusMessage: 'Journal not found' })
  return journal
})
