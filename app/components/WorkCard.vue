<script setup lang="ts">
import type { Work } from '~/types'
import { formatDate, getCategoryLabel } from '~/utils/format'

interface Props {
  work: Work
}

defineProps<Props>()
</script>

<template>
  <NuxtLink :to="`/works/${work.slug}`" class="work-card">
    <div class="card-image">
      <img
        v-if="work.cover"
        :src="work.cover"
        :alt="`${work.title} 封面`"
        class="card-image-media"
        loading="lazy"
        decoding="async"
      />
      <div v-else class="image-placeholder" aria-hidden="true">
        <span class="placeholder-icon"></span>
      </div>
      <div v-if="work.featured" class="featured-badge">精选</div>
    </div>
    <div class="card-content">
      <div class="card-meta">
        <span class="category">{{ getCategoryLabel(work.category) }}</span>
        <span class="dot">·</span>
        <span class="date">{{ formatDate(work.date) }}</span>
      </div>
      <h3 class="card-title">{{ work.title }}</h3>
      <p class="card-excerpt">{{ work.excerpt }}</p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.work-card { display: flex; flex-direction: column; text-decoration: none; color: inherit; transition: transform var(--transition-base); }
.work-card:hover { transform: translateY(-4px); }
.card-image { position: relative; width: 100%; aspect-ratio: 4 / 3; background: var(--color-surface); overflow: hidden; border-radius: var(--radius-md); margin-bottom: var(--space-4); }
.card-image-media { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-base); }
.work-card:hover .card-image-media { transform: scale(1.02); }
.image-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--color-surface-alt) 0%, var(--color-surface) 100%); }
.placeholder-icon { width: 48px; height: 48px; border: 1px solid var(--color-border); border-radius: 50%; opacity: 0.3; }
.work-card:hover .card-image { box-shadow: var(--shadow-md); }
.featured-badge { position: absolute; top: var(--space-3); left: var(--space-3); padding: var(--space-1) var(--space-3); background: var(--color-accent); color: white; font-size: 0.7rem; letter-spacing: 0.05em; border-radius: var(--radius-sm); }
.card-meta { display: flex; align-items: center; gap: var(--space-2); font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: var(--space-2); }
.category { font-weight: 500; letter-spacing: 0.02em; }
.dot { opacity: 0.5; }
.card-title { font-family: var(--font-serif); font-size: 1.125rem; font-weight: 500; color: var(--color-text); margin-bottom: var(--space-2); line-height: 1.4; transition: color var(--transition-fast); }
.work-card:hover .card-title { color: var(--color-accent); }
.card-excerpt { font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
@media (max-width: 768px) { .card-title { font-size: 1rem; } }
</style>
