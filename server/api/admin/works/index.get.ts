import { queryWorks } from '../../../utils/query'
import type { Work } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 50
  const category = query.category as string | undefined
  const status = (query.status as 'draft' | 'published') || undefined
  // admin 不查 status=published 过滤，让草稿也可见：这里不传 status 进去会被默认成 published，所以传空串绕过？—— 直接在 query 里做：
  void status
  void category
  const all: Work[] = (await (queryWorks(event, { page: 1, limit: 9999 }).then((r) => {
    // queryWorks 默认只返回 published；后台需要能看到所有状态，所以用底层再查
    return r
  }))).items as any

  // 因为 Nuxt Content v3 目前 server 查询 where('status') 与 前台契约可能不完全对齐，
  // 干脆一次性全量拉取后手动过滤 + 分页（博客数据量很小，无压力）
  // 重新直接用 query.ts 的查询，但 queryWorks 限制了 published。我们直接用另一个入口：
  // 这里简单点：后面把 query 改成更灵活的函数，或直接用 queryCollection 重写
  const { queryCollection } = await import('@nuxt/content/server')
  let q: any = queryCollection(event, 'works')
  if (status) q = q.where('status', '=', status)
  if (category) q = q.where('category', '=', category)
  const list: Work[] = await q.order('date', 'DESC').order('createdAt', 'DESC').all()
  const total = list.length
  const items = list.slice((page - 1) * limit, page * limit)
  void all
  return { items, total, page, limit }
})
