<script setup lang="ts">
import type { Work, Journal } from '~/types'

definePageMeta({
  layout: false
})

const { isAuthenticated, isLoading, checkAuth } = useAuth()

const { data: worksStats } = await useFetch('/api/admin/works', {
  query: { limit: 5 },
  headers: useRequestHeaders(['cookie']) as Record<string, string>,
  default: () => ({ items: [] as Work[], total: 0 })
})

const { data: journalStats } = await useFetch('/api/admin/journal', {
  query: { limit: 5 },
  headers: useRequestHeaders(['cookie']) as Record<string, string>,
  default: () => ({ items: [] as Journal[], total: 0 })
})

onMounted(() => {
  checkAuth()
})

useHead({
  title: '仪表盘 — 管理后台'
})
</script>

<template>
  <AdminLayout>
    <div class="dashboard">
      <header class="page-header">
        <h1 class="page-title">仪表盘</h1>
        <p class="page-desc">内容概览与最近动态</p>
      </header>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">作品总数</span>
          <span class="stat-value">{{ worksStats.total }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">日志总数</span>
          <span class="stat-value">{{ journalStats.total }}</span>
        </div>
      </div>

      <div class="recent-sections">
        <div class="recent-section">
          <div class="section-header">
            <h2>最近作品</h2>
            <NuxtLink to="/admin/works" class="section-link">全部 →</NuxtLink>
          </div>
          <div class="recent-list">
            <div v-for="work in worksStats.items.slice(0, 5)" :key="work.id" class="recent-item">
              <div class="item-info">
                <span class="item-title">{{ work.title }}</span>
                <span class="item-meta">
                  <span :class="`status-badge status-${work.status}`">
                    {{ work.status === 'published' ? '已发布' : '草稿' }}
                  </span>
                </span>
              </div>
              <NuxtLink :to="`/admin/works/${work.id}`" class="item-action">编辑</NuxtLink>
            </div>
          </div>
        </div>

        <div class="recent-section">
          <div class="section-header">
            <h2>最近日志</h2>
            <NuxtLink to="/admin/journal" class="section-link">全部 →</NuxtLink>
          </div>
          <div class="recent-list">
            <div v-for="journal in journalStats.items.slice(0, 5)" :key="journal.id" class="recent-item">
              <div class="item-info">
                <span class="item-title">{{ journal.title }}</span>
                <span class="item-meta">
                  <span :class="`status-badge status-${journal.status}`">
                    {{ journal.status === 'published' ? '已发布' : '草稿' }}
                  </span>
                </span>
              </div>
              <NuxtLink :to="`/admin/journal/${journal.id}`" class="item-action">编辑</NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h2>快捷操作</h2>
        <div class="action-buttons">
          <NuxtLink to="/admin/works/new" class="action-btn">
            <span class="action-icon">+</span>
            <span>新建作品</span>
          </NuxtLink>
          <NuxtLink to="/admin/journal/new" class="action-btn">
            <span class="action-icon">+</span>
            <span>新建日志</span>
          </NuxtLink>
          <NuxtLink to="/" target="_blank" class="action-btn secondary">
            <span class="action-icon">↗</span>
            <span>查看前台</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
}

.page-header {
  margin-bottom: var(--space-8);
}

.page-title {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.page-desc {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
  margin-bottom: var(--space-10);
}

.stat-card {
  background: white;
  padding: var(--space-8);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.stat-value {
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--color-text);
}

.recent-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-10);
}

.recent-section {
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  padding: var(--space-6);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.section-header h2 {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 600;
}

.section-link {
  font-size: 0.8rem;
  color: var(--color-accent);
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.recent-item:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  flex: 1;
}

.item-title {
  font-size: 0.9rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  gap: var(--space-2);
}

.status-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.status-published {
  background: rgba(90, 138, 106, 0.1);
  color: var(--color-success);
}

.status-draft {
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
}

.item-action {
  font-size: 0.8rem;
  color: var(--color-accent);
  padding: var(--space-1) var(--space-2);
  flex-shrink: 0;
}

.quick-actions {
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  padding: var(--space-6);
}

.quick-actions h2 {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--space-4);
}

.action-buttons {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-text);
  color: white;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  transition: all var(--transition-fast);
  text-decoration: none;
}

.action-btn:hover {
  background: var(--color-accent);
  color: white;
}

.action-btn.secondary {
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.action-btn.secondary:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.action-icon {
  font-size: 1rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .recent-sections {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    justify-content: center;
  }
}
</style>
