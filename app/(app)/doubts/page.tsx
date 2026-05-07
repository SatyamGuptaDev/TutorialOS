'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { HelpCircle, Search, CheckCircle2, Trash2, ExternalLink, FolderOpen } from 'lucide-react'
import { db } from '@/lib/db/schema'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatTimeAgo } from '@/lib/utils'
import type { Doubt } from '@/types'

type Filter = 'all' | 'open' | 'resolved'

export default function DoubtsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''
  const [filter, setFilter] = useState<Filter>('open')
  const [query, setQuery] = useState('')

  const doubts = useLiveQuery(
    () => db.doubts.where('userId').equals(userId).reverse().sortBy('createdAt'),
    [userId]
  )

  const sessions = useLiveQuery(
    () => db.sessions.where('userId').equals(userId).toArray(),
    [userId]
  )

  const sessionMap = Object.fromEntries((sessions ?? []).map((s) => [s.id, s.title]))

  const filtered = (doubts ?? []).filter((d) => {
    const matchesFilter = filter === 'all' || d.status === filter
    const matchesQuery = !query || d.text.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  })

  // Group by session
  const grouped = filtered.reduce<Record<string, Doubt[]>>((acc, doubt) => {
    const key = doubt.sessionId ?? '__unsessioned__'
    if (!acc[key]) acc[key] = []
    acc[key]!.push(doubt)
    return acc
  }, {})

  const resolve = async (id: string) => {
    await db.doubts.update(id, { status: 'resolved', resolvedAt: new Date().toISOString() })
  }

  const deleteDoubt = async (id: string) => {
    await db.doubts.delete(id)
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Doubts</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {filtered.length} doubt{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doubts…"
            className="w-full h-9 pl-9 pr-3 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>
        <div className="flex bg-[var(--color-surface-2)] rounded-[var(--radius-sm)] p-0.5 gap-0.5">
          {(['open', 'resolved', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'h-7 px-3 text-xs rounded-[3px] capitalize font-medium transition-colors',
                filter === f
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped sections */}
      {Object.entries(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <HelpCircle className="h-10 w-10 text-[var(--color-text-faint)]" />
          <p className="font-medium text-[var(--color-text-muted)]">
            {filter === 'open' ? 'No open doubts 🎉' : 'No doubts found'}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([sessionId, sessionDoubts]) => {
          const title = sessionId === '__unsessioned__'
            ? 'No session'
            : (sessionMap[sessionId] ?? 'Unknown session')

          return (
            <div key={sessionId} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-[var(--color-text-muted)]" />
                <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
                {sessionId !== '__unsessioned__' && (
                  <button
                    onClick={() => router.push(`/studio?session=${sessionId}`)}
                    className="text-[var(--color-text-faint)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5 pl-6">
                {sessionDoubts.map((doubt, i) => (
                  <motion.div
                    key={doubt.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 group py-2 px-3 rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <div className={cn(
                      'h-2 w-2 rounded-full mt-1.5 shrink-0',
                      doubt.status === 'open' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'
                    )} />
                    <p className="flex-1 text-sm text-[var(--color-text)] leading-relaxed">{doubt.text}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-[var(--color-text-faint)]">{formatTimeAgo(doubt.createdAt)}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {doubt.status === 'open' && (
                          <button
                            onClick={() => resolve(doubt.id)}
                            className="h-6 w-6 flex items-center justify-center text-[var(--color-success)] hover:bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] rounded transition-all"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteDoubt(doubt.id)}
                          className="h-6 w-6 flex items-center justify-center text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] rounded transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
