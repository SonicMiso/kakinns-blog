import { queryWorkBySlug } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  const work = await queryWorkBySlug(event, slug)
  if (!work || work.status !== 'published') {
    throw createError({ statusCode: 404, statusMessage: 'Work not found' })
  }
  return work
})
