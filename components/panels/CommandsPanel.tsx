'use client'

import { useState } from 'react'
import { Terminal, Plus, Copy, Check, Trash2 } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/schema'
import { useStudioStore } from '@/stores/studioStore'
import { useAuthStore } from '@/stores/authStore'
import { PanelContainer } from './PanelContainer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'

const LANGUAGES = ['bash', 'python', 'javascript', 'typescript', 'sql', 'go', 'rust', 'other']

export function CommandsPanel() {
  const user = useAuthStore((s) => s.user)
  const currentSession = useStudioStore((s) => s.currentSession)
  const [cmd, setCmd] = useState('')
  const [lang, setLang] = useState('bash')
  const [topic, setTopic] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const commands = useLiveQuery(
    () => currentSession
      ? db.commandSnippets.where('sessionId').equals(currentSession.id).reverse().sortBy('createdAt')
      : Promise.resolve([] as import('@/types').CommandSnippet[]),
    [currentSession?.id]
  )

  const addCommand = async () => {
    if (!cmd.trim() || !user) return
    await db.commandSnippets.add({
      id: generateId(),
      userId: user.id,
      sessionId: currentSession?.id ?? null,
      command: cmd.trim(),
      language: lang,
      topic: topic.trim(),
      createdAt: new Date().toISOString(),
    })
    setCmd('')
    setTopic('')
  }

  const copyCommand = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <PanelContainer name="commands" title="Commands" icon={Terminal}>
      {/* Add form */}
      <div className="flex flex-col gap-2 mb-3">
        <textarea
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="$ your command here"
          rows={2}
          className="w-full text-xs font-mono rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] p-2 resize-none focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
        <div className="flex gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="h-7 px-2 text-xs rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          >
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic tag"
            className="flex-1 h-7 px-2 text-xs rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <Button size="xs" onClick={addCommand} disabled={!cmd.trim()}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {(commands ?? []).map((c) => (
          <div key={c.id} className="group rounded-[var(--radius-sm)] border border-[var(--color-border)] overflow-hidden">
            <div className="flex items-center justify-between px-2 py-1 bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-1.5">
                <Badge size="sm" variant="accent">{c.language}</Badge>
                {c.topic && <span className="text-[10px] text-[var(--color-text-muted)]">{c.topic}</span>}
              </div>
              <div className="flex gap-0.5">
                <button
                  onClick={() => copyCommand(c.id, c.command)}
                  className="h-5 w-5 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded transition-colors"
                >
                  {copiedId === c.id ? <Check className="h-3 w-3 text-[var(--color-success)]" /> : <Copy className="h-3 w-3" />}
                </button>
                <button
                  onClick={() => db.commandSnippets.delete(c.id)}
                  className="h-5 w-5 flex items-center justify-center text-[var(--color-error)] opacity-0 group-hover:opacity-100 hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] rounded transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <pre className="px-2 py-1.5 text-xs font-mono text-[var(--color-text)] overflow-x-auto">
              {c.command.length > 100 ? c.command.slice(0, 100) + '…' : c.command}
            </pre>
          </div>
        ))}
        {(commands ?? []).length === 0 && (
          <p className="text-xs text-[var(--color-text-faint)] text-center py-2">No commands yet</p>
        )}
      </div>
    </PanelContainer>
  )
}
