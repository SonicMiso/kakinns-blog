import { queryJournals } from '../../../utils/query'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const status = (query.status as 'draft' | 'published') || undefined
  return queryJournals(event, {
    page,
    limit,
    status,
    includeUnpublished: !status
  })
})
