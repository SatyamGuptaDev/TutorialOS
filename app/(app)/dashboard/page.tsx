'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  HelpCircle,
  Terminal,
  Brain,
  MonitorPlay,
  ExternalLink,
  Upload,
  Download,
  FilePlus,
  Youtube,
  Globe,
  Monitor,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import {
  useDashboardStats,
  useRecentSessions,
} from '@/lib/db/hooks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip'
import { getTimeGreeting, formatTimeAgo } from '@/lib/utils'
import type { Session, SourceType } from '@/types'
import type { Metadata } from 'next'

const SOURCE_ICONS: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  stream: Monitor,
  iframe: Globe,
  unknown: Globe,
}

function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="skeleton h-4 w-8 mb-2" />
      <div className="skeleton h-6 w-16 mb-1" />
      <div className="skeleton h-3 w-24" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[var(--color-border-subtle)]">
      <div className="skeleton h-4 w-4 rounded" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="skeleton h-4 w-48" />
        <div className="skeleton h-3 w-32" />
      </div>
      <div className="skeleton h-6 w-12 rounded-full" />
      <div className="skeleton h-8 w-14 rounded-[var(--radius-sm)]" />
    </div>
  )
}

function EmptySessionsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <svg
        width="120"
        height="90"
        viewBox="0 0 120 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-40"
      >
        <rect x="10" y="20" width="100" height="60" rx="8" fill="var(--color-surface-3)" />
        <rect x="10" y="20" width="100" height="60" rx="8" stroke="var(--color-border)" strokeWidth="1.5" />
        <rect x="22" y="34" width="44" height="4" rx="2" fill="var(--color-border)" />
        <rect x="22" y="44" width="30" height="4" rx="2" fill="var(--color-border-subtle)" />
        <rect x="22" y="54" width="38" height="4" rx="2" fill="var(--color-border-subtle)" />
        <rect x="70" y="30" width="28" height="20" rx="4" fill="var(--color-surface-2)" stroke="var(--color-border)" strokeWidth="1" />
        <polygon points="80,36 80,44 87,40" fill="var(--color-accent)" opacity="0.5" />
        <circle cx="98" cy="16" r="10" fill="var(--color-accent)" opacity="0.15" stroke="var(--color-accent)" strokeWidth="1.5" />
        <path d="M94 16l2.5 2.5L102 13" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </svg>
      <div className="text-center">
        <p className="text-[var(--color-text-muted)] font-medium">No sessions yet</p>
        <p className="text-sm text-[var(--color-text-faint)] mt-1">
          Start your first learning session to track notes and progress.
        </p>
      </div>
      <Button asChild>
        <Link href="/studio">
          <FilePlus className="h-4 w-4" />
          Create your first session
        </Link>
      </Button>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''

  const stats = useDashboardStats(userId)
  const recentSessions = useRecentSessions(userId, 5)

  const displayName =
    (user?.user_metadata?.['full_name'] as string | undefined)?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'there'

  const greeting = getTimeGreeting()
  const isLoading = recentSessions === undefined

  const statCards = [
    {
      id: 'sessions',
      label: 'Total sessions',
      count: stats.sessionCount,
      icon: BookOpen,
      accent: false,
    },
    {
      id: 'doubts',
      label: 'Open doubts',
      count: stats.openDoubtCount,
      icon: HelpCircle,
      accent: stats.openDoubtCount > 0,
      accentColor: 'warning' as const,
    },
    {
      id: 'commands',
      label: 'Saved commands',
      count: stats.commandCount,
      icon: Terminal,
      accent: false,
    },
    {
      id: 'review',
      label: 'Due for review',
      count: stats.reviewDueCount,
      icon: Brain,
      accent: stats.reviewDueCount > 0,
      accentColor: 'error' as const,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {greeting}, {displayName} 👋
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Ready to learn something today?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/studio">
              <MonitorPlay className="h-4 w-4" />
              Open Studio
            </Link>
          </Button>
          <Tooltip
            content={
              stats.sessionCount === 0
                ? 'Create a session first'
                : 'Continue last session'
            }
          >
            <Button
              variant="outline"
              disabled={stats.sessionCount === 0}
              onClick={() => {
                if (recentSessions?.[0]) {
                  router.push(`/studio?session=${recentSessions[0].id}`)
                }
              }}
            >
              Continue
            </Button>
          </Tooltip>
        </div>
      </motion.div>

      {/* Stats bento grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map(({ id, label, count, icon: Icon, accent, accentColor }, i) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="flex flex-col gap-2 cursor-default">
                  <Icon
                    className={
                      accent
                        ? accentColor === 'warning'
                          ? 'h-4 w-4 text-[var(--color-warning)]'
                          : 'h-4 w-4 text-[var(--color-error)]'
                        : 'h-4 w-4 text-[var(--color-text-muted)]'
                    }
                  />
                  <div
                    className={
                      accent
                        ? accentColor === 'warning'
                          ? 'text-2xl font-bold text-[var(--color-warning)]'
                          : 'text-2xl font-bold text-[var(--color-error)]'
                        : 'text-2xl font-bold text-[var(--color-text)]'
                    }
                  >
                    {count}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Recent sessions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Recent Sessions</h2>
          <Link
            href="/library"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1"
          >
            View all <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          {isLoading ? (
            <div className="px-4 divide-y divide-[var(--color-border-subtle)]">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : recentSessions?.length === 0 ? (
            <EmptySessionsState />
          ) : (
            <div className="divide-y divide-[var(--color-border-subtle)]">
              {recentSessions?.map((session: Session, i: number) => {
                const SourceIcon = SOURCE_ICONS[session.sourceType]
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors group"
                  >
                    <SourceIcon className="h-4 w-4 text-[var(--color-text-faint)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {session.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {session.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} size="sm">{tag}</Badge>
                        ))}
                        <span className="text-xs text-[var(--color-text-faint)]">
                          {formatTimeAgo(session.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={() => router.push(`/studio?session=${session.id}`)}
                    >
                      Open
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex flex-col gap-3"
      >
        <h2 className="text-sm font-semibold text-[var(--color-text)]">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/studio">
              <FilePlus className="h-3.5 w-3.5" />
              New Session
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-3.5 w-3.5" />
            Import Backup
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5" />
            Export All
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
