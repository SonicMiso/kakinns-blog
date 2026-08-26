/**
 * 全局路由守卫（.global.ts 后缀 = 每条路由都跑）
 * 规则：
 *  - /admin/login                 所有人可访问（未认证或已认证均可，已登录则跳回 /admin）
 *  - /admin/**（除 login 外）     必须已认证，否则跳 /admin/login?redirect=<原路径>
 *  - 其它前台页面                  不拦截
 *
 * 关键：每次进入 admin 路由都强制从 /api/auth/session 拉取真实状态，
 *      不依赖客户端内存中的 isAuthenticated ref，避免脏状态。
 *      CSR 模式下此中间件在客户端水合后的导航前阶段执行。
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return

  const isLoginPage = to.path === '/admin/login'
  const { isAuthenticated, checkAuth } = useAuth()

  // 【关键】强制校验 session，不信任内存 ref 的当前值
  // 即使 isAuthenticated 之前被设为 true，也要用服务端 API 再确认一次
  try {
    await checkAuth()
  } catch {
    // 网络错误等情况一律视为未登录
    isAuthenticated.value = false
  }

  if (isLoginPage) {
    // 已登录访问登录页 → 跳回仪表盘
    if (isAuthenticated.value) {
      return navigateTo('/admin', { replace: true })
    }
    return
  }

  // 非 login 的 admin 页面：未登录 → 跳登录页并记住来路
  if (!isAuthenticated.value) {
    const redirect = to.fullPath !== '/admin/login' ? to.fullPath : '/admin'
    return navigateTo(
      {
        path: '/admin/login',
        query: { redirect }
      },
      { replace: true }
    )
  }
})
