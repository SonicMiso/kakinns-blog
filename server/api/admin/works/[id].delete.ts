import type { Work } from '~/types'
import { queryCollection } from '@nuxt/content/server'
import { commitContentChanges } from '../../../utils/github'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const matches = (await queryCollection<Work>(event, 'works').where('id', '=', id).limit(1).all()) as Work[]
  const work = matches[0] as any
  if (!work) throw createError({ statusCode: 404, statusMessage: 'Work not found' })

  await commitContentChanges({
    message: `delete(works): 删除作品 ${work.title} (${work.slug})`,
    deletes: [{ path: `content/works/${work.slug}.md` }]
  })
  return { success: true }
})
