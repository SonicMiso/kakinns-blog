import { readdir } from 'node:fs/promises'
import path from 'node:path'
import type { Journal, PaginatedResponse, Work } from '~/types'
import { parseMarkdownSource } from './contentSource'
import { readFile } from 'node:fs/promises'

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

async function listMarkdownFilesRecursive(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const nested = await Promise.all(entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return listMarkdownFilesRecursive(fullPath)
      return entry.isFile() && fullPath.toLowerCase().endsWith('.md') ? [fullPath] : []
    }))
    return nested.flat()
  } catch (error: any) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

function getFrontmatterObject(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {}
}

function readString(frontmatter: Record<string, unknown>, key: string, fallback = ''): string {
  if (!Object.prototype.hasOwnProperty.call(frontmatter, key)) return fallback
  const value = frontmatter[key]
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return ''
  return String(value)
}

function pickMarkdownBody(primary: string, fallback: string): string {
  if (typeof primary === 'string' && primary.trim().length > 0) return primary
  if (typeof fallback === 'string') return fallback
  return ''
}

function readStringArray(frontmatter: Record<string, unknown>, key: string): string[] {
  const value = frontmatter[key]
  if (!Array.isArray(value)) return []
  return value
    .map(item => (item === undefined || item === null ? '' : String(item).trim()))
    .filter(Boolean)
}

function readBoolean(frontmatter: Record<string, unknown>, key: string, fallback = false): boolean {
  if (!Object.prototype.hasOwnProperty.call(frontmatter, key)) return fallback
  const value = frontmatter[key]
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true'
  return Boolean(value)
}

function readStatus(frontmatter: Record<string, unknown>): 'draft' | 'published' {
  const value = readString(frontmatter, 'status', 'draft')
  return CONTENT_STATUSES.has(value) ? value as 'draft' | 'published' : 'draft'
}

function sortByNewest<T extends { date: string, createdAt: string }>(a: T, b: T): number {
  const dateCompare = b.date.localeCompare(a.date)
  if (dateCompare !== 0) return dateCompare
  return b.createdAt.localeCompare(a.createdAt)
}

async function loadCollectionEntries(collection: 'works'): Promise<AdminWorkEntry[]>
async function loadCollectionEntries(collection: 'journal'): Promise<AdminJournalEntry[]>
async function loadCollectionEntries(collection: 'works' | 'journal') {
  const baseDir = path.resolve(process.cwd(), 'content', collection)
  const files = await listMarkdownFilesRecursive(baseDir)

  const entries = await Promise.all(files.map(async (filePath) => {
    const raw = await readFile(filePath, 'utf8')
    const source = parseMarkdownSource(raw)
    const frontmatter = getFrontmatterObject(source.frontmatter)
    const slugFallback = path.basename(filePath, '.md')
    const slug = readString(frontmatter, 'slug', slugFallback) || slugFallback
    const storagePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')

    if (collection === 'works') {
      const category = readString(frontmatter, 'category', 'wood')
      return {
        title: readString(frontmatter, 'title', ''),
        slug,
        date: readString(frontmatter, 'date', ''),
        createdAt: readString(frontmatter, 'createdAt', ''),
        updatedAt: readString(frontmatter, 'updatedAt', ''),
        category: WORK_CATEGORIES.has(category) ? category : 'other',
        cover: readString(frontmatter, 'cover', ''),
        excerpt: readString(frontmatter, 'excerpt', readString(frontmatter, 'summary', '')),
        materials: readStringArray(frontmatter, 'materials'),
        tools: readStringArray(frontmatter, 'tools'),
        gallery: readStringArray(frontmatter, 'gallery'),
        featured: readBoolean(frontmatter, 'featured', false),
        status: readStatus(frontmatter),
        process: pickMarkdownBody(source.body, readString(frontmatter, 'process', '')),
        storagePath
      } satisfies AdminWorkEntry
    }

    return {
      title: readString(frontmatter, 'title', ''),
      slug,
      date: readString(frontmatter, 'date', ''),
      createdAt: readString(frontmatter, 'createdAt', ''),
      updatedAt: readString(frontmatter, 'updatedAt', ''),
      cover: readString(frontmatter, 'cover', ''),
      excerpt: readString(frontmatter, 'excerpt', readString(frontmatter, 'summary', '')),
      status: readStatus(frontmatter),
      content: pickMarkdownBody(source.body, readString(frontmatter, 'content', '')),
      storagePath
    } satisfies AdminJournalEntry
  }))

  return entries.sort(sortByNewest)
}

export async function listAdminWorks(opts: {
  page?: number
  limit?: number
  category?: string
  status?: 'draft' | 'published'
} = {}): Promise<PaginatedResponse<Work>> {
  const page = Math.max(1, opts.page || 1)
  const limit = Math.max(1, opts.limit || 50)
  const offset = (page - 1) * limit
  const all = await loadCollectionEntries('works')

  const filtered = all.filter((work) => {
    if (opts.category && work.category !== opts.category) return false
    if (opts.status && work.status !== opts.status) return false
    return true
  })

  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    page,
    limit
  }
}

export async function listAdminJournals(opts: {
  page?: number
  limit?: number
  status?: 'draft' | 'published'
} = {}): Promise<PaginatedResponse<Journal>> {
  const page = Math.max(1, opts.page || 1)
  const limit = Math.max(1, opts.limit || 50)
  const offset = (page - 1) * limit
  const all = await loadCollectionEntries('journal')

  const filtered = all.filter((journal) => {
    if (opts.status && journal.status !== opts.status) return false
    return true
  })

  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    page,
    limit
  }
}

export async function getAdminWorkBySlug(slug: string): Promise<AdminWorkEntry | null> {
  const all = await loadCollectionEntries('works')
  return all.find(work => work.slug === slug) || null
}

export async function getAdminJournalBySlug(slug: string): Promise<AdminJournalEntry | null> {
  const all = await loadCollectionEntries('journal')
  return all.find(journal => journal.slug === slug) || null
}

export async function adminWorkSlugExists(slug: string): Promise<boolean> {
  return !!(await getAdminWorkBySlug(slug))
}

export async function adminJournalSlugExists(slug: string): Promise<boolean> {
  return !!(await getAdminJournalBySlug(slug))
}
