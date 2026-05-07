'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSyncStore } from '@/stores/syncStore'
import { SyncEngine } from '@/lib/sync/SyncEngine'

// Initializes Supabase auth listener on app mount
// Placed in root layout so it runs on every page
export function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)
  const { setEngine, engine, reset } = useSyncStore()
  // Track if engine is already started for this user to prevent double-init
  const engineUserId = useRef<string | null>(null)

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (user) {
      // Only create/reinitialize if the user changed
      if (engineUserId.current === user.id) return
      engineUserId.current = user.id

      if (!engine) {
        const newEngine = new SyncEngine()
        setEngine(newEngine)
        newEngine.initialize(user.id)
      } else {
        engine.initialize(user.id)
      }
    } else {
      engineUserId.current = null
      reset()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
