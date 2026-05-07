import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toast'
import { AuthInitializer } from '@/components/auth/AuthInitializer'
import { AccentInitializer } from '@/components/layout/AccentInitializer'

export const metadata: Metadata = {
  title: {
    default: 'TutorialOS — Watch. Write. Remember.',
    template: '%s | TutorialOS',
  },
  description:
    'A personal learning OS — watch tutorial videos and take rich notes side-by-side. Track doubts, commands, and spaced-repetition review.',
  keywords: ['learning', 'tutorials', 'notes', 'spaced repetition', 'developer'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AuthInitializer />
          <AccentInitializer />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
