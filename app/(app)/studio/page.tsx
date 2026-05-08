'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStudioStore } from '@/stores/studioStore'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/lib/db/schema'
import { StudioShell } from '@/components/studio/StudioShell'
import { StudioTopbar } from '@/components/studio/StudioTopbar'
import { EditorBody } from '@/components/studio/EditorBody'
import { TimestampsPanel } from '@/components/panels/TimestampsPanel'
import { QuickCapturePanel } from '@/components/panels/QuickCapturePanel'
import { DoubtsPanel } from '@/components/panels/DoubtsPanel'
import { CommandsPanel } from '@/components/panels/CommandsPanel'
import { cn } from '@/lib/utils'

import { AIPanel } from '@/components/ai/AIPanel'

export default function StudioPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const user = useAuthStore((s) => s.user)
  const loadSession = useStudioStore((s) => s.loadSession)
  const focusMode = useStudioStore((s) => s.focusMode)
  const panels = useStudioStore((s) => s.panels)

  const clearAutosave = useStudioStore((s) => s.clearAutosave)

  // Load session from URL param on mount
  useEffect(() => {
    if (sessionId && user) {
      db.sessions.get(sessionId).then((session) => {
        if (session) loadSession(session)
      })
    }
    return () => clearAutosave()
  }, [sessionId, user, loadSession, clearAutosave])

  const showPanelSidebar =
    focusMode === 'normal' &&
    (panels.timestamps.visible || panels.quickCapture.visible || panels.doubts.visible || panels.commands.visible)

  return (
    <StudioShell>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Studio-specific topbar */}
        {focusMode === 'normal' && <StudioTopbar />}

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left panels sidebar */}
          {showPanelSidebar && (
            <div className={cn(
              'w-64 shrink-0 flex flex-col gap-2 p-2 overflow-y-auto',
              'border-r border-[var(--color-border-subtle)]',
              'bg-[var(--color-surface)]'
            )}>
              {panels.timestamps.visible && <TimestampsPanel />}
              {panels.quickCapture.visible && <QuickCapturePanel />}
              {panels.doubts.visible && <DoubtsPanel />}
              {panels.commands.visible && <CommandsPanel />}
            </div>
          )}

          {/* Main content: video + editor */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <EditorBody />
          </div>

          {/* Right panels sidebar (AI) */}
          {focusMode === 'normal' && panels.studyCoach.visible && (
            <div className={cn(
              'w-80 shrink-0 flex flex-col overflow-hidden',
              'border-l border-[var(--color-border-subtle)]',
              'bg-[var(--color-surface)]'
            )}>
              <AIPanel />
            </div>
          )}
        </div>
      </div>
    </StudioShell>
  )
}
