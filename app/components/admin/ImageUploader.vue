<script setup lang="ts">
const uploading = ref(false)
const uploadedUrl = ref('')
const errorMessage = ref('')
const copied = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function handleUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  uploadedUrl.value = ''
  errorMessage.value = ''
  copied.value = false

  try {
    const body = new FormData()
    body.append('file', file)
    const result = await $fetch<{ url: string }>('/api/admin/images', {
      method: 'POST',
      body
    })
    uploadedUrl.value = result.url
    await copyUrl()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || '上传失败'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function copyUrl() {
  if (!uploadedUrl.value) return
  try {
    await navigator.clipboard.writeText(uploadedUrl.value)
    copied.value = true
    window.setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    copied.value = false
  }
}

function openPicker() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="image-uploader">
    <input
      ref="fileInput"
      class="file-input"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      @change="handleUpload"
    />

    <button class="upload-btn" type="button" :disabled="uploading" @click="openPicker">
      <span v-if="uploading">上传中…</span>
      <span v-else>上传图片</span>
    </button>

    <div v-if="uploadedUrl" class="upload-result">
      <input :value="uploadedUrl" type="text" readonly class="url-input" @focus="($event.target as HTMLInputElement).select()" />
      <button type="button" class="copy-btn" @click="copyUrl">
        {{ copied ? '已复制' : '复制 URL' }}
      </button>
    </div>

    <p v-if="uploadedUrl" class="upload-hint">图片已上传到 blog-imgs，并已自动复制 URL。</p>
    <p v-if="errorMessage" class="upload-error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.image-uploader {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.file-input {
  display: none;
}

.upload-btn,
.copy-btn {
  align-self: flex-start;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.upload-btn:hover:not(:disabled),
.copy-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.upload-result {
  display: flex;
  gap: var(--space-2);
}

.url-input {
  min-width: 0;
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.upload-hint,
.upload-error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.upload-error {
  color: var(--color-error);
}
</style>
