'use client'

import { useState } from 'react'
import { BookOpen, Brain, Terminal, GraduationCap, Mail } from 'lucide-react'
import { SignupForm } from '@/components/auth/SignupForm'

const features = [
  { icon: BookOpen, title: 'Watch & Write', description: 'Video + notes in a beautiful split view.' },
  { icon: Brain, title: 'Spaced Review', description: 'Smart reminders resurface key concepts.' },
  { icon: Terminal, title: 'Command Library', description: 'Save every command. Search in seconds.' },
]

export default function SignupPage() {
  const [confirmed, setConfirmed] = useState(false)

  return (
    <div className="min-h-screen flex bg-[var(--color-bg)]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 bg-[var(--color-surface)] border-r border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[var(--radius-md)] gradient-accent flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-[var(--color-text)]">TutorialOS</span>
        </div>
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-3xl font-bold text-[var(--color-text)] leading-tight">
              Start learning <span className="gradient-text">smarter.</span>
            </h2>
            <p className="mt-3 text-[var(--color-text-muted)] text-base leading-relaxed">
              Join developers who take structured notes, track doubts, and actually remember what they learn.
            </p>
          </div>
          <div className="flex flex-col gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[var(--color-accent)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-[var(--color-text-faint)]">© {new Date().getFullYear()} TutorialOS.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-[var(--radius-sm)] gradient-accent flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-[var(--color-text)]">TutorialOS</span>
          </div>

          {confirmed ? (
            <div className="flex flex-col items-center gap-6 text-center py-8">
              <div className="h-16 w-16 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] flex items-center justify-center">
                <Mail className="h-8 w-8 text-[var(--color-success)]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">Check your email</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-2 leading-relaxed">
                  We sent you a confirmation link. Click it to activate your account and get started.
                </p>
              </div>
              <p className="text-xs text-[var(--color-text-faint)]">
                Didn&apos;t receive it? Check your spam folder.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--color-text)]">Create your account</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Free forever. No credit card required.
                </p>
              </div>
              <SignupForm onSuccess={() => setConfirmed(true)} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
