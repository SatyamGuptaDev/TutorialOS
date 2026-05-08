import { db } from '@/lib/db/schema'
import { supabase } from '@/lib/supabase/client'
import { useSyncStore } from '@/stores/syncStore'

export interface PushResult {
  pushed: number
  failed: number
  skipped?: boolean
  reason?: string
}

export interface PullResult {
  pulled: number
  skipped?: boolean
}

// Simple case converters for payloads
function toSnakeCasePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    result[snakeKey] = value
  }
  return result
}

function toCamelCasePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result
}

export class SyncEngine {
  private isRunning = false
  private lastSyncedAt: Date | null = null
  private userId: string | null = null
  private syncInterval: ReturnType<typeof setInterval> | null = null

  private onlineHandler = () => {
    useSyncStore.getState().setStatus('idle')
  }

  private offlineHandler = () => {
    useSyncStore.getState().setStatus('offline')
  }

  private TABLE_MAP: Record<string, string> = {
    sessions: 'sessions',
    timestamps: 'timestamps',
    doubts: 'doubts',
    commandSnippets: 'command_snippets',
    reviewItems: 'review_items',
    userSettings: 'user_settings',
  }

  initialize(userId: string): void {
    this.cleanup()
    this.userId = userId

    if (!navigator.onLine) {
      useSyncStore.getState().setStatus('offline')
    }

    window.addEventListener('online', this.onlineHandler)
    window.addEventListener('offline', this.offlineHandler)
  }

  startAutoSync(intervalMinutes: number): void {
    this.stopAutoSync()
    if (intervalMinutes <= 0) return
    const ms = intervalMinutes * 60 * 1000
    this.syncInterval = setInterval(() => {
      this.sync().catch((e) => console.error('Auto-sync error:', e))
    }, ms)
  }

  stopAutoSync(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async push(): Promise<PushResult> {
    if (!navigator.onLine) return { pushed: 0, failed: 0, skipped: true, reason: 'offline' }
    if (!this.userId) return { pushed: 0, failed: 0, skipped: true, reason: 'no_user' }

    const items = await db.syncQueue.orderBy('createdAt').toArray()
    if (items.length === 0) return { pushed: 0, failed: 0 }

    let pushed = 0
    let failed = 0

    // Group items by table and operation
    const grouped: Record<string, { upsert: unknown[]; delete: string[]; queueIdsToDelete: number[] }> = {}

    for (const item of items) {
      const tableName = this.TABLE_MAP[item.entityType]
      if (!tableName) {
        await db.syncQueue.delete(item.localId!)
        continue
      }

      if (!grouped[tableName]) {
        grouped[tableName] = { upsert: [], delete: [], queueIdsToDelete: [] }
      }

      grouped[tableName].queueIdsToDelete.push(item.localId!)

      if (item.operation === 'upsert') {
        const snakePayload = toSnakeCasePayload(item.payload)
        ;(snakePayload as Record<string, unknown>).user_id = this.userId
        grouped[tableName].upsert.push(snakePayload)
      } else if (item.operation === 'delete') {
        grouped[tableName].delete.push(item.entityId)
      }
    }

    // Execute bulk operations per table
    for (const [tableName, ops] of Object.entries(grouped)) {
      try {
        // Bulk Upsert
        if (ops.upsert.length > 0) {
          const { error } = await (supabase as unknown as {
            from: (table: string) => {
              upsert: (data: unknown[], options: Record<string, unknown>) => Promise<{ error: Error | null }>
            }
          }).from(tableName).upsert(ops.upsert, { onConflict: tableName === 'user_settings' ? 'user_id' : 'id' })

          if (error) throw error
          pushed += ops.upsert.length
        }

        // Bulk Delete (or Soft Delete)
        if (ops.delete.length > 0) {
          const sbClient = supabase as unknown as {
            from: (table: string) => {
              update: (data: unknown) => { in: (col: string, ids: string[]) => Promise<{ error: Error | null }> }
              delete: () => { in: (col: string, ids: string[]) => Promise<{ error: Error | null }> }
            }
          }

          if (tableName === 'sessions') {
            const { error } = await sbClient.from(tableName).update({ is_deleted: true }).in('id', ops.delete)
            if (error) throw error
          } else {
            const { error } = await sbClient.from(tableName).delete().in('id', ops.delete)
            if (error) throw error
          }
          pushed += ops.delete.length
        }

        // Success: clear these items from local queue
        await db.syncQueue.bulkDelete(ops.queueIdsToDelete)
      } catch (e) {
        console.error(`Sync bulk push error for ${tableName}:`, e)
        failed += ops.queueIdsToDelete.length
      }
    }

    // Update live count
    const pendingCount = await db.syncQueue.count()
    useSyncStore.getState().setPendingCount(pendingCount)

    return { pushed, failed }
  }

  async pull(): Promise<PullResult> {
    if (!navigator.onLine) return { pulled: 0, skipped: true }
    if (!this.userId) return { pulled: 0, skipped: true }

    // Gate behind cloudSyncEnabled — do NOT pull if sync is disabled
    const settings = await db.userSettings.get(this.userId)
    if (!settings?.cloudSyncEnabled) return { pulled: 0, skipped: true }

    let totalPulled = 0

    for (const [entityType, tableName] of Object.entries(this.TABLE_MAP)) {

      type SupabaseTable = {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            gt: (col: string, val: string) => Promise<{ data: Record<string, unknown>[] | null; error: Error | null }>
            then: (fn: (r: { data: Record<string, unknown>[] | null; error: Error | null }) => void) => void
          }
          then: (fn: (r: { data: Record<string, unknown>[] | null; error: Error | null }) => void) => void
        }
      }

      const sbClient = supabase as unknown as { from: (t: string) => SupabaseTable }

      let query = sbClient.from(tableName).select('*').eq('user_id', this.userId)

      const { data, error } = this.lastSyncedAt
        ? await (query.gt(
            'updated_at',
            this.lastSyncedAt.toISOString()
          ) as unknown as Promise<{ data: Record<string, unknown>[] | null; error: Error | null }>)
        : await (query as unknown as Promise<{ data: Record<string, unknown>[] | null; error: Error | null }>)

      if (error) {
        console.error(`Sync pull error for ${tableName}:`, error)
        continue
      }

      if (data && data.length > 0) {
        const camelData = data.map(toCamelCasePayload)

        const table = (db as unknown as Record<string, { get: (id: string) => Promise<Record<string, unknown> | undefined>; put: (r: unknown) => Promise<void> }>)[entityType]
        if (!table) continue

        for (const remote of camelData) {
          const localId = (remote.id || remote.userId) as string
          const local = await table.get(localId)

          if (local) {
            const remoteDate = new Date((remote.updatedAt || remote.createdAt || 0) as string).getTime()
            const localDate = new Date((local.updatedAt || local.createdAt || 0) as string).getTime()

            if (remoteDate > localDate) {
              await table.put(remote)
              totalPulled++
            }
            // If local is newer or same, keep local — it will push on next sync
          } else {
            await table.put(remote)
            totalPulled++
          }
        }
      }
    }

    this.lastSyncedAt = new Date()
    useSyncStore.getState().setLastSyncedAt(this.lastSyncedAt)
    return { pulled: totalPulled }
  }

  async sync(): Promise<void> {
    if (this.isRunning) return
    if (!this.userId) return

    // Respect user settings — abort immediately if cloud sync is disabled
    const settings = await db.userSettings.get(this.userId)
    if (!settings?.cloudSyncEnabled) {
      useSyncStore.getState().setStatus('idle')
      return
    }

    this.isRunning = true
    const store = useSyncStore.getState()
    store.setStatus('syncing')
    store.setError(null)

    try {
      await this.push()
      await this.pull()
      store.setStatus('synced')
    } catch (e) {
      console.error('Sync failed', e)
      store.setStatus('error')
      store.setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      this.isRunning = false
    }
  }

  cleanup(): void {
    this.stopAutoSync()
    window.removeEventListener('online', this.onlineHandler)
    window.removeEventListener('offline', this.offlineHandler)
  }
}
