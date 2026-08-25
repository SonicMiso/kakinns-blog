<script setup lang="ts">
import type { Work } from '~/types'
import { formatDate, formatDateLong, getCategoryLabel } from '~/utils/format'

const route = useRoute()
const slug = route.params.slug as string

const { data: work } = await useAsyncData(`work-${slug}`, () =>
  queryCollection<Work>('works').where('slug', '=', slug).where('status', '=', 'published').first()
)

if (!work.value) {
  throw createError({ statusCode: 404, statusMessage: '作品不存在' })
}

// type=page 集合正文存放在 body 字段；process 是旧 JSON 格式字段，兼容读取
const workProcess = computed(() => {
  const w = work.value as any
  if (!w) return ''
  return w.process || w.body || w.content || ''
})

useHead(() => ({
  title: `${work.value?.title} — Kakin Studio`,
  meta: [
    { name: 'description', content: work.value?.excerpt }
  ]
}))
</script>

<template>
  <article v-if="work" class="work-detail">
    <div class="container-narrow">
      <header class="work-header">
        <NuxtLink to="/works" class="back-link">← 返回作品列表</NuxtLink>
        <div class="work-meta-top">
          <span class="category">{{ getCategoryLabel(work.category) }}</span>
          <span class="dot">·</span>
          <span class="date">{{ formatDateLong(work.date) }}</span>
        </div>
        <h1 class="work-title">{{ work.title }}</h1>
        <p class="work-excerpt">{{ work.excerpt }}</p>
      </header>
    </div>

    <div class="container-wide">
      <div class="work-cover">
        <div class="cover-placeholder">
          <span class="cover-title">{{ work.title }}</span>
        </div>
      </div>
    </div>

    <div class="container-narrow">
      <div class="work-info">
        <div class="info-row">
          <div class="info-item">
            <span class="info-label">材料</span>
            <span class="info-value">
              <span v-for="(m, i) in work.materials" :key="i" class="tag">
                {{ m }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">工具</span>
            <span class="info-value">
              <span v-for="(t, i) in work.tools" :key="i" class="tag">
                {{ t }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <WorkGallery v-if="work.gallery.length > 0" :images="work.gallery" />

      <div v-if="workProcess" class="work-process prose">
        <h2>制作过程</h2>
        <div class="process-content">
          <p v-for="(para, i) in workProcess.split('\n\n').filter(p => p.trim())" :key="i">
            {{ para.replace(/^#+\s*/, '') }}
          </p>
        </div>
      </div>

      <div class="work-nav">
        <NuxtLink to="/works" class="back-to-list">
          ← 查看更多作品
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.work-detail {
  padding-bottom: var(--space-16);
}

.work-header {
  padding: var(--space-16) 0 var(--space-12);
  text-align: center;
}

.back-link {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-accent);
}

.work-meta-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.category {
  font-weight: 500;
}

.dot {
  opacity: 0.5;
}

.work-title {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 600;
  margin-bottom: var(--space-4);
  line-height: 1.2;
}

.work-excerpt {
  font-size: 1.05rem;
  color: var(--color-text-secondary);
  line-height: 1.8;
  max-width: 560px;
  margin: 0 auto;
}

.work-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-12);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-surface-alt) 0%, #DDE0DF 50%, var(--color-surface-alt) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  color: var(--color-text-muted);
  opacity: 0.4;
}

.work-info {
  border-top: 1px solid var(--color-border-light);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--space-8) 0;
  margin-bottom: var(--space-12);
}

.info-row {
  display: flex;
  gap: var(--space-12);
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  font-weight: 500;
}

.info-value {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.work-process {
  margin-top: var(--space-12);
}

.work-process h2 {
  margin-bottom: var(--space-8);
}

.process-content {
  color: var(--color-text-secondary);
  line-height: 1.9;
}

.work-nav {
  margin-top: var(--space-16);
  padding-top: var(--space-8);
  border-top: 1px solid var(--color-border-light);
  text-align: center;
}

.back-to-list {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.back-to-list:hover {
  color: var(--color-accent);
}

@media (max-width: 768px) {
  .work-header {
    padding: var(--space-12) 0 var(--space-8);
    text-align: left;
  }

  .work-meta-top {
    justify-content: flex-start;
  }

  .work-cover {
    margin-bottom: var(--space-8);
  }

  .info-row {
    gap: var(--space-6);
  }

  .work-process {
    margin-top: var(--space-8);
  }
}
</style>
