import type { Metadata } from 'next'
import { BookOpen, Brain, Terminal, GraduationCap } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to TutorialOS and continue your learning journey.',
}

const features = [
  {
    icon: BookOpen,
    title: 'Watch & Write',
    description: 'Video + notes in a beautiful split view. Never lose context.',
  },
  {
    icon: Brain,
    title: 'Spaced Review',
    description: 'Smart reminders resurface key concepts exactly when you need them.',
  },
  {
    icon: Terminal,
    title: 'Command Library',
    description: 'Save every command you encounter. Search in seconds.',
  },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      {/* Left panel — feature showcase */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 bg-[var(--color-surface)] border-r border-[var(--color-border-subtle)]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[var(--radius-md)] gradient-accent flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[var(--color-text)]">TutorialOS</span>
        </div>

        {/* Main copy */}
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-text)] leading-tight">
              Watch.{' '}
              <span className="gradient-text">Write.</span>
              {' '}Remember.
            </h2>
            <p className="mt-3 text-[var(--color-text-muted)] text-base leading-relaxed">
              The personal learning OS built for developers who take their growth seriously.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] flex items-center justify-center shrink-0">
                  <Icon className="h-4.5 w-4.5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-faint)]">
          © {new Date().getFullYear()} TutorialOS. All rights reserved.
        </p>
      </div>

      {/* Right panel — login card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-[var(--radius-sm)] gradient-accent flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[var(--color-text)]">TutorialOS</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Welcome back</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Sign in to continue your learning journey.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
