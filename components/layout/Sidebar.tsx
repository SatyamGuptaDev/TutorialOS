'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MonitorPlay,
  BookOpen,
  Brain,
  HelpCircle,
  Terminal,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/studio', icon: MonitorPlay, label: 'Studio' },
  { href: '/library', icon: BookOpen, label: 'Library' },
  { href: '/review', icon: Brain, label: 'Review' },
  { href: '/doubts', icon: HelpCircle, label: 'Doubts' },
  { href: '/commands', icon: Terminal, label: 'Commands' },
]

export function Sidebar() {
  const pathname = usePathname()
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)

  const displayName = (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? 'You'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside
      style={{ width: collapsed ? 56 : 220 }}
      className={cn(
        'relative flex flex-col h-full shrink-0',
        'bg-[var(--color-surface)] border-r border-[var(--color-border-subtle)]',
        'overflow-hidden',
        'transition-[width] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-[var(--topbar-height)] px-3 shrink-0 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-[var(--radius-sm)] gradient-accent flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span
            className={cn(
              'font-bold text-sm text-[var(--color-text)] whitespace-nowrap overflow-hidden',
              'transition-[opacity,width] duration-200',
              collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
            )}
          >
            TutorialOS
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1 pt-3">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          const item = (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-sm)]',
                'transition-colors duration-[var(--duration-fast)]',
                'group relative',
                isActive
                  ? 'bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]'
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium whitespace-nowrap overflow-hidden',
                  'transition-[opacity,width] duration-[180ms]',
                  collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--color-accent)] rounded-full" />
              )}
            </Link>
          )

          return collapsed ? (
            <Tooltip key={href} content={label} side="right">
              {item}
            </Tooltip>
          ) : (
            item
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-2 border-t border-[var(--color-border-subtle)] flex flex-col gap-0.5">
        {/* User info */}
        <div className={cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-sm)]',
          'transition-colors duration-[var(--duration-fast)]'
        )}>
          <div className="h-6 w-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </div>
          <div
            className={cn(
              'flex flex-col min-w-0 overflow-hidden',
              'transition-[opacity,width] duration-[180ms]',
              collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
            )}
          >
            <span className="text-xs font-medium text-[var(--color-text)] truncate">{displayName}</span>
          </div>
        </div>

        {/* Settings */}
        {collapsed ? (
          <Tooltip content="Settings" side="right">
            <Link
              href="/settings"
              className={cn(
                'flex items-center justify-center px-2.5 py-2 rounded-[var(--radius-sm)]',
                'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
                'transition-colors duration-[var(--duration-fast)]',
                pathname === '/settings' && 'bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]'
              )}
            >
              <Settings className="h-4 w-4" />
            </Link>
          </Tooltip>
        ) : (
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-sm)]',
              'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
              'transition-colors duration-[var(--duration-fast)] text-sm font-medium',
              pathname === '/settings' && 'bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </Link>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-sm)] w-full',
            'text-[var(--color-text-faint)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-muted)]',
            'transition-colors duration-[var(--duration-fast)] text-sm',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
