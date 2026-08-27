<script setup lang="ts">
import type { Journal } from '~/types'
import { formatDate } from '~/utils/format'

interface Props {
  journal: Journal
}

defineProps<Props>()
</script>

<template>
  <!-- slug = 文件名（不含扩展名），详情页路由 /journal/<slug> -->
  <NuxtLink :to="`/journal/${journal.slug}`" class="journal-card">
    <div class="card-content">
      <div class="card-date">{{ formatDate(journal.date) }}</div>
      <h3 class="card-title">{{ journal.title }}</h3>
      <p class="card-excerpt">{{ journal.excerpt }}</p>
      <span class="read-more">阅读全文 →</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.journal-card {
  display: block;
  padding: var(--space-6) 0;
  border-bottom: 1px solid var(--color-border-light);
  text-decoration: none;
  color: inherit;
  transition: all var(--transition-fast);
}

.journal-card:last-child {
  border-bottom: none;
}

.journal-card:hover .card-title {
  color: var(--color-accent);
}

.card-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
  margin-bottom: var(--space-3);
}

.card-title {
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-3);
  line-height: 1.4;
  transition: color var(--transition-fast);
}

.card-excerpt {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-4);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more {
  font-size: 0.85rem;
  color: var(--color-accent);
  transition: all var(--transition-fast);
}

.journal-card:hover .read-more {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .journal-card {
    padding: var(--space-5) 0;
  }

  .card-title {
    font-size: 1.125rem;
  }
}
</style>
