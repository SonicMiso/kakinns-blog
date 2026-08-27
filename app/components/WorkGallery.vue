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
        <img
          :src="images[activeIndex]"
          :alt="`作品图片 ${activeIndex + 1}`"
          class="gallery-image-media"
          loading="lazy"
          decoding="async"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
      </div>
      <button v-if="images.length > 1" type="button" class="gallery-nav prev" @click="prev" aria-label="上一张">
        <span></span>
      </button>
      <button v-if="images.length > 1" type="button" class="gallery-nav next" @click="next" aria-label="下一张">
        <span></span>
      </button>
    </div>

    <div v-if="images.length > 1" class="gallery-thumbs" role="tablist" aria-label="作品图片缩略图">
      <button
        v-for="(img, index) in images"
        :key="`${img}-${index}`"
        type="button"
        class="thumb"
        :class="{ active: activeIndex === index }"
        :aria-label="`查看图片 ${index + 1}`"
        :aria-selected="activeIndex === index"
        role="tab"
        @click="setActive(index)"
      >
        <img :src="img" :alt="`作品缩略图 ${index + 1}`" class="thumb-media" loading="lazy" decoding="async" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.work-gallery { margin: var(--space-8) 0; }
.gallery-main {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.gallery-image { width: 100%; height: 100%; }
.gallery-image-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--color-surface);
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
.gallery-nav:hover { opacity: 1; background: white; }
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
  transition: opacity var(--transition-fast), border-color var(--transition-fast);
  border: 2px solid transparent;
}
.thumb:hover, .thumb.active { opacity: 1; }
.thumb.active { border-color: var(--color-accent); }
.thumb-media {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (max-width: 768px) {
  .gallery-nav { width: 36px; height: 36px; }
  .gallery-nav.prev { left: var(--space-2); }
  .gallery-nav.next { right: var(--space-2); }
  .thumb { width: 64px; height: 48px; }
}
</style>
