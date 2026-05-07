'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-medium rounded-full transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-surface-3)] text-[var(--color-text-muted)]',
        accent: 'bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-[var(--color-accent)]',
        success: 'bg-[color-mix(in_srgb,var(--color-success)_18%,transparent)] text-[var(--color-success)]',
        warning: 'bg-[color-mix(in_srgb,var(--color-warning)_18%,transparent)] text-[var(--color-warning)]',
        error: 'bg-[color-mix(in_srgb,var(--color-error)_18%,transparent)] text-[var(--color-error)]',
        cyan: 'bg-[color-mix(in_srgb,var(--color-accent-2)_18%,transparent)] text-[var(--color-accent-2)]',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2 py-0.5 text-xs',
        lg: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode
  className?: string
}

export function Badge({ children, variant, size, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {children}
    </span>
  )
}
