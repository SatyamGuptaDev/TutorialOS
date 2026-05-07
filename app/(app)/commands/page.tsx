'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Terminal, Search, Copy, Check, Trash2, Download, Tag } from 'lucide-react'
import { db } from '@/lib/db/schema'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatTimeAgo } from '@/lib/utils'

export default function CommandsPage() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''
  const [query, setQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const commands = useLiveQuery(
    () => db.commandSnippets.where('userId').equals(userId).reverse().sortBy('createdAt'),
    [userId]
  )

  const filtered = (commands ?? []).filter((c) => {
    const q = query.toLowerCase()
    return !q || c.command.toLowerCase().includes(q) || c.topic.toLowerCase().includes(q) || c.language.toLowerCase().includes(q)
  })

  // Group by topic
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, cmd) => {
    const key = cmd.topic || 'Uncategorized'
    if (!acc[key]) acc[key] = []
    acc[key]!.push(cmd)
    return acc
  }, {})

  const copyCmd = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const exportAll = () => {
    const md = (commands ?? [])
      .map((c) => `### ${c.topic || 'General'}\n\`\`\`${c.language}\n${c.command}\n\`\`\``)
      .join('\n\n')
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'commands.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Commands</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {filtered.length} snippet{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={exportAll} disabled={!commands?.length}>
          <Download className="h-4 w-4" /> Export Markdown
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-faint)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands…"
          className="w-full h-9 pl-9 pr-3 text-sm rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
      </div>

      {/* Grouped commands */}
      {Object.entries(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Terminal className="h-10 w-10 text-[var(--color-text-faint)]" />
          <p className="font-medium text-[var(--color-text-muted)]">
            {query ? 'No commands match your search' : 'No commands saved yet'}
          </p>
          <p className="text-sm text-[var(--color-text-faint)]">
            Capture commands in the Studio&apos;s Commands panel.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([topic, cmds]) => (
          <div key={topic} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-[var(--color-text-muted)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text)]">{topic}</h2>
              <span className="text-xs text-[var(--color-text-faint)]">({cmds.length})</span>
            </div>

            <div className="flex flex-col gap-2 pl-6">
              {cmds.map((cmd, i) => (
                <motion.div
                  key={cmd.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden group"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-2)]">
                    <div className="flex items-center gap-2">
                      <Badge variant="accent" size="sm">{cmd.language}</Badge>
                      <span className="text-xs text-[var(--color-text-faint)]">{formatTimeAgo(cmd.createdAt)}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyCmd(cmd.id, cmd.command)}
                        className="h-7 px-2 flex items-center gap-1.5 text-xs rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] transition-colors"
                      >
                        {copiedId === cmd.id
                          ? <><Check className="h-3.5 w-3.5 text-[var(--color-success)]" /> Copied</>
                          : <><Copy className="h-3.5 w-3.5" /> Copy</>
                        }
                      </button>
                      <button
                        onClick={() => db.commandSnippets.delete(cmd.id)}
                        className="h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] rounded-[var(--radius-sm)] transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 text-sm font-mono text-[var(--color-text)] overflow-x-auto bg-[var(--color-surface)]">
                    <code>{cmd.command}</code>
                  </pre>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
