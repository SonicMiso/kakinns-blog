import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

type DraftCollection = 'works' | 'journal'
type DraftKey = string

interface AdminDraft<T> {
  key: DraftKey
  collection: DraftCollection
  identity: string
  savedAt: number
  data: T
}

const DB_NAME = 'kakinns-admin-drafts'
const STORE_NAME = 'drafts'
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readDraft<T>(key: DraftKey): Promise<AdminDraft<T> | null> {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
      request.onsuccess = () => resolve((request.result as AdminDraft<T> | undefined) || null)
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}

async function writeDraft<T>(draft: AdminDraft<T>): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(draft)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}

async function removeDraft(key: DraftKey): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}

function stableSnapshot<T>(value: T): string {
  return JSON.stringify(value)
}

export function useAdminDraft<T extends Record<string, any>>(
  collection: DraftCollection,
  identity: Ref<string>,
  data: Ref<T>,
  options: { debounceMs?: number } = {}
) {
  const debounceMs = options.debounceMs ?? 800
  const baseline = ref('')
  const draftSavedAt = ref<number | null>(null)
  const ready = ref(false)
  const hasRecoveredDraft = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const key = computed(() => `${collection}:${identity.value || '__new__'}`)
  const isDirty = computed(() => ready.value && stableSnapshot(data.value) !== baseline.value)

  async function saveDraftNow() {
    if (!import.meta.client || !ready.value || !isDirty.value) return
    await writeDraft({
      key: key.value,
      collection,
      identity: identity.value || '__new__',
      savedAt: Date.now(),
      data: structuredClone(data.value)
    })
    draftSavedAt.value = Date.now()
  }

  function scheduleSave() {
    if (!import.meta.client || !ready.value || !isDirty.value) return
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { void saveDraftNow() }, debounceMs)
  }

  async function initialize() {
    if (!import.meta.client) return
    const draft = await readDraft<T>(key.value)
    if (draft && stableSnapshot(draft.data) !== stableSnapshot(data.value)) {
      if (confirm(`检测到 ${new Date(draft.savedAt).toLocaleString()} 保存的未提交草稿，是否恢复？`)) {
        data.value = structuredClone(draft.data)
        hasRecoveredDraft.value = true
        draftSavedAt.value = draft.savedAt
      } else {
        await removeDraft(key.value)
      }
    }
    baseline.value = stableSnapshot(data.value)
    ready.value = true
  }

  async function markSaved() {
    baseline.value = stableSnapshot(data.value)
    if (timer) clearTimeout(timer)
    await removeDraft(key.value)
    draftSavedAt.value = null
    hasRecoveredDraft.value = false
  }

  async function discardDraft() {
    await removeDraft(key.value)
    draftSavedAt.value = null
    hasRecoveredDraft.value = false
  }

  function markReady() {
    baseline.value = stableSnapshot(data.value)
    ready.value = true
  }

  watch(data, scheduleSave, { deep: true })

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') void saveDraftNow()
  }
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty.value) return
    event.preventDefault()
    event.returnValue = true
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onBeforeUnload)
  })
  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('beforeunload', onBeforeUnload)
  })

  return { isDirty, draftSavedAt, hasRecoveredDraft, initialize, markSaved, discardDraft, markReady, saveDraftNow }
}
