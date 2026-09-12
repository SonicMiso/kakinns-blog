<script setup lang="ts">
definePageMeta({
  layout: false
})

const uploadedUrl = ref('')
const uploading = ref(false)
const errorMessage = ref('')
const images = ref<Array<{ path: string; url: string; repositoryUrl: string }>>([])
const loadingImages = ref(false)
const deletingPath = ref('')

useHead({
  title: '图片管理 — 管理后台'
})

async function loadImages() {
  loadingImages.value = true
  errorMessage.value = ''
  try {
    const result = await $fetch<{ items: typeof images.value }>('/api/admin/images')
    images.value = result.items || []
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || '加载图片失败'
  } finally {
    loadingImages.value = false
  }
}

async function handleUpload(file: File) {
  uploading.value = true
  uploadedUrl.value = ''
  errorMessage.value = ''

  try {
    const body = new FormData()
    body.append('file', file)
    const result = await $fetch<{ url: string }>('/api/admin/images', {
      method: 'POST',
      body
    })
    uploadedUrl.value = result.url
    try {
      await navigator.clipboard.writeText(result.url)
    } catch {
      // 剪贴板不可用时仍保留 URL，用户可以手动复制。
    }
    await loadImages()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || '上传失败'
  } finally {
    uploading.value = false
  }
}

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    // 用户仍可以从输入框手动复制。
  }
}

async function handleDelete(image: typeof images.value[number]) {
  if (!confirm(`确定删除这张图片吗？\n${image.path}`)) return

  deletingPath.value = image.path
  errorMessage.value = ''
  try {
    await $fetch('/api/admin/images', {
      method: 'DELETE',
      body: { path: image.path }
    })
    await loadImages()
    if (uploadedUrl.value === image.url) uploadedUrl.value = ''
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || '删除失败'
  } finally {
    deletingPath.value = ''
  }
}

onMounted(() => {
  loadImages()
})
</script>

<template>
  <AdminLayout>
    <div class="image-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">图片管理</h1>
          <p class="page-desc">统一管理博客图片，上传到 SonicMiso/blog-imgs。</p>
        </div>
        <button class="refresh-btn" type="button" :disabled="loadingImages" @click="loadImages">
          {{ loadingImages ? '加载中…' : '刷新' }}
        </button>
      </header>

      <section class="upload-card">
        <div class="section-heading">
          <div>
            <h2>上传图片</h2>
            <p>支持 JPG、PNG、WebP、GIF，单张最大 10 MB。</p>
          </div>
        </div>

        <label class="dropzone" :class="{ disabled: uploading }">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            :disabled="uploading"
            @change="($event) => {
              const file = ($event.target as HTMLInputElement).files?.[0]
              if (file) handleUpload(file)
              ;($event.target as HTMLInputElement).value = ''
            }"
          />
          <span class="upload-title">{{ uploading ? '上传中…' : '选择图片' }}</span>
          <span class="upload-subtitle">上传后会出现在下方图片列表</span>
        </label>

        <div v-if="uploadedUrl" class="result-card">
          <label>刚上传的图片 URL</label>
          <div class="url-row">
            <input :value="uploadedUrl" type="text" readonly @focus="($event.target as HTMLInputElement).select()" />
            <button type="button" @click="copyUrl(uploadedUrl)">复制</button>
          </div>
        </div>
      </section>

      <section class="library-card">
        <div class="section-heading library-heading">
          <div>
            <h2>已上传图片</h2>
            <p>{{ loadingImages ? '正在加载…' : `共 ${images.length} 张` }}</p>
          </div>
        </div>

        <div v-if="!loadingImages && images.length === 0" class="empty-state">
          暂无已上传图片
        </div>

        <div v-else class="image-grid">
          <article v-for="image in images" :key="image.path" class="image-item">
            <a :href="image.url" target="_blank" rel="noopener noreferrer" class="image-preview">
              <img :src="image.url" :alt="image.path" loading="lazy" />
            </a>
            <div class="image-meta">
              <input :value="image.url" type="text" readonly @focus="($event.target as HTMLInputElement).select()" />
              <div class="image-actions">
                <button type="button" @click="copyUrl(image.url)">复制 URL</button>
                <button
                  type="button"
                  class="delete-btn"
                  :disabled="deletingPath === image.path"
                  @click="handleDelete(image)"
                >
                  {{ deletingPath === image.path ? '删除中…' : '删除' }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </AdminLayout>
</template>

<style scoped>
.image-page {
  max-width: 1100px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.page-title {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.page-desc,
.section-heading p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.refresh-btn,
.url-row button,
.image-actions button {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
}

.refresh-btn:disabled,
.image-actions button:disabled {
  opacity: 0.5;
  cursor: wait;
}

.upload-card,
.library-card {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: var(--space-8);
}

.library-card {
  margin-top: var(--space-6);
}

.section-heading {
  margin-bottom: var(--space-5);
}

.section-heading h2 {
  margin: 0 0 var(--space-1);
  font-size: 1rem;
  font-weight: 600;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
}

.dropzone:hover:not(.disabled) {
  border-color: var(--color-accent);
  background: var(--color-surface-alt);
}

.dropzone.disabled {
  cursor: wait;
  opacity: 0.6;
}

.upload-title {
  font-size: 0.95rem;
  font-weight: 500;
}

.upload-subtitle {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.result-card {
  margin-top: var(--space-5);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-light);
}

.result-card label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.url-row {
  display: flex;
  gap: var(--space-2);
}

.url-row input,
.image-meta input {
  min-width: 0;
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: 0.75rem;
}

.empty-state {
  padding: var(--space-12);
  text-align: center;
  color: var(--color-text-muted);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

.image-item {
  overflow: hidden;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: white;
}

.image-preview {
  display: block;
  aspect-ratio: 4 / 3;
  background: var(--color-surface);
}

.image-preview img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.image-meta {
  padding: var(--space-3);
}

.image-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.delete-btn {
  color: var(--color-error) !important;
}

.error-message {
  margin-top: var(--space-4);
  color: var(--color-error);
  font-size: 0.8rem;
}

@media (max-width: 900px) {
  .image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .upload-card,
  .library-card {
    padding: var(--space-5);
  }

  .image-grid {
    grid-template-columns: 1fr;
  }
}
</style>
