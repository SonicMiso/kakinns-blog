import crypto from 'node:crypto'
import { setSessionCookie } from '../../utils/session'

function safeStringEqual(a: string, b: string): boolean {
  // Pad both buffers to the same length so timingSafeEqual can be used.
  // The final length-equality check ensures different-length strings are rejected.
  const aBuf = Buffer.from(a, 'utf8')
  const bBuf = Buffer.from(b, 'utf8')
  const len = Math.max(aBuf.length, bBuf.length)
  const padA = Buffer.alloc(len)
  const padB = Buffer.alloc(len)
  aBuf.copy(padA)
  bBuf.copy(padB)
  return crypto.timingSafeEqual(padA, padB) && aBuf.length === bBuf.length
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
  const usernameOk = safeStringEqual(config.adminUsername, username)
  const passwordOk = safeStringEqual(config.adminPassword, password)
  if (usernameOk && passwordOk) {
    setSessionCookie(event, 1)
    return { success: true, user: { id: 1, username } }
  }

  setResponseStatus(event, 401)
  return { success: false, message: '用户名或密码错误' }
})
