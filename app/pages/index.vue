<script setup lang="ts">
import type { Work, Journal } from '~/types'

// 首页：使用 Nuxt Content 内置 queryCollection，直接命中 SQLite dump + 客户端 WASM
const { data: worksData } = await useAsyncData(
  'home-featured-works',
  () => queryCollection<Work>('works').where('featured', '=', true).where('status', '=', 'published').order('date', 'DESC').limit(3).all(),
  { default: () => [] as Work[] }
)
const featuredWorks = computed(() => ({ items: worksData.value || [], total: (worksData.value || []).length }))

const { data: journalsData } = await useAsyncData(
  'home-recent-journals',
  () => queryCollection<Journal>('journal').where('status', '=', 'published').order('date', 'DESC').limit(2).all(),
  { default: () => [] as Journal[] }
)
const recentJournals = computed(() => ({ items: journalsData.value || [], total: (journalsData.value || []).length }))

useHead({
  title: 'Kakin Studio — 手工艺个人工作室'
})
</script>

<template>
  <div class="home-page">
    <section class="hero section-lg">
      <div class="container">
        <div class="hero-inner">
          <div class="hero-text">
            <p class="hero-eyebrow heading-eyebrow">手工艺 · 慢生活</p>
            <h1 class="hero-title heading-display">
              用双手<br />记录时间的温度
            </h1>
            <p class="hero-desc">
              一间安静的个人工作室，专注于木作、陶瓷与天然染色。
              每一件作品都承载着材料的故事和手工的痕迹。
            </p>
            <div class="hero-actions">
              <NuxtLink to="/works" class="btn btn-primary">浏览作品</NuxtLink>
              <NuxtLink to="/about" class="btn btn-ghost">关于工作室 →</NuxtLink>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-image hero-image-main">
              <div class="image-placeholder">
                <span class="placeholder-label">精选作品</span>
              </div>
            </div>
            <div class="hero-image hero-image-sub">
              <div class="image-placeholder">
                <span class="placeholder-label small">工作室一角</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header">
          <div>
            <p class="section-eyebrow heading-eyebrow">Featured Works</p>
            <h2 class="section-title">精选作品</h2>
          </div>
          <NuxtLink to="/works" class="section-link">查看全部 →</NuxtLink>
        </div>

        <div class="works-grid">
          <WorkCard v-for="work in featuredWorks.items" :key="work.id" :work="work" />
        </div>
      </div>
    </section>

    <section class="section journal-section">
      <div class="container">
        <div class="section-header">
          <div>
            <p class="section-eyebrow heading-eyebrow">Journal</p>
            <h2 class="section-title">制作日志</h2>
          </div>
          <NuxtLink to="/journal" class="section-link">全部日志 →</NuxtLink>
        </div>

        <div class="journal-list">
          <JournalCard v-for="journal in recentJournals.items" :key="journal.id" :journal="journal" />
        </div>
      </div>
    </section>

    <section class="section about-preview">
      <div class="container">
        <div class="about-grid">
          <div class="about-visual">
            <div class="about-image">
              <div class="image-placeholder">
                <span class="placeholder-label">工作室</span>
              </div>
            </div>
          </div>
          <div class="about-text">
            <p class="section-eyebrow heading-eyebrow">About</p>
            <h2 class="section-title">工作室一瞥</h2>
            <p class="about-desc">
              Kakin Studio 成立于 2022 年，是一间专注于手工制作的个人工作室。
              我们相信慢工出细活，每一件作品都需要时间的沉淀和双手的温度。
              在这里，你可以看到从原材料到成品的完整过程。
            </p>
            <NuxtLink to="/about" class="btn btn-primary">了解更多</NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding-top: var(--space-16);
  padding-bottom: var(--space-20);
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-16);
  align-items: center;
}

.hero-eyebrow {
  margin-bottom: var(--space-4);
}

.hero-title {
  margin-bottom: var(--space-6);
}

.hero-desc {
  font-size: 1.05rem;
  color: var(--color-text-secondary);
  line-height: 1.8;
  max-width: 420px;
  margin-bottom: var(--space-8);
}

.hero-actions {
  display: flex;
  gap: var(--space-5);
  align-items: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-6);
  font-size: 0.9rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  min-height: 44px;
}

.btn-primary {
  background: var(--color-text);
  color: var(--color-bg);
}

.btn-primary:hover {
  background: var(--color-accent);
  color: white;
}

.btn-ghost {
  color: var(--color-text-secondary);
  padding: var(--space-3) 0;
}

.btn-ghost:hover {
  color: var(--color-accent);
}

.hero-visual {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.hero-image {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.hero-image-main {
  aspect-ratio: 4 / 5;
}

.hero-image-sub {
  position: absolute;
  bottom: -2rem;
  left: -2rem;
  width: 45%;
  aspect-ratio: 1;
  border: 4px solid var(--color-bg);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-surface-alt) 0%, #E2E5E4 50%, var(--color-surface-alt) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.placeholder-label {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--color-text-muted);
  opacity: 0.5;
}

.placeholder-label.small {
  font-size: 0.9rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--space-10);
}

.section-eyebrow {
  margin-bottom: var(--space-3);
}

.section-title {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
}

.section-link {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  transition: all var(--transition-fast);
}

.section-link:hover {
  color: var(--color-accent);
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
}

.journal-section {
  background: var(--color-surface);
  margin: 0 calc(-50vw + 50%);
  padding-left: calc(50vw - 50%);
  padding-right: calc(50vw - 50%);
}

.journal-list {
  max-width: var(--container-narrow);
  margin: 0 auto;
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-16);
  align-items: center;
}

.about-visual {
  position: relative;
}

.about-image {
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.about-text {
  max-width: 480px;
}

.about-desc {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin: var(--space-6) 0 var(--space-8);
}

@media (max-width: 1024px) {
  .works-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero {
    padding-top: var(--space-12);
    padding-bottom: var(--space-16);
  }

  .hero-inner {
    grid-template-columns: 1fr;
    gap: var(--space-10);
  }

  .hero-visual {
    order: -1;
  }

  .hero-image-sub {
    display: none;
  }

  .hero-desc {
    font-size: 1rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .works-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .about-grid {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }

  .about-image {
    aspect-ratio: 16 / 10;
  }
}
</style>
