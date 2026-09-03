import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { queryCollection } from '@nuxt/content/server'
import type { H3Event } from 'h3'
import type { Journal, PaginatedResponse, Work } from '~/types'
import { bodyLikeToString } from './rawContent'
import { parseMarkdownSource, type CollectionName } from './contentSource'

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
  if (Array.isArray(value)) {
    return value
      .map(item => (item == null ? '' : String(item).trim()))
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|[,，]/)
      .map(item => item.trim())
      .filter(Boolean)
  }
  return []
}

function readFrontmatterString(frontmatter: Record<string, unknown>, key: string, fallback = ''): string {
  if (!Object.prototype.hasOwnProperty.call(frontmatter, key)) return fallback
  const value = frontmatter[key]
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return ''
  return String(value)
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return Boolean(value)
}

function readExcerpt(frontmatter: Record<string, unknown>): string {
  return readFrontmatterString(frontmatter, 'excerpt') || readFrontmatterString(frontmatter, 'summary') || ''
}

function sortByNewest<T extends { date: string, createdAt: string }>(a: T, b: T): number {
  const dateCompare = b.date.localeCompare(a.date)
  if (dateCompare !== 0) return dateCompare
  return b.createdAt.localeCompare(a.createdAt)
}

function ensureStoragePath(collection: CollectionName, slug: string): string {
  return `content/${collection}/${slug}.md`
}

async function listMarkdownFilesRecursive(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const nested = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return listMarkdownFilesRecursive(fullPath)
      if (entry.isFile() && fullPath.toLowerCase().endsWith('.md')) return [fullPath]
      return []
    }))
    return nested.flat()
  } catch (error: any) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

async function readLocalWorks(): Promise<AdminWorkEntry[]> {
  const baseDir = path.resolve(process.cwd(), 'content', 'works')
  const files = await listMarkdownFilesRecursive(baseDir)
  const items = await Promise.all(files.map(async (filePath) => {
    const raw = await readFile(filePath, 'utf8')
    const { frontmatter, body } = parseMarkdownSource(raw)
    const record = frontmatter as Record<string, unknown>
    const slug = normalizeString(readFrontmatterString(record, 'slug')) || path.basename(filePath, '.md')
    const category = readFrontmatterString(record, 'category', 'wood')

    return {
      title: readFrontmatterString(record, 'title'),
      slug,
      date: readFrontmatterString(record, 'date'),
      createdAt: readFrontmatterString(record, 'createdAt'),
      updatedAt: readFrontmatterString(record, 'updatedAt'),
      category: WORK_CATEGORIES.has(category) ? category : 'other',
      cover: readFrontmatterString(record, 'cover'),
      excerpt: readExcerpt(record),
      materials: normalizeStringArray(record.materials),
      tools: normalizeStringArray(record.tools),
      gallery: normalizeStringArray(record.gallery),
      featured: readBoolean(record.featured),
      status: normalizeStatus(record.status),
      process: normalizeString(record.process) || body,
      storagePath: path.relative(process.cwd(), filePath).replace(/\\/g, '/')
    } satisfies AdminWorkEntry
  }))

  items.sort(sortByNewest)
  return items
}

async function readLocalJournals(): Promise<AdminJournalEntry[]> {
  const baseDir = path.resolve(process.cwd(), 'content', 'journal')
  const files = await listMarkdownFilesRecursive(baseDir)
  const items = await Promise.all(files.map(async (filePath) => {
    const raw = await readFile(filePath, 'utf8')
    const { frontmatter, body } = parseMarkdownSource(raw)
    const record = frontmatter as Record<string, unknown>
    const slug = normalizeString(readFrontmatterString(record, 'slug')) || path.basename(filePath, '.md')

    return {
      title: readFrontmatterString(record, 'title'),
      slug,
      date: readFrontmatterString(record, 'date'),
      createdAt: readFrontmatterString(record, 'createdAt'),
      updatedAt: readFrontmatterString(record, 'updatedAt'),
      cover: readFrontmatterString(record, 'cover'),
      excerpt: readExcerpt(record),
      status: normalizeStatus(record.status),
      content: normalizeString(record.content) || body,
      storagePath: path.relative(process.cwd(), filePath).replace(/\\/g, '/')
    } satisfies AdminJournalEntry
  }))

  items.sort(sortByNewest)
  return items
}

async function readWorksFromCollection(event: H3Event): Promise<AdminWorkEntry[]> {
  const rows = await (queryCollection<Work>(event, 'works').order('date', 'DESC').order('createdAt', 'DESC') as any).all()
  return rows.map((row: any) => {
    const slug = normalizeString(row.slug)
    const category = normalizeString(row.category)
    return {
      title: normalizeString(row.title),
      slug,
      date: normalizeString(row.date),
      createdAt: normalizeString(row.createdAt),
      updatedAt: normalizeString(row.updatedAt),
      category: WORK_CATEGORIES.has(category) ? category : 'other',
      cover: normalizeString(row.cover),
      excerpt: normalizeString(row.excerpt) || normalizeString(row.summary) || normalizeString(row.description),
      materials: normalizeStringArray(row.materials),
      tools: normalizeStringArray(row.tools),
      gallery: normalizeStringArray(row.gallery),
      featured: row.featured === true,
      status: normalizeStatus(row.status),
      process: bodyLikeToString(row.body) || normalizeString(row.process),
      storagePath: ensureStoragePath('works', slug)
    } satisfies AdminWorkEntry
  })
}

async function readJournalsFromCollection(event: H3Event): Promise<AdminJournalEntry[]> {
  const rows = await (queryCollection<Journal>(event, 'journal').order('date', 'DESC').order('createdAt', 'DESC') as any).all()
  return rows.map((row: any) => {
    const slug = normalizeString(row.slug)
    return {
      title: normalizeString(row.title),
      slug,
      date: normalizeString(row.date),
      createdAt: normalizeString(row.createdAt),
      updatedAt: normalizeString(row.updatedAt),
      cover: normalizeString(row.cover),
      excerpt: normalizeString(row.excerpt) || normalizeString(row.summary) || normalizeString(row.description),
      status: normalizeStatus(row.status),
      content: bodyLikeToString(row.body) || normalizeString(row.content),
      storagePath: ensureStoragePath('journal', slug)
    } satisfies AdminJournalEntry
  })
}

async function loadAdminWorks(event?: H3Event): Promise<AdminWorkEntry[]> {
  const local = await readLocalWorks()
  if (local.length > 0) return local
  if (!event) return []
  return readWorksFromCollection(event)
}

async function loadAdminJournals(event?: H3Event): Promise<AdminJournalEntry[]> {
  const local = await readLocalJournals()
  if (local.length > 0) return local
  if (!event) return []
  return readJournalsFromCollection(event)
}

export async function listAdminWorks(opts: {
  event?: H3Event
  page?: number
  limit?: number
  category?: string
  status?: 'draft' | 'published'
} = {}): Promise<PaginatedResponse<Work>> {
  const page = Math.max(1, opts.page || 1)
  const limit = Math.max(1, opts.limit || 50)
  const offset = (page - 1) * limit
  const all = await loadAdminWorks(opts.event)

  const filtered = all.filter((row) => {
    if (opts.category && row.category !== opts.category) return false
    if (opts.status && row.status !== opts.status) return false
    return true
  })

  filtered.sort(sortByNewest)

  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    page,
    limit
  }
}

export async function listAdminJournals(opts: {
  event?: H3Event
  page?: number
  limit?: number
  status?: 'draft' | 'published'
} = {}): Promise<PaginatedResponse<Journal>> {
  const page = Math.max(1, opts.page || 1)
  const limit = Math.max(1, opts.limit || 50)
  const offset = (page - 1) * limit
  const all = await loadAdminJournals(opts.event)

  const filtered = all.filter((row) => {
    if (opts.status && row.status !== opts.status) return false
    return true
  })

  filtered.sort(sortByNewest)

  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    page,
    limit
  }
}

export async function getAdminWorkBySlug(event: H3Event, slug: string): Promise<AdminWorkEntry | null> {
  const all = await loadAdminWorks(event)
  return all.find(item => item.slug === slug) || null
}

export async function getAdminJournalBySlug(event: H3Event, slug: string): Promise<AdminJournalEntry | null> {
  const all = await loadAdminJournals(event)
  return all.find(item => item.slug === slug) || null
}

export async function adminWorkSlugExists(event: H3Event, slug: string): Promise<boolean> {
  const all = await loadAdminWorks(event)
  return all.some(item => item.slug === slug)
}

export async function adminJournalSlugExists(event: H3Event, slug: string): Promise<boolean> {
  const all = await loadAdminJournals(event)
  return all.some(item => item.slug === slug)
}
