import { queryJournalBySlug } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  const journal = await queryJournalBySlug(event, slug)
  if (!journal || journal.status !== 'published') {
    throw createError({ statusCode: 404, statusMessage: 'Journal not found' })
  }
  return journal
})
