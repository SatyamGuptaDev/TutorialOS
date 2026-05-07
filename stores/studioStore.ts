'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/lib/db/schema'
import { saveSession as saveSessionMutation } from '@/lib/db/mutations'
import { generateId } from '@/lib/utils'
import type {
  Session,
  SourceType,
  EditorMode,
  StudioLayout,
  FocusMode,
  PanelState,
  PanelName,
} from '@/types'

// ── Helpers ──────────────────────────────────────────────────

function detectSourceType(url: string): SourceType {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/twitch\.tv|livestorm|vimeo\.com|loom\.com/.test(url)) return 'stream'
  if (url.startsWith('http')) return 'iframe'
  return 'unknown'
}

function toEmbedUrl(url: string): string {
  // youtube.com/watch?v=ID → embed
  const watchMatch = url.match(/youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]+)/)
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?enablejsapi=1`
  }
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?enablejsapi=1`
  }
  // already an embed URL — ensure enablejsapi
  if (url.includes('youtube.com/embed/')) {
    return url.includes('enablejsapi') ? url : `${url}${url.includes('?') ? '&' : '?'}enablejsapi=1`
  }
  return url
}

function parseVideoInput(raw: string): { url: string; sourceType: SourceType } {
  const trimmed = raw.trim()
  // Extract src from <iframe ... src="..."> paste
  const iframeSrc = trimmed.match(/src=["']([^"']+)["']/i)
  if (iframeSrc) {
    const src = iframeSrc[1]!
    return { url: toEmbedUrl(src), sourceType: detectSourceType(src) }
  }
  return { url: toEmbedUrl(trimmed), sourceType: detectSourceType(trimmed) }
}

function makeDateTitle(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function makeSkeletonMarkdown(title: string): string {
  return `# ${title}\n\n📅 ${makeDateTitle()}`
}

const DEFAULT_PANEL: PanelState = { visible: true, collapsed: false, pinned: false }
const HIDDEN_PANEL: PanelState = { visible: false, collapsed: false, pinned: false }

// ── State & Actions ──────────────────────────────────────────

interface StudioState {
  // Session
  currentSession: Session | null
  isDirty: boolean
  isSaving: boolean
  lastSavedAt: Date | null

  // Video
  videoUrl: string
  videoTitle: string
  sourceType: SourceType
  videoInputValue: string
  isVideoLoading: boolean
  videoLoadError: string | null

  // Editor
  editorMode: EditorMode
  markdownContent: string
  richContent: Record<string, unknown> | null

  // Layout
  layout: StudioLayout
  focusMode: FocusMode

  // Panels
  panels: Record<PanelName, PanelState>

  // Resize
  splitRatio: number

  // Actions — Video
  loadVideo: (input: string, userId: string) => Promise<void>
  setVideoInputValue: (val: string) => void
  setVideoTitle: (title: string) => void

  // Actions — Editor
  setEditorMode: (mode: EditorMode) => void
  updateMarkdown: (content: string) => void
  updateRichContent: (json: Record<string, unknown>) => void

  // Actions — Session
  saveSession: (userId: string) => Promise<void>
  loadSession: (session: Session) => void
  clearSession: () => void
  clearAutosave: () => void

  // Actions — Layout
  setFocusMode: (mode: FocusMode) => void
  setLayout: (layout: StudioLayout) => void
  setSplitRatio: (ratio: number) => void

  // Actions — Panels
  togglePanel: (name: PanelName) => void
  collapsePanel: (name: PanelName) => void
  expandPanel: (name: PanelName) => void
  hidePanel: (name: PanelName) => void
  pinPanel: (name: PanelName) => void
  collapseAllPanels: () => void
  expandAllPanels: () => void

  // Helpers
  isNoteSkeletonOnly: () => boolean
}

// Autosave timer — module-level so it survives store updates
let autosaveTimer: ReturnType<typeof setTimeout> | null = null

// ── Store ────────────────────────────────────────────────────

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      // Session
      currentSession: null,
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,

      // Video
      videoUrl: '',
      videoTitle: '',
      sourceType: 'unknown',
      videoInputValue: '',
      isVideoLoading: false,
      videoLoadError: null,

      // Editor
      editorMode: 'rich',
      markdownContent: '',
      richContent: null,

      // Layout
      layout: 'balanced',
      focusMode: 'normal',

      // Panels — timestamps + quickCapture visible by default
      panels: {
        timestamps: DEFAULT_PANEL,
        quickCapture: DEFAULT_PANEL,
        studyCoach: HIDDEN_PANEL,
        templates: HIDDEN_PANEL,
        doubts: DEFAULT_PANEL,
        commands: DEFAULT_PANEL,
      },

      // Resize — 45% video by default
      splitRatio: 0.45,

      // ── Video ─────────────────────────────────────────────
      setVideoInputValue: (val) => set({ videoInputValue: val }),

      setVideoTitle: (title) => {
        set((s) => ({
          videoTitle: title,
          currentSession: s.currentSession
            ? { ...s.currentSession, title: title || s.currentSession.title }
            : null,
        }))
      },

      loadVideo: async (input, userId) => {
        if (!input.trim()) return
        set({ isVideoLoading: true, videoLoadError: null })

        try {
          const { url, sourceType } = parseVideoInput(input)
          const title = sourceType === 'youtube' ? 'YouTube Video' : 'Learning Session'
          const now = new Date().toISOString()

          const state = get()
          const isSkeletonOrEmpty =
            !state.markdownContent || state.isNoteSkeletonOnly()

          if (!isSkeletonOrEmpty && state.currentSession) {
            // Save existing session before loading new video
            await get().saveSession(userId)
          }

          // Create a new session
          const newSession: Session = {
            id: generateId(),
            userId,
            title,
            source: url,
            sourceType,
            notesMarkdown: makeSkeletonMarkdown(title),
            notesRichJson: null,
            tags: [],
            createdAt: now,
            updatedAt: now,
            syncedAt: null,
            isDeleted: false,
          }

          await db.sessions.add(newSession)

          set({
            videoUrl: url,
            videoTitle: title,
            sourceType,
            videoInputValue: input,
            isVideoLoading: false,
            currentSession: newSession,
            markdownContent: newSession.notesMarkdown,
            richContent: null,
            isDirty: false,
            lastSavedAt: null,
          })
        } catch (err) {
          set({
            isVideoLoading: false,
            videoLoadError: err instanceof Error ? err.message : 'Failed to load video',
          })
        }
      },

      // ── Editor ────────────────────────────────────────────
      setEditorMode: (mode) => set({ editorMode: mode }),

      updateMarkdown: (content) => {
        set({ markdownContent: content, isDirty: true })
        if (autosaveTimer) clearTimeout(autosaveTimer)
        const userId = get().currentSession?.userId ?? ''
        if (userId) {
          autosaveTimer = setTimeout(() => {
            get().saveSession(userId)
          }, 1800)
        }
      },

      updateRichContent: (json) => {
        set({ richContent: json, isDirty: true })
        if (autosaveTimer) clearTimeout(autosaveTimer)
        const userId = get().currentSession?.userId ?? ''
        if (userId) {
          autosaveTimer = setTimeout(() => {
            get().saveSession(userId)
          }, 1800)
        }
      },

      clearAutosave: () => {
        if (autosaveTimer) {
          clearTimeout(autosaveTimer)
          autosaveTimer = null
        }
      },

      // ── Session ───────────────────────────────────────────
      saveSession: async (userId) => {
        const state = get()
        if (!state.currentSession) return

        set({ isSaving: true })
        const now = new Date().toISOString()
        const updated: Session = {
          ...state.currentSession,
          notesMarkdown: state.markdownContent,
          notesRichJson: state.richContent,
          updatedAt: now,
        }

        await saveSessionMutation(updated)

        set({
          currentSession: updated,
          isDirty: false,
          isSaving: false,
          lastSavedAt: new Date(),
        })
      },

      loadSession: (session) => {
        set({
          currentSession: session,
          videoUrl: session.source,
          videoTitle: session.title,
          sourceType: session.sourceType,
          videoInputValue: session.source,
          markdownContent: session.notesMarkdown,
          richContent: session.notesRichJson as Record<string, unknown> | null,
          isDirty: false,
          isSaving: false,
          lastSavedAt: null,
        })
      },

      clearSession: () => {
        set({
          currentSession: null,
          videoUrl: '',
          videoTitle: '',
          sourceType: 'unknown',
          videoInputValue: '',
          markdownContent: '',
          richContent: null,
          isDirty: false,
          isSaving: false,
          lastSavedAt: null,
        })
      },

      // ── Layout ────────────────────────────────────────────
      setFocusMode: (mode) => set({ focusMode: mode }),
      setLayout: (layout) => set({ layout }),
      setSplitRatio: (ratio) =>
        set({ splitRatio: Math.min(0.85, Math.max(0.15, ratio)) }),

      // ── Panels ────────────────────────────────────────────
      togglePanel: (name) =>
        set((s) => ({
          panels: {
            ...s.panels,
            [name]: {
              ...s.panels[name],
              collapsed: !s.panels[name]!.collapsed,
            },
          },
        })),

      collapsePanel: (name) =>
        set((s) => ({
          panels: { ...s.panels, [name]: { ...s.panels[name], collapsed: true } },
        })),

      expandPanel: (name) =>
        set((s) => ({
          panels: { ...s.panels, [name]: { ...s.panels[name], collapsed: false, visible: true } },
        })),

      hidePanel: (name) =>
        set((s) => ({
          panels: { ...s.panels, [name]: { ...s.panels[name], visible: false } },
        })),

      pinPanel: (name) =>
        set((s) => ({
          panels: {
            ...s.panels,
            [name]: { ...s.panels[name], pinned: !s.panels[name]!.pinned },
          },
        })),

      collapseAllPanels: () =>
        set((s) => ({
          panels: Object.fromEntries(
            Object.entries(s.panels).map(([k, v]) => [k, { ...v, collapsed: true }])
          ) as Record<PanelName, PanelState>,
        })),

      expandAllPanels: () =>
        set((s) => ({
          panels: Object.fromEntries(
            Object.entries(s.panels).map(([k, v]) => [
              k,
              { ...v, collapsed: false, visible: true },
            ])
          ) as Record<PanelName, PanelState>,
        })),

      // ── Helpers ───────────────────────────────────────────
      isNoteSkeletonOnly: () => {
        const { markdownContent } = get()
        return /^# .+\n\n📅 .+$/.test(markdownContent.trim())
      },
    }),
    {
      name: 'tutorialos-studio-state',
      // Only persist UI preferences, not session content
      partialize: (s) => ({
        panels: s.panels,
        layout: s.layout,
        focusMode: s.focusMode === 'normal' ? 'normal' : 'normal', // always reset focus mode on reload
        splitRatio: s.splitRatio,
        editorMode: s.editorMode,
      }),
    }
  )
)
