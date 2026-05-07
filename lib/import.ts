import { z } from 'zod'
import { db } from './db/schema'
import type { Session, Timestamp, Doubt, CommandSnippet, ReviewItem, UserSettings } from '@/types'

const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  source: z.string(),
  sourceType: z.enum(['youtube', 'stream', 'iframe', 'unknown']),
  notesMarkdown: z.string(),
  notesRichJson: z.record(z.unknown()).nullable(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  syncedAt: z.string().nullable(),
  isDeleted: z.boolean()
})

const TimestampSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  userId: z.string(),
  timeSeconds: z.number(),
  label: z.string(),
  createdAt: z.string()
})

const DoubtSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string().nullable(),
  text: z.string(),
  timestampSeconds: z.number().nullable(),
  status: z.enum(['open', 'resolved']),
  createdAt: z.string(),
  resolvedAt: z.string().nullable()
})

const CommandSnippetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string().nullable(),
  command: z.string(),
  language: z.string(),
  topic: z.string(),
  createdAt: z.string()
})

const ReviewItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  title: z.string(),
  status: z.enum(['due', 'done']),
  dueDate: z.string(),
  easeFactor: z.number(),
  intervalDays: z.number(),
  repetitions: z.number(),
  createdAt: z.string(),
  completedAt: z.string().nullable()
})

const UserSettingsSchema = z.object({
  userId: z.string(),
  theme: z.enum(['dark', 'light', 'system']),
  accent: z.enum(['violet', 'cyan', 'emerald', 'rose', 'amber']),
  fontSize: z.enum(['sm', 'md', 'lg']),
  autoSave: z.boolean(),
  cloudSyncEnabled: z.boolean(),
  editorMode: z.enum(['write', 'preview', 'split', 'rich']),
  updatedAt: z.string()
})

const BackupSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  sessions: z.array(SessionSchema),
  timestamps: z.array(TimestampSchema),
  doubts: z.array(DoubtSchema),
  commands: z.array(CommandSnippetSchema),
  reviewItems: z.array(ReviewItemSchema),
  settings: UserSettingsSchema.optional()
})

export type ImportResult = 
  | { success: true; imported: Record<string, number> }
  | { success: false; errors: z.ZodIssue[] }

export async function importFullBackup(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    const json = JSON.parse(text)
    
    // Parse and validate with Zod
    const parsed = BackupSchema.safeParse(json)
    
    if (!parsed.success) {
      return { success: false, errors: parsed.error.issues }
    }

    const data = parsed.data

    // Bulk upsert to Dexie (put handles both insert and update)
    await db.transaction('rw', 
      [db.sessions, db.timestamps, db.doubts, db.commandSnippets, db.reviewItems, db.userSettings], 
      async () => {
        if (data.sessions.length) await db.sessions.bulkPut(data.sessions as Session[])
        if (data.timestamps.length) await db.timestamps.bulkPut(data.timestamps as Timestamp[])
        if (data.doubts.length) await db.doubts.bulkPut(data.doubts as Doubt[])
        if (data.commands.length) await db.commandSnippets.bulkPut(data.commands as CommandSnippet[])
        if (data.reviewItems.length) await db.reviewItems.bulkPut(data.reviewItems as ReviewItem[])
        if (data.settings) await db.userSettings.put(data.settings as UserSettings)
    })

    return {
      success: true,
      imported: {
        sessions: data.sessions.length,
        timestamps: data.timestamps.length,
        doubts: data.doubts.length,
        commands: data.commands.length,
        reviewItems: data.reviewItems.length,
        settings: data.settings ? 1 : 0
      }
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      return { success: false, errors: [{ code: 'custom', path: [], message: 'Invalid JSON file format' }] as z.ZodIssue[] }
    }
    return { success: false, errors: [{ code: 'custom', path: [], message: (err as Error).message }] as z.ZodIssue[] }
  }
}
