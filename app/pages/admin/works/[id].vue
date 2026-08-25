<script setup lang="ts">
import type { Work } from '~/types'
import { CATEGORIES } from '~/types'
import { generateSlug } from '~/utils/format'

definePageMeta({
  layout: false
})

const { checkAuth } = useAuth()
const route = useRoute()
const id = parseInt(route.params.id as string)

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
    const work = (await $fetch<any>(`/api/admin/works/${id}`)) as Work & Record<string, any>
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
  saving.value = true
  try {
    await $fetch(`/api/admin/works/${id}`, {
      method: 'PUT',
      body: {
        ...form.value,
        materials: form.value.materials.split('\n').filter(m => m.trim()),
        tools: form.value.tools.split('\n').filter(t => t.trim()),
        gallery: form.value.gallery.split('\n').filter(g => g.trim())
      }
    })
    alert('保存成功')
  } catch (e) {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!confirm('确定要删除这个作品吗？')) return
  try {
    await $fetch(`/api/admin/works/${id}`, { method: 'DELETE' })
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
