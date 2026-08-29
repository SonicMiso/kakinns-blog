<script setup lang="ts">
import { formatDate, formatDateLong, formatCreatedUpdated, getCategoryLabel } from '~/utils/format'

const route = useRoute()
const slug = route.params.slug as string

const work = await queryCollection('works')
  .where('slug', '=', slug)
  .where('status', '=', 'published')
  .first()

if (!work) {
  throw createError({ statusCode: 404, statusMessage: '作品不存在' })
}

const timestamps = computed(() => {
  const w = work
  if (!w) return null
  return formatCreatedUpdated(w.createdAt, w.updatedAt, { withTime: true })
})

useHead(() => ({
  title: `${work?.title} — Kakinn Studio`,
  meta: [
    { name: 'description', content: work?.excerpt }
  ]
}))

function onCoverError(event: Event) {
  const image = event.target as HTMLImageElement
  image.style.display = 'none'
  image.nextElementSibling?.removeAttribute('hidden')
}
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
        <img
          v-if="work.cover"
          :src="work.cover"
          :alt="`${work.title} 封面`"
          class="cover-media"
          fetchpriority="high"
          decoding="async"
          @error="onCoverError"
        />
        <div v-if="!work.cover" class="cover-placeholder" aria-hidden="true">
          <span class="cover-title">{{ work.title }}</span>
        </div>
        <div v-else class="cover-placeholder" hidden aria-hidden="true">
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

      <WorkGallery v-if="Array.isArray(work.gallery) && work.gallery.length > 0" :images="work.gallery" />

      <section v-if="work.body" class="work-process-section">
        <h2 class="section-title">制作过程</h2>
        <div class="prose markdown-body">
          <ContentRenderer :value="work" tag="div" class="content-renderer-host">
            <template #empty>
              <div class="empty-tip">该作品还没有制作过程描述</div>
            </template>
          </ContentRenderer>
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
.work-detail { padding-bottom: var(--space-16); }
.work-header { padding: var(--space-16) 0 var(--space-12); text-align: center; }
.back-link { display: inline-block; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: var(--space-6); transition: color var(--transition-fast); }
.back-link:hover { color: var(--color-accent); }
.work-meta-top { display: flex; align-items: center; justify-content: center; gap: var(--space-2); font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: var(--space-4); }
.category { font-weight: 500; }
.date { opacity: 0.5; }
.meta-time { font-size: 0.8rem; opacity: 0.65; }
.meta-time.muted { opacity: 0.45; }
.work-title { font-family: var(--font-serif); font-size: clamp(2rem, 4vw, 2.75rem); font-weight: 600; margin-bottom: var(--space-4); line-height: 1.2; }
.work-excerpt { font-size: 1.05rem; color: var(--color-text-secondary); line-height: 1.8; max-width: 560px; margin: 0 auto; }
.work-cover { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: var(--space-12); background: var(--color-surface); }
.cover-media { display: block; width: 100%; height: 100%; object-fit: cover; }
.cover-placeholder { position: absolute; inset: 0; background: linear-gradient(135deg, var(--color-surface-alt) 0%, #DDE0DF 50%, var(--color-surface-alt) 100%); display: flex; align-items: center; justify-content: center; }
.cover-placeholder[hidden] { display: none; }
.cover-title { font-family: var(--font-serif); font-size: 2rem; color: var(--color-text-muted); opacity: 0.4; }
.work-info { border-top: 1px solid var(--color-border-light); border-bottom: 1px solid var(--color-border-light); padding: var(--space-8) 0; margin-bottom: var(--space-12); }
.info-row { display: flex; gap: var(--space-12); flex-wrap: wrap; }
.info-item { display: flex; flex-direction: column; gap: var(--space-3); }
.info-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-text-muted); font-weight: 500; }
.info-value { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.tag { display: inline-block; padding: var(--space-1) var(--space-3); background: var(--color-surface); border: 1px solid var(--color-border-light); border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--color-text-secondary); }
.work-process-section { margin-top: var(--space-12); }
.section-title { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 600; margin-bottom: var(--space-8); }
.markdown-body { color: var(--color-text-secondary); line-height: 1.9; font-size: 1rem; }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3), .markdown-body :deep(h4) { font-family: var(--font-serif); color: var(--color-text); font-weight: 600; line-height: 1.35; margin-top: var(--space-10); margin-bottom: var(--space-4); }
.markdown-body :deep(h2) { font-size: 1.5rem; margin-top: var(--space-10); }
.markdown-body :deep(h3) { font-size: 1.25rem; }
.markdown-body :deep(p) { margin-bottom: var(--space-5); }
.empty-tip { color: var(--color-text-muted); padding: var(--space-10) 0; text-align: center; }
.work-nav { margin-top: var(--space-16); padding-top: var(--space-8); border-top: 1px solid var(--color-border-light); text-align: center; }
.back-to-list { font-size: 0.9rem; color: var(--color-text-muted); transition: color var(--transition-fast); }
.back-to-list:hover { color: var(--color-accent); }
@media (max-width: 768px) { .work-header { padding: var(--space-12) 0 var(--space-8); text-align: left; } .work-meta-top { justify-content: flex-start; } .work-cover { margin-bottom: var(--space-8); } .info-row { gap: var(--space-6); } .work-process-section { margin-top: var(--space-8); } }
</style>
