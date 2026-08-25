import { queryWorks } from '../../utils/query'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const page = parseInt(q.page as string) || 1
  const limit = parseInt(q.limit as string) || 20
  const category = q.category as string | undefined
  const featured =
    q.featured === 'true' ? true : q.featured === 'false' ? false : undefined

  return queryWorks(event, { status: 'published', category, featured, page, limit })
})
