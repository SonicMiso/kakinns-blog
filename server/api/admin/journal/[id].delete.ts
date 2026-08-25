import type { Journal } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { commitContentChanges } from '../../../utils/github'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const matches = (await queryCollection<Journal>(event, 'journal').where('id', '=', id).limit(1).all()) as Journal[]
  const journal = matches[0]
  if (!journal) throw createError({ statusCode: 404, statusMessage: 'Journal not found' })

  await commitContentChanges({
    message: `delete(journal): 删除日志 ${journal.title} (${journal.slug})`,
    deletes: [{ path: `content/journal/${journal.slug}.md` }]
  })
  return { success: true }
})
