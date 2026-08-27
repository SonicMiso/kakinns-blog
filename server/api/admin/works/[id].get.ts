import type { Work } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { minimarkToMarkdown } from '../../../utils/rawContent'

// 路由参数语义：slug（字符串，唯一标识）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id') || ''
  const matches = (await queryCollection<Work>(event, 'works').where('slug', '=', slug).limit(1).all()) as (Work & Record<string, any>)[]
  const raw = matches[0]
  if (!raw) throw createError({ statusCode: 404, statusMessage: 'Work not found' })

  return {
    title: raw.title,
    slug: raw.slug,
    date: raw.date,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    category: raw.category,
    cover: raw.cover,
    excerpt: raw.excerpt,
    materials: Array.isArray(raw.materials) ? raw.materials : [],
    tools: Array.isArray(raw.tools) ? raw.tools : [],
    gallery: Array.isArray(raw.gallery) ? raw.gallery : [],
    featured: !!raw.featured,
    status: raw.status || 'draft',
    process: minimarkToMarkdown(raw.process ?? raw.content ?? raw.body)
  }
})
