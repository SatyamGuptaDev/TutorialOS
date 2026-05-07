'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Sun,
  Moon,
  Command,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Settings,
  User,
} from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown'
import { Tooltip } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { SyncIndicator } from './SyncIndicator'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/studio': 'Studio',
  '/library': 'Library',
  '/review': 'Review',
  '/doubts': 'Doubts',
  '/commands': 'Commands',
  '/settings': 'Settings',
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const openCommandPalette = useAppStore((s) => s.openCommandPalette)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  const pageTitle = PAGE_TITLES[pathname] ?? 'TutorialOS'
  const displayName = (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? 'Account'
  const email = user?.email ?? ''
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    router.push('/login')
  }

  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 shrink-0',
        'h-[var(--topbar-height)]',
        'bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)]',
        'sticky top-0 z-10'
      )}
    >
      {/* Left: page title */}
      <h1 className="text-sm font-semibold text-[var(--color-text)]">{pageTitle}</h1>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <SyncIndicator />

        {/* Command palette trigger */}
        <Tooltip content="Command palette">
          <Button
            variant="ghost"
            size="sm"
            onClick={openCommandPalette}
            className="gap-1.5 text-xs text-[var(--color-text-muted)]"
          >
            <Command className="h-3.5 w-3.5" />
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-3)] text-[10px] font-mono">⌘K</kbd>
            </span>
          </Button>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip content={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-[var(--color-text-muted)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--color-text-muted)]" />
            )}
          </Button>
        </Tooltip>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'h-7 w-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center',
              'text-[10px] font-bold text-white cursor-pointer',
              'transition-opacity hover:opacity-80',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface)]'
            )}>
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2.5 py-2 border-b border-[var(--color-border-subtle)] mb-1">
              <p className="text-sm font-medium text-[var(--color-text)] truncate">{displayName}</p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{email}</p>
            </div>
            <DropdownMenuItem
              icon={<Settings className="h-4 w-4" />}
              shortcut="⌘,"
              onSelect={() => router.push('/settings')}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon={<LogOut className="h-4 w-4" />}
              destructive
              onSelect={handleSignOut}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
