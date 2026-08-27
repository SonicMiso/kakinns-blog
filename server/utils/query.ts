// 读接口：从 Nuxt Content collections 查询，兼容旧 API 的分页响应格式

import type { Work, Journal, PaginatedResponse } from '~/types'
import { queryCollection } from '@nuxt/content/server'

interface WorkQueryOptions {
  limit?: number
  page?: number
  featured?: boolean
  category?: string
  status?: 'draft' | 'published'
  includeUnpublished?: boolean
}

/**
 * 作品列表（前台 published 默认，后台 admin 可查全部）
 */
export async function queryWorks(event: any, opts: WorkQueryOptions = {}): Promise<PaginatedResponse<Work>> {
  const limit = Math.max(1, opts.limit || 100)
  const page = Math.max(1, opts.page || 1)
  const offset = (page - 1) * limit

  let q = queryCollection<Work>(event, 'works')
  if (opts.status) q = q.where('status', '=', opts.status)
  else if (!opts.includeUnpublished) q = q.where('status', '=', 'published') as any
  if (opts.category) q = q.where('category', '=', opts.category) as any
  if (opts.featured !== undefined) q = q.where('featured', '=', opts.featured) as any

  const all = await (q.order('date', 'DESC').order('createdAt', 'DESC') as any).all()
  const total = all.length
  const items = all.slice(offset, offset + limit) as Work[]
  return { items, total, page, limit }
}

export async function queryWorkBySlug(event: any, slug: string): Promise<Work | null> {
  const matches = (await queryCollection<Work>(event, 'works').where('slug', '=', slug).limit(1).all()) as Work[]
  return matches[0] || null
}

interface JournalQueryOptions {
  limit?: number
  page?: number
  status?: 'draft' | 'published'
  includeUnpublished?: boolean
}

export async function queryJournals(
  event: any,
  opts: JournalQueryOptions = {}
): Promise<PaginatedResponse<Journal>> {
  const limit = Math.max(1, opts.limit || 100)
  const page = Math.max(1, opts.page || 1)
  const offset = (page - 1) * limit

  let q = queryCollection<Journal>(event, 'journal')
  if (opts.status) q = q.where('status', '=', opts.status)
  else if (!opts.includeUnpublished) q = q.where('status', '=', 'published') as any

  const all = await (q.order('date', 'DESC').order('createdAt', 'DESC') as any).all()
  const total = all.length
  const items = all.slice(offset, offset + limit) as Journal[]
  return { items, total, page, limit }
}

export async function queryJournalBySlug(event: any, slug: string): Promise<Journal | null> {
  const matches = (await queryCollection<Journal>(event, 'journal').where('slug', '=', slug).limit(1).all()) as Journal[]
  return matches[0] || null
}
