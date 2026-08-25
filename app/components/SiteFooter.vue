<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="footer-logo">Kakin Studio</span>
          <p class="footer-tagline">手工艺个人工作室 · 用双手记录时间</p>
        </div>

        <div class="footer-links">
          <div class="footer-col">
            <h5>导航</h5>
            <ul>
              <li><NuxtLink to="/works">作品</NuxtLink></li>
              <li><NuxtLink to="/journal">日志</NuxtLink></li>
              <li><NuxtLink to="/about">关于</NuxtLink></li>
            </ul>
          </div>
          <div class="footer-col">
            <h5>联系</h5>
            <ul>
              <li><a href="mailto:hello@kakin.studio">hello@kakin.studio</a></li>
              <li><a href="#" target="_blank" rel="noopener">Instagram</a></li>
              <li><a href="#" target="_blank" rel="noopener">小红书</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} Kakin Studio. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: var(--space-24);
  padding-top: var(--space-16);
  padding-bottom: var(--space-6);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-light);
}

.footer-inner {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-16);
  padding-bottom: var(--space-12);
  border-bottom: 1px solid var(--color-border-light);
}

.footer-logo {
  display: block;
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.footer-tagline {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  max-width: 280px;
  line-height: 1.6;
}

.footer-links {
  display: flex;
  gap: var(--space-16);
  justify-content: flex-end;
}

.footer-col h5 {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
  font-family: var(--font-sans);
}

.footer-col ul {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.footer-col a {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.footer-col a:hover {
  color: var(--color-accent);
}

.footer-bottom {
  padding-top: var(--space-6);
  text-align: center;
}

.footer-bottom p {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .footer-inner {
    grid-template-columns: 1fr;
    gap: var(--space-8);
    padding-bottom: var(--space-8);
  }

  .footer-links {
    justify-content: flex-start;
    gap: var(--space-12);
  }
}
</style>
