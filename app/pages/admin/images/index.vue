<script setup lang="ts">
definePageMeta({
  layout: false
})

const uploadedUrl = ref('')
const uploading = ref(false)
const errorMessage = ref('')

useHead({
  title: '图片管理 — 管理后台'
})

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
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || '上传失败'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <AdminLayout>
    <div class="image-page">
      <header class="page-header">
        <div>
          <h1 class="page-title">图片管理</h1>
          <p class="page-desc">上传并管理博客使用的图片</p>
        </div>
      </header>

      <section class="upload-card">
        <h2>上传图片</h2>
        <p class="upload-desc">支持 JPG、PNG、WebP、GIF，单张最大 10 MB。</p>

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
          <span class="upload-subtitle">上传到 SonicMiso/blog-imgs</span>
        </label>

        <div v-if="uploadedUrl" class="result-card">
          <label>图片 URL</label>
          <div class="url-row">
            <input :value="uploadedUrl" type="text" readonly @focus="($event.target as HTMLInputElement).select()" />
            <button type="button" @click="navigator.clipboard?.writeText(uploadedUrl)">复制</button>
          </div>
          <p>上传成功，URL 已尝试自动复制到剪贴板。</p>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </section>
    </div>
  </AdminLayout>
</template>

<style scoped>
.image-page {
  max-width: 900px;
}

.page-header {
  margin-bottom: var(--space-6);
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

.upload-card {
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: var(--space-8);
}

.upload-card h2 {
  margin: 0 0 var(--space-2);
  font-size: 1rem;
  font-weight: 600;
}

.upload-desc {
  margin: 0 0 var(--space-5);
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--transition-fast);
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
  color: var(--color-text);
}

.upload-subtitle {
  margin-top: var(--space-2);
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.result-card {
  margin-top: var(--space-6);
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

.url-row input {
  min-width: 0;
  flex: 1;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: 0.8rem;
}

.url-row button {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  cursor: pointer;
}

.result-card p,
.error-message {
  margin: var(--space-2) 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.error-message {
  color: var(--color-error);
}
</style>
