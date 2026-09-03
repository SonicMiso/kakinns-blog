import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { H3Event } from 'h3'
import type { Journal, PaginatedResponse, Work } from '~/types'
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

function ensureStoragePath(collection: CollectionName, slug: string): string {
 return `content/${collection}/${slug}.md`
}

function readBoolean(value: unknown): boolean {
 if (typeof value === 'boolean') return value
 if (typeof value === 'string') return value.toLowerCase() === 'true'
 return Boolean(value)
}

function sortByNewest<T extends { date: string, createdAt: string }>(a: T, b: T): number {
 const dateCompare = b.date.localeCompare(a.date)
 if (dateCompare !== 0) return dateCompare
 return b.createdAt.localeCompare(a.createdAt)
}

function readExcerpt(frontmatter: Record<string, unknown>): string {
 return (
   readFrontmatterString(frontmatter, 'excerpt') ||
   readFrontmatterString(frontmatter, 'summary') ||
   ''
 )
}

async function readEntriesByCollection(collection: CollectionName): Promise<Array<Record<string, any>>> {
 const baseDir = path.resolve(process.cwd(), 'content', collection)
 const files = await listMarkdownFilesRecursive(baseDir)

 return Promise.all(files.map(async (filePath) => {
   const raw = await readFile(filePath, 'utf8')
   const { frontmatter, body } = parseMarkdownSource(raw)
   const record = frontmatter as Record<string, unknown>
   const slug = normalizeString(readFrontmatterString(record, 'slug')) || path.basename(filePath, '.md')
   const storagePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')

   if (collection === 'works') {
     const categoryValue = readFrontmatterString(record, 'category', 'wood')
     return {
       title: readFrontmatterString(record, 'title'),
       slug,
       date: readFrontmatterString(record, 'date'),
       createdAt: readFrontmatterString(record, 'createdAt'),
       updatedAt: readFrontmatterString(record, 'updatedAt'),
       category: WORK_CATEGORIES.has(categoryValue) ? categoryValue : 'other',
       cover: readFrontmatterString(record, 'cover'),
       excerpt: readExcerpt(record),
       materials: normalizeStringArray(record.materials),
       tools: normalizeStringArray(record.tools),
       gallery: normalizeStringArray(record.gallery),
       featured: readBoolean(record.featured),
       status: normalizeStatus(record.status),
       process: normalizeString(record.process) || body,
       storagePath,
       description: readFrontmatterString(record, 'description')
     }
   }

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
     storagePath,
     description: readFrontmatterString(record, 'description')
   }
 }))
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
 const all = await readEntriesByCollection('works')

 const filtered = all.filter((row) => {
   if (opts.category && row.category !== opts.category) return false
   if (opts.status && row.status !== opts.status) return false
   return true
 })

 filtered.sort(sortByNewest as any)

 return {
   items: filtered.slice(offset, offset + limit) as Work[],
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
 const all = await readEntriesByCollection('journal')

 const filtered = all.filter((row) => {
   if (opts.status && row.status !== opts.status) return false
   return true
 })

 filtered.sort(sortByNewest as any)

 return {
   items: filtered.slice(offset, offset + limit) as Journal[],
   total: filtered.length,
   page,
   limit
 }
}

export async function getAdminWorkBySlug(event: H3Event, slug: string): Promise<AdminWorkEntry | null> {
 const all = await readEntriesByCollection('works')
 const row = all.find(item => item.slug === slug)
 if (!row) return null

 return {
   title: normalizeString(row.title),
   slug: normalizeString(row.slug),
   date: normalizeString(row.date),
   createdAt: normalizeString(row.createdAt),
   updatedAt: normalizeString(row.updatedAt),
   category: WORK_CATEGORIES.has(row.category) ? row.category : 'other',
   cover: normalizeString(row.cover),
   excerpt: normalizeString(row.excerpt),
   materials: normalizeStringArray(row.materials),
   tools: normalizeStringArray(row.tools),
   gallery: normalizeStringArray(row.gallery),
   featured: !!row.featured,
   status: normalizeStatus(row.status),
   process: normalizeString(row.process),
   storagePath: row.storagePath || ensureStoragePath('works', slug)
 }
}

export async function getAdminJournalBySlug(event: H3Event, slug: string): Promise<AdminJournalEntry | null> {
 const all = await readEntriesByCollection('journal')
 const row = all.find(item => item.slug === slug)
 if (!row) return null

 return {
   title: normalizeString(row.title),
   slug: normalizeString(row.slug),
   date: normalizeString(row.date),
   createdAt: normalizeString(row.createdAt),
   updatedAt: normalizeString(row.updatedAt),
   cover: normalizeString(row.cover),
   excerpt: normalizeString(row.excerpt),
   status: normalizeStatus(row.status),
   content: normalizeString(row.content),
   storagePath: row.storagePath || ensureStoragePath('journal', slug)
 }
}

export async function adminWorkSlugExists(event: H3Event, slug: string): Promise<boolean> {
 const all = await readEntriesByCollection('works')
 return all.some(item => item.slug === slug)
}

export async function adminJournalSlugExists(event: H3Event, slug: string): Promise<boolean> {
 const all = await readEntriesByCollection('journal')
 return all.some(item => item.slug === slug)
}
