<script setup lang="ts">
import type { Work } from '~/types'
import { formatDate, getCategoryLabel } from '~/utils/format'
import SyncStatusChip from '~/components/admin/SyncStatusChip.vue'
import { writeLastPushed } from '~/composables/useLastPushed'

definePageMeta({
  layout: false
})

const page = ref(1)
const limit = ref(10)
const statusFilter = ref<string>('')

// admin = ssr:false，纯 CSR，$fetch 自动带浏览器 cookie，无需 useRequestHeaders
const { data: worksData, refresh, error: worksError } = await useAsyncData('admin-works', () => {
  return $fetch('/api/admin/works', {
    query: {
      page: page.value,
      limit: limit.value,
      ...(statusFilter.value ? { status: statusFilter.value } : {})
    }
  })
}, {
  default: () => ({ items: [] as Work[], total: 0, page: 1, limit: 10 })
})

const loadErrorMessage = computed(() => {
  const e = worksError.value as any
  if (!e) return ''
  return e?.data?.message || e?.data?.statusMessage || e?.message || '加载失败，请刷新重试'
})

async function handleDelete(slug: string) {
  if (!confirm('确定要删除这个作品吗？')) return
  try {
    const res = await $fetch<any>(`/api/admin/works/${slug}`, { method: 'DELETE' })
    writeLastPushed(res?.sync, { scope: 'works', description: `删除作品 ${slug}` })
    await refresh()
  } catch (e) {
    alert('删除失败')
  }
}

async function toggleStatus(work: Work) {
  const newStatus = work.status === 'published' ? 'draft' : 'published'
  try {
    const res = await $fetch<any>(`/api/admin/works/${work.slug}`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    writeLastPushed(res?.sync, { scope: 'works', description: `切换状态 ${work.slug} -> ${newStatus}` })
    await refresh()
  } catch {
    alert('状态更新失败')
  }
}

watch([page, statusFilter], () => {
  refresh()
})

useHead({
  title: '作品管理 — 管理后台'
})
</script>

<template>
  <AdminLayout>
    <div class="admin-works">
      <header class="page-header">
        <div>
          <h1 class="page-title">作品管理</h1>
          <p class="page-desc">管理所有作品内容</p>
        </div>
        <div class="header-actions">
          <SyncStatusChip size="sm" scope-hint="作品内容同步状态" />
          <NuxtLink to="/admin/works/new" class="btn-primary">新建作品</NuxtLink>
        </div>
      </header>

      <div class="filter-bar">
        <div class="filter-group">
          <label>状态</label>
          <select v-model="statusFilter">
            <option value="">全部</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </div>
      </div>

      <div class="data-table-wrapper">
        <div v-if="loadErrorMessage" class="load-error">
          {{ loadErrorMessage }}
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>日期</th>
              <th>状态</th>
              <th>精选</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="work in worksData.items" :key="work.slug">
              <td class="title-cell">
                <NuxtLink :to="`/admin/works/${work.slug}`" class="work-title">
                  {{ work.title }}
                </NuxtLink>
              </td>
              <td>{{ getCategoryLabel(work.category) }}</td>
              <td>{{ formatDate(work.date) }}</td>
              <td>
                <button class="status-toggle" @click="toggleStatus(work)">
                  <span :class="`status-badge status-${work.status}`">
                    {{ work.status === 'published' ? '已发布' : '草稿' }}
                  </span>
                </button>
              </td>
              <td>
                <span v-if="work.featured" class="featured-badge">是</span>
                <span v-else class="muted-text">否</span>
              </td>
              <td>
                <div class="actions">
                  <NuxtLink :to="`/admin/works/${work.slug}`" class="action-link">编辑</NuxtLink>
                  <button class="action-link delete" @click="handleDelete(work.slug)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="worksData.items.length === 0" class="empty-state">
          暂无作品
        </div>
      </div>

      <div v-if="worksData.total > limit" class="pagination">
        <button
          class="page-btn"
          :disabled="page <= 1"
          @click="page = Math.max(1, page - 1)"
        >
          上一页
        </button>
        <span class="page-info">第 {{ page }} 页 / 共 {{ Math.ceil(worksData.total / limit) }} 页</span>
        <button
          class="page-btn"
          :disabled="page >= Math.ceil(worksData.total / limit)"
          @click="page = Math.min(Math.ceil(worksData.total / limit), page + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.admin-works {
  max-width: 1000px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-6);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
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

.btn-primary {
  padding: var(--space-3) var(--space-5);
  background: var(--color-text);
  color: white;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  transition: all var(--transition-fast);
  text-decoration: none;
  white-space: nowrap;
}

.btn-primary:hover {
  background: var(--color-accent);
  color: white;
}

.filter-bar {
  background: white;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  margin-bottom: var(--space-6);
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.filter-group label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.filter-group select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  background: var(--color-surface);
}

.data-table-wrapper {
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}

.load-error {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(181, 75, 75, 0.08);
  color: var(--color-error);
  font-size: 0.88rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: var(--space-4);
  text-align: left;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 0.9rem;
}

.data-table th {
  background: var(--color-surface);
  font-weight: 500;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: var(--color-surface);
}

.title-cell {
  max-width: 250px;
}

.work-title {
  color: var(--color-text);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.work-title:hover {
  color: var(--color-accent);
}

.status-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.status-badge {
  font-size: 0.75rem;
  padding: 3px 10px;
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

.featured-badge {
  color: var(--color-accent);
  font-weight: 500;
  font-size: 0.85rem;
}

.muted-text {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.actions {
  display: flex;
  gap: var(--space-3);
}

.action-link {
  font-size: 0.85rem;
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.action-link.delete {
  color: var(--color-error);
}

.empty-state {
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-muted);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.page-btn {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  background: white;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .data-table th:nth-child(3),
  .data-table td:nth-child(3),
  .data-table th:nth-child(5),
  .data-table td:nth-child(5) {
    display: none;
  }
}
</style>
