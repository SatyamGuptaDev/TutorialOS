import Dexie, { type EntityTable } from 'dexie'
import type {
  Session,
  Timestamp,
  Doubt,
  CommandSnippet,
  ReviewItem,
  UserSettings,
  SyncQueueItem,
} from '@/types'

export interface AIKey {
  id?: number
  userId: string
  provider: string
  encryptedKey: string
  iv: string
}

class TutorialOSDB extends Dexie {
  sessions!: EntityTable<Session, 'id'>
  timestamps!: EntityTable<Timestamp, 'id'>
  doubts!: EntityTable<Doubt, 'id'>
  commandSnippets!: EntityTable<CommandSnippet, 'id'>
  reviewItems!: EntityTable<ReviewItem, 'id'>
  userSettings!: EntityTable<UserSettings, 'userId'>
  syncQueue!: EntityTable<SyncQueueItem, 'localId'>
  aiKeys!: EntityTable<AIKey, 'id'>

  constructor() {
    super('TutorialOSDB')

    this.version(3).stores({
      sessions: 'id, userId, updatedAt, isDeleted, [userId+isDeleted]',
      timestamps: 'id, sessionId, userId, timeSeconds',
      doubts: 'id, userId, sessionId, status, [userId+status]',
      commandSnippets: 'id, userId, sessionId, language, createdAt',
      reviewItems: 'id, userId, sessionId, status, dueDate, [userId+status], [userId+status+dueDate]',
      userSettings: 'userId',
      syncQueue: '++localId, entityType, entityId, createdAt, [entityType+entityId]',
      aiKeys: '++id, [userId+provider]',
    })
  }
}

export const db = new TutorialOSDB()
