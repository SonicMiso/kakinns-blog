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

const heroMainImage = works[0]?.cover || ''
const studioCornerImage =
  journals.find(item => item.cover)?.cover ||
  'https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=1600'

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
              <img
                v-if="heroMainImage"
                :src="heroMainImage"
                alt="精选作品"
                class="hero-image-media"
                loading="lazy"
                decoding="async"
              />
              <div v-else class="image-placeholder">
                <span class="placeholder-label">精选作品</span>
              </div>
            </div>
            <div class="hero-image hero-image-sub">
              <img
                v-if="studioCornerImage"
                :src="studioCornerImage"
                alt="工作室一角"
                class="hero-image-media"
                loading="lazy"
                decoding="async"
              />
              <div v-else class="image-placeholder">
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
.hero-image-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  .featured-grid { grid-template-columns: 1fr; }
  .section-head { align-items: flex-start; }
}
</style>
