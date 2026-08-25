import { readSession } from '../utils/session'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (!url.pathname.startsWith('/api/admin/')) return
  const session = readSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  event.context.userId = session.userId
})
