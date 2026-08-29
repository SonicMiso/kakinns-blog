<script setup lang="ts">
const journals = await queryCollection('journal')
  .where('status', '=', 'published')
  .order('date', 'DESC')
  .limit(20)
  .all()

useHead({
  title: '日志 — Kakinn\'s Studio'
})
</script>

<template>
  <div class="journal-page">
    <div class="container">
      <div class="container-narrow">
        <section class="page-header section-sm">
          <p class="page-eyebrow heading-eyebrow">Journal</p>
          <h1 class="page-title">制作日志</h1>
          <p class="page-desc">
            记录工作室的日常、创作心得与技术探索。
            这些文字是手作之外的另一种沉淀。
          </p>
        </section>

        <section class="journal-section section">
          <div v-if="journals.length > 0" class="journal-list">
            <JournalCard v-for="journal in journals" :key="journal.slug" :journal="journal" />
          </div>
          <div v-else class="empty-state">
            <p>暂无日志</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  padding-top: var(--space-16);
  padding-bottom: var(--space-8);
  text-align: center;
}
.page-eyebrow { margin-bottom: var(--space-3); }
.page-title { margin-bottom: var(--space-4); }
.page-desc {
  color: var(--color-text-muted);
  font-size: 1rem;
  line-height: 1.7;
  max-width: 480px;
  margin: 0 auto;
}
.journal-section { padding-top: var(--space-4); }
.journal-list { display: flex; flex-direction: column; }
.empty-state {
  text-align: center;
  padding: var(--space-16) 0;
  color: var(--color-text-muted);
}
@media (max-width: 768px) {
  .page-header {
    padding-top: var(--space-12);
    padding-bottom: var(--space-6);
    text-align: left;
  }
  .page-desc { margin: 0; }
}
</style>
