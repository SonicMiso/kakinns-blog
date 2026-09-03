import { listAdminJournals } from '../../../utils/adminContent'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const status = (query.status as 'draft' | 'published') || undefined
  return listAdminJournals({
    event,
    page,
    limit,
    status
  })
})
