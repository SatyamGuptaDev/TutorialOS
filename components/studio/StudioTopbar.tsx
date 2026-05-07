'use client'

import { useRef, useState, useEffect } from 'react'
import { useStudioStore } from '@/stores/studioStore'
import { useAuthStore } from '@/stores/authStore'
import {
  Columns2,
  AlignLeft,
  AlignRight,
  Minus,
  Monitor,
  Eye,
  Circle,
  FileText,
  SplitSquareHorizontal,
  Type,
  Save,
  Check,
  Layout,
  Clock,
  HelpCircle,
  Terminal,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown'
import { cn } from '@/lib/utils'
import type { StudioLayout, EditorMode, FocusMode } from '@/types'

const LAYOUTS: { id: StudioLayout; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: 'balanced', icon: Columns2, label: 'Balanced' },
  { id: 'video-wide', icon: Monitor, label: 'Video Wide' },
  { id: 'notes-wide', icon: AlignLeft, label: 'Notes Wide' },
  { id: 'notes-only', icon: FileText, label: 'Notes Only' },
  { id: 'video-focus', icon: Eye, label: 'Video Focus' },
]

const EDITOR_MODES: { id: EditorMode; label: string }[] = [
  { id: 'rich', label: 'Rich' },
  { id: 'write', label: 'Write' },
  { id: 'split', label: 'Split' },
  { id: 'preview', label: 'Preview' },
]

export function StudioTopbar() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''

  const videoInputValue = useStudioStore((s) => s.videoInputValue)
  const setVideoInputValue = useStudioStore((s) => s.setVideoInputValue)
  const loadVideo = useStudioStore((s) => s.loadVideo)
  const isVideoLoading = useStudioStore((s) => s.isVideoLoading)

  const layout = useStudioStore((s) => s.layout)
  const setLayout = useStudioStore((s) => s.setLayout)

  const focusMode = useStudioStore((s) => s.focusMode)
  const setFocusMode = useStudioStore((s) => s.setFocusMode)

  const editorMode = useStudioStore((s) => s.editorMode)
  const setEditorMode = useStudioStore((s) => s.setEditorMode)

  const isDirty = useStudioStore((s) => s.isDirty)
  const isSaving = useStudioStore((s) => s.isSaving)
  const lastSavedAt = useStudioStore((s) => s.lastSavedAt)
  const saveSession = useStudioStore((s) => s.saveSession)
  const panels = useStudioStore((s) => s.panels)
  const expandPanel = useStudioStore((s) => s.expandPanel)
  const hidePanel = useStudioStore((s) => s.hidePanel)

  const currentSession = useStudioStore((s) => s.currentSession)
  const setVideoTitle = useStudioStore((s) => s.setVideoTitle)
  const expandAllPanels = useStudioStore((s) => s.expandAllPanels)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleRestore = () => expandAllPanels()
    window.addEventListener('restore-all-panels', handleRestore)
    return () => window.removeEventListener('restore-all-panels', handleRestore)
  }, [expandAllPanels])

  const handleLoad = () => {
    if (videoInputValue.trim()) loadVideo(videoInputValue, userId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLoad()
  }

  return (
    <div className={cn(
      'flex flex-col gap-0 border-b border-[var(--color-border-subtle)]',
      'bg-[var(--color-surface)] shrink-0'
    )}>
      {/* Row 1: URL input + controls */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* URL input */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input
            value={videoInputValue}
            onChange={(e) => setVideoInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste YouTube URL, iframe code, or stream embed URL…"
            className={cn(
              'flex-1 h-8 px-3 text-sm rounded-[var(--radius-sm)]',
              'bg-[var(--color-surface-2)] border border-[var(--color-border)]',
              'text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]',
              'focus:outline-none focus:border-[var(--color-accent)]',
              'transition-colors duration-[var(--duration-fast)]'
            )}
          />
          <Button size="sm" onClick={handleLoad} loading={isVideoLoading}>
            Load
          </Button>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-[var(--color-border-subtle)]" />

        {/* Layout switcher */}
        <div className="flex items-center gap-0.5">
          {LAYOUTS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id} content={label}>
              <button
                onClick={() => setLayout(id)}
                className={cn(
                  'h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)]',
                  'transition-colors duration-[var(--duration-fast)]',
                  layout === id
                    ? 'bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-[var(--color-border-subtle)]" />

        {/* Focus mode */}
        <Tooltip content="Watch + Write mode">
          <button
            onClick={() => setFocusMode(focusMode === 'watch-write' ? 'normal' : 'watch-write')}
            className={cn(
              'h-7 px-2 flex items-center gap-1.5 rounded-[var(--radius-sm)] text-xs font-medium',
              'transition-colors duration-[var(--duration-fast)]',
              focusMode === 'watch-write'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Focus</span>
          </button>
        </Tooltip>

        <Tooltip content="Zen mode (Esc to exit)">
          <button
            onClick={() => setFocusMode(focusMode === 'zen' ? 'normal' : 'zen')}
            className={cn(
              'h-7 px-2 flex items-center gap-1.5 rounded-[var(--radius-sm)] text-xs font-medium',
              'transition-colors duration-[var(--duration-fast)]',
              focusMode === 'zen'
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
            )}
          >
            <Circle className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Zen</span>
          </button>
        </Tooltip>

        {/* Separator */}
        <div className="h-5 w-px bg-[var(--color-border-subtle)]" />

        {/* Editor mode tabs */}
        <div className="flex items-center bg-[var(--color-surface-2)] rounded-[var(--radius-sm)] p-0.5 gap-0.5">
          {EDITOR_MODES.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setEditorMode(id)}
              className={cn(
                'h-6 px-2 text-xs font-medium rounded-[3px]',
                'transition-colors duration-[var(--duration-fast)]',
                editorMode === id
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View Panels Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'h-7 px-2 flex items-center gap-1.5 rounded-[var(--radius-sm)] text-xs font-medium',
              'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors'
            )}>
              <Layout className="h-3.5 w-3.5" />
              <span className="hidden lg:block">Panels</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Show Panels</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={panels.timestamps.visible}
              onCheckedChange={(checked: boolean) => checked ? expandPanel('timestamps') : hidePanel('timestamps')}
            >
              <Clock className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" /> Timestamps
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={panels.doubts.visible}
              onCheckedChange={(checked: boolean) => checked ? expandPanel('doubts') : hidePanel('doubts')}
            >
              <HelpCircle className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" /> Doubts
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={panels.quickCapture.visible}
              onCheckedChange={(checked: boolean) => checked ? expandPanel('quickCapture') : hidePanel('quickCapture')}
            >
              <Zap className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" /> Quick Capture
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={panels.commands.visible}
              onCheckedChange={(checked: boolean) => checked ? expandPanel('commands') : hidePanel('commands')}
            >
              <Terminal className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" /> Commands
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={panels.studyCoach.visible}
              onCheckedChange={(checked: boolean) => checked ? expandPanel('studyCoach') : hidePanel('studyCoach')}
            >
              <Monitor className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" /> AI Study Coach
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => expandAllPanels()}
            >
              <Layout className="mr-2 h-4 w-4 text-[var(--color-text-muted)]" /> Restore all panels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separator */}
        <div className="h-5 w-px bg-[var(--color-border-subtle)]" />

        {/* Save button */}
        <SaveStatus
          isDirty={isDirty}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          onSave={() => saveSession(userId)}
          disabled={!isDirty || !currentSession}
        />
      </div>

      {/* Row 2: Session title (editable) */}
      {currentSession && (
        <div className="px-3 pb-2">
          <input
            ref={titleRef}
            value={currentSession.title}
            onChange={(e) => setVideoTitle(e.target.value)}
            className={cn(
              'w-full text-sm font-medium bg-transparent border-none outline-none',
              'text-[var(--color-text-muted)] placeholder:text-[var(--color-text-faint)]',
              'hover:text-[var(--color-text)] focus:text-[var(--color-text)]',
              'transition-colors duration-[var(--duration-fast)]'
            )}
            placeholder="Session title…"
          />
        </div>
      )}
    </div>
  )
}

function SaveStatus({
  isDirty,
  isSaving,
  lastSavedAt,
  onSave,
  disabled
}: {
  isDirty: boolean
  isSaving: boolean
  lastSavedAt: Date | null
  onSave: () => void
  disabled: boolean
}) {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (!lastSavedAt || isSaving) return
    
    const update = () => {
      const diff = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000)
      if (diff < 5) setTimeAgo('Saved')
      else if (diff < 60) setTimeAgo(`Saved ${diff}s ago`)
      else setTimeAgo(`Saved ${Math.floor(diff / 60)}m ago`)
    }
    
    update()
    const interval = setInterval(update, 5000) // update less frequently to reduce jitter
    return () => clearInterval(interval)
  }, [lastSavedAt, isSaving])

  const text = isSaving 
    ? 'Saving...' 
    : isDirty 
      ? 'Save' 
      : timeAgo || 'Saved'

  const icon = isSaving 
    ? undefined 
    : isDirty 
      ? <span className="text-[var(--color-warning)] mr-1">●</span>
      : <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />

  return (
    <Tooltip content={isDirty ? 'Save (⌘S)' : lastSavedAt ? timeAgo : 'No changes'}>
      <Button
        size="sm"
        variant={isDirty ? 'default' : 'ghost'}
        onClick={onSave}
        disabled={disabled || isSaving}
        leftIcon={isDirty || isSaving ? undefined : icon}
      >
        {isDirty && icon}
        {text}
      </Button>
    </Tooltip>
  )
}
