// All TypeScript interfaces for TutorialOS
// Zero `any` types. All fields fully typed.

export type SourceType = 'youtube' | 'stream' | 'iframe' | 'unknown'
export type EditorMode = 'write' | 'preview' | 'split' | 'rich'
export type StudioLayout =
  | 'balanced'
  | 'notes-wide'
  | 'video-wide'
  | 'notes-only'
  | 'video-focus'
export type FocusMode =
  | 'normal'
  | 'watch-write'
  | 'zen'
  | 'notes-only'
  | 'video-focus'
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
export type AIProvider = 'openai' | 'gemini' | 'groq' | 'claude' | 'mistral'
export type ThemeMode = 'dark' | 'light' | 'system'
export type AccentColor = 'violet' | 'cyan' | 'emerald' | 'rose' | 'amber'

export interface Session {
  id: string
  userId: string
  title: string
  source: string
  sourceType: SourceType
  notesMarkdown: string
  notesRichJson: Record<string, unknown> | null
  tags: string[]
  createdAt: string
  updatedAt: string
  syncedAt: string | null
  isDeleted: boolean
}

export interface Timestamp {
  id: string
  sessionId: string
  userId: string
  timeSeconds: number
  label: string
  createdAt: string
}

export interface Doubt {
  id: string
  userId: string
  sessionId: string | null
  text: string
  timestampSeconds: number | null
  status: 'open' | 'resolved'
  createdAt: string
  resolvedAt: string | null
}

export interface CommandSnippet {
  id: string
  userId: string
  sessionId: string | null
  command: string
  language: string
  topic: string
  createdAt: string
}

export interface ReviewItem {
  id: string
  userId: string
  sessionId: string
  title: string
  status: 'due' | 'done'
  dueDate: string
  easeFactor: number
  intervalDays: number
  repetitions: number
  createdAt: string
  completedAt: string | null
}

export interface UserSettings {
  userId: string
  theme: ThemeMode
  accent: AccentColor
  fontSize: 'sm' | 'md' | 'lg'
  autoSave: boolean
  cloudSyncEnabled: boolean
  editorMode: EditorMode
  updatedAt: string
}

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model: string
  enabled: boolean
}

export interface SyncQueueItem {
  localId?: number
  entityType: string
  entityId: string
  operation: 'upsert' | 'delete'
  payload: Record<string, unknown>
  createdAt: string
  retryCount: number
}

export interface PanelState {
  visible: boolean
  collapsed: boolean
  pinned: boolean
}

export type PanelName =
  | 'timestamps'
  | 'quickCapture'
  | 'studyCoach'
  | 'templates'
  | 'doubts'
  | 'commands'
