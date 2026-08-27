/** ISO8601 时间（createdAt/updatedAt）→ 中文格式，精确到分：如 "2026年3月15日 10:00" */
export function formatDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  const y = d.getFullYear()
  const mo = d.getMonth() + 1
  const da = d.getDate()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}年${mo}月${da}日 ${hh}:${mm}`
}

/** createdAt !== updatedAt 时才显示"最后更新"，createdAt 转成短日期，避免和 date 字段显示重复 */
export function formatCreatedUpdated(createdAt: string, updatedAt: string, opts?: { withTime?: boolean }) {
  const fmt = (v: string) => opts?.withTime ? formatDateTime(v) : formatDateLong(v)
  if (!createdAt && !updatedAt) return null
  const created = createdAt ? fmt(createdAt) : ''
  // 比较到秒级即可（忽略毫秒差异），同则不显示更新
  const same =
    createdAt && updatedAt &&
    new Date(createdAt).getTime() - new Date(updatedAt).getTime() === 0
  if (same || !updatedAt) return { created, updated: '' }
  return { created, updated: updatedAt ? fmt(updatedAt) : '' }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
}

export function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    wood: '木作',
    ceramics: '陶瓷',
    textile: '织物',
    paper: '纸艺',
    metal: '金工',
    other: '其他'
  }
  return map[category] || category
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}
