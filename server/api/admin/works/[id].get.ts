import type { Work } from '~/types'
import { queryCollection } from '@nuxt/content/server'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const matches = (await queryCollection<Work>(event, 'works').where('id', '=', id).limit(1).all()) as Work[]
  const work = matches[0]
  if (!work) throw createError({ statusCode: 404, statusMessage: 'Work not found' })
  return work
})
