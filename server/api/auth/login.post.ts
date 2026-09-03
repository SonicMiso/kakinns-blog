import crypto from 'node:crypto'
import { setSessionCookie } from '../../utils/session'

function safeEqual(expected: string, provided: string): boolean {
  // HMAC-hash both values with an ephemeral key to normalize length,
  // then use timingSafeEqual for constant-time comparison.
  const key = crypto.randomBytes(32)
  const expectedHash = crypto.createHmac('sha256', key).update(expected).digest()
  const providedHash = crypto.createHmac('sha256', key).update(provided).digest()
  return crypto.timingSafeEqual(expectedHash, providedHash)
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (typeof username !== 'string' || typeof password !== 'string') {
    setResponseStatus(event, 400)
    return { success: false, message: '参数错误' }
  }

  const config = useRuntimeConfig()

  // Always evaluate both comparisons to avoid short-circuit timing leaks
  const usernameOk = safeEqual(config.adminUsername, username)
  const passwordOk = safeEqual(config.adminPassword, password)
  if (usernameOk && passwordOk) {
    setSessionCookie(event, 1)
    return { success: true, user: { id: 1, username } }
  }

  setResponseStatus(event, 401)
  return { success: false, message: '用户名或密码错误' }
})
