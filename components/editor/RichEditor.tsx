'use client'

import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import { TimestampExtension } from './extensions/TimestampExtension'
import { CalloutExtension } from './extensions/CalloutExtension'
import { DoubtExtension } from './extensions/DoubtExtension'
import { CommandBlockExtension } from './extensions/CommandBlockExtension'
import { BubbleToolbar } from './BubbleToolbar'
import { createSlashMenuExtension } from './SlashMenu'
import { EditorContextMenu } from './EditorContextMenu'
import { tipTapContentToMarkdown } from '@/lib/utils/editorConvert'
import { cn } from '@/lib/utils'
import type { JSONContent } from '@tiptap/core'
import type { VideoPanelRef } from '@/components/studio/VideoPanel'

const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('bash', bash)
lowlight.register('sql', sql)
lowlight.register('json', json)
lowlight.register('css', css)
lowlight.register('html', xml)

interface RichEditorProps {
  content: string
  richJson: Record<string, unknown> | null
  onChange: (markdown: string, json: Record<string, unknown>) => void
  readOnly?: boolean
  videoPlayerRef?: React.RefObject<VideoPanelRef | null>
}

export function RichEditor({
  content,
  richJson,
  onChange,
  readOnly = false,
  videoPlayerRef,
}: RichEditorProps) {
  const lastJson = useRef<Record<string, unknown> | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Start writing… type / for commands' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      TimestampExtension.configure({
        onSeek: (seconds: number) => videoPlayerRef?.current?.seekTo(seconds),
      }),
      CalloutExtension,
      DoubtExtension,
      CommandBlockExtension,
      createSlashMenuExtension(videoPlayerRef),
    ],
    content: richJson ?? content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as JSONContent
      lastJson.current = json as Record<string, unknown>
      const markdown = tipTapContentToMarkdown(json)
      onChange(markdown, json as Record<string, unknown>)
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose-editor focus:outline-none h-full min-h-full',
          'text-[var(--color-text)] leading-relaxed'
        ),
      },
    },
  })

  return (
    <div className="relative flex flex-col h-full">
      {editor && <BubbleToolbar editor={editor} />}
      {editor && <EditorContextMenu editor={editor} videoPlayerRef={videoPlayerRef} />}
      
      <EditorContent
        editor={editor}
        className={cn(
          'flex-1 overflow-auto px-8 py-6',
          'rich-editor-content'
        )}
      />
    </div>
  )
}
