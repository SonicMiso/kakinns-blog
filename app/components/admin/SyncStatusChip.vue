<script setup lang="ts">
// 管理后台「主站同步状态」芯片：
//   - 绿色 ✅ 已同步：主站 commit >= 最近一次 admin push 的 commit
//   - 黄色 ⏳ 同步中：push 成功但主站 / Actions 还没到位（每 30s 轮询一次，最长 15min）
//   - 红色 ⚠️ 失败：Actions 失败 / 超时未同步 / GitHub 调用异常
//   - 灰色 ❓ 未知：还没 push 过 / 本地开发走 localOnly 模式 / 不可查询
//
// Props:
//   - size: 'sm'（按钮旁、列表顶部紧凑 chip）/ 'md'（仪表盘右上角）
//   - autoPoll：默认 true。列表页只需要展示「最近一次」状态并轮询时为 true；编辑页保存后写一次 localStorage，组件也会从它立刻开始轮询。
//   - scopeHint：仅用于 tooltip 描述，如「作品：xxx」，可空
//
// 对外暴露一个主动刷新方法：暴露在 defineExpose({ refresh })，父组件可以 const chip = ref(); chip.value?.refresh(true)。
import type { LastPushedCommit, SyncStatusResponse } from '~/types'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md'
  autoPoll?: boolean
  scopeHint?: string
}>(), {
  size: 'sm',
  autoPoll: true,
  scopeHint: ''
})

const POLL_MS = 30 * 1000
const STORAGE_KEY = 'admin:lastPushedCommit'
const sizeClass = computed(() => `size-${props.size}`)

const state = ref<SyncStatusResponse | null>(null)
const loading = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
let firstDone = false

function readLastPushed(): LastPushedCommit | null {
  if (import.meta.server) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as LastPushedCommit
  } catch {
    return null
  }
}

function statusConfig(s: SyncStatusResponse['state']) {
  switch (s) {
    case 'synced':
      return { label: '已同步', icon: '●', colorClass: 'status-synced' }
    case 'syncing':
      return { label: '同步中', icon: '◐', colorClass: 'status-syncing' }
    case 'failed':
      return { label: '同步失败', icon: '✕', colorClass: 'status-failed' }
    default:
      return { label: '未知', icon: '?', colorClass: 'status-unknown' }
  }
}

async function refresh(force = false) {
  if (import.meta.server) return
  loading.value = true
  try {
    const lp = readLastPushed()
    const params: any = {}
    if (lp?.commitSha) params.sinceSha = lp.commitSha
    if (lp?.savedAt) params.sinceSavedAt = lp.savedAt
    const res = await $fetch<SyncStatusResponse>('/api/admin/sync-status', {
      query: params,
      credentials: 'same-origin'
    })
    // 如果是 localOnly 模式（githubConfigured=false），统一显示 unknown + 独立说明文案
    state.value = res
  } catch (e: any) {
    // 401：会话丢失，auth.global.ts 会负责跳登录，这里只降级 unknown
    state.value = {
      state: 'unknown',
      sinceSha: null,
      lastSavedAt: null,
      siteUrl: '',
      errorMessage: e?.data?.message || e?.message || '查询同步状态失败'
    }
  } finally {
    loading.value = false
    firstDone = true
  }
}

function stopPoll() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startPoll() {
  stopPoll()
  if (!props.autoPoll) return
  timer = setInterval(() => refresh(false), POLL_MS)
}

onMounted(async () => {
  await refresh(false)
  startPoll()
})

onBeforeUnmount(() => stopPoll())

// 父组件写完 / 存完 lastPushed 后，立刻手动刷新一次
defineExpose({ refresh, restartPoll: startPoll, stopPoll })

function chipDescription(): string {
  const lp = readLastPushed()
  if (!state.value) return ''
  if (state.value.state === 'unknown') {
    if (state.value.githubConfigured === false) return '本地模式（内容直接写磁盘，无需 Actions 构建）'
    return state.value.errorMessage || '还未通过后台执行过保存操作'
  }
  if (state.value.state === 'synced') {
    const parts: string[] = []
    if (lp?.savedAt) parts.push(`最近保存于 ${formatTime(lp.savedAt)}`)
    if (state.value.siteCommitSha) parts.push(`主站版本 ${shortSha(state.value.siteCommitSha)}`)
    return parts.join(' · ') || '主站内容版本与目标 commit 一致'
  }
  if (state.value.state === 'failed') {
    return state.value.errorMessage || '同步失败，请检查 Actions / VPS 部署日志'
  }
  // syncing
  const parts: string[] = ['GitHub Actions / VPS 正在拉取新镜像']
  if (lp?.savedAt) parts.push(`保存于 ${formatTime(lp.savedAt)}`)
  if (typeof state.value.elapsedMs === 'number') {
    const min = Math.round(state.value.elapsedMs / 60000)
    parts.push(`已等待 ${min >= 1 ? `${min} 分钟` : '不足 1 分钟'}`)
  }
  return parts.join(' · ')
}

function shortSha(s: string): string { return s ? s.slice(0, 7) : '' }
function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return iso
  }
}

function actionsHref(): string | null {
  const lp = readLastPushed()
  if (state.value?.actionsRun?.html_url) return state.value.actionsRun.html_url
  return lp?.actionsRunUrl || null
}
function commitHref(): string | null {
  const lp = readLastPushed()
  return lp?.commitHtmlUrl || null
}
</script>

<template>
  <div class="sync-status-chip" :class="[sizeClass, `chip-${state?.state ?? 'unknown'}`, { 'is-loading': loading && !firstDone }]">
    <span class="chip-icon" :class="statusConfig(state?.state ?? 'unknown').colorClass">
      {{ statusConfig(state?.state ?? 'unknown').icon }}
    </span>
    <span class="chip-label">{{ statusConfig(state?.state ?? 'unknown').label }}</span>

    <!-- 悬浮 tooltip / popover：hover 展示详情 + 外链 -->
    <div class="popover">
      <div class="popover-title">主站同步状态</div>
      <div v-if="props.scopeHint" class="popover-hint">{{ props.scopeHint }}</div>
      <div class="popover-desc">{{ chipDescription() }}</div>

      <ul class="popover-meta">
        <li v-if="state?.siteCommitSha">
          主站版本：<code>{{ shortSha(state.siteCommitSha) }}</code>
        </li>
        <li v-if="readLastPushed()?.commitSha">
          目标 commit：<code>{{ shortSha(readLastPushed()?.commitSha || '') }}</code>
        </li>
        <li v-if="state?.content">
          内容统计：作品 {{ state.content.worksCount }} · 日志 {{ state.content.journalCount }}
        </li>
        <li v-if="state?.actionsRun">
          Actions 状态：
          <span class="badge">{{ state.actionsRun.status }}</span>
          <span v-if="state.actionsRun.conclusion" class="badge">{{ state.actionsRun.conclusion }}</span>
        </li>
      </ul>

      <div class="popover-actions">
        <a
          v-if="commitHref()"
          :href="commitHref()!"
          target="_blank"
          rel="noopener noreferrer"
          class="popover-link"
        >查看 commit ↗</a>
        <a
          v-if="actionsHref()"
          :href="actionsHref()!"
          target="_blank"
          rel="noopener noreferrer"
          class="popover-link"
        >查看 Actions ↗</a>
        <button class="popover-link" type="button" @click="refresh(true)">刷新</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sync-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border-light);
  background: white;
  font-size: 0.8rem;
  color: var(--color-text);
  cursor: help;
  position: relative;
  user-select: none;
  line-height: 1.2;
}

.sync-status-chip.size-md {
  padding: 6px 14px;
  font-size: 0.85rem;
  gap: 8px;
}

.sync-status-chip.is-loading {
  opacity: 0.7;
}

.chip-icon {
  font-weight: 600;
  font-size: 0.9em;
}

.status-synced { color: var(--color-success, #5a8a6a); }
.status-syncing { color: #d98b36; animation: pulse 1.2s ease-in-out infinite; }
.status-failed  { color: var(--color-error,   #b54b4b); }
.status-unknown { color: var(--color-text-muted); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

.popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: white;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: all var(--transition-fast);
  z-index: 50;
  text-align: left;
  cursor: default;
  line-height: 1.5;
}

.sync-status-chip:hover .popover,
.sync-status-chip:focus-within .popover {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.popover-title {
  font-weight: 600;
  font-family: var(--font-serif);
  margin-bottom: 4px;
  font-size: 0.95rem;
}

.popover-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.popover-desc {
  font-size: 0.85rem;
  color: var(--color-text);
  margin-bottom: 10px;
}

.popover-meta {
  list-style: none;
  padding: 0;
  margin: 0 0 10px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  display: grid;
  gap: 4px;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  background: var(--color-surface-alt);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.78rem;
  color: var(--color-text);
}

.badge {
  display: inline-block;
  padding: 1px 8px;
  background: var(--color-surface-alt);
  border-radius: 10px;
  font-size: 0.72rem;
  margin-left: 4px;
  color: var(--color-text);
}

.popover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  border-top: 1px solid var(--color-border-light);
  padding-top: 8px;
}

.popover-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--color-accent);
  text-decoration: none;
  cursor: pointer;
  font-size: 0.8rem;
}

.popover-link:hover { text-decoration: underline; }
</style>
