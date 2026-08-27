<script setup lang="ts">
const works = await queryCollection('works')
  .where('featured', '=', true)
  .where('status', '=', 'published')
  .order('date', 'DESC')
  .limit(3)
  .all()

const journals = await queryCollection('journal')
  .where('status', '=', 'published')
  .order('date', 'DESC')
  .limit(2)
  .all()

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
        <div class="section-head">
          <div>
            <p class="section-eyebrow heading-eyebrow">Featured Works</p>
            <h2 class="section-title">精选作品</h2>
          </div>
          <NuxtLink to="/works" class="section-more">查看全部 →</NuxtLink>
        </div>

        <div v-if="works.length > 0" class="featured-grid">
          <WorkCard v-for="work in works" :key="work.slug" :work="work" />
        </div>
        <div v-else class="empty-state">
          <p>暂无精选作品</p>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="container-narrow">
          <div class="section-head">
            <div>
              <p class="section-eyebrow heading-eyebrow">Journal</p>
              <h2 class="section-title">近期日志</h2>
            </div>
            <NuxtLink to="/journal" class="section-more">阅读更多 →</NuxtLink>
          </div>

          <div v-if="journals.length > 0" class="recent-journals">
            <JournalCard v-for="journal in journals" :key="journal.slug" :journal="journal" />
          </div>
          <div v-else class="empty-state">
            <p>暂无日志</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-alt { background: var(--color-surface-alt); }
.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--space-10);
  gap: var(--space-6);
  flex-wrap: wrap;
}
.section-more {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}
.section-more:hover { color: var(--color-accent); }
.featured-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-10);
}
.recent-journals { display: flex; flex-direction: column; }
.empty-state {
  text-align: center;
  padding: var(--space-12) 0;
  color: var(--color-text-muted);
}
@media (max-width: 1024px) {
  .featured-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-8); }
}
@media (max-width: 768px) {
  .featured-grid { grid-template-columns: 1fr; }
  .section-head { align-items: flex-start; }
}
</style>
