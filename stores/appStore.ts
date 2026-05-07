'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SyncStatus } from '@/types'

interface AppState {
  currentPage: string
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  syncStatus: SyncStatus
  setCurrentPage: (page: string) => void
  setSyncStatus: (status: SyncStatus) => void
  toggleSidebar: () => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'dashboard',
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      syncStatus: 'idle',

      setCurrentPage: (page) => set({ currentPage: page }),

      setSyncStatus: (status) => set({ syncStatus: status }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      openCommandPalette: () => set({ commandPaletteOpen: true }),

      closeCommandPalette: () => set({ commandPaletteOpen: false }),
    }),
    {
      name: 'tutorialos-app-state',
      // Only persist sidebar state — other state resets on page load
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
)
