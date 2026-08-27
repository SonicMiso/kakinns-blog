import { queryCollection } from '@nuxt/content/server'

export interface ContentStats {
  worksCount: number
  journalCount: number
  /** 所有条目 updatedAt 的 ISO8601 最大值；没有任何条目时返回空串 */
  lastUpdatedAt: string
  /** 各集合的 updatedAt 最大值（方便未来 UI 用） */
  collections: {
    works: { count: number; lastUpdatedAt: string }
    journal: { count: number; lastUpdatedAt: string }
  }
}

function maxIso(a: string, b: string): string {
  if (!a) return b
  if (!b) return a
  return a >= b ? a : b
}

function getUpdatedAt(v: any): string {
  return typeof v?.updatedAt === 'string' ? v.updatedAt : ''
}

export async function collectContentStats(event: any): Promise<ContentStats> {
  const works = await queryCollection<any>(event, 'works').all()
  const journal = await queryCollection<any>(event, 'journal').all()

  const worksLatest = works.reduce((acc: string, item: any) => maxIso(acc, getUpdatedAt(item)), '')
  const journalLatest = journal.reduce((acc: string, item: any) => maxIso(acc, getUpdatedAt(item)), '')

  return {
    worksCount: works.length,
    journalCount: journal.length,
    lastUpdatedAt: maxIso(worksLatest, journalLatest),
    collections: {
      works: { count: works.length, lastUpdatedAt: worksLatest },
      journal: { count: journal.length, lastUpdatedAt: journalLatest }
    }
  }
}
