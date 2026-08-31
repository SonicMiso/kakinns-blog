import { listAdminWorks } from '../../../utils/adminContent'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const category = query.category as string | undefined
  const status = (query.status as 'draft' | 'published') || undefined
  return listAdminWorks({
    page,
    limit,
    category,
    status
  })
})
