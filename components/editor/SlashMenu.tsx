'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import type { SuggestionProps } from '@tiptap/suggestion'
import {
  Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare,
  Quote, Code2, Table2, Minus,
  Bell, Clock, HelpCircle, Terminal, FileText,
  AlertCircle, CheckCircle2, Info, XCircle, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VideoPanelRef } from '@/components/studio/VideoPanel'

interface SlashCommand {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action: (editor: Editor, videoRef?: React.RefObject<VideoPanelRef | null>) => void
}

const buildCommands = (videoRef?: React.RefObject<VideoPanelRef | null>): SlashCommand[] => [
  { id: 'h1', title: 'Heading 1', description: 'Large section heading', icon: Heading1, action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2', title: 'Heading 2', description: 'Medium section heading', icon: Heading2, action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', title: 'Heading 3', description: 'Small section heading', icon: Heading3, action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bullet', title: 'Bullet List', description: 'Unordered list', icon: List, action: (e) => e.chain().focus().toggleBulletList().run() },
  { id: 'numbered', title: 'Numbered List', description: 'Ordered list', icon: ListOrdered, action: (e) => e.chain().focus().toggleOrderedList().run() },
  { id: 'todo', title: 'Task List', description: 'Checkboxes', icon: CheckSquare, action: (e) => e.chain().focus().toggleTaskList().run() },
  { id: 'quote', title: 'Blockquote', description: 'Highlighted quote', icon: Quote, action: (e) => e.chain().focus().toggleBlockquote().run() },
  { id: 'code', title: 'Code Block', description: 'Syntax-highlighted code', icon: Code2, action: (e) => e.chain().focus().toggleCodeBlock().run() },
  { id: 'table', title: 'Table', description: 'Insert a 3×3 table', icon: Table2, action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { id: 'divider', title: 'Divider', description: 'Horizontal rule', icon: Minus, action: (e) => e.chain().focus().setHorizontalRule().run() },
  {
    id: 'youtube', title: 'YouTube Video', description: 'Embed a video from YouTube', icon: FileText,
    action: (e) => {
      e.chain().focus().insertContent(`<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="100%" height="400"></iframe>`).run()
    }
  },
  {
    id: 'image', title: 'Image', description: 'Upload or link an image', icon: FileText,
    action: (e) => {
      e.chain().focus().setImage({ src: 'https://placehold.co/600x400?text=Placeholder+Image' }).run()
    }
  },
  {
    id: 'info', title: 'Info Callout', description: 'Blue information block', icon: Info,
    action: (e) => e.chain().focus().insertContent({ type: 'callout', attrs: { type: 'info' }, content: [{ type: 'text', text: 'Information…' }] }).run()
  },
  {
    id: 'success', title: 'Success Callout', description: 'Green success block', icon: CheckCircle2,
    action: (e) => e.chain().focus().insertContent({ type: 'callout', attrs: { type: 'success' }, content: [{ type: 'text', text: 'Success…' }] }).run()
  },
  {
    id: 'warning', title: 'Warning Callout', description: 'Yellow warning block', icon: AlertCircle,
    action: (e) => e.chain().focus().insertContent({ type: 'callout', attrs: { type: 'warning' }, content: [{ type: 'text', text: 'Warning…' }] }).run()
  },
  {
    id: 'error', title: 'Error Callout', description: 'Red error block', icon: XCircle,
    action: (e) => e.chain().focus().insertContent({ type: 'callout', attrs: { type: 'error' }, content: [{ type: 'text', text: 'Error…' }] }).run()
  },
  {
    id: 'timestamp', title: 'Timestamp', description: 'Current video time', icon: Clock,
    action: (e) => {
      const seconds = videoRef?.current?.getCurrentTime() ?? 0
      e.chain().focus().insertContent({ type: 'timestamp', attrs: { timeSeconds: Math.floor(seconds), label: '' } }).run()
    }
  },
  {
    id: 'doubt', title: 'Doubt', description: 'Mark a question/doubt', icon: HelpCircle,
    action: (e) => {
      e.chain().focus().insertContent({ type: 'doubt', attrs: { text: 'Type your doubt here...' } }).run()
    }
  },
  {
    id: 'template-lecture', title: 'Lecture Template', description: 'Quick setup for course lectures', icon: FileText,
    action: (e) => e.chain().focus().insertContent(`
      <h2>Lecture Summary</h2>
      <p>Key topics covered in this video.</p>
      <ul data-type="taskList">
        <li data-checked="false">Review core concepts</li>
        <li data-checked="false">Complete practice exercise</li>
      </ul>
      <p></p>
    `).run()
  },
  {
    id: 'template-tutorial', title: 'Project Tutorial', description: 'Step-by-step project guide', icon: FileText,
    action: (e) => e.chain().focus().insertContent(`
      <h2>Project Overview</h2>
      <p>Goal: [Insert Goal]</p>
      <h3>Steps</h3>
      <ol>
        <li>Setup environment</li>
        <li>Implement core logic</li>
        <li>Test and debug</li>
      </ol>
      <div data-type="callout" data-type-attr="info">Remember to commit your changes!</div>
    `).run()
  },
  {
    id: 'command', title: 'Command Block', description: 'Terminal command snippet', icon: Terminal,
    action: (e) => e.chain().focus().insertContent({ type: 'commandBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '' }] }).run()
  },
  {
    id: 'ai', title: 'Ask AI', description: 'Ask the study coach about this', icon: Sparkles,
    action: () => {
      window.dispatchEvent(new CustomEvent('ai-panel-query', { detail: { text: '' } }))
    }
  },
]

// ── Slash Menu React Component ────────────────────────────────

interface SlashMenuListProps {
  items: SlashCommand[]
  command: (item: SlashCommand) => void
}

function SlashMenuList({ items, command }: SlashMenuListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setSelectedIndex(0), [items])

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => (i - 1 + items.length) % items.length); return true }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => (i + 1) % items.length); return true }
      if (e.key === 'Enter') { e.preventDefault(); if (items[selectedIndex]) command(items[selectedIndex]!); return true }
      return false
    },
    [items, selectedIndex, command]
  )

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  if (!items.length) return null

  return (
    <div className={cn(
      'w-64 max-h-72 overflow-y-auto rounded-[var(--radius-md)] p-1.5',
      'glass shadow-[0_8px_32px_rgba(0,0,0,0.5)] scrollbar-none',
      'animate-in fade-in slide-in-from-top-2 duration-150'
    )}>
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            ref={i === selectedIndex ? selectedRef : undefined}
            onClick={() => command(item)}
            className={cn(
              'w-full flex items-center gap-3 px-2.5 py-2 rounded-[var(--radius-sm)] text-left',
              'transition-colors duration-[var(--duration-fast)]',
              i === selectedIndex
                ? 'bg-[var(--color-surface-2)]'
                : 'hover:bg-[var(--color-surface-2)]'
            )}
          >
            <div className="h-8 w-8 rounded-[var(--radius-sm)] bg-[var(--color-surface-3)] flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-text)] leading-none">{item.title}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── SlashMenu Extension ───────────────────────────────────────



// Export the extension for use in useEditor
export function createSlashMenuExtension(videoPlayerRef?: React.RefObject<VideoPanelRef | null>) {
  const allCommands = buildCommands(videoPlayerRef)

  return Extension.create({
    name: 'slashMenu',
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: '/',
          startOfLine: false,
          items: ({ query }: { query: string }) =>
            allCommands.filter((c) =>
              c.title.toLowerCase().includes(query.toLowerCase()) ||
              c.description.toLowerCase().includes(query.toLowerCase())
            ),
          command: ({ editor: ed, range, props }: { editor: Editor; range: { from: number; to: number }; props: SlashCommand }) => {
            ed.chain().focus().deleteRange(range).run()
            ;(props as SlashCommand).action(ed, videoPlayerRef)
          },
          render: () => {
            let renderer: ReactRenderer | null = null
            let popup: HTMLDivElement | null = null

            return {
              onStart: (props: SuggestionProps<SlashCommand>) => {
                popup = document.createElement('div')
                popup.className = 'slash-menu-portal'
                popup.style.cssText = 'position:fixed;z-index:9999;'
                document.body.appendChild(popup)

                renderer = new ReactRenderer(SlashMenuList, {
                  props: {
                    items: props.items,
                    command: (item: SlashCommand) => props.command({ editor: props.editor, range: props.range, props: item }),
                  },
                  editor: props.editor,
                })

                if (popup && renderer.element) {
                  popup.appendChild(renderer.element)
                  const rect = props.clientRect?.()
                  if (rect) {
                    popup.style.top = `${rect.bottom + 4}px`
                    popup.style.left = `${rect.left}px`
                  }
                }
              },
              onUpdate: (props: SuggestionProps<SlashCommand>) => {
                renderer?.updateProps({
                  items: props.items,
                  command: (item: SlashCommand) => props.command({ editor: props.editor, range: props.range, props: item }),
                })
                if (popup) {
                  const rect = props.clientRect?.()
                  if (rect) {
                    popup.style.top = `${rect.bottom + 4}px`
                    popup.style.left = `${rect.left}px`
                  }
                }
              },
              onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === 'Escape') { popup?.remove(); return true }
                return false
              },
              onExit: () => {
                renderer?.destroy()
                popup?.remove()
                popup = null
                renderer = null
              },
            }
          },
        }),
      ]
    },
  })
}
