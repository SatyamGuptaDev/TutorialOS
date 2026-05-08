import { create } from 'zustand'
import type { SyncStatus } from '@/types'
import { SyncEngine } from '@/lib/sync/SyncEngine'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: Date | null
  pendingCount: number
  error: string | null
  engine: SyncEngine | null

  setStatus: (status: SyncStatus) => void
  setLastSyncedAt: (date: Date) => void
  setPendingCount: (count: number) => void
  setError: (error: string | null) => void

  initialize: (userId: string, syncIntervalMinutes?: number) => void
  triggerSync: () => Promise<void>
  updateSyncInterval: (intervalMinutes: number) => void
  reset: () => void
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  lastSyncedAt: null,
  pendingCount: 0,
  error: null,
  engine: null,

  setStatus: (status) => set({ status }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setError: (error) => set({ error }),

  initialize: (userId, syncIntervalMinutes = 10) => {
    // Get or create the engine
    let { engine } = get()
    if (!engine) {
      engine = new SyncEngine()
      set({ engine })
    }
    engine.initialize(userId)

    // Start auto-sync if enabled
    if (syncIntervalMinutes > 0) {
      engine.startAutoSync(syncIntervalMinutes)
    }
  },

  triggerSync: async () => {
    const { engine, status } = get()
    if (!engine || status === 'syncing' || status === 'offline') return
    await engine.sync()
  },

  updateSyncInterval: (intervalMinutes) => {
    const { engine } = get()
    if (!engine) return
    engine.stopAutoSync()
    if (intervalMinutes > 0) {
      engine.startAutoSync(intervalMinutes)
    }
  },

  reset: () => {
    const { engine } = get()
    if (engine) {
      engine.cleanup()
    }
    set({
      status: 'idle',
      lastSyncedAt: null,
      pendingCount: 0,
      error: null,
      engine: null,
    })
  },
}))
