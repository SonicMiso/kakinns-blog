import { setSessionCookie } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body
  const config = useRuntimeConfig()

  if (username === config.adminUsername && password === config.adminPassword) {
    setSessionCookie(event, 1)
    return { success: true, user: { id: 1, username } }
  }

  setResponseStatus(event, 401)
  return { success: false, message: '用户名或密码错误' }
})
