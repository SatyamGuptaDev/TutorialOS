'use client'

import { useState } from 'react'
import { Zap, ArrowDown, HelpCircle, Terminal, X } from 'lucide-react'
import { useStudioStore } from '@/stores/studioStore'
import { useAuthStore } from '@/stores/authStore'
import { PanelContainer } from './PanelContainer'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { addDoubt, addCommand } from '@/lib/db/mutations'

export function QuickCapturePanel() {
  const [text, setText] = useState('')
  const user = useAuthStore((s) => s.user)
  const currentSession = useStudioStore((s) => s.currentSession)
  const updateContent = useStudioStore((s) => s.updateContent)
  const markdownContent = useStudioStore((s) => s.markdownContent)

  const pushToNote = async () => {
    if (!text.trim()) return
    const newMarkdown = markdownContent + '\n\n' + text.trim()
    const { markdownToTipTapContent } = await import('@/lib/utils/editorConvert')
    const newJson = markdownToTipTapContent(newMarkdown)
    updateContent(newMarkdown, newJson)
    toast.success('Pushed to note')
    setText('')
  }

  const saveAsDoubt = async () => {
    if (!text.trim() || !user) return
    await addDoubt({
      userId: user.id,
      sessionId: currentSession?.id ?? null,
      text: text.trim(),
      timestampSeconds: null,
      status: 'open',
      resolvedAt: null,
    })
    toast.success('Saved as doubt')
    setText('')
  }

  const saveAsCommand = async () => {
    if (!text.trim() || !user) return
    await addCommand({
      userId: user.id,
      sessionId: currentSession?.id ?? null,
      command: text.trim(),
      language: 'bash',
      topic: '',
    })
    toast.success('Saved as command')
    setText('')
  }

  return (
    <PanelContainer name="quickCapture" title="Quick Capture" icon={Zap}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Jot something quickly…"
        rows={3}
        className="w-full text-xs rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] p-2 resize-none focus:outline-none focus:border-[var(--color-accent)] transition-colors"
      />
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Button size="xs" variant="ghost" onClick={pushToNote} disabled={!text.trim()}>
          <ArrowDown className="h-3 w-3" /> Push to note
        </Button>
        <Button size="xs" variant="ghost" onClick={saveAsDoubt} disabled={!text.trim()}>
          <HelpCircle className="h-3 w-3" /> Doubt
        </Button>
        <Button size="xs" variant="ghost" onClick={saveAsCommand} disabled={!text.trim()}>
          <Terminal className="h-3 w-3" /> Command
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setText('')} disabled={!text.trim()}>
          <X className="h-3 w-3" /> Clear
        </Button>
      </div>
    </PanelContainer>
  )
}
