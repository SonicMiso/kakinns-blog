import { ref } from 'vue'

const isAuthenticated = ref(false)
const isLoading = ref(true)

export function useAuth() {
  async function checkAuth() {
    isLoading.value = true
    try {
      const res = await $fetch('/api/auth/session')
      isAuthenticated.value = res.authenticated
    } catch {
      isAuthenticated.value = false
    } finally {
      isLoading.value = false
    }
  }

  async function login(username: string, password: string) {
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    if (res.success) {
      isAuthenticated.value = true
    }
    return res
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    isAuthenticated.value = false
    await navigateTo('/admin/login')
  }

  return {
    isAuthenticated,
    isLoading,
    checkAuth,
    login,
    logout
  }
}
