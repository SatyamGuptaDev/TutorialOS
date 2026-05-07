'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const magicLinkSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type MagicLinkValues = z.infer<typeof magicLinkSchema>

export function LoginForm() {
  const router = useRouter()
  const signIn = useAuthStore((s) => s.signIn)
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink)
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [magicSent, setMagicSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const magicForm = useForm<MagicLinkValues>({ resolver: zodResolver(magicLinkSchema) })

  const onSubmit = async (data: LoginFormValues) => {
    const { error } = await signIn(data.email, data.password)
    if (error) {
      toast.error(error)
    } else {
      router.push('/dashboard')
    }
  }

  const onMagicLink = async (data: MagicLinkValues) => {
    const { error } = await sendMagicLink(data.email)
    if (error) {
      toast.error(error)
    } else {
      setMagicSent(true)
    }
  }

  if (magicSent) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="h-12 w-12 rounded-full bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] flex items-center justify-center">
          <Mail className="h-6 w-6 text-[var(--color-success)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--color-text)]">Check your email</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            We sent you a magic link. Click it to sign in.
          </p>
        </div>
        <button
          onClick={() => setMagicSent(false)}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const handleGoogleSignIn = async () => {
    const { error } = await useAuthStore.getState().signInWithGoogle()
    if (error) toast.error(error)
  }

  return (
    <div className="flex flex-col gap-5">
      <Button
        type="button"
        variant="outline"
        className="w-full relative bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]"
        onClick={handleGoogleSignIn}
      >
        <svg className="absolute left-4 h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <Separator />
        <span className="text-xs text-[var(--color-text-faint)] whitespace-nowrap">or</span>
        <Separator />
      </div>
      {mode === 'password' ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              autoComplete="current-password"
              {...register('password')}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode('magic')}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full mt-1">
            Sign in
          </Button>
        </form>
      ) : (
        <form onSubmit={magicForm.handleSubmit(onMagicLink)} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={magicForm.formState.errors.email?.message}
            autoComplete="email"
            {...magicForm.register('email')}
          />
          <Button type="submit" loading={magicForm.formState.isSubmitting} className="w-full">
            Send magic link
          </Button>
        </form>
      )}

      <div className="flex items-center gap-3">
        <Separator />
        <span className="text-xs text-[var(--color-text-faint)] whitespace-nowrap">or</span>
        <Separator />
      </div>

      <button
        type="button"
        onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
        className={cn(
          'text-sm text-center py-2 rounded-[var(--radius-sm)]',
          'border border-[var(--color-border)] text-[var(--color-text-muted)]',
          'hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
          'transition-colors duration-[var(--duration-fast)]'
        )}
      >
        {mode === 'password' ? '✉️  Send magic link instead' : '🔑  Sign in with password'}
      </button>

      <p className="text-sm text-center text-[var(--color-text-muted)]">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[var(--color-accent)] hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
