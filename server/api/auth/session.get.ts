import { readSession } from '../../utils/session'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const session = readSession(event)
  if (!session) return { authenticated: false }
  return { authenticated: true, user: { id: session.userId } }
})
