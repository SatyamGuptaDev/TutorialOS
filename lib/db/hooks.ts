'use client'

import Dexie from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './schema'
import type { Session, Doubt, CommandSnippet, ReviewItem, UserSettings } from '@/types'

// Default settings factory — prevents infinite spinner when no row exists
function defaultSettings(userId: string): UserSettings {
  return {
    userId,
    theme: 'dark',
    accent: 'violet',
    fontSize: 'md',
    autoSave: true,
    cloudSyncEnabled: false,
    editorMode: 'rich',
    updatedAt: new Date().toISOString(),
  }
}

// ── Sessions ─────────────────────────────────────────────────

export function useSessions(userId: string): Session[] | undefined {
  return useLiveQuery(
    () =>
      db.sessions
        .where('[userId+isDeleted]')
        .equals([userId, 0])
        .reverse()
        .sortBy('updatedAt'),
    [userId]
  )
}

export function useRecentSessions(userId: string, limit = 5): Session[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.sessions
      .where('[userId+isDeleted]')
      .equals([userId, 0])
      .reverse()
      .sortBy('updatedAt')
    return all.slice(0, limit)
  }, [userId, limit])
}

export function useSession(id: string): Session | undefined {
  return useLiveQuery(() => db.sessions.get(id), [id])
}

export function useSessionCount(userId: string): number {
  return (
    useLiveQuery(
      () =>
        db.sessions.where('[userId+isDeleted]').equals([userId, 0]).count(),
      [userId]
    ) ?? 0
  )
}

// ── Doubts ───────────────────────────────────────────────────

export function useOpenDoubtCount(userId: string): number {
  return (
    useLiveQuery(
      () =>
        db.doubts.where('[userId+status]').equals([userId, 'open']).count(),
      [userId]
    ) ?? 0
  )
}

export function useDoubts(userId: string, filter?: 'open' | 'resolved'): Doubt[] | undefined {
  return useLiveQuery(
    () => {
      if (filter) {
        return db.doubts
          .where('[userId+status]')
          .equals([userId, filter])
          .reverse()
          .sortBy('createdAt')
      }
      return db.doubts
        .where('userId')
        .equals(userId)
        .reverse()
        .sortBy('createdAt')
    },
    [userId, filter]
  )
}

export function useTimestamps(sessionId: string): import('@/types').Timestamp[] | undefined {
  return useLiveQuery(
    () => db.timestamps.where('sessionId').equals(sessionId).sortBy('timeSeconds'),
    [sessionId]
  )
}

/**
 * Returns settings for a user. Returns `undefined` while loading, or the
 * UserSettings record once resolved (which may be null if no row exists yet).
 * Call `ensureDefaultSettings(userId)` once on mount to create defaults.
 */
export function useSettings(userId: string): UserSettings | undefined {
  return useLiveQuery(
    () => (userId ? db.userSettings.get(userId) : undefined),
    [userId]
  )
}

/**
 * One-time write: creates default settings if they don't exist.
 * Call this inside a useEffect in the component, NOT inside liveQuery.
 */
export async function ensureDefaultSettings(userId: string): Promise<void> {
  if (!userId) return
  const existing = await db.userSettings.get(userId)
  if (!existing) {
    await db.userSettings.put(defaultSettings(userId))
  }
}

// ── Commands ─────────────────────────────────────────────────

export function useCommandCount(userId: string): number {
  return (
    useLiveQuery(
      () => db.commandSnippets.where('userId').equals(userId).count(),
      [userId]
    ) ?? 0
  )
}

export function useCommands(userId: string): CommandSnippet[] | undefined {
  return useLiveQuery(
    () =>
      db.commandSnippets
        .where('userId')
        .equals(userId)
        .reverse()
        .sortBy('createdAt'),
    [userId]
  )
}

// ── Review Items ─────────────────────────────────────────────

export function useReviewDueTodayCount(userId: string): number {
  const today = new Date().toISOString().split('T')[0]!
  return (
    useLiveQuery(
      () =>
        db.reviewItems
          .where('[userId+status]')
          .equals([userId, 'due'])
          .and((item) => item.dueDate <= today)
          .count(),
      [userId, today]
    ) ?? 0
  )
}

export function useReviewItems(userId: string): ReviewItem[] | undefined {
  return useLiveQuery(
    () =>
      db.reviewItems
        .where('[userId+status+dueDate]')
        .between([userId, 'due', Dexie.minKey], [userId, 'due', Dexie.maxKey])
        .sortBy('dueDate'),
    [userId]
  )
}

// ── Dashboard aggregate stats ────────────────────────────────

export interface DashboardStats {
  sessionCount: number
  openDoubtCount: number
  commandCount: number
  reviewDueCount: number
}

export function useDashboardStats(userId: string): DashboardStats {
  const today = new Date().toISOString().split('T')[0]!

  const stats = useLiveQuery(async () => {
    const [sessionCount, openDoubtCount, commandCount, reviewDueCount] =
      await Promise.all([
        db.sessions.where('[userId+isDeleted]').equals([userId, 0]).count(),
        db.doubts.where('[userId+status]').equals([userId, 'open']).count(),
        db.commandSnippets.where('userId').equals(userId).count(),
        db.reviewItems
          .where('[userId+status]')
          .equals([userId, 'due'])
          .and((item) => item.dueDate <= today)
          .count(),
      ])
    return { sessionCount, openDoubtCount, commandCount, reviewDueCount }
  }, [userId, today])

  return stats ?? {
    sessionCount: 0,
    openDoubtCount: 0,
    commandCount: 0,
    reviewDueCount: 0,
  }
}
