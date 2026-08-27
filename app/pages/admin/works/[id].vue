<script setup lang="ts">
import type { Work } from '~/types'
import { CATEGORIES } from '~/types'
import { generateSlug } from '~/utils/format'
import SyncStatusChip from '~/components/admin/SyncStatusChip.vue'
import { writeLastPushed } from '~/composables/useLastPushed'

definePageMeta({
  layout: false
})

const { checkAuth } = useAuth()
const route = useRoute()
// 路由文件还是 [id]，但语义已经是 slug（字符串唯一标识）
const slug = route.params.id as string

const timestamps = ref({ createdAt: '', updatedAt: '' })

const form = ref({
  title: '',
  slug: '',
  date: new Date().toISOString().split('T')[0],
  category: 'wood',
  cover: '',
  excerpt: '',
  materials: '',
  tools: '',
  process: '',
  gallery: '',
  featured: false,
  status: 'draft' as 'draft' | 'published'
})

const loading = ref(false)
const saving = ref(false)

onMounted(async () => {
  await checkAuth()
  loading.value = true
  try {
    const work = (await $fetch<any>(`/api/admin/works/${slug}`)) as Work & Record<string, any>
    timestamps.value = {
      createdAt: work.createdAt || '',
      updatedAt: work.updatedAt || ''
    }
    form.value = {
      title: work.title,
      slug: work.slug,
      date: work.date,
      category: work.category,
      cover: work.cover,
      excerpt: work.excerpt,
      materials: (work.materials || []).join('\n'),
      tools: (work.tools || []).join('\n'),
      process: work.process ?? work.body ?? work.content ?? '',
      gallery: (work.gallery || []).join('\n'),
      featured: !!work.featured,
      status: work.status || 'draft'
    }
  } catch (e) {
    alert('加载失败')
    await navigateTo('/admin/works')
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
  if (!form.value.process || typeof form.value.process !== 'string' || form.value.process.trim().length === 0) {
    if (!confirm('「制作过程」内容为空，确认继续保存？')) return
  }
  saving.value = true
  try {
    // 确保 process 字段一定按字符串发出，且 body 里只包含 PUT handler 认识的字段
    const payload: Record<string, any> = {
      title: form.value.title,
      slug: form.value.slug,
      date: form.value.date,
      category: form.value.category,
      cover: form.value.cover,
      excerpt: form.value.excerpt ?? '',
      materials: String(form.value.materials ?? '').split('\n').filter((m: string) => m.trim()),
      tools: String(form.value.tools ?? '').split('\n').filter((t: string) => t.trim()),
      gallery: String(form.value.gallery ?? '').split('\n').filter((g: string) => g.trim()),
      featured: !!form.value.featured,
      status: form.value.status || 'draft',
      process: String(form.value.process ?? '')
    }
    const res = await $fetch<any>(`/api/admin/works/${slug}`, {
      method: 'PUT',
      body: payload
    })
    writeLastPushed(res?.sync, { scope: 'works', description: `更新作品 ${form.value.title}` })
    // 保存成功：用后端返回的真实 updatedAt（不用客户端自己 new Date()，避免时区/秒级不一致）
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
  if (!confirm('确定要删除这个作品吗？')) return
  try {
    const res = await $fetch<any>(`/api/admin/works/${slug}`, { method: 'DELETE' })
    writeLastPushed(res?.sync, { scope: 'works', description: `删除作品 ${form.value.title || slug}` })
    await navigateTo('/admin/works')
  } catch (e) {
    alert('删除失败')
  }
}

useHead({
  title: '编辑作品 — 管理后台'
})
</script>

<template>
  <AdminLayout>
    <div class="edit-page">
      <header class="page-header">
        <div>
          <NuxtLink to="/admin/works" class="back-link">← 返回列表</NuxtLink>
          <h1 class="page-title">编辑作品</h1>
        </div>
        <div class="header-actions">
          <SyncStatusChip size="sm" scope-hint="作品内容同步状态" />
          <button class="btn-delete" @click="handleDelete">删除</button>
          <button class="btn-save" @click="handleSave" :disabled="saving || loading">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </header>

      <div v-if="!loading" class="form-container">
        <div class="form-grid">
          <div class="form-group">
            <label>标题 *</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="作品标题"
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

          <div class="form-group">
            <label>分类</label>
            <select v-model="form.category">
              <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div class="form-group full-width">
            <label>封面图 URL</label>
            <input v-model="form.cover" type="text" placeholder="/images/works/xxx.jpg" />
          </div>

          <div class="form-group full-width">
            <label>简介</label>
            <textarea v-model="form.excerpt" rows="3" placeholder="作品简介"></textarea>
          </div>

          <div class="form-group">
            <label>材料（每行一个）</label>
            <textarea v-model="form.materials" rows="4" placeholder="胡桃木&#10;木蜡油"></textarea>
          </div>

          <div class="form-group">
            <label>工具（每行一个）</label>
            <textarea v-model="form.tools" rows="4" placeholder="台锯&#10;砂光机"></textarea>
          </div>

          <div class="form-group full-width">
            <label>制作过程（Markdown）</label>
            <textarea v-model="form.process" rows="12" placeholder="## 设计&#10;&#10;制作过程描述..."></textarea>
          </div>

          <div class="form-group full-width">
            <label>图集（每行一个图片 URL）</label>
            <textarea v-model="form.gallery" rows="4" placeholder="/images/works/xxx-01.jpg&#10;/images/works/xxx-02.jpg"></textarea>
          </div>

          <div class="form-group">
            <label>状态</label>
            <select v-model="form.status">
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>
          </div>

          <div class="form-group">
            <label>精选展示</label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.featured" />
              <span>在首页精选展示</span>
            </label>
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
  max-width: 900px;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-weight: 400 !important;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  padding: 0;
}

.readonly-input {
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
  cursor: not-allowed;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.85rem;
}

.loading-state {
  text-align: center;
  padding: var(--space-16);
  color: var(--color-text-muted);
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
