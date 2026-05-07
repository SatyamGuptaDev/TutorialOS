'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, MonitorPlay, BookOpen, Brain, HelpCircle,
  Terminal, Settings, FilePlus, Save, Download, FileCode,
  Clock, MessageSquarePlus, Zap, Eye, Sun, LogOut, Search,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  group: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void
}

export function CommandPalette() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const open = useAppStore((s) => s.commandPaletteOpen)
  const openPalette = useAppStore((s) => s.openCommandPalette)
  const closePalette = useAppStore((s) => s.closeCommandPalette)
  const signOut = useAuthStore((s) => s.signOut)

  const close = useCallback(() => closePalette(), [closePalette])

  const navigate = useCallback(
    (path: string) => {
      router.push(path)
      close()
    },
    [router, close]
  )

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Dashboard', group: 'Navigate', icon: LayoutDashboard, shortcut: 'G D', action: () => navigate('/dashboard') },
    { id: 'nav-studio', label: 'Go to Studio', group: 'Navigate', icon: MonitorPlay, shortcut: 'G S', action: () => navigate('/studio') },
    { id: 'nav-library', label: 'Go to Library', group: 'Navigate', icon: BookOpen, shortcut: 'G L', action: () => navigate('/library') },
    { id: 'nav-review', label: 'Go to Review', group: 'Navigate', icon: Brain, shortcut: 'G R', action: () => navigate('/review') },
    { id: 'nav-doubts', label: 'Go to Doubts', group: 'Navigate', icon: HelpCircle, shortcut: 'G ?', action: () => navigate('/doubts') },
    { id: 'nav-commands', label: 'Go to Commands', group: 'Navigate', icon: Terminal, shortcut: 'G C', action: () => navigate('/commands') },
    // Actions
    { id: 'action-new', label: 'New Session', group: 'Actions', icon: FilePlus, shortcut: '⌘N', action: () => { navigate('/studio') } },
    { id: 'action-save', label: 'Save Note', group: 'Actions', icon: Save, shortcut: '⌘S', action: close },
    { id: 'action-export-md', label: 'Export Markdown', group: 'Actions', icon: Download, shortcut: '⌘⇧E', action: close },
    { id: 'action-export-html', label: 'Export HTML', group: 'Actions', icon: FileCode, action: close },
    { id: 'action-timestamp', label: 'Add Timestamp', group: 'Actions', icon: Clock, shortcut: '⌘T', action: close },
    { id: 'action-doubt', label: 'Add Doubt', group: 'Actions', icon: MessageSquarePlus, shortcut: '⌘D', action: close },
    { id: 'action-command', label: 'Add Command', group: 'Actions', icon: Terminal, action: close },
    // View
    { id: 'view-zen', label: 'Toggle Zen Mode', group: 'View', icon: Zap, shortcut: '⌘⇧Z', action: close },
    { id: 'view-watch-write', label: 'Toggle Watch+Write', group: 'View', icon: Eye, shortcut: '⌘⇧W', action: close },
    // System
    { id: 'sys-settings', label: 'Open Settings', group: 'System', icon: Settings, shortcut: '⌘,', action: () => navigate('/settings') },
    { id: 'sys-theme', label: 'Toggle Theme', group: 'System', icon: Sun, action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); close() } },
    { id: 'sys-signout', label: 'Sign Out', group: 'System', icon: LogOut, action: async () => { await signOut(); router.push('/login'); close() } },
  ]

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        open ? close() : openPalette()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, close, openPalette])

  const groups = Array.from(new Set(commands.map((c) => c.group)))

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
            className={cn(
              'fixed top-[15%] left-1/2 -translate-x-1/2 z-50',
              'w-full max-w-lg mx-4',
              'bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
              'border border-[var(--color-border)]',
              'shadow-[0_24px_80px_rgba(0,0,0,0.5)]',
              'overflow-hidden'
            )}
          >
            <Command className="flex flex-col" shouldFilter>
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
                <Search className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
                <Command.Input
                  placeholder="Search commands…"
                  className={cn(
                    'flex-1 bg-transparent outline-none border-none',
                    'text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]',
                    'caret-[var(--color-accent)]'
                  )}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Escape' && close()}
                />
                <kbd className="text-[10px] text-[var(--color-text-faint)] font-mono bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-80 overflow-y-auto p-2 scrollbar-none">
                <Command.Empty className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                  No commands found.
                </Command.Empty>

                {groups.map((group) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className={cn(
                      '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                      '[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold',
                      '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider',
                      '[&_[cmdk-group-heading]]:text-[var(--color-text-faint)]'
                    )}
                  >
                    {commands
                      .filter((c) => c.group === group)
                      .map((cmd) => {
                        const Icon = cmd.icon
                        return (
                          <Command.Item
                            key={cmd.id}
                            value={`${cmd.group} ${cmd.label}`}
                            onSelect={cmd.action}
                            className={cn(
                              'flex items-center gap-2.5 px-2.5 py-2',
                              'rounded-[var(--radius-sm)] text-sm cursor-pointer',
                              'text-[var(--color-text-muted)]',
                              'data-[selected=true]:bg-[var(--color-surface-2)]',
                              'data-[selected=true]:text-[var(--color-text)]',
                              'transition-colors duration-[var(--duration-fast)]',
                              'aria-selected:bg-[var(--color-surface-2)]',
                              'aria-selected:text-[var(--color-text)]'
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                            <span className="flex-1">{cmd.label}</span>
                            {cmd.shortcut && (
                              <span className="text-[10px] font-mono text-[var(--color-text-faint)]">
                                {cmd.shortcut}
                              </span>
                            )}
                          </Command.Item>
                        )
                      })}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
