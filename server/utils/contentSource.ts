import { parse as parseYaml } from 'yaml'

export type CollectionName = 'works' | 'journal'

export interface MarkdownSource {
  frontmatter: Record<string, unknown>
  body: string
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

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

