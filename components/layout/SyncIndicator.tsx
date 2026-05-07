'use client'

import { useSyncStore } from '@/stores/syncStore'
import { useAuthStore } from '@/stores/authStore'
import { useSettings } from '@/lib/db/hooks'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Cloud, CloudOff, RefreshCw, AlertCircle, HardDrive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function SyncIndicator() {
  const user = useAuthStore((s) => s.user)
  const settings = useSettings(user?.id ?? '')
  const { status, lastSyncedAt, pendingCount, triggerSync } = useSyncStore()

  // If sync is disabled in settings, show "Local Only"
  if (settings && !settings.cloudSyncEnabled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]" title="Cloud Sync Disabled">
        <HardDrive className="h-3.5 w-3.5" />
        <span className="text-xs font-medium hidden md:inline-block">Local Only</span>
      </div>
    )
  }

  let icon = <Cloud className="h-4 w-4 text-[var(--color-text-muted)]" />
  let dotColor = 'bg-[var(--color-surface-3)]'
  let label = 'Up to date'

  if (status === 'offline') {
    icon = <CloudOff className="h-4 w-4 text-[var(--color-text-muted)]" />
    dotColor = 'bg-[var(--color-surface-3)]'
    label = 'Offline'
  } else if (status === 'syncing') {
    icon = <RefreshCw className="h-4 w-4 text-[var(--color-warning)] animate-spin" />
    dotColor = 'bg-[var(--color-warning)] animate-pulse'
    label = 'Syncing...'
  } else if (status === 'error') {
    icon = <AlertCircle className="h-4 w-4 text-[var(--color-error)]" />
    dotColor = 'bg-[var(--color-error)]'
    label = 'Sync Error'
  } else if (pendingCount > 0) {
    icon = <Cloud className="h-4 w-4 text-[var(--color-accent)]" />
    dotColor = 'bg-[var(--color-accent)]'
    label = `${pendingCount} to sync`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
            pendingCount > 0 && status !== 'syncing' 
              ? "bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-accent)_25%,transparent)] text-[var(--color-accent)] border border-[var(--color-accent)]/30" 
              : "hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-transparent"
          )}
        >
          <div className="relative flex items-center justify-center">
            {icon}
            {pendingCount > 0 && status !== 'syncing' && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--color-accent)] border-[1.5px] border-[var(--color-surface)]"></span>
              </span>
            )}
          </div>
          <span className={cn(
            "text-xs font-semibold hidden md:inline-block",
            pendingCount > 0 && status !== 'syncing' ? "text-[var(--color-accent)]" : ""
          )}>
            {label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-4 flex flex-col gap-3 rounded-xl border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)]">Cloud Sync</h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {status === 'offline' ? 'You are currently offline.' : 
               status === 'syncing' ? 'Syncing your data securely...' :
               status === 'error' ? 'Failed to sync. Please try again.' :
               pendingCount > 0 ? 'You have unsaved changes locally.' :
               'All changes are securely backed up.'}
            </p>
          </div>
        </div>

        <div className="bg-[var(--color-surface-2)] rounded-lg p-3 flex flex-col gap-2 text-xs border border-[var(--color-border-subtle)]">
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Last synced</span>
            <span className="text-[var(--color-text)] font-medium">
              {lastSyncedAt ? formatDistanceToNow(lastSyncedAt, { addSuffix: true }) : 'Never'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--color-text-muted)]">Pending items</span>
            <span className={cn(
              "font-semibold", 
              pendingCount > 0 ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"
            )}>
              {pendingCount}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <Button 
            size="sm" 
            className={cn(
              "flex-1 text-xs h-9 transition-colors",
              pendingCount > 0 ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]" : ""
            )}
            onClick={() => triggerSync()}
            disabled={status === 'syncing' || status === 'offline' || pendingCount === 0}
          >
            {status === 'error' ? 'Retry Sync' : status === 'syncing' ? 'Syncing...' : 'Sync to Cloud'}
          </Button>
          <Button variant="outline" size="sm" className="px-3 h-9" asChild>
            <Link href="/settings"><CloudOff className="h-4 w-4 text-[var(--color-text-muted)]" /></Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
