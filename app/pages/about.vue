<script setup lang="ts">
const studioCover = 'https://images.pexels.com/photos/4226806/pexels-photo-4226806.jpeg?auto=compress&cs=tinysrgb&w=1600'

function onStudioCoverError(event: Event) {
  const image = event.target as HTMLImageElement
  image.style.display = 'none'
  image.nextElementSibling?.removeAttribute('hidden')
}

useHead({
  title: '关于 — Kakin Studio'
})
</script>

<template>
  <div class="about-page">
    <div class="container">
      <div class="container-narrow">
        <section class="about-intro section-sm">
          <p class="page-eyebrow heading-eyebrow">About</p>
          <h1 class="page-title">关于工作室</h1>
        </section>

        <section class="about-content section">
          <div class="about-image-hero">
            <img
              :src="studioCover"
              alt="工作室空间"
              class="studio-cover-media"
              loading="lazy"
              decoding="async"
              @error="onStudioCoverError"
            />
            <div class="image-placeholder" aria-hidden="true" hidden>
              <span class="placeholder-text">工作室空间</span>
            </div>
          </div>

          <div class="prose about-text">
            <p>
              Kakin Studio 是一间独立的手工艺个人工作室，成立于 2022 年。
              工作室专注于木作、陶瓷与天然染色三个方向，
              每一件作品都由手工完成。
            </p>

            <h2>理念</h2>
            <p>
              我们相信"慢工出细活"。在这个一切都追求速度的时代，
              手工制作似乎显得有些不合时宜。但正是这种"慢"，
              让作品有了温度，让过程有了意义。
            </p>
            <p>
              每一件作品都不是完美的——手工的痕迹、材料的特性、
              时间的沉淀，这些不完美恰恰是作品最动人的地方。
            </p>

            <h2>方向</h2>
            <p>
              <strong>木作</strong>：以榫卯结构为核心，使用天然木材和木蜡油，
              制作日常使用的小器物和收纳用品。
            </p>
            <p>
              <strong>陶瓷</strong>：手工拉坯与手捏成型，关注器物的使用手感，
              尝试不同的釉色和烧成方式。
            </p>
            <p>
              <strong>天然染色</strong>：从植物中提取染料，在丝绸、棉布上
              留下自然柔和的色彩。
            </p>

            <h2>联系</h2>
            <p>
              如果你对我们的作品感兴趣，或者有合作意向，
              欢迎通过以下方式联系我们：
            </p>
            <ul>
              <li>邮箱：hello@kakin.studio</li>
              <li>微信：kakin-studio</li>
              <li>工作室地址：预约制，暂不对外开放</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-intro {
  padding-top: var(--space-16);
  padding-bottom: var(--space-8);
  text-align: center;
}

.page-eyebrow {
  margin-bottom: var(--space-3);
}

.page-title {
  margin-bottom: 0;
}

.about-content {
  padding-top: var(--space-4);
  padding-bottom: var(--space-16);
}

.about-image-hero {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-12);
  background: var(--color-surface-alt);
}

.studio-cover-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-surface-alt) 0%, #DDE0DF 50%, var(--color-surface-alt) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder[hidden] {
  display: none;
}

.placeholder-text {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--color-text-muted);
  opacity: 0.4;
}

.about-text {
  color: var(--color-text-secondary);
  line-height: 1.9;
  font-size: 1rem;
}

.about-text h2 {
  margin-top: var(--space-12);
  margin-bottom: var(--space-4);
  font-family: var(--font-serif);
  font-weight: 600;
  color: var(--color-text);
}

.about-text p {
  margin-bottom: var(--space-5);
}

.about-text ul {
  list-style: none;
  padding: 0;
  margin-bottom: var(--space-5);
}

.about-text li {
  padding: var(--space-2) 0;
  padding-left: var(--space-5);
  position: relative;
}

.about-text li::before {
  content: '—';
  position: absolute;
  left: 0;
  color: var(--color-border);
}

@media (max-width: 768px) {
  .about-intro {
    padding-top: var(--space-12);
    padding-bottom: var(--space-6);
    text-align: left;
  }

  .about-image-hero {
    margin-bottom: var(--space-8);
  }
}
</style>
