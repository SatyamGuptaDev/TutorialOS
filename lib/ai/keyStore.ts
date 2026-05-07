import { db } from '@/lib/db/schema'
import { useAuthStore } from '@/stores/authStore'
import type { AIProvider } from '@/types'

// Simple fixed salt for PBKDF2, since the user's ID/created_at adds entropy
const SALT = new TextEncoder().encode('TutorialOS_AI_Keys')

async function getEncryptionKey(): Promise<CryptoKey> {
  const user = useAuthStore.getState().user
  if (!user) throw new Error('Cannot derive key without authenticated user')

  const baseString = `${user.id}_${user.created_at}`
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(baseString),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export async function saveKey(provider: AIProvider, key: string): Promise<void> {
  const user = useAuthStore.getState().user
  if (!user) return

  const cryptoKey = await getEncryptionKey()
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encodedData = new TextEncoder().encode(key)

  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    encodedData
  )

  const existing = await db.aiKeys.where({ userId: user.id, provider }).first()

  if (existing && existing.id) {
    await db.aiKeys.update(existing.id, {
      encryptedKey: bufferToBase64(encryptedContent),
      iv: bufferToBase64(iv.buffer),
    })
  } else {
    await db.aiKeys.add({
      userId: user.id,
      provider,
      encryptedKey: bufferToBase64(encryptedContent),
      iv: bufferToBase64(iv.buffer),
    })
  }
}

export async function loadKey(provider: AIProvider): Promise<string | null> {
  const user = useAuthStore.getState().user
  if (!user) return null

  const row = await db.aiKeys.where({ userId: user.id, provider }).first()
  if (!row) return null

  try {
    const cryptoKey = await getEncryptionKey()
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToBuffer(row.iv),
      },
      cryptoKey,
      base64ToBuffer(row.encryptedKey)
    )

    return new TextDecoder().decode(decryptedContent)
  } catch (e) {
    console.error(`Failed to decrypt key for ${provider}`, e)
    return null
  }
}

export async function deleteKey(provider: AIProvider): Promise<void> {
  const user = useAuthStore.getState().user
  if (!user) return

  const row = await db.aiKeys.where({ userId: user.id, provider }).first()
  if (row && row.id) {
    await db.aiKeys.delete(row.id)
  }
}

export async function hasKey(provider: AIProvider): Promise<boolean> {
  const user = useAuthStore.getState().user
  if (!user) return false

  const row = await db.aiKeys.where({ userId: user.id, provider }).first()
  return !!row
}
