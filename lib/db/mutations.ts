import { db } from './schema'
import type { Session, Timestamp, Doubt, CommandSnippet, ReviewItem, UserSettings, SyncQueueItem } from '@/types'

// Helper to push to sync queue if needed
async function pushToSyncQueue(entityType: string, entityId: string, operation: 'upsert' | 'delete', payload: Record<string, unknown> = {}) {
  await db.syncQueue.put({
    entityType,
    entityId,
    operation,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0
  }).catch(() => {})
}

// ── Sessions ─────────────────────────────────────────────────

export async function saveSession(session: Partial<Session> & { id: string }): Promise<void> {
  const existing = await db.sessions.get(session.id)
  let payload = session
  if (existing) {
    await db.sessions.update(session.id, {
      ...session,
      updatedAt: new Date().toISOString()
    })
    payload = { ...existing, ...session, updatedAt: new Date().toISOString() }
  } else {
    // Requires full session if new, but let's cast
    payload = {
      ...session,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.sessions.add(payload as Session)
  }
  await pushToSyncQueue('sessions', session.id, 'upsert', payload)
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.update(id, { isDeleted: true, updatedAt: new Date().toISOString() })
  await pushToSyncQueue('sessions', id, 'upsert', { isDeleted: true })
}

export async function purgeSession(id: string): Promise<void> {
  await db.sessions.delete(id)
  await db.timestamps.where('sessionId').equals(id).delete()
  await db.doubts.where('sessionId').equals(id).delete()
  await db.commandSnippets.where('sessionId').equals(id).delete()
  await db.reviewItems.where('sessionId').equals(id).delete()
  await pushToSyncQueue('sessions', id, 'delete')
}

// ── Timestamps ───────────────────────────────────────────────

export async function addTimestamp(ts: Omit<Timestamp, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID()
  const fullTs = { ...ts, id, createdAt: new Date().toISOString() }
  await db.timestamps.add(fullTs)
  await pushToSyncQueue('timestamps', id, 'upsert', fullTs)
  return id
}

export async function deleteTimestamp(id: string): Promise<void> {
  await db.timestamps.delete(id)
  await pushToSyncQueue('timestamps', id, 'delete')
}

// ── Doubts ───────────────────────────────────────────────────

export async function addDoubt(d: Omit<Doubt, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID()
  const fullDoubt = { ...d, id, createdAt: new Date().toISOString() }
  await db.doubts.add(fullDoubt)
  await pushToSyncQueue('doubts', id, 'upsert', fullDoubt)
  return id
}

export async function resolveDoubt(id: string): Promise<void> {
  await db.doubts.update(id, { status: 'resolved', resolvedAt: new Date().toISOString() })
  await pushToSyncQueue('doubts', id, 'upsert', { status: 'resolved' })
}

export async function deleteDoubt(id: string): Promise<void> {
  await db.doubts.delete(id)
  await pushToSyncQueue('doubts', id, 'delete')
}

// ── Commands ─────────────────────────────────────────────────

export async function addCommand(c: Omit<CommandSnippet, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID()
  const fullCommand = { ...c, id, createdAt: new Date().toISOString() }
  await db.commandSnippets.add(fullCommand)
  await pushToSyncQueue('commandSnippets', id, 'upsert', fullCommand)
  return id
}

export async function deleteCommand(id: string): Promise<void> {
  await db.commandSnippets.delete(id)
  await pushToSyncQueue('commandSnippets', id, 'delete')
}

// ── Review Items ─────────────────────────────────────────────

export async function addReviewItem(r: Omit<ReviewItem, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID()
  const fullReview = { ...r, id, createdAt: new Date().toISOString() }
  await db.reviewItems.add(fullReview)
  await pushToSyncQueue('reviewItems', id, 'upsert', fullReview)
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

  const payload = {
    easeFactor,
    intervalDays,
    repetitions,
    dueDate: due.toISOString().split('T')[0],
    completedAt: new Date().toISOString(),
    status: 'due' as const
  }

  await db.reviewItems.update(id, payload)
  await pushToSyncQueue('reviewItems', id, 'upsert', payload)
}

// ── Settings ─────────────────────────────────────────────────

export async function saveSettings(s: UserSettings): Promise<void> {
  await db.userSettings.put(s)
  await pushToSyncQueue('userSettings', s.userId, 'upsert', s as unknown as Record<string, unknown>)
}
