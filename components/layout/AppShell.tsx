'use client'

import { type ReactNode, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { useAppStore } from '@/stores/appStore'
import { shortcuts } from '@/lib/shortcuts'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: ReactNode }) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const openCommandPalette = useAppStore((s) => s.openCommandPalette)

  useEffect(() => {
    const unregisterK = shortcuts.register('meta+k', (e) => {
      openCommandPalette()
    })
    const unregisterCtrlK = shortcuts.register('ctrl+k', (e) => {
      openCommandPalette()
    })
    const unregisterSlash = shortcuts.register('meta+\\', (e) => {
      toggleSidebar()
    })
    const unregisterCtrlSlash = shortcuts.register('ctrl+\\', (e) => {
      toggleSidebar()
    })

    return () => {
      unregisterK()
      unregisterCtrlK()
      unregisterSlash()
      unregisterCtrlSlash()
    }
  }, [openCommandPalette, toggleSidebar])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
