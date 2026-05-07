import { create } from 'zustand'
import type { SyncStatus } from '@/types'
import type { SyncEngine } from '@/lib/sync/SyncEngine'

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
  setEngine: (engine: SyncEngine) => void
  
  initialize: (userId: string) => void
  triggerSync: () => Promise<void>
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
  setEngine: (engine) => set({ engine }),

  initialize: (userId) => {
    const { engine } = get()
    if (engine) {
      engine.initialize(userId)
    }
  },

  triggerSync: async () => {
    const { engine, status } = get()
    // Don't trigger if already syncing or offline
    if (!engine || status === 'syncing' || status === 'offline') return
    // Wait for the engine to load user id somehow? 
    // The engine already knows the user ID from initialize().
    // Wait, triggerSync() in the prompt doesn't take userId, but the SyncEngine.sync(userId) does.
    // Let's store userId in the store or let the engine hold it.
    // The instructions say `triggerSync(): Promise<void>`, and `SyncEngine.sync(userId)`.
    await engine.sync()
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
      engine: null
    })
  }
}))
