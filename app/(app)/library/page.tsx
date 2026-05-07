'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import {
  Search, Youtube, Monitor, Globe, Trash2, Plus,
  BookOpen, Star, Download, SortAsc, Filter,
} from 'lucide-react'
import { db } from '@/lib/db/schema'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { cn, formatTimeAgo, debounce } from '@/lib/utils'
import type { Session, SourceType } from '@/types'
import Link from 'next/link'

const SOURCE_ICONS: Record<SourceType, React.ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  stream: Monitor,
  iframe: Globe,
  unknown: Globe,
}

type SortKey = 'updatedAt' | 'createdAt' | 'title'
type SourceFilter = 'all' | SourceType

export default function LibraryPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('updatedAt')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sessions = useLiveQuery(
    () => db.sessions.where('userId').equals(userId).and((s) => !s.isDeleted).toArray(),
    [userId]
  )

  const filtered = (sessions ?? [])
    .filter((s) => {
      const q = query.toLowerCase()
      const matchesQuery = !q || s.title.toLowerCase().includes(q) || s.notesMarkdown.toLowerCase().includes(q)
      const matchesSource = sourceFilter === 'all' || s.sourceType === sourceFilter
      return matchesQuery && matchesSource
    })
    .sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      return new Date(b[sort]).getTime() - new Date(a[sort]).getTime()
    })

  const confirmDelete = async () => {
    if (!deleteId) return
    await db.sessions.update(deleteId, { isDeleted: true, updatedAt: new Date().toISOString() })
    setDeleteId(null)
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Library</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {filtered.length} session{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/studio">
            <Plus className="h-4 w-4" /> New Session
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions…"
            className="w-full h-9 pl-9 pr-3 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>

        {/* Source filter tabs */}
        <div className="flex bg-[var(--color-surface-2)] rounded-[var(--radius-sm)] p-0.5 gap-0.5">
          {(['all', 'youtube', 'stream', 'iframe'] as SourceFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={cn(
                'h-7 px-3 text-xs rounded-[3px] capitalize font-medium transition-colors',
                sourceFilter === f
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 px-3 text-xs rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
        >
          <option value="updatedAt">Most recent</option>
          <option value="createdAt">Oldest</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {/* Session grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <BookOpen className="h-10 w-10 text-[var(--color-text-faint)]" />
          <div>
            <p className="font-medium text-[var(--color-text-muted)]">
              {query ? 'No sessions match your search' : 'No sessions yet'}
            </p>
            <p className="text-sm text-[var(--color-text-faint)] mt-1">
              {!query && 'Start a new learning session in the Studio.'}
            </p>
          </div>
          {!query && (
            <Button asChild>
              <Link href="/studio"><Plus className="h-4 w-4" /> Open Studio</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((session, i) => {
            const Icon = SOURCE_ICONS[session.sourceType]
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4',
                  'hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer group'
                )}
                onClick={() => router.push(`/studio?session=${session.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--color-surface-3)] flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[var(--color-text)] truncate">{session.title}</h3>
                    <p className="text-xs text-[var(--color-text-faint)] mt-0.5">
                      {formatTimeAgo(session.updatedAt)}
                    </p>
                    {session.notesMarkdown && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-2 line-clamp-2">
                        {session.notesMarkdown.replace(/^#.*$/m, '').trim().slice(0, 120)}
                      </p>
                    )}
                    {session.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {session.tags.slice(0, 3).map((tag) => <Badge key={tag} size="sm">{tag}</Badge>)}
                        {session.tags.length > 3 && (
                          <span className="text-[10px] text-[var(--color-text-faint)]">+{session.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button size="xs" variant="ghost" onClick={() => router.push(`/studio?session=${session.id}`)}>Open</Button>
                  <Button size="xs" variant="ghost" onClick={() => setDeleteId(session.id)}>
                    <Trash2 className="h-3 w-3 text-[var(--color-error)]" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="Delete Session"
        description="This will permanently delete the session and all its notes. This cannot be undone."
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--color-text-muted)]">Are you sure you want to delete this session?</p>
      </Modal>
    </div>
  )
}
