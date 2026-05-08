'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSyncStore } from '@/stores/syncStore'

// Initializes Supabase auth listener on app mount
// Placed in root layout so it runs on every page
export function AuthInitializer() {
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)
  const { initialize: initSync, reset } = useSyncStore()
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

      // Initialize sync with user ID (and default interval of 10)
      initSync(user.id, 10)
    } else {
      engineUserId.current = null
      reset()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
