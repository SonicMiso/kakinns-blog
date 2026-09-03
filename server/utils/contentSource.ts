import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'

export type CollectionName = 'works' | 'journal'

export interface MarkdownSource {
  frontmatter: Record<string, unknown>
  body: string
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export async function tryReadCollectionSource(collection: CollectionName, slug: string): Promise<MarkdownSource | null> {
  const fullPath = path.resolve(process.cwd(), 'content', collection, `${slug}.md`)

  try {
    const raw = await readFile(fullPath, 'utf8')
    return parseMarkdownSource(raw)
  } catch (error: any) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

export function parseMarkdownSource(raw: string): MarkdownSource {
  const match = raw.match(FRONTMATTER_RE)
  if (!match) return { frontmatter: {}, body: raw }

  const parsed = parseYaml(match[1])
  const frontmatter =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {}

  return {
    frontmatter,
    body: raw.slice(match[0].length).replace(/^\r?\n/, '')
  }
}

export function readFrontmatterString(
  source: MarkdownSource | null,
  key: string,
  fallback = ''
): string {
  if (!source || !Object.prototype.hasOwnProperty.call(source.frontmatter, key)) return fallback
  const value = source.frontmatter[key]
  if (typeof value === 'string') return value
  if (value === undefined || value === null) return ''
  return String(value)
}
