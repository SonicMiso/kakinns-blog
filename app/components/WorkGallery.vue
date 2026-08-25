<script setup lang="ts">
interface Props {
  images: string[]
}

const props = defineProps<Props>()

const activeIndex = ref(0)

function setActive(index: number) {
  activeIndex.value = index
}

function next() {
  activeIndex.value = (activeIndex.value + 1) % (props.images.length || 1)
}

function prev() {
  const total = props.images.length || 1
  activeIndex.value = (activeIndex.value - 1 + total) % total
}
</script>

<template>
  <div v-if="images.length > 0" class="work-gallery">
    <div class="gallery-main">
      <div class="gallery-image">
        <div class="image-placeholder large"></div>
      </div>
      <button
        v-if="images.length > 1"
        class="gallery-nav prev"
        @click="prev"
        aria-label="上一张"
      >
        <span></span>
      </button>
      <button
        v-if="images.length > 1"
        class="gallery-nav next"
        @click="next"
        aria-label="下一张"
      >
        <span></span>
      </button>
    </div>

    <div v-if="images.length > 1" class="gallery-thumbs">
      <button
        v-for="(img, index) in images"
        :key="index"
        class="thumb"
        :class="{ active: activeIndex === index }"
        @click="setActive(index)"
      >
        <div class="thumb-placeholder"></div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.work-gallery {
  margin: var(--space-8) 0;
}

.gallery-main {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.gallery-image {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-surface-alt) 0%, var(--color-surface) 100%);
}

.image-placeholder.large::after {
  content: '作品图集';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--color-text-muted);
  opacity: 0.4;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transition: all var(--transition-fast);
  opacity: 0.7;
}

.gallery-nav:hover {
  opacity: 1;
  background: white;
}

.gallery-nav.prev { left: var(--space-4); }
.gallery-nav.next { right: var(--space-4); }

.gallery-nav span {
  width: 10px;
  height: 10px;
  border-top: 1.5px solid var(--color-text);
  border-left: 1.5px solid var(--color-text);
}

.gallery-nav.prev span { transform: rotate(-45deg); margin-left: 3px; }
.gallery-nav.next span { transform: rotate(135deg); margin-right: 3px; }

.gallery-thumbs {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
  overflow-x: auto;
  padding-bottom: var(--space-2);
}

.thumb {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
  border: 2px solid transparent;
}

.thumb:hover,
.thumb.active {
  opacity: 1;
}

.thumb.active {
  border-color: var(--color-accent);
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-surface-alt) 0%, var(--color-surface) 100%);
}

@media (max-width: 768px) {
  .gallery-nav {
    width: 36px;
    height: 36px;
  }

  .gallery-nav.prev { left: var(--space-2); }
  .gallery-nav.next { right: var(--space-2); }

  .thumb {
    width: 64px;
    height: 48px;
  }
}
</style>
