'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Code,
  Link,
  Highlighter,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Play,
  Pause,
  Clock,
  Sparkles,
  Trash2,
  Copy,
  ClipboardPaste,
  Strikethrough,
  AlignLeft,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VideoPanelRef } from '@/components/studio/VideoPanel'

// ── Constants ─────────────────────────────────────────────────
const MENU_WIDTH = 224  // px — matches w-56
const MENU_PADDING = 8  // viewport padding

interface EditorContextMenuProps {
  editor?: Editor
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
  videoPlayerRef?: React.RefObject<VideoPanelRef | null>
}

interface MenuSection {
  label?: string
  items: MenuItemConfig[]
}

interface MenuItemConfig {
  id: string
  icon?: React.ReactNode
  label: string
  shortcut?: string
  destructive?: boolean
  hidden?: boolean
  action: () => void
}

// ── Link Dialog ───────────────────────────────────────────────
function LinkDialog({
  initialUrl,
  onConfirm,
  onCancel,
}: {
  initialUrl: string
  onConfirm: (url: string) => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState(initialUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className={cn(
        'bg-[var(--color-surface)] border border-[var(--color-border)]',
        'rounded-[var(--radius-md)] shadow-xl p-4 w-80',
        'animate-in fade-in zoom-in-95 duration-150'
      )}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[var(--color-text)]">Insert Link</span>
          <button
            onClick={onCancel}
            className="h-6 w-6 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <input
          ref={inputRef}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(url)
            if (e.key === 'Escape') onCancel()
          }}
          placeholder="https://example.com"
          className={cn(
            'w-full h-9 px-3 text-sm rounded-[var(--radius-sm)]',
            'bg-[var(--color-surface-2)] border border-[var(--color-border)]',
            'text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]',
            'focus:outline-none focus:border-[var(--color-accent)]',
            'transition-colors'
          )}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onConfirm(url)}
            className={cn(
              'flex-1 h-8 text-sm font-medium rounded-[var(--radius-sm)]',
              'bg-[var(--color-accent)] text-white',
              'hover:bg-[var(--color-accent-hover)] transition-colors'
            )}
          >
            Apply
          </button>
          <button
            onClick={onCancel}
            className={cn(
              'flex-1 h-8 text-sm font-medium rounded-[var(--radius-sm)]',
              'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
              'hover:bg-[var(--color-surface-3)] transition-colors'
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Context Menu Item ─────────────────────────────────────────
function ContextMenuItem({
  icon,
  label,
  shortcut,
  destructive,
  onClick,
}: {
  icon?: React.ReactNode
  label: string
  shortcut?: string
  destructive?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-[var(--radius-xs)]',
        'transition-colors duration-75 text-left outline-none',
        destructive
          ? 'text-[var(--color-error)] hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]'
          : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
      )}
    >
      {icon && (
        <span className={cn('shrink-0 opacity-70', destructive && 'opacity-100')}>
          {icon}
        </span>
      )}
      <span className="flex-1 font-medium">{label}</span>
      {shortcut && (
        <span className="text-[var(--color-text-faint)] font-mono text-[10px]">{shortcut}</span>
      )}
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────
export function EditorContextMenu({ editor, textareaRef, videoPlayerRef }: EditorContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [isMac, setIsMac] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  const mod = isMac ? '⌘' : 'Ctrl+'

  const close = useCallback(() => {
    setIsOpen(false)
    setShowLinkDialog(false)
  }, [])

  const handleContextMenu = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement
    // Support both TipTap and Markdown editor targets
    if (!target.closest('.rich-editor-content') && !target.closest('.markdown-editor-content')) return

    e.preventDefault()

    const estimatedHeight = 340 
    const x = Math.min(e.clientX, window.innerWidth - MENU_WIDTH - MENU_PADDING)
    const y = Math.min(e.clientY, window.innerHeight - estimatedHeight - MENU_PADDING)

    setPos({ x: Math.max(MENU_PADDING, x), y: Math.max(MENU_PADDING, y) })
    setIsOpen(true)
  }, [])

  // Escape key and click-outside handlers
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [isOpen, close])

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [handleContextMenu])

  if (!isOpen) return null

  // ── Helpers ─────────────────────────────────────────────────
  const getSelectedText = () => {
    if (editor) {
      const { from, to } = editor.state.selection
      return from === to ? '' : editor.state.doc.textBetween(from, to)
    }
    if (textareaRef?.current) {
      const { selectionStart, selectionEnd, value } = textareaRef.current
      return value.substring(selectionStart, selectionEnd)
    }
    return ''
  }

  const hasSelection = !!getSelectedText()
  const selectedText = getSelectedText()
  const currentLink = editor?.getAttributes('link').href as string | undefined

  const applyFormatting = (mdTag: string, tipTapFn: () => void) => {
    if (editor) {
      tipTapFn()
    } else if (textareaRef?.current) {
      const el = textareaRef.current
      const { selectionStart: start, selectionEnd: end, value: v } = el
      const selected = v.substring(start, end)
      const wrapped = `${mdTag}${selected}${mdTag}`
      const newVal = v.substring(0, start) + wrapped + v.substring(end)
      
      // We need to trigger the onChange of the parent component
      // Since we don't have access to onChange here directly, 
      // we'll rely on the textarea's native event simulation or a shared state.
      // For now, let's manually dispatch an input event.
      el.value = newVal
      el.dispatchEvent(new Event('input', { bubbles: true }))
      
      requestAnimationFrame(() => {
        el.focus()
        el.selectionStart = start + mdTag.length
        el.selectionEnd = end + mdTag.length
      })
    }
  }

  const runAndClose = (fn: () => void) => {
    fn()
    close()
  }

  const menu: MenuSection[] = [
    ...(hasSelection ? [{
      label: 'Selection',
      items: [
        {
          id: 'bold', icon: <Bold className="h-3.5 w-3.5" />, label: 'Bold', shortcut: `${mod}B`,
          action: () => runAndClose(() => applyFormatting('**', () => editor?.chain().focus().toggleBold().run())),
        },
        {
          id: 'italic', icon: <Italic className="h-3.5 w-3.5" />, label: 'Italic', shortcut: `${mod}I`,
          action: () => runAndClose(() => applyFormatting('_', () => editor?.chain().focus().toggleItalic().run())),
        },
        {
          id: 'strike', icon: <Strikethrough className="h-3.5 w-3.5" />, label: 'Strikethrough',
          action: () => runAndClose(() => applyFormatting('~~', () => editor?.chain().focus().toggleStrike().run())),
        },
        {
          id: 'highlight', icon: <Highlighter className="h-3.5 w-3.5" />, label: 'Highlight', shortcut: `${mod}H`,
          action: () => runAndClose(() => applyFormatting('==', () => editor?.chain().focus().toggleHighlight().run())),
        },
        {
          id: 'link', icon: <Link className="h-3.5 w-3.5" />, label: currentLink ? 'Edit Link' : 'Add Link',
          action: () => { setShowLinkDialog(true) },
        },
      ] satisfies MenuItemConfig[],
    }] : []),
    {
      label: 'Insert Block',
      items: [
        {
          id: 'h1', icon: <Heading1 className="h-3.5 w-3.5" />, label: 'Heading 1',
          action: () => runAndClose(() => {
            if (editor) editor.chain().focus().toggleHeading({ level: 1 }).run()
            else applyFormatting('# ', () => {})
          }),
        },
        {
          id: 'h2', icon: <Heading2 className="h-3.5 w-3.5" />, label: 'Heading 2',
          action: () => runAndClose(() => {
            if (editor) editor.chain().focus().toggleHeading({ level: 2 }).run()
            else applyFormatting('## ', () => {})
          }),
        },
        {
          id: 'bullet', icon: <List className="h-3.5 w-3.5" />, label: 'Bullet List',
          action: () => runAndClose(() => {
            if (editor) editor.chain().focus().toggleBulletList().run()
            else applyFormatting('- ', () => {})
          }),
        },
        {
          id: 'task', icon: <CheckSquare className="h-3.5 w-3.5" />, label: 'Task List',
          action: () => runAndClose(() => {
            if (editor) editor.chain().focus().toggleTaskList().run()
            else applyFormatting('- [ ] ', () => {})
          }),
        },
        {
          id: 'code', icon: <Code className="h-3.5 w-3.5" />, label: 'Code Block',
          action: () => runAndClose(() => {
            if (editor) editor.chain().focus().toggleCodeBlock().run()
            else applyFormatting('```\n', () => {})
          }),
        },
      ] satisfies MenuItemConfig[],
    },
    {
      label: 'Video',
      items: [
        {
          id: 'timestamp', icon: <Clock className="h-3.5 w-3.5" />, label: 'Insert Timestamp',
          action: () => runAndClose(() => {
            const seconds = videoPlayerRef?.current?.getCurrentTime() ?? 0
            const ts = Math.floor(seconds)
            if (editor) {
              editor.chain().focus().insertContent({
                type: 'timestamp',
                attrs: { timeSeconds: ts, label: '' }
              }).run()
            } else if (textareaRef?.current) {
              const el = textareaRef.current
              const { selectionStart: start, value: v } = el
              const tsString = `[ts:${ts}]`
              el.value = v.substring(0, start) + tsString + v.substring(start)
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
          }),
        },
        {
          id: 'play', icon: <Play className="h-3.5 w-3.5" />, label: 'Play Video',
          action: () => runAndClose(() => videoPlayerRef?.current?.play()),
        },
        {
          id: 'pause', icon: <Pause className="h-3.5 w-3.5" />, label: 'Pause Video',
          action: () => runAndClose(() => videoPlayerRef?.current?.pause()),
        },
      ] satisfies MenuItemConfig[],
    },
    {
      label: 'AI',
      items: [
        {
          id: 'ai', icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Ask AI about selection',
          hidden: !hasSelection,
          action: () => runAndClose(() => {
            window.dispatchEvent(new CustomEvent('ai-panel-query', { detail: { text: selectedText } }))
          }),
        },
      ] satisfies MenuItemConfig[],
    },
    {
      label: 'Clipboard',
      items: [
        {
          id: 'copy', icon: <Copy className="h-3.5 w-3.5" />, label: 'Copy', shortcut: `${mod}C`,
          action: () => runAndClose(() => navigator.clipboard.writeText(selectedText)),
        },
        {
          id: 'paste', icon: <ClipboardPaste className="h-3.5 w-3.5" />, label: 'Paste', shortcut: `${mod}V`,
          action: () => runAndClose(async () => {
            const text = await navigator.clipboard.readText()
            if (editor) editor.chain().focus().insertContent(text).run()
            else if (textareaRef?.current) {
              const el = textareaRef.current
              const { selectionStart: start, selectionEnd: end, value: v } = el
              el.value = v.substring(0, start) + text + v.substring(end)
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
          }),
        },
        {
          id: 'selectAll', icon: <AlignLeft className="h-3.5 w-3.5" />, label: 'Select All', shortcut: `${mod}A`,
          action: () => runAndClose(() => {
            if (editor) editor.chain().focus().selectAll().run()
            else if (textareaRef?.current) {
              textareaRef.current.select()
            }
          }),
        },
      ] satisfies MenuItemConfig[],
    },
    {
      items: [
        {
          id: 'delete', icon: <Trash2 className="h-3.5 w-3.5" />, label: 'Delete', destructive: true,
          hidden: !hasSelection,
          action: () => runAndClose(() => {
            if (editor) editor.chain().focus().deleteSelection().run()
            else if (textareaRef?.current) {
              const el = textareaRef.current
              const { selectionStart: start, selectionEnd: end, value: v } = el
              el.value = v.substring(0, start) + v.substring(end)
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
          }),
        },
      ] satisfies MenuItemConfig[],
    },
  ]

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9999]" onClick={close} onContextMenu={(e) => e.preventDefault()} />

      {/* Menu */}
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 10000,
          width: MENU_WIDTH,
        }}
        className={cn(
          'bg-[var(--color-surface)] border border-[var(--color-border)]',
          'rounded-[var(--radius-md)] shadow-xl py-1',
          'animate-in fade-in zoom-in-95 duration-100',
          'max-h-[min(400px,calc(100vh-32px))] overflow-y-auto'
        )}
        onContextMenu={(e) => e.preventDefault()}
      >
        {menu.map((section, si) => {
          const visibleItems = section.items.filter((item) => !item.hidden)
          if (visibleItems.length === 0) return null
          return (
            <div key={si}>
              {si > 0 && <div className="h-px bg-[var(--color-border-subtle)] my-1" />}
              {section.label && (
                <p className="px-2.5 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-faint)]">
                  {section.label}
                </p>
              )}
              <div className="px-1">
                {visibleItems.map((item) => (
                  <ContextMenuItem
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    shortcut={item.shortcut}
                    destructive={item.destructive}
                    onClick={item.action}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <LinkDialog
          initialUrl={currentLink ?? ''}
          onConfirm={(url) => {
            if (editor) {
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              } else {
                editor.chain().focus().unsetLink().run()
              }
            } else if (textareaRef?.current) {
              const el = textareaRef.current
              const { selectionStart: start, selectionEnd: end, value: v } = el
              const selected = v.substring(start, end)
              const link = url ? `[${selected}](${url})` : selected
              el.value = v.substring(0, start) + link + v.substring(end)
              el.dispatchEvent(new Event('input', { bubbles: true }))
            }
            close()
          }}
          onCancel={close}
        />
      )}
    </>,
    document.body
  )
}
