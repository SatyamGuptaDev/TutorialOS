'use client'

import { useRef } from 'react'
import { useStudioStore } from '@/stores/studioStore'
import { VideoPanel, type VideoPanelRef } from './VideoPanel'
import { ResizeDivider } from './ResizeDivider'
import { TutorialEditor } from '@/components/editor/TutorialEditor'

export function EditorBody() {
  const layout = useStudioStore((s) => s.layout)
  const splitRatio = useStudioStore((s) => s.splitRatio)
  const focusMode = useStudioStore((s) => s.focusMode)
  const videoUrl = useStudioStore((s) => s.videoUrl)
  const sourceType = useStudioStore((s) => s.sourceType)
  const setVideoTitle = useStudioStore((s) => s.setVideoTitle)
  const editorMode = useStudioStore((s) => s.editorMode)
  const markdownContent = useStudioStore((s) => s.markdownContent)
  const richContent = useStudioStore((s) => s.richContent)
  const updateMarkdown = useStudioStore((s) => s.updateMarkdown)
  const updateRichContent = useStudioStore((s) => s.updateRichContent)
  const videoRef = useRef<VideoPanelRef>(null)

  const showVideo = layout !== 'notes-only' && focusMode !== 'zen' && focusMode !== 'notes-only'
  const showDivider = showVideo && layout === 'balanced'

  const videoPercent = !showVideo ? 0
    : layout === 'video-wide' ? 60
    : layout === 'notes-wide' ? 35
    : layout === 'video-focus' ? 65
    : Math.round(splitRatio * 100)

  const notesPercent = showVideo ? 100 - videoPercent : 100

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {showVideo && (
        <div className="flex flex-col min-w-0 p-3 overflow-auto" style={{ width: `${videoPercent}%` }}>
          <VideoPanel ref={videoRef} url={videoUrl} sourceType={sourceType} onTitleReady={setVideoTitle} />
        </div>
      )}
      {showDivider && <ResizeDivider />}
      <div className="flex flex-col min-w-0 overflow-hidden" style={{ width: `${notesPercent}%` }}>
        <TutorialEditor
          mode={editorMode}
          content={markdownContent}
          richJson={richContent}
          onChange={(md, json) => { updateMarkdown(md); updateRichContent(json) }}
          videoPlayerRef={videoRef}
        />
      </div>
    </div>
  )
}
