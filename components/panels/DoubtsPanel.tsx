'use client'

import { useState } from 'react'
import { HelpCircle, Plus, CheckCircle2, Trash2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import { useStudioStore } from '@/stores/studioStore'
import { useAuthStore } from '@/stores/authStore'
import { PanelContainer } from './PanelContainer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { addDoubt, resolveDoubt, deleteDoubt as deleteDoubtMutation } from '@/lib/db/mutations'

type FilterTab = 'all' | 'open' | 'resolved'

export function DoubtsPanel() {
  const user = useAuthStore((s) => s.user)
  const currentSession = useStudioStore((s) => s.currentSession)
  const [newText, setNewText] = useState('')
  const [filter, setFilter] = useState<FilterTab>('open')

  const doubts = useLiveQuery(
    () => currentSession
      ? db.doubts.where('sessionId').equals(currentSession.id).reverse().sortBy('createdAt')
      : Promise.resolve([] as import('@/types').Doubt[]),
    [currentSession?.id]
  )

  const filtered = (doubts ?? []).filter((d) =>
    filter === 'all' ? true : d.status === filter
  )

  const handleAddDoubt = async () => {
    if (!newText.trim() || !user) return
    await addDoubt({
      userId: user.id,
      sessionId: currentSession?.id ?? null,
      text: newText.trim(),
      timestampSeconds: null,
      status: 'open',
      resolvedAt: null,
    })
    setNewText('')
  }

  const resolve = async (id: string) => {
    await resolveDoubt(id)
  }

  const handleDelete = async (id: string) => {
    await deleteDoubtMutation(id)
  }

  return (
    <PanelContainer name="doubts" title="Doubts" icon={HelpCircle}>
      {/* Add form */}
      <div className="flex gap-2 mb-3">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="What's unclear?"
          className="flex-1 h-7 px-2 text-xs rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          onKeyDown={(e) => e.key === 'Enter' && handleAddDoubt()}
        />
        <Button size="xs" onClick={handleAddDoubt} disabled={!newText.trim()}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-2">
        {(['open', 'resolved', 'all'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full capitalize transition-colors',
              filter === tab
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-1.5">
        {filtered.map((doubt) => (
          <div key={doubt.id} className="flex items-start gap-2 group">
            <div className={cn(
              'h-2 w-2 rounded-full mt-1.5 shrink-0',
              doubt.status === 'open' ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'
            )} />
            <p className="flex-1 text-xs text-[var(--color-text)] leading-relaxed">{doubt.text}</p>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {doubt.status === 'open' && (
                <button onClick={() => resolve(doubt.id)} className="h-5 w-5 flex items-center justify-center text-[var(--color-success)] hover:bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] rounded transition-all">
                  <CheckCircle2 className="h-3 w-3" />
                </button>
              )}
              <button onClick={() => handleDelete(doubt.id)} className="h-5 w-5 flex items-center justify-center text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] rounded transition-all">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-[var(--color-text-faint)] text-center py-2">
            {filter === 'open' ? 'No open doubts 🎉' : 'None found'}
          </p>
        )}
      </div>
    </PanelContainer>
  )
}
