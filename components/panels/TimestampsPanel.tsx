'use client'

import { useState } from 'react'
import { Clock, Plus, Trash2, FileInput } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import { useStudioStore } from '@/stores/studioStore'
import { useAuthStore } from '@/stores/authStore'
import { PanelContainer } from './PanelContainer'
import { Button } from '@/components/ui/button'
import { generateId, formatSeconds } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function TimestampsPanel() {
  const user = useAuthStore((s) => s.user)
  const currentSession = useStudioStore((s) => s.currentSession)
  const sourceType = useStudioStore((s) => s.sourceType)
  const [timeInput, setTimeInput] = useState('')
  const [labelInput, setLabelInput] = useState('')

  const timestamps = useLiveQuery(
    () => currentSession
      ? db.timestamps.where('sessionId').equals(currentSession.id).sortBy('timeSeconds')
      : Promise.resolve([] as import('@/types').Timestamp[]),
    [currentSession?.id]
  )

  const parseTime = (input: string): number => {
    const clean = input.trim()
    if (/^\d+$/.test(clean)) return parseInt(clean)
    const parts = clean.split(':').map(Number)
    if (parts.length === 2) return (parts[0]! * 60) + (parts[1]!)
    if (parts.length === 3) return (parts[0]! * 3600) + (parts[1]! * 60) + (parts[2]!)
    return 0
  }

  const handleAdd = async () => {
    if (!currentSession || !user) return
    const seconds = parseTime(timeInput)
    await db.timestamps.add({
      id: generateId(),
      sessionId: currentSession.id,
      userId: user.id,
      timeSeconds: seconds,
      label: labelInput,
      createdAt: new Date().toISOString(),
    })
    setTimeInput('')
    setLabelInput('')
  }

  const handleDelete = async (id: string) => {
    await db.timestamps.delete(id)
  }

  return (
    <PanelContainer name="timestamps" title="Timestamps" icon={Clock}>
      {/* Add form */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex gap-2">
          <input
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            placeholder="MM:SS"
            className="w-20 h-7 px-2 text-xs font-mono rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          />
          <input
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Label (optional)"
            className="flex-1 h-7 px-2 text-xs rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button size="xs" onClick={handleAdd} disabled={!currentSession}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-1">
        {(timestamps ?? []).map((ts) => (
          <div key={ts.id} className="flex items-center gap-2 group py-1">
            <span className="font-mono text-xs text-[var(--color-accent)] shrink-0">
              {formatSeconds(ts.timeSeconds)}
            </span>
            <span className="flex-1 text-xs text-[var(--color-text-muted)] truncate">
              {ts.label || '—'}
            </span>
            <button
              onClick={() => handleDelete(ts.id)}
              className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] rounded transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {(timestamps ?? []).length === 0 && (
          <p className="text-xs text-[var(--color-text-faint)] text-center py-2">No timestamps yet</p>
        )}
      </div>
    </PanelContainer>
  )
}
