<script setup lang="ts">
const navItems = [
  { href: '/', label: '首页' },
  { href: '/works', label: '作品' },
  { href: '/journal', label: '日志' },
  { href: '/about', label: '关于' }
]

const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}
</script>

<template>
  <header class="site-header">
    <div class="container">
      <div class="header-inner">
        <NuxtLink to="/" class="logo" @click="closeMenu">
          <span class="logo-text">Kakinn's Studio</span>
        </NuxtLink>

        <button class="menu-toggle" @click="toggleMenu" :aria-label="isMenuOpen ? '关闭菜单' : '打开菜单'">
          <span class="menu-icon" :class="{ open: isMenuOpen }">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <nav class="nav" :class="{ open: isMenuOpen }">
          <ul>
            <li v-for="item in navItems" :key="item.href">
              <NuxtLink
                :to="item.href"
                class="nav-link"
                @click="closeMenu"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border-light);
  backdrop-filter: blur(12px);
  background: rgba(244, 245, 245, 0.85);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.logo {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.02em;
}

.logo:hover {
  color: var(--color-accent);
}

.nav ul {
  display: flex;
  gap: var(--space-8);
  align-items: center;
}

.nav-link {
  position: relative;
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  padding: var(--space-2) 0;
  transition: color var(--transition-fast);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--color-accent);
  transition: width var(--transition-base);
}

.nav-link:hover,
.nav-link.active {
  color: var(--color-text);
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 100%;
}

.menu-toggle {
  display: none;
  padding: var(--space-2);
  margin-right: calc(var(--space-2) * -1);
}

.menu-icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 24px;
  height: 20px;
  position: relative;
}

.menu-icon span {
  display: block;
  width: 100%;
  height: 1px;
  background: var(--color-text);
  transition: all var(--transition-base);
  position: absolute;
  left: 0;
}

.menu-icon span:nth-child(1) { top: 2px; }
.menu-icon span:nth-child(2) { top: 50%; transform: translateY(-50%); }
.menu-icon span:nth-child(3) { bottom: 2px; }

.menu-icon.open span:nth-child(1) {
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

.menu-icon.open span:nth-child(2) {
  opacity: 0;
}

.menu-icon.open span:nth-child(3) {
  bottom: 50%;
  transform: translateY(50%) rotate(-45deg);
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .nav {
    position: fixed;
    top: 72px;
    left: 0;
    right: 0;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border-light);
    padding: var(--space-6) var(--space-6);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all var(--transition-base);
  }

  .nav.open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .nav ul {
    flex-direction: column;
    gap: var(--space-4);
    align-items: flex-start;
  }

  .nav-link {
    font-size: 1.125rem;
    padding: var(--space-2) 0;
  }
}
</style>
