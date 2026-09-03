<script setup lang="ts">
import type { Journal } from '~/types'
import { generateSlug } from '~/utils/format'
import { pickFirstMeaningfulText } from '~/utils/adminFormValue'
import SyncStatusChip from '~/components/admin/SyncStatusChip.vue'
import { writeLastPushed } from '~/composables/useLastPushed'

definePageMeta({
  layout: false
})

const { checkAuth } = useAuth()
const route = useRoute()
// 路由文件还是 [id]，语义已是 slug 字符串
const slug = route.params.id as string

const timestamps = ref({ createdAt: '', updatedAt: '' })

const form = ref({
  title: '',
  slug: '',
  date: new Date().toISOString().split('T')[0],
  cover: '',
  excerpt: '',
  content: '',
  status: 'draft' as 'draft' | 'published'
})

const loading = ref(false)
const saving = ref(false)

onMounted(async () => {
  await checkAuth()
  loading.value = true
  try {
    const journal = (await $fetch<any>(`/api/admin/journal/${slug}`)) as Journal & Record<string, any>
    timestamps.value = {
      createdAt: journal.createdAt || '',
      updatedAt: journal.updatedAt || ''
    }
    form.value = {
      title: journal.title,
      slug: journal.slug,
      date: journal.date,
      cover: journal.cover,
      excerpt: pickFirstMeaningfulText(journal.excerpt, (journal as Record<string, any>).summary),
      content: pickFirstMeaningfulText(
        journal.content,
        journal.body,
        (journal as Record<string, any>).process
      ),
      status: journal.status || 'draft'
    }
  } catch (e) {
    alert('加载失败')
    await navigateTo('/admin/journal')
  } finally {
    loading.value = false
  }
})

function generateSlugFromTitle() {
  if (form.value.title && !form.value.slug) {
    form.value.slug = generateSlug(form.value.title)
  }
}

async function handleSave() {
  if (!form.value.title) {
    alert('请输入标题')
    return
  }
  if (!form.value.slug) {
    alert('请输入 Slug')
    return
  }
  if (!form.value.content || typeof form.value.content !== 'string' || form.value.content.trim().length === 0) {
    if (!confirm('「正文」内容为空，确认继续保存？')) return
  }
  saving.value = true
  try {
    const payload: Record<string, any> = {
      title: form.value.title,
      slug: form.value.slug,
      date: form.value.date,
      cover: form.value.cover,
      excerpt: form.value.excerpt ?? '',
      status: form.value.status || 'draft',
      content: String(form.value.content ?? '')
    }
    const res = await $fetch<any>(`/api/admin/journal/${slug}`, {
      method: 'PUT',
      body: payload
    })
    writeLastPushed(res?.sync, { scope: 'journal', description: `更新日志 ${form.value.title}` })
    if (res && typeof res.updatedAt === 'string') timestamps.value.updatedAt = res.updatedAt
    else timestamps.value.updatedAt = new Date().toISOString()
    alert('保存成功')
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || '保存失败'
    alert(`保存失败：${msg}`)
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!confirm('确定要删除这篇日志吗？')) return
  try {
    const res = await $fetch<any>(`/api/admin/journal/${slug}`, { method: 'DELETE' })
    writeLastPushed(res?.sync, { scope: 'journal', description: `删除日志 ${form.value.title || slug}` })
    await navigateTo('/admin/journal')
  } catch (e) {
    alert('删除失败')
  }
}

useHead({
  title: '编辑日志 — 管理后台'
})
</script>

<template>
  <AdminLayout>
    <div class="edit-page">
      <header class="page-header">
        <div>
          <NuxtLink to="/admin/journal" class="back-link">← 返回列表</NuxtLink>
          <h1 class="page-title">编辑日志</h1>
        </div>
        <div class="header-actions">
          <SyncStatusChip size="sm" scope-hint="日志内容同步状态" />
          <button class="btn-delete" @click="handleDelete">删除</button>
          <button class="btn-save" @click="handleSave" :disabled="saving || loading">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </header>

      <div v-if="!loading" class="form-container">
        <div class="form-grid">
          <div class="form-group full-width">
            <label>标题 *</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="日志标题"
              @blur="generateSlugFromTitle"
            />
          </div>

          <div class="form-group">
            <label>Slug *</label>
            <input v-model="form.slug" type="text" placeholder="url-slug" />
          </div>

          <div class="form-group">
            <label>日期</label>
            <input v-model="form.date" type="date" />
          </div>

          <div class="form-group full-width">
            <label>封面图 URL</label>
            <input v-model="form.cover" type="text" placeholder="/images/journal/xxx.jpg" />
          </div>

          <div class="form-group full-width">
            <label>摘要</label>
            <textarea v-model="form.excerpt" rows="2" placeholder="日志摘要"></textarea>
          </div>

          <div class="form-group full-width">
            <label>正文（Markdown）</label>
            <textarea v-model="form.content" rows="20" placeholder="## 标题&#10;&#10;正文内容..."></textarea>
          </div>

          <div class="form-group">
            <label>状态</label>
            <select v-model="form.status">
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>
          </div>

          <div class="form-group">
            <label>创建时间（后端自动）</label>
            <input :value="timestamps.createdAt" type="text" disabled class="readonly-input" />
          </div>

          <div class="form-group">
            <label>更新时间（后端自动）</label>
            <input :value="timestamps.updatedAt" type="text" disabled class="readonly-input" />
          </div>
        </div>
      </div>

      <div v-else class="loading-state">加载中...</div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.edit-page {
  max-width: 800px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-6);
}

.back-link {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}

.page-title {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

.btn-save {
  padding: var(--space-3) var(--space-6);
  background: var(--color-text);
  color: white;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 40px;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-accent);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete {
  padding: var(--space-3) var(--space-5);
  background: transparent;
  color: var(--color-error);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-delete:hover {
  background: rgba(181, 75, 75, 0.08);
}

.form-container {
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  padding: var(--space-8);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  background: var(--color-surface);
  transition: all var(--transition-fast);
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  background: white;
  box-shadow: 0 0 0 3px rgba(80, 106, 115, 0.1);
}

.loading-state {
  text-align: center;
  padding: var(--space-16);
  color: var(--color-text-muted);
}

.readonly-input {
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
  cursor: not-allowed;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .form-container {
    padding: var(--space-5);
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
