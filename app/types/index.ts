// ⚠️ 业务标识用 slug（schema 中已显式 z.string() → SQLite TEXT 列，不会走 INT 分支）。
// id 由 Nuxt Content 内部自动维护，不主动使用（避免手写 id 被覆盖成"works/works/xxx.md"）。
// createdAt / updatedAt 存储 ISO8601 字符串，后台新建/修改时自动写入。
export interface Work {
  slug: string
  title: string
  date: string        // 发布日期（YYYY-MM-DD，业务语义）
  createdAt: string   // 创建时间（ISO8601，后台新建时写）
  updatedAt: string   // 更新时间（ISO8601，新建/修改时均写）
  category: string
  cover?: string
  excerpt?: string
  materials?: string[]
  tools?: string[]
  process?: string
  gallery?: string[]
  featured?: boolean
  status?: 'draft' | 'published'
}

export interface Journal {
  slug: string
  title: string
  date: string        // 发布日期
  createdAt: string   // 创建时间（ISO8601）
  updatedAt: string   // 更新时间（ISO8601）
  cover?: string
  excerpt?: string
  content?: string
  status?: 'draft' | 'published'
}

export interface User {
  id: number
  username: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface WorkFormData {
  slug: string
  title: string
  date: string
  createdAt?: string   // 新建时不传，后端自动写
  updatedAt?: string   // 新建/修改均由后端自动写，前端只读回显
  category: string
  cover: string
  excerpt: string
  materials: string
  tools: string
  process: string
  gallery: string
  featured: boolean
  status: 'draft' | 'published'
}

export interface JournalFormData {
  slug: string
  title: string
  date: string
  createdAt?: string   // 新建时不传，后端自动写
  updatedAt?: string   // 新建/修改均由后端自动写，前端只读回显
  cover: string
  excerpt: string
  content: string
  status: 'draft' | 'published'
}

export const CATEGORIES = [
  { value: 'wood', label: '木作' },
  { value: 'ceramics', label: '陶瓷' },
  { value: 'textile', label: '织物' },
  { value: 'paper', label: '纸艺' },
  { value: 'metal', label: '金工' },
  { value: 'other', label: '其他' }
] as const

export type CategoryValue = typeof CATEGORIES[number]['value']

// ==================== Admin 写操作返回的「同步元信息」====================
// 后台 POST/PUT/DELETE 响应体的 sync 字段；前端存到 localStorage 作为轮询起点。
export interface AdminWriteSyncInfo {
  localOnly: boolean
  commitSha: string
  commitHtmlUrl: string
  actionsRunUrl: string
  savedAt: string
}

export type SyncStateState = 'synced' | 'syncing' | 'failed' | 'unknown'

/** 后台 GET /api/admin/sync-status 的响应（与 server/api/admin/sync-status.get.ts 对齐） */
export interface SyncStatusResponse {
  state: SyncStateState
  sinceSha: string | null
  lastSavedAt: string | null
  siteUrl: string
  errorMessage?: string
  siteCommitSha?: string
  siteBuildTime?: string
  content?: {
    worksCount: number
    journalCount: number
    lastUpdatedAt: string
  }
  isSiteSyncedByPrefix?: boolean
  isSiteSyncedByCompare?: boolean
  githubConfigured?: boolean
  pushed?: boolean
  aheadBy?: number
  elapsedMs?: number
  actionsRun?: {
    status: string
    conclusion: string | null
    html_url: string
    started_at: string | null
    updated_at: string | null
  }
}

/** 前端 localStorage['admin:lastPushedCommit'] 存的结构 */
export interface LastPushedCommit {
  commitSha: string
  commitHtmlUrl?: string
  actionsRunUrl?: string
  savedAt: string
  /** 标记这条 lastPushed 是由哪个页面产生的，便于芯片显示「最近一次操作」的描述 */
  scope?: 'works' | 'journal' | 'dashboard' | 'global'
  description?: string
}
