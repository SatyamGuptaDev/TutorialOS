'use client'

import { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  className?: string
}

export function MarkdownEditor({ value, onChange, readOnly = false, className }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea to content
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    resize()
  }, [value, resize])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = ref.current!
    const { selectionStart: start, selectionEnd: end, value: v } = el

    // Tab → 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const newVal = v.substring(0, start) + '  ' + v.substring(end)
      onChange(newVal)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2
      })
      return
    }

    // Ctrl+B → wrap **bold**
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      const selected = v.substring(start, end)
      const wrapped = `**${selected}**`
      onChange(v.substring(0, start) + wrapped + v.substring(end))
      requestAnimationFrame(() => {
        el.selectionStart = start + 2
        el.selectionEnd = end + 2
      })
      return
    }

    // Ctrl+I → wrap *italic*
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      const selected = v.substring(start, end)
      const wrapped = `*${selected}*`
      onChange(v.substring(0, start) + wrapped + v.substring(end))
      requestAnimationFrame(() => {
        el.selectionStart = start + 1
        el.selectionEnd = end + 1
      })
      return
    }

    // Auto-pair brackets + quotes
    const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" }
    if (PAIRS[e.key] && start === end) {
      e.preventDefault()
      const close = PAIRS[e.key]!
      onChange(v.substring(0, start) + e.key + close + v.substring(end))
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 1 })
    }
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck={false}
        className={cn(
          'flex-1 w-full resize-none bg-transparent border-none outline-none',
          'font-mono text-sm leading-relaxed',
          'text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]',
          'px-8 py-6',
          readOnly && 'cursor-default'
        )}
        style={{ fontFamily: 'var(--font-mono)', minHeight: '100%' }}
        placeholder="Start writing in Markdown…"
      />
    </div>
  )
}
