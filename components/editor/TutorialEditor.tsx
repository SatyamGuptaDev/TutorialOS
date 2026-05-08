'use client'

import { type RefObject, useRef } from 'react'
import { RichEditor } from './RichEditor'
import { MarkdownEditor } from './MarkdownEditor'
import { MarkdownPreview } from './MarkdownPreview'
import { cn } from '@/lib/utils'
import type { EditorMode } from '@/types'
import type { VideoPanelRef } from '@/components/studio/VideoPanel'
import { EditorContextMenu } from './EditorContextMenu'

interface TutorialEditorProps {
  mode: EditorMode
  content: string
  richJson: Record<string, unknown> | null
  onChange: (markdown: string, json: Record<string, unknown>) => void
  readOnly?: boolean
  videoPlayerRef?: RefObject<VideoPanelRef | null>
}

import { markdownToTipTapContent } from '@/lib/utils/editorConvert'

export function TutorialEditor({
  mode,
  content,
  richJson,
  onChange,
  readOnly = false,
  videoPlayerRef,
}: TutorialEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleMarkdownChange = (md: string) => {
    const json = markdownToTipTapContent(md) as Record<string, unknown>
    onChange(md, json)
  }

  if (mode === 'write') {
    return (
      <div className="flex flex-col h-full overflow-auto relative">
        <MarkdownEditor
          ref={textareaRef}
          value={content}
          onChange={handleMarkdownChange}
          readOnly={readOnly}
          className="h-full"
        />
        <EditorContextMenu textareaRef={textareaRef} videoPlayerRef={videoPlayerRef} />
      </div>
    )
  }

  if (mode === 'preview') {
    return (
      <div className="flex flex-col h-full overflow-auto">
        <MarkdownPreview content={content} className="h-full" />
      </div>
    )
  }

  if (mode === 'split') {
    return (
      <div className="flex h-full overflow-hidden relative">
        <div className="flex-1 border-r border-[var(--color-border-subtle)] overflow-auto">
          <MarkdownEditor
            ref={textareaRef}
            value={content}
            onChange={handleMarkdownChange}
            readOnly={readOnly}
          />
        </div>
        <div className="flex-1 overflow-auto">
          <MarkdownPreview content={content} />
        </div>
        <EditorContextMenu textareaRef={textareaRef} videoPlayerRef={videoPlayerRef} />
      </div>
    )
  }

  // mode === 'rich' (default)
  return (
    <div className="flex flex-col h-full overflow-auto">
      <RichEditor
        content={content}
        richJson={richJson}
        onChange={onChange}
        readOnly={readOnly}
        videoPlayerRef={videoPlayerRef}
      />
    </div>
  )
}
