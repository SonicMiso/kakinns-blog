<script setup lang="ts">
const { isAuthenticated, isLoading, checkAuth, logout } = useAuth()

const navItems = [
  { href: '/admin', label: '仪表盘', icon: 'dashboard' },
  { href: '/admin/works', label: '作品管理', icon: 'works' },
  { href: '/admin/journal', label: '日志管理', icon: 'journal' }
]

onMounted(() => {
  checkAuth()
})

watch(isAuthenticated, (val) => {
  if (!val && !isLoading.value) {
    const route = useRoute()
    if (!route.path.startsWith('/admin/login')) {
      navigateTo('/admin/login')
    }
  }
})
</script>

<template>
  <div v-if="!isLoading" class="admin-layout">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <NuxtLink to="/" class="brand">Kakinn Studio</NuxtLink>
        <span class="brand-sub">管理后台</span>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li v-for="item in navItems" :key="item.href">
            <NuxtLink :to="item.href" class="nav-link">
              <span class="nav-icon" :class="`icon-${item.icon}`"></span>
              <span class="nav-label">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="logout">
          退出登录
        </button>
      </div>
    </aside>
    <main class="admin-main">
      <div class="admin-content">
        <slot />
      </div>
    </main>
  </div>
  <div v-else class="admin-loading">
    加载中...
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-surface);
}

.admin-sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 50;
}

.sidebar-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}

.brand {
  display: block;
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

.brand-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-4) 0;
}

.sidebar-nav ul {
  display: flex;
  flex-direction: column;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-6);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  transition: all var(--transition-fast);
  border-left: 2px solid transparent;
}

.nav-link:hover {
  background: var(--color-surface);
  color: var(--color-text);
}

.nav-link.active {
  color: var(--color-accent);
  background: var(--color-surface);
  border-left-color: var(--color-accent);
}

.nav-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  background: currentColor;
  opacity: 0.7;
  border-radius: 2px;
}

.icon-dashboard {
  clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%, 0 100%, 45% 100%, 45% 55%, 100% 55%, 100% 100%, 0 100%);
}

.icon-works {
  clip-path: polygon(20% 0, 80% 0, 100% 20%, 100% 100%, 0 100%, 0 20%);
}

.icon-journal {
  clip-path: polygon(0 0, 85% 0, 100% 15%, 100% 100%, 0 100%);
}

.sidebar-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-light);
}

.logout-btn {
  width: 100%;
  padding: var(--space-3);
  font-size: 0.85rem;
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  text-align: left;
}

.logout-btn:hover {
  background: var(--color-surface-alt);
  color: var(--color-error);
}

.admin-main {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
}

.admin-content {
  padding: var(--space-8);
  max-width: 1200px;
}

.admin-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 60px;
  }

  .sidebar-header .brand-sub,
  .nav-label,
  .logout-btn span {
    display: none;
  }

  .sidebar-header {
    padding: var(--space-4);
    text-align: center;
  }

  .brand {
    font-size: 0.75rem;
  }

  .nav-link {
    justify-content: center;
    padding: var(--space-4);
  }

  .admin-main {
    margin-left: 60px;
  }

  .admin-content {
    padding: var(--space-4);
  }
}
</style>
