import { minimarkToMarkdown } from '~/utils/rawContentClient'

function toStringSafe(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return minimarkToMarkdown(value)
  return String(value)
}

function hasMeaningfulText(value: string): boolean {
  return value.trim().length > 0
}

export function pickFirstMeaningfulText(...candidates: unknown[]): string {
  let firstNonEmpty = ''
  for (const candidate of candidates) {
    const text = toStringSafe(candidate)
    if (!firstNonEmpty && text.length > 0) firstNonEmpty = text
    if (hasMeaningfulText(text)) return text
  }
  return firstNonEmpty
}

