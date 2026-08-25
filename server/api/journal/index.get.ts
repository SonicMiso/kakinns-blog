import { queryJournals } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = parseInt(q.page as string) || 1
  const limit = parseInt(q.limit as string) || 10
  return queryJournals(event, { status: 'published', page, limit })
})
