import crypto from 'node:crypto'

const COOKIE_NAME = 'admin_session'

/**
 * 轻量签名 cookie 会话：不用再存 JSON 文件。
 * cookie 格式：<base64(payload)>.<hmac>
 * payload = { uid, exp }
 */

function getKey() {
  const { sessionSecret } = useRuntimeConfig()
  if (!sessionSecret || sessionSecret.length < 16) {
    // 兜底：本地开发时不强制
    return 'kakinn-local-dev-key-not-for-production-use-'
  }
  return sessionSecret
}

function b64url(buf: Buffer) {
  return buf.toString('base64url')
}

function sign(data: string) {
  return crypto.createHmac('sha256', getKey()).update(data).digest('base64url')
}

export function createCookieSession(userId: number, maxAgeSec = 7 * 24 * 60 * 60) {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString('base64url')
  const sig = sign(payload)
  return `${payload}.${sig}`
}

export function verifyCookieSession(token: string | undefined): { userId: number } | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  if (sign(payload) !== sig) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      uid: number
      exp: number
    }
    if (!data.uid || !data.exp) return null
    if (data.exp < Math.floor(Date.now() / 1000)) return null
    return { userId: data.uid }
  } catch {
    return null
  }
}

export function setSessionCookie(event: any, userId: number) {
  const maxAge = 7 * 24 * 60 * 60
  const value = createCookieSession(userId, maxAge)
  setCookie(event, COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge
  })
}

export function clearSessionCookie(event: any) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function readSession(event: any) {
  const token = getCookie(event, COOKIE_NAME)
  return verifyCookieSession(token)
}
