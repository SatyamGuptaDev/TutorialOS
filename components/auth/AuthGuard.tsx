'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)]">
        <div className="h-10 w-10 rounded-[var(--radius-md)] gradient-accent flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <Loader2 className="h-5 w-5 text-[var(--color-text-muted)] animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
