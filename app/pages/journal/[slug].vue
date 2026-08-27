<script setup lang="ts">
import type { Journal } from '~/types'
import { formatDateLong, formatCreatedUpdated } from '~/utils/format'
import { minimarkToMarkdown } from '~/utils/rawContentClient'

const route = useRoute()
const slug = route.params.slug as string

const { data: journal } = await useAsyncData(`journal-${slug}`, () =>
  queryCollection<Journal>('journal').where('slug', '=', slug).where('status', '=', 'published').first()
)

if (!journal.value) {
  throw createError({ statusCode: 404, statusMessage: '日志不存在' })
}

const contentRendererSource = computed(() => {
  const j = journal.value as any
  if (!j) return null
  if (j.body && typeof j.body === 'object' && j.body.type === 'minimark') return j.body
  if (j.content && typeof j.content === 'object' && j.content.type === 'minimark') return j.content
  if (j.process && typeof j.process === 'object' && j.process.type === 'minimark') return j.process
  return null
})

const contentMarkdown = computed(() => {
  const j = journal.value as any
  if (!j) return ''
  const v = contentRendererSource.value
  if (v) return minimarkToMarkdown(v)
  for (const k of ['content', 'body', 'process']) {
    const field = (j as any)[k]
    if (typeof field === 'string' && field.trim()) return field
  }
  return ''
})

const timestamps = computed(() => {
  const j = journal.value
  if (!j) return null
  return formatCreatedUpdated(j.createdAt, j.updatedAt, { withTime: true })
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
        <!-- 原生 Nuxt Content minimark 渲染：<h2>/<p>/<ul>/<strong> 全部成正确 DOM -->
          <ContentRenderer v-if="contentRendererSource" :value="contentRendererSource" />
        <!-- 降级：历史字符串保留原样输出 -->
        <pre v-else class="markdown-fallback">{{ contentMarkdown }}</pre>
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

/* ============== Markdown 渲染样式（:deep 穿透 scoped） ============== */
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

.markdown-body :deep(p) {
  margin-bottom: var(--space-5);
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: var(--space-5);
  padding-left: var(--space-6);
}
.markdown-body :deep(li) {
  margin-bottom: var(--space-2);
}
.markdown-body :deep(blockquote) {
  margin: var(--space-6) 0;
  padding: var(--space-3) var(--space-5);
  border-left: 3px solid var(--color-accent);
  color: var(--color-text-muted);
  background: var(--color-surface-alt);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.markdown-body :deep(pre) {
  background: var(--color-surface-alt);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: var(--space-5);
}
.markdown-body :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background: var(--color-surface-alt);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}
.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  border-radius: 0;
}
.markdown-body :deep(a) {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.markdown-body :deep(a:hover) { opacity: 0.8; }
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: var(--space-10) 0;
}
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: var(--space-5);
  font-size: 0.95rem;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border-light);
  text-align: left;
}
.markdown-body :deep(th) {
  background: var(--color-surface);
  font-weight: 500;
  color: var(--color-text);
}
.markdown-body :deep(strong),
.markdown-body :deep(b) {
  font-weight: 600;
  color: var(--color-text);
}
.markdown-body :deep(em),
.markdown-body :deep(i) {
  font-style: italic;
}

.markdown-fallback {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  color: inherit;
  line-height: inherit;
  background: transparent;
  padding: 0;
  margin: 0;
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
