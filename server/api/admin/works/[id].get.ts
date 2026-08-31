import { getAdminWorkBySlug } from '../../../utils/adminContent'

// 路由参数语义：slug（字符串，唯一标识）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id') || ''
  const work = await getAdminWorkBySlug(slug)
  if (!work) throw createError({ statusCode: 404, statusMessage: 'Work not found' })
  return work
})
