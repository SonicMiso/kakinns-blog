<script setup lang="ts">
import type { Work } from '~/types'
import { formatDate, formatDateLong, formatCreatedUpdated, getCategoryLabel } from '~/utils/format'
import { minimarkToMarkdown } from '~/utils/rawContentClient'

const route = useRoute()
const slug = route.params.slug as string

const { data: work } = await useAsyncData(`work-${slug}`, () =>
  queryCollection<Work>('works').where('slug', '=', slug).where('status', '=', 'published').first()
)

if (!work.value) {
  throw createError({ statusCode: 404, statusMessage: '作品不存在' })
}

// 为 Markdown 正文选择合适的渲染源：
//   Nuxt Content v3 会把 frontmatter 里包含的长文本字段（process/content/body）
//   统一解析成 minimark 结构（{ type: 'minimark', value: [...] }），
//   直接喂给 <ContentRenderer> 就能得到完整的 <h2>/<p>/<ul>/<code> DOM。
const processRendererSource = computed(() => {
  const w = work.value as any
  if (!w) return null
  // 优先选择是 minimark 对象的字段（ContentRenderer 原生支持）
  if (w.body && typeof w.body === 'object' && w.body.type === 'minimark') return w.body
  if (w.process && typeof w.process === 'object' && w.process.type === 'minimark') return w.process
  if (w.content && typeof w.content === 'object' && w.content.type === 'minimark') return w.content
  // 如果都不是 minimark 对象（例如仍是纯字符串的历史数据），就退化回：
  // 先还原成 Markdown 文本，然后在下面用 <pre class="prose"> 原样包一下保持可读性。
  return null
})

const processMarkdown = computed(() => {
  const w = work.value as any
  if (!w) return ''
  const v = processRendererSource.value
  if (v) return minimarkToMarkdown(v) // 有 minimark，但 fallback 用
  // 退化：尝试 process/content/body 的字符串值
  for (const k of ['process', 'content', 'body']) {
    const field = (w as any)[k]
    if (typeof field === 'string' && field.trim()) return field
  }
  return ''
})

const timestamps = computed(() => {
  const w = work.value
  if (!w) return null
  return formatCreatedUpdated(w.createdAt, w.updatedAt, { withTime: true })
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
          <template v-if="timestamps && timestamps.created">
            <span class="dot">·</span>
            <span class="meta-time" :title="`创建于 ${timestamps.created}`">创建 {{ timestamps.created }}</span>
          </template>
          <template v-if="timestamps && timestamps.updated">
            <span class="dot">·</span>
            <span class="meta-time muted" :title="`最后更新 ${timestamps.updated}`">更新 {{ timestamps.updated }}</span>
          </template>
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

      <section v-if="processRendererSource || processMarkdown" class="work-process-section">
        <h2 class="section-title">制作过程</h2>
        <div class="prose markdown-body">
          <!-- 优先用 Nuxt Content 原生 ContentRenderer，最小保真度最高 -->
          <ContentRenderer v-if="processRendererSource" :value="processRendererSource" />
          <!-- 降级：历史纯字符串 Markdown 放 <pre> 保证可读（正常情况下走不到这里） -->
          <pre v-else class="markdown-fallback">{{ processMarkdown }}</pre>
        </div>
      </section>

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
.category { font-weight: 500; }
.date { opacity: 0.5; }
.meta-time { font-size: 0.8rem; opacity: 0.65; }
.meta-time.muted { opacity: 0.45; }

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
.info-item { display: flex; flex-direction: column; gap: var(--space-3); }
.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  font-weight: 500;
}
.info-value { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.tag {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

/* 制作过程：ContentRenderer 注入的节点需要穿透 scoped；
   同时用统一的 prose/markdown-body 命名空间，与前台详情页共用视觉。 */
.work-process-section {
  margin-top: var(--space-12);
}
.section-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: var(--space-8);
}

.markdown-body {
  color: var(--color-text-secondary);
  line-height: 1.9;
  font-size: 1rem;
}

/* :deep(...) 穿透 scoped，让 v-html / ContentRenderer 产出的 h2/p/ul/code 能吃到样式 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-family: var(--font-serif);
  color: var(--color-text);
  font-weight: 600;
  line-height: 1.35;
  margin-top: var(--space-10);
  margin-bottom: var(--space-4);
}
.markdown-body :deep(h2) { font-size: 1.5rem; margin-top: var(--space-10); }
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
.markdown-body :deep(a:hover) {
  opacity: 0.8;
}
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
  .work-meta-top { justify-content: flex-start; }
  .work-cover { margin-bottom: var(--space-8); }
  .info-row { gap: var(--space-6); }
  .work-process-section { margin-top: var(--space-8); }
}
</style>
