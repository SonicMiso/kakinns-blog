import { queryCollection } from '@nuxt/content/server'
import type { Journal, PaginatedResponse, Work } from '~/types'
import { bodyLikeToString } from './rawContent'
import type { H3Event } from 'h3'
import { readFrontmatterString, tryReadCollectionSource, type CollectionName } from './contentSource'

export interface AdminWorkEntry extends Work {
  process: string
  storagePath: string
}

export interface AdminJournalEntry extends Journal {
  content: string
  storagePath: string
}

const WORK_CATEGORIES = new Set(['wood', 'ceramics', 'textile', 'paper', 'metal', 'other'])
const CONTENT_STATUSES = new Set(['draft', 'published'])

function normalizeStatus(value: unknown): 'draft' | 'published' {
  if (typeof value === 'string' && CONTENT_STATUSES.has(value)) {
    return value as 'draft' | 'published'
  }
  return 'draft'
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item)).filter(Boolean)
}

function resolveStoragePath(collection: CollectionName, row: any, slug: string): string {
  const stem = typeof row?.stem === 'string' ? row.stem : ''
  if (stem.startsWith(`${collection}/`)) return `content/${stem}.md`
  return `content/${collection}/${slug}.md`
}

async function resolveExcerpt(
  collection: CollectionName,
  slug: string,
  rowExcerpt: string,
  rowDescription: string
): Promise<string> {
  const source = await tryReadCollectionSource(collection, slug)
  return readFrontmatterString(
    source,
    'excerpt',
    readFrontmatterString(source, 'summary', rowExcerpt || rowDescription || '')
  )
}

function sortByNewest<T extends { date: string, createdAt: string }>(a: T, b: T): number {
  const dateCompare = b.date.localeCompare(a.date)
  if (dateCompare !== 0) return dateCompare
  return b.createdAt.localeCompare(a.createdAt)
}

export async function listAdminWorks(opts: {
  event: H3Event
  page?: number
  limit?: number
  category?: string
  status?: 'draft' | 'published'
} = {}): Promise<PaginatedResponse<Work>> {
  const page = Math.max(1, opts.page || 1)
  const limit = Math.max(1, opts.limit || 50)
  const offset = (page - 1) * limit
  let query = queryCollection<Work>(opts.event, 'works')
  if (opts.category) query = query.where('category', '=', opts.category) as any
  if (opts.status) query = query.where('status', '=', opts.status) as any
  const rows = await (query.order('date', 'DESC').order('createdAt', 'DESC') as any).all()
  const all = await Promise.all(rows.map(async (row: any) => {
    const slug = typeof row.slug === 'string' ? row.slug : ''
    const category = typeof row.category === 'string' && WORK_CATEGORIES.has(row.category) ? row.category : 'other'
    const excerpt = await resolveExcerpt('works', slug, normalizeString(row.excerpt), normalizeString(row.description))
    return {
      title: normalizeString(row.title),
      slug,
      date: normalizeString(row.date),
      createdAt: normalizeString(row.createdAt),
      updatedAt: normalizeString(row.updatedAt),
      category,
      cover: normalizeString(row.cover),
      excerpt,
      materials: normalizeStringArray(row.materials),
      tools: normalizeStringArray(row.tools),
      gallery: normalizeStringArray(row.gallery),
      featured: row.featured === true,
      status: normalizeStatus(row.status),
      process: bodyLikeToString(row.body),
      storagePath: resolveStoragePath('works', row, slug)
    } satisfies AdminWorkEntry
  }))
  all.sort(sortByNewest)

  return {
    items: all.slice(offset, offset + limit),
    total: all.length,
    page,
    limit
  }
}

export async function listAdminJournals(opts: {
  event: H3Event
  page?: number
  limit?: number
  status?: 'draft' | 'published'
} = {}): Promise<PaginatedResponse<Journal>> {
  const page = Math.max(1, opts.page || 1)
  const limit = Math.max(1, opts.limit || 50)
  const offset = (page - 1) * limit
  let query = queryCollection<Journal>(opts.event, 'journal')
  if (opts.status) query = query.where('status', '=', opts.status) as any
  const rows = await (query.order('date', 'DESC').order('createdAt', 'DESC') as any).all()
  const all = await Promise.all(rows.map(async (row: any) => {
    const slug = typeof row.slug === 'string' ? row.slug : ''
    const excerpt = await resolveExcerpt('journal', slug, normalizeString(row.excerpt), normalizeString(row.description))
    return {
      title: normalizeString(row.title),
      slug,
      date: normalizeString(row.date),
      createdAt: normalizeString(row.createdAt),
      updatedAt: normalizeString(row.updatedAt),
      cover: normalizeString(row.cover),
      excerpt,
      status: normalizeStatus(row.status),
      content: bodyLikeToString(row.body),
      storagePath: resolveStoragePath('journal', row, slug)
    } satisfies AdminJournalEntry
  }))
  all.sort(sortByNewest)

  return {
    items: all.slice(offset, offset + limit),
    total: all.length,
    page,
    limit
  }
}

export async function getAdminWorkBySlug(event: H3Event, slug: string): Promise<AdminWorkEntry | null> {
  const rows = await queryCollection<Work>(event, 'works').where('slug', '=', slug).limit(1).all() as any[]
  const row = rows[0]
  if (!row) return null
  const category = typeof row.category === 'string' && WORK_CATEGORIES.has(row.category) ? row.category : 'other'
  const excerpt = await resolveExcerpt('works', slug, normalizeString(row.excerpt), normalizeString(row.description))
  return {
    title: normalizeString(row.title),
    slug,
    date: normalizeString(row.date),
    createdAt: normalizeString(row.createdAt),
    updatedAt: normalizeString(row.updatedAt),
    category,
    cover: normalizeString(row.cover),
    excerpt,
    materials: normalizeStringArray(row.materials),
    tools: normalizeStringArray(row.tools),
    gallery: normalizeStringArray(row.gallery),
    featured: row.featured === true,
    status: normalizeStatus(row.status),
    process: bodyLikeToString(row.body),
    storagePath: resolveStoragePath('works', row, slug)
  }
}

export async function getAdminJournalBySlug(event: H3Event, slug: string): Promise<AdminJournalEntry | null> {
  const rows = await queryCollection<Journal>(event, 'journal').where('slug', '=', slug).limit(1).all() as any[]
  const row = rows[0]
  if (!row) return null
  const excerpt = await resolveExcerpt('journal', slug, normalizeString(row.excerpt), normalizeString(row.description))
  return {
    title: normalizeString(row.title),
    slug,
    date: normalizeString(row.date),
    createdAt: normalizeString(row.createdAt),
    updatedAt: normalizeString(row.updatedAt),
    cover: normalizeString(row.cover),
    excerpt,
    status: normalizeStatus(row.status),
    content: bodyLikeToString(row.body),
    storagePath: resolveStoragePath('journal', row, slug)
  }
}

export async function adminWorkSlugExists(event: H3Event, slug: string): Promise<boolean> {
  const rows = await queryCollection<Work>(event, 'works').where('slug', '=', slug).limit(1).all()
  return rows.length > 0
}

export async function adminJournalSlugExists(event: H3Event, slug: string): Promise<boolean> {
  const rows = await queryCollection<Journal>(event, 'journal').where('slug', '=', slug).limit(1).all()
  return rows.length > 0
}
