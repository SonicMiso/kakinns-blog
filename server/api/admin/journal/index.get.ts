import type { Journal } from '~/types'
import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const status = (query.status as 'draft' | 'published') || undefined

  let q: any = queryCollection(event, 'journal')
  if (status) q = q.where('status', '=', status)
  const list: Journal[] = await q.order('date', 'DESC').order('createdAt', 'DESC').all()
  const total = list.length
  const items = list.slice((page - 1) * limit, page * limit)
  return { items, total, page, limit }
})
