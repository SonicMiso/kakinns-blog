import type { Journal } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { readRawContentBody, bodyLikeToString } from '../../../utils/rawContent'

// 路由参数语义：slug（字符串）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id') || ''
  const matches = (await queryCollection<Journal>(event, 'journal').where('slug', '=', slug).limit(1).all()) as (Journal & Record<string, any>)[]
  const raw = matches[0]
  if (!raw) throw createError({ statusCode: 404, statusMessage: 'Journal not found' })

  const contentText: string =
    readRawContentBody('journal', slug) ||
    (typeof raw.content === 'string'
      ? raw.content
      : bodyLikeToString(raw.content) ||
        bodyLikeToString(raw.body))

  const out: any = { ...raw, content: contentText }
  delete out.body
  return out
})
