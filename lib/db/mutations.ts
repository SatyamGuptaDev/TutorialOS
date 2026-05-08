import { db } from './schema'
import type { Session, Timestamp, Doubt, CommandSnippet, ReviewItem, UserSettings } from '@/types'

// Helper to push to sync queue — only when cloud sync is enabled
async function pushToSyncQueue(
  userId: string,
  entityType: string,
  entityId: string,
  operation: 'upsert' | 'delete',
  payload: Record<string, unknown> = {}
) {
  if (!userId) return

  // Check user setting first — skip if cloud sync is disabled
  const settings = await db.userSettings.get(userId).catch(() => null)
  if (!settings?.cloudSyncEnabled) return

  await db.syncQueue
    .put({
      entityType,
      entityId,
      operation,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    })
    .catch((e) => console.error('Failed to push to sync queue', e))
}

// ── Sessions ─────────────────────────────────────────────────

export async function saveSession(session: Partial<Session> & { id: string }): Promise<void> {
  const existing = await db.sessions.get(session.id)
  const now = new Date().toISOString()
  
  let fullSession: Session
  
  if (existing) {
    fullSession = {
      ...existing,
      ...session,
      updatedAt: now,
    }
    await db.sessions.put(fullSession)
  } else {
    fullSession = {
      ...(session as Session),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    }
    await db.sessions.add(fullSession)
  }
  
  const userId = fullSession.userId || ''
  await pushToSyncQueue(userId, 'sessions', session.id, 'upsert', fullSession as unknown as Record<string, unknown>)
}

export async function deleteSession(id: string): Promise<void> {
  const session = await db.sessions.get(id)
  if (!session) return
  
  const now = new Date().toISOString()
  const updated: Session = { ...session, isDeleted: true, updatedAt: now }
  
  await db.sessions.put(updated)
  await pushToSyncQueue(session.userId, 'sessions', id, 'upsert', updated as unknown as Record<string, unknown>)
}

export async function purgeSession(id: string): Promise<void> {
  const session = await db.sessions.get(id)
  if (!session) return
  
  const userId = session.userId
  await db.sessions.delete(id)
  await db.timestamps.where('sessionId').equals(id).delete()
  await db.doubts.where('sessionId').equals(id).delete()
  await db.commandSnippets.where('sessionId').equals(id).delete()
  await db.reviewItems.where('sessionId').equals(id).delete()
  await pushToSyncQueue(userId, 'sessions', id, 'delete')
}

// ── Timestamps ───────────────────────────────────────────────

export async function addTimestamp(ts: Omit<Timestamp, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const fullTs: Timestamp = { ...ts, id, createdAt: now, updatedAt: now } as Timestamp
  await db.timestamps.add(fullTs)
  await pushToSyncQueue(ts.userId, 'timestamps', id, 'upsert', fullTs as unknown as Record<string, unknown>)
  return id
}

export async function deleteTimestamp(id: string): Promise<void> {
  const ts = await db.timestamps.get(id)
  if (!ts) return
  const userId = ts.userId
  await db.timestamps.delete(id)
  await pushToSyncQueue(userId, 'timestamps', id, 'delete')
}

// ── Doubts ───────────────────────────────────────────────────

export async function addDoubt(d: Omit<Doubt, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const fullDoubt: Doubt = { ...d, id, createdAt: now, updatedAt: now } as Doubt
  await db.doubts.add(fullDoubt)
  await pushToSyncQueue(d.userId, 'doubts', id, 'upsert', fullDoubt as unknown as Record<string, unknown>)
  return id
}

export async function resolveDoubt(id: string): Promise<void> {
  const existing = await db.doubts.get(id)
  if (!existing) return
  
  const now = new Date().toISOString()
  const updated: Doubt = { ...existing, status: 'resolved', resolvedAt: now, updatedAt: now }
  
  await db.doubts.update(id, updated)
  await pushToSyncQueue(existing.userId, 'doubts', id, 'upsert', updated as unknown as Record<string, unknown>)
}

export async function deleteDoubt(id: string): Promise<void> {
  const doubt = await db.doubts.get(id)
  if (!doubt) return
  const userId = doubt.userId
  await db.doubts.delete(id)
  await pushToSyncQueue(userId, 'doubts', id, 'delete')
}

// ── Commands ─────────────────────────────────────────────────

export async function addCommand(c: Omit<CommandSnippet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const fullCommand: CommandSnippet = { ...c, id, createdAt: now, updatedAt: now } as CommandSnippet
  await db.commandSnippets.add(fullCommand)
  await pushToSyncQueue(c.userId, 'commandSnippets', id, 'upsert', fullCommand as unknown as Record<string, unknown>)
  return id
}

export async function deleteCommand(id: string): Promise<void> {
  const cmd = await db.commandSnippets.get(id)
  if (!cmd) return
  const userId = cmd.userId
  await db.commandSnippets.delete(id)
  await pushToSyncQueue(userId, 'commandSnippets', id, 'delete')
}

// ── Review Items ─────────────────────────────────────────────

export async function addReviewItem(r: Omit<ReviewItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const fullReview: ReviewItem = { ...r, id, createdAt: now, updatedAt: now } as ReviewItem
  await db.reviewItems.add(fullReview)
  await pushToSyncQueue(r.userId, 'reviewItems', id, 'upsert', fullReview as unknown as Record<string, unknown>)
  return id
}

export async function updateReviewSM2(id: string, quality: number): Promise<void> {
  const existing = await db.reviewItems.get(id)
  if (!existing) return

  let { easeFactor = 2.5, intervalDays = 0, repetitions = 0 } = existing

  if (quality >= 3) {
    if (repetitions === 0) {
      intervalDays = 1
    } else if (repetitions === 1) {
      intervalDays = 6
    } else {
      intervalDays = Math.round(intervalDays * easeFactor)
    }
    repetitions += 1
  } else {
    repetitions = 0
    intervalDays = 1
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  const due = new Date()
  due.setDate(due.getDate() + intervalDays)
  const now = new Date().toISOString()

  const updated: ReviewItem = {
    ...existing,
    easeFactor,
    intervalDays,
    repetitions,
    dueDate: due.toISOString().split('T')[0],
    completedAt: now,
    updatedAt: now,
    status: 'due' as const,
  }

  await db.reviewItems.update(id, updated)
  await pushToSyncQueue(existing.userId, 'reviewItems', id, 'upsert', updated as unknown as Record<string, unknown>)
}

// ── Settings ─────────────────────────────────────────────────

export async function saveSettings(s: UserSettings): Promise<void> {
  await db.userSettings.put(s)
  await pushToSyncQueue(s.userId, 'userSettings', s.userId, 'upsert', s as unknown as Record<string, unknown>)
}
