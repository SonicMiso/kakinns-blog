<script setup lang="ts">
const { login } = useAuth()
const route = useRoute()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await login(username.value, password.value)
    if (res.success) {
      const redirect = (route.query.redirect as string) || '/admin'
      await navigateTo(redirect)
    } else {
      error.value = res.message || '登录失败'
    }
  } catch (e: any) {
    error.value = e.data?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

useHead({
  title: '登录 — 管理后台'
})
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <h1 class="login-title">Kakin Studio</h1>
        <p class="login-subtitle">管理后台</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            :disabled="loading"
            @keyup.enter="handleSubmit"
          />
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="login-hint">
        <p>默认账号：admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: var(--space-6);
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--space-10);
  box-shadow: var(--shadow-lg);
}

.login-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.login-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.login-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-group input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  transition: all var(--transition-fast);
  background: var(--color-surface);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-accent);
  background: white;
  box-shadow: 0 0 0 3px rgba(80, 106, 115, 0.1);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  font-size: 0.85rem;
  color: var(--color-error);
  padding: var(--space-3);
  background: rgba(181, 75, 75, 0.08);
  border-radius: var(--radius-sm);
}

.login-btn {
  padding: var(--space-4);
  background: var(--color-text);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 48px;
}

.login-btn:hover:not(:disabled) {
  background: var(--color-accent);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-hint {
  margin-top: var(--space-6);
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
