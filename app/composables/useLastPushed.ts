// 管理后台跨页面共享的「最近一次 push 的 commit」存取：
//   - 任意写接口（POST/PUT/DELETE works/journal）成功后调用 writeLastPushed(sync, options)
//   - SyncStatusChip 组件通过 readLastPushed() 读取，作为 /api/admin/sync-status 的 sinceSha / sinceSavedAt。
import type { AdminWriteSyncInfo, LastPushedCommit } from '~/types'

const KEY = 'admin:lastPushedCommit'

export function readLastPushed(): LastPushedCommit | null {
  if (import.meta.server) return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as LastPushedCommit
  } catch {
    return null
  }
}

export function writeLastPushed(sync: AdminWriteSyncInfo | undefined | null, opts?: {
  scope?: LastPushedCommit['scope']
  description?: string
}): LastPushedCommit | null {
  if (import.meta.server) return null
  if (!sync) return null
  // localOnly 模式下：后台只写了本地磁盘，虽然不触发 CI/VPS 同步，但仍然保留最近一次操作
  const next: LastPushedCommit = {
    commitSha: sync.commitSha || '',
    commitHtmlUrl: sync.commitHtmlUrl || '',
    actionsRunUrl: sync.actionsRunUrl || '',
    savedAt: sync.savedAt || new Date().toISOString(),
    scope: opts?.scope || 'global',
    description: opts?.description || ''
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // localStorage 不可用（隐私模式等），静默降级
  }
  return next
}

export function clearLastPushed() {
  if (import.meta.server) return
  try { window.localStorage.removeItem(KEY) } catch {}
}
