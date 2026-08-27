import type { Journal } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { minimarkToMarkdown } from '../../../utils/rawContent'

// 路由参数语义：slug（字符串）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id') || ''
  const matches = (await queryCollection<Journal>(event, 'journal').where('slug', '=', slug).limit(1).all()) as (Journal & Record<string, any>)[]
  const raw = matches[0]
  if (!raw) throw createError({ statusCode: 404, statusMessage: 'Journal not found' })

  return {
    title: raw.title,
    slug: raw.slug,
    date: raw.date,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    cover: raw.cover,
    excerpt: raw.excerpt,
    status: raw.status || 'draft',
    content: minimarkToMarkdown(raw.content ?? raw.body)
  }
})
