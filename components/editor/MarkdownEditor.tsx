import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  className?: string
}

export const MarkdownEditor = forwardRef<HTMLTextAreaElement, MarkdownEditorProps>(
  ({ value, onChange, readOnly = false, className }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => internalRef.current!)

    const resize = useCallback(() => {
      const el = internalRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }, [])

    useEffect(() => {
      resize()
    }, [value, resize])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = internalRef.current!
      const { selectionStart: start, selectionEnd: end, value: v } = el

      if (e.key === 'Tab') {
        e.preventDefault()
        const newVal = v.substring(0, start) + '  ' + v.substring(end)
        onChange(newVal)
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 2
        })
        return
      }

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
          ref={internalRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          className={cn(
            'flex-1 w-full resize-none bg-transparent border-none outline-none',
            'font-mono text-sm leading-relaxed',
            'text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]',
            'px-8 py-6 markdown-editor-content',
            readOnly && 'cursor-default'
          )}
          style={{ fontFamily: 'var(--font-mono)', minHeight: '100%' }}
          placeholder="Start writing in Markdown…"
        />
      </div>
    )
  }
)

MarkdownEditor.displayName = 'MarkdownEditor'
