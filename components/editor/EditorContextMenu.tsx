'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown'
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
} from 'lucide-react'
import type { VideoPanelRef } from '@/components/studio/VideoPanel'

interface EditorContextMenuProps {
  editor: Editor
  videoPlayerRef?: React.RefObject<VideoPanelRef | null>
}

export function EditorContextMenu({ editor, videoPlayerRef }: EditorContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const handleContextMenu = useCallback((e: MouseEvent) => {
    // Check if right click was inside the editor content
    const target = e.target as HTMLElement
    if (target.closest('.rich-editor-content')) {
      e.preventDefault()
      setPos({ x: e.clientX, y: e.clientY })
      setIsOpen(true)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [handleContextMenu])

  if (!isOpen) return null

  const hasSelection = !editor.state.selection.empty

  return (
    <div 
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 10000 }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger className="sr-only">Open</DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start" sideOffset={0}>
          {hasSelection && (
            <>
              <DropdownMenuLabel>Selection</DropdownMenuLabel>
              <DropdownMenuItem 
                icon={<Bold className="h-3.5 w-3.5" />}
                onSelect={() => editor.chain().focus().toggleBold().run()}
                shortcut="⌘B"
              >
                Bold
              </DropdownMenuItem>
              <DropdownMenuItem 
                icon={<Italic className="h-3.5 w-3.5" />}
                onSelect={() => editor.chain().focus().toggleItalic().run()}
                shortcut="⌘I"
              >
                Italic
              </DropdownMenuItem>
              <DropdownMenuItem 
                icon={<Highlighter className="h-3.5 w-3.5" />}
                onSelect={() => editor.chain().focus().toggleHighlight().run()}
                shortcut="⌘H"
              >
                Highlight
              </DropdownMenuItem>
              <DropdownMenuItem 
                icon={<Link className="h-3.5 w-3.5" />}
                onSelect={() => {
                  const url = window.prompt('URL:')
                  if (url) editor.chain().focus().setLink({ href: url }).run()
                }}
              >
                Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuLabel>Insert Block</DropdownMenuLabel>
          <DropdownMenuItem 
            icon={<Heading1 className="h-3.5 w-3.5" />}
            onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem 
            icon={<Heading2 className="h-3.5 w-3.5" />}
            onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem 
            icon={<List className="h-3.5 w-3.5" />}
            onSelect={() => editor.chain().focus().toggleBulletList().run()}
          >
            Bullet List
          </DropdownMenuItem>
          <DropdownMenuItem 
            icon={<CheckSquare className="h-3.5 w-3.5" />}
            onSelect={() => editor.chain().focus().toggleTaskList().run()}
          >
            Task List
          </DropdownMenuItem>
          <DropdownMenuItem 
            icon={<Code className="h-3.5 w-3.5" />}
            onSelect={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            Code Block
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>Video Controls</DropdownMenuLabel>
          <DropdownMenuItem 
            icon={<Clock className="h-3.5 w-3.5" />}
            onSelect={() => {
              const seconds = videoPlayerRef?.current?.getCurrentTime() ?? 0
              editor.chain().focus().insertContent({ 
                type: 'timestamp', 
                attrs: { timeSeconds: Math.floor(seconds), label: '' } 
              }).run()
            }}
          >
            Insert Timestamp
          </DropdownMenuItem>
          <DropdownMenuItem 
            icon={<Play className="h-3.5 w-3.5" />}
            onSelect={() => videoPlayerRef?.current?.play()}
          >
            Play Video
          </DropdownMenuItem>
          <DropdownMenuItem 
            icon={<Pause className="h-3.5 w-3.5" />}
            onSelect={() => videoPlayerRef?.current?.pause()}
          >
            Pause Video
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>AI Actions</DropdownMenuLabel>
          <DropdownMenuItem 
            icon={<Sparkles className="h-3.5 w-3.5" />}
            onSelect={() => {
              const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
              const query = window.prompt('Ask AI about this selection:', text)
              if (query) {
                editor.chain().focus().insertContent(`<blockquote><strong>AI Query:</strong> ${query}</blockquote>`).run()
              }
            }}
          >
            Ask AI about selection
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem 
            icon={<Copy className="h-3.5 w-3.5" />}
            onSelect={() => {
              const text = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)
              navigator.clipboard.writeText(text)
            }}
            shortcut="⌘C"
          >
            Copy
          </DropdownMenuItem>
          <DropdownMenuItem 
            icon={<Copy className="h-3.5 w-3.5" />}
            onSelect={async () => {
              const text = await navigator.clipboard.readText()
              editor.chain().focus().insertContent(text).run()
            }}
            shortcut="⌘V"
          >
            Paste
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={() => editor.chain().focus().selectAll().run()}
            shortcut="⌘A"
          >
            Select All
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />

          <DropdownMenuItem 
            icon={<Trash2 className="h-3.5 w-3.5" />}
            destructive
            onSelect={() => editor.chain().focus().deleteSelection().run()}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
