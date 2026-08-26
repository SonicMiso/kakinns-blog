<script setup lang="ts">
import type { Work } from '~/types'
import { CATEGORIES } from '~/types'

const route = useRoute()
const activeCategory = ref<string | null>(null)

const worksList = ref<Work[]>([])

function setCategory(cat: string | null) {
  activeCategory.value = cat
}

async function loadWorks() {
  let q = queryCollection<Work>('works').where('status', '=', 'published') as any
  if (activeCategory.value) q = q.where('category', '=', activeCategory.value)
  worksList.value = await q.order('date', 'DESC').all() as Work[]
}

// 初始 + 分类变化时刷新
await loadWorks()
watch(activeCategory, loadWorks)

const worksData = computed(() => ({ items: worksList.value, total: worksList.value.length }))

useHead({
  title: '作品 — Kakin Studio'
})
</script>

<template>
  <div class="works-page">
    <div class="container">
      <section class="page-header section-sm">
        <p class="page-eyebrow heading-eyebrow">Works</p>
        <h1 class="page-title">全部作品</h1>
        <p class="page-desc">
          木作、陶瓷、织物……每一件作品都由手工完成，记录着材料与时间的对话。
        </p>
      </section>

      <div class="filter-bar">
        <button
          class="filter-btn"
          :class="{ active: !activeCategory }"
          @click="setCategory(null)"
        >
          全部
        </button>
        <button
          v-for="cat in CATEGORIES"
          :key="cat.value"
          class="filter-btn"
          :class="{ active: activeCategory === cat.value }"
          @click="setCategory(cat.value)"
        >
          {{ cat.label }}
        </button>
      </div>

      <section class="works-section section">
        <div v-if="worksData.items.length > 0" class="works-grid">
          <WorkCard v-for="work in worksData.items" :key="work.slug" :work="work" />
        </div>
        <div v-else class="empty-state">
          <p>暂无作品</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  padding-top: var(--space-16);
  padding-bottom: var(--space-8);
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.page-eyebrow {
  margin-bottom: var(--space-3);
}

.page-title {
  margin-bottom: var(--space-4);
}

.page-desc {
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.filter-bar {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  flex-wrap: wrap;
  padding: var(--space-6) 0;
  border-top: 1px solid var(--color-border-light);
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: var(--space-10);
}

.filter-btn {
  padding: var(--space-2) var(--space-4);
  font-size: 0.85rem;
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  min-height: 36px;
}

.filter-btn:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.filter-btn.active {
  color: var(--color-text);
  background: var(--color-surface-alt);
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
}

.empty-state {
  text-align: center;
  padding: var(--space-16) 0;
  color: var(--color-text-muted);
}

@media (max-width: 1024px) {
  .works-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header {
    padding-top: var(--space-12);
    padding-bottom: var(--space-6);
    text-align: left;
  }

  .filter-bar {
    justify-content: flex-start;
    padding: var(--space-4) 0;
    margin-bottom: var(--space-8);
  }

  .works-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
}
</style>
