'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettings } from '@/lib/db/hooks'

export function AccentInitializer() {
  const user = useAuthStore((s) => s.user)
  const settings = useSettings(user?.id ?? '')

  useEffect(() => {
    if (settings?.accent) {
      document.documentElement.setAttribute('data-accent', settings.accent)
    } else {
      document.documentElement.setAttribute('data-accent', 'violet')
    }
  }, [settings?.accent])

  return null
}
