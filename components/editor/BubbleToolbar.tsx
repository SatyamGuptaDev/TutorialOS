'use client'

import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough,
  Link, Code, Eraser, Highlighter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Pink', value: '#ec4899' },
]

const HIGHLIGHT_COLORS = [
  { label: 'None', value: '' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fce7f3' },
  { label: 'Orange', value: '#fed7aa' },
  { label: 'Purple', value: '#e9d5ff' },
]

function ToolbarButton({ active, onClick, children, title }: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded-[var(--radius-xs)]',
        'transition-colors duration-[var(--duration-fast)] text-xs',
        active
          ? 'bg-[var(--color-accent)] text-white'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarSep() {
  return <div className="h-4 w-px bg-[var(--color-border-subtle)] mx-0.5" />
}

interface BubbleToolbarProps { editor: Editor }

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [colorOpen, setColorOpen] = useState(false)
  const [highlightOpen, setHighlightOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection
      if (from === to || editor.view.state.selection.empty) {
        setIsVisible(false)
        return
      }

      // Get position from selection
      try {
        const { view } = editor
        const domRange = view.domAtPos(from)
        const range = document.createRange()
        range.setStart(domRange.node, domRange.offset)
        const domRangeTo = view.domAtPos(to)
        range.setEnd(domRangeTo.node, domRangeTo.offset)
        const rect = range.getBoundingClientRect()

        const toolbarHeight = 44
        const top = rect.top + window.scrollY - toolbarHeight - 8
        const left = Math.min(
          rect.left + window.scrollX + rect.width / 2 - 180,
          window.innerWidth - 380
        )

        setPosition({ top, left: Math.max(8, left) })
        setIsVisible(true)
      } catch {
        setIsVisible(false)
      }
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    editor.on('blur', () => setTimeout(() => setIsVisible(false), 150))

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor])

  if (!isVisible) return null

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 999 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className={cn(
        'flex items-center gap-0.5 p-1 rounded-[var(--radius-md)]',
        'bg-[var(--color-surface)] border border-[var(--color-border)]',
        'shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
      )}>
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (⌘B)">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (⌘I)">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton active={editor.isActive('link')} onClick={() => {
          const url = window.prompt('URL:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }} title="Link">
          <Link className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarSep />

        {/* Text color */}
        <div className="relative">
          <button
            onMouseDown={(e) => { e.preventDefault(); setColorOpen(!colorOpen); setHighlightOpen(false) }}
            className="h-7 w-7 flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-xs)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
            title="Text color"
          >
            <span className="text-[10px] font-bold leading-none">A</span>
            <div className="w-4 h-0.5 rounded-full" style={{ background: editor.getAttributes('textStyle')['color'] as string || 'var(--color-accent)' }} />
          </button>
          {colorOpen && (
            <div className="absolute bottom-full left-0 mb-1 p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[0_8px_24px_rgba(0,0,0,0.3)] grid grid-cols-4 gap-1 z-10">
              {TEXT_COLORS.map(({ label, value }) => (
                <button
                  key={label}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (value) editor.chain().focus().setColor(value).run()
                    else editor.chain().focus().unsetColor().run()
                    setColorOpen(false)
                  }}
                  title={label}
                  className="h-5 w-5 rounded border border-[var(--color-border)] hover:scale-110 transition-transform"
                  style={{ background: value || 'var(--color-text)' }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="relative">
          <button
            onMouseDown={(e) => { e.preventDefault(); setHighlightOpen(!highlightOpen); setColorOpen(false) }}
            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
            title="Highlight"
          >
            <Highlighter className="h-3.5 w-3.5" />
          </button>
          {highlightOpen && (
            <div className="absolute bottom-full right-0 mb-1 p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[0_8px_24px_rgba(0,0,0,0.3)] grid grid-cols-4 gap-1 z-10">
              {HIGHLIGHT_COLORS.map(({ label, value }) => (
                <button
                  key={label}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (value) editor.chain().focus().setHighlight({ color: value }).run()
                    else editor.chain().focus().unsetHighlight().run()
                    setHighlightOpen(false)
                  }}
                  title={label}
                  className="h-5 w-5 rounded border border-[var(--color-border)] hover:scale-110 transition-transform"
                  style={{ background: value || 'transparent' }}
                />
              ))}
            </div>
          )}
        </div>

        <ToolbarSep />

        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear formatting">
          <Eraser className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
    </div>
  )
}
