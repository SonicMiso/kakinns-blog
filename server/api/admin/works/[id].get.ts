import type { Work } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { readRawContentBody, bodyLikeToString } from '../../../utils/rawContent'

// 路由参数语义：slug（字符串，唯一标识）
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id') || ''
  const matches = (await queryCollection<Work>(event, 'works').where('slug', '=', slug).limit(1).all()) as (Work & Record<string, any>)[]
  const raw = matches[0]
  if (!raw) throw createError({ statusCode: 404, statusMessage: 'Work not found' })

  const processText: string =
    readRawContentBody('works', slug) ||
    (typeof raw.process === 'string'
      ? raw.process
      : bodyLikeToString(raw.process) ||
        typeof raw.content === 'string'
          ? raw.content
          : bodyLikeToString(raw.content) ||
            bodyLikeToString(raw.body))

  // 注意：Nuxt Content Document 内部是 Proxy + getter，不能用 Object.entries 过滤字段
  //（会把 title/slug/materials 这些访问器属性全丢掉，只剩空对象）。
  // 改用对象展开：把 process 字段覆盖，同时显式去掉 body（Prose 数组，避免 UI fallback 成 [object Object]）。
  const out: any = { ...raw, process: processText }
  delete out.body
  return out
})
