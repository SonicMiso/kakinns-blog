export interface Work {
  id?: number
  title: string
  slug: string
  date: string
  category: string
  cover?: string
  excerpt?: string
  materials?: string[]
  tools?: string[]
  process?: string
  gallery?: string[]
  featured?: boolean
  status?: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface Journal {
  id?: number
  title: string
  slug: string
  date: string
  cover?: string
  excerpt?: string
  content?: string
  status?: 'draft' | 'published'
  createdAt: string
  updatedAt: string
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
  title: string
  slug: string
  date: string
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
  title: string
  slug: string
  date: string
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
