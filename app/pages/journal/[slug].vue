<script setup lang="ts">
import { formatDateLong, formatCreatedUpdated } from '~/utils/format'

const route = useRoute()
const slug = route.params.slug as string

const journal = await queryCollection('journal')
  .where('slug', '=', slug)
  .where('status', '=', 'published')
  .first()

if (!journal) {
  throw createError({ statusCode: 404, statusMessage: '日志不存在' })
}

const timestamps = computed(() => {
  const j = journal
  if (!j) return null
  return formatCreatedUpdated(j.createdAt, j.updatedAt, { withTime: true })
})

useHead(() => ({
  title: `${journal?.title} — Kakin Studio`,
  meta: [
    { name: 'description', content: journal?.excerpt }
  ]
}))
</script>

<template>
  <article v-if="journal" class="journal-detail">
    <div class="container-narrow">
      <header class="journal-header">
        <NuxtLink to="/journal" class="back-link">← 返回日志列表</NuxtLink>
        <p class="journal-date">{{ formatDateLong(journal.date) }}
          <template v-if="timestamps && (timestamps.created || timestamps.updated)">
            <template v-if="timestamps.created"> · 创建 {{ timestamps.created }}</template>
            <template v-if="timestamps.updated"> · <span class="muted">更新 {{ timestamps.updated }}</span></template>
          </template>
        </p>
        <h1 class="journal-title">{{ journal.title }}</h1>
      </header>

      <div class="journal-cover">
        <div class="cover-placeholder">
          <span class="cover-label"></span>
        </div>
      </div>

      <div class="prose markdown-body">
        <ContentRenderer :value="journal" tag="div" class="content-renderer-host">
          <template #empty>
            <div class="empty-tip">这篇日志还没有正文</div>
          </template>
        </ContentRenderer>
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
.journal-detail { padding-bottom: var(--space-16); }
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
.back-link:hover { color: var(--color-accent); }
.journal-date {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}
.journal-date .muted { opacity: 0.6; }
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

.markdown-body {
  color: var(--color-text-secondary);
  line-height: 1.9;
  font-size: 1.02rem;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-family: var(--font-serif);
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.35;
  margin-top: var(--space-10);
  margin-bottom: var(--space-4);
}
.markdown-body :deep(h1) { font-size: 1.75rem; }
.markdown-body :deep(h2) { font-size: 1.5rem; }
.markdown-body :deep(h3) { font-size: 1.25rem; }
.markdown-body :deep(p) { margin-bottom: var(--space-5); }
.empty-tip {
  color: var(--color-text-muted);
  padding: var(--space-10) 0;
  text-align: center;
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
.back-to-list:hover { color: var(--color-accent); }

@media (max-width: 768px) {
  .journal-header {
    padding: var(--space-12) 0 var(--space-8);
    text-align: left;
  }
  .journal-cover { margin-bottom: var(--space-8); }
  .markdown-body { font-size: 1rem; }
}
</style>
