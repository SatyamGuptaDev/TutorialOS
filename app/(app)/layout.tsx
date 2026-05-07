import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { TooltipProvider } from '@/components/ui/tooltip'

// Force dynamic so Supabase auth middleware doesn't fail during static prerendering
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'TutorialOS',
    template: '%s | TutorialOS',
  },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TooltipProvider>
        <AppShell>{children}</AppShell>
      </TooltipProvider>
    </AuthGuard>
  )
}
