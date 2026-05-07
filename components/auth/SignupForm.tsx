'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/components/ui/toast'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to continue' }),
  }),
})

type SignupFormValues = z.infer<typeof signupSchema>

function PasswordStrengthBar({ password }: { password: string }) {
  const getStrength = (pw: string): number => {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  const strength = getStrength(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = [
    '',
    'bg-[var(--color-error)]',
    'bg-[var(--color-warning)]',
    'bg-[color-mix(in_srgb,var(--color-success)_70%,var(--color-warning))]',
    'bg-[var(--color-success)]',
  ]

  if (!password) return null

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-[var(--duration-normal)]',
              level <= strength ? colors[strength] : 'bg-[var(--color-surface-3)]'
            )}
          />
        ))}
      </div>
      {strength > 0 && (
        <span className="text-xs text-[var(--color-text-muted)]">
          {labels[strength]}
        </span>
      )}
    </div>
  )
}

interface SignupFormProps {
  onSuccess: () => void
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const signUp = useAuthStore((s) => s.signUp)
  const [showPassword, setShowPassword] = useState(false)
  const [termsChecked, setTermsChecked] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { terms: undefined },
  })

  const passwordValue = watch('password') ?? ''

  const onSubmit = async (data: SignupFormValues) => {
    const { error } = await signUp(data.email, data.password, data.name)
    if (error) {
      toast.error(error)
    } else {
      onSuccess()
    }
  }

  const handleTermsChange = (checked: boolean) => {
    setTermsChecked(checked)
    setValue('terms', checked as true, { shouldValidate: true })
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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Input
        label="Full name"
        type="text"
        placeholder="Jane Doe"
        leftIcon={<User className="h-4 w-4" />}
        error={errors.name?.message}
        autoComplete="name"
        {...register('name')}
      />

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        autoComplete="email"
        {...register('email')}
      />

      <div className="flex flex-col gap-2">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min 8 chars, 1 uppercase, 1 number"
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
          autoComplete="new-password"
          {...register('password')}
        />
        <PasswordStrengthBar password={passwordValue} />
      </div>

      <div className="flex flex-col gap-1">
        <Checkbox
          id="terms"
          checked={termsChecked}
          onCheckedChange={handleTermsChange}
          label={
            <span>
              I agree to the{' '}
              <a href="#" className="text-[var(--color-accent)] hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-[var(--color-accent)] hover:underline">
                Privacy Policy
              </a>
            </span>
          }
        />
        {errors.terms && (
          <p className="text-xs text-[var(--color-error)] ml-6">{errors.terms.message}</p>
        )}
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full mt-1">
        Create account
      </Button>

      <p className="text-sm text-center text-[var(--color-text-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--color-accent)] hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  </div>
  )
}
