<script setup lang="ts">
import type { Journal } from '~/types'
import { formatDateLong } from '~/utils/format'

const route = useRoute()
const slug = route.params.slug as string

const { data: journal } = await useAsyncData(`journal-${slug}`, () =>
  queryCollection<Journal>('journal').where('slug', '=', slug).where('status', '=', 'published').first()
)

if (!journal.value) {
  throw createError({ statusCode: 404, statusMessage: '日志不存在' })
}

// 正文：Nuxt Content type=page 集合会把 markdown 正文放 body 字段；我们自己原格式用 content。做个兼容。
const journalBody = computed(() => {
  const j = journal.value as any
  if (!j) return ''
  return j.content || j.body || ''
})

useHead(() => ({
  title: `${journal.value?.title} — Kakin Studio`,
  meta: [
    { name: 'description', content: journal.value?.excerpt }
  ]
}))
</script>

<template>
  <article v-if="journal" class="journal-detail">
    <div class="container-narrow">
      <header class="journal-header">
        <NuxtLink to="/journal" class="back-link">← 返回日志列表</NuxtLink>
        <p class="journal-date">{{ formatDateLong(journal.date) }}</p>
        <h1 class="journal-title">{{ journal.title }}</h1>
      </header>

      <div class="journal-cover">
        <div class="cover-placeholder">
          <span class="cover-label"></span>
        </div>
      </div>

      <div class="journal-content prose">
        <p v-for="(para, i) in journalBody.split('\n\n').filter(p => p.trim())" :key="i">
          <template v-if="para.match(/^##+\s/)">
            <strong class="section-heading">{{ para.replace(/^#+\s*/, '') }}</strong>
          </template>
          <template v-else>
            {{ para }}
          </template>
        </p>
      </div>

      <div class="journal-nav">
        <NuxtLink to="/journal" class="back-to-list">
          ← 查看更多日志
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.journal-detail {
  padding-bottom: var(--space-16);
}

.journal-header {
  padding: var(--space-16) 0 var(--space-10);
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

.journal-date {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.journal-title {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 600;
  line-height: 1.3;
}

.journal-cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--space-10);
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-surface-alt) 0%, #E0E3E2 50%, var(--color-surface-alt) 100%);
}

.journal-content {
  color: var(--color-text-secondary);
  line-height: 1.9;
  font-size: 1.02rem;
}

.journal-content p {
  margin-bottom: var(--space-5);
}

.section-heading {
  display: block;
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--color-text);
  margin-top: var(--space-10);
  margin-bottom: var(--space-4);
}

.journal-nav {
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
  .journal-header {
    padding: var(--space-12) 0 var(--space-8);
    text-align: left;
  }

  .journal-cover {
    margin-bottom: var(--space-8);
  }

  .journal-content {
    font-size: 1rem;
  }
}
</style>
