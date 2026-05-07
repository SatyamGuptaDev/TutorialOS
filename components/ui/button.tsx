'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium leading-none select-none',
    'transition-all cursor-pointer',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'focus-ring',
    '[--duration:var(--duration-fast)]',
    'transition-[background-color,box-shadow,opacity,transform]',
    'duration-[var(--duration-fast)]',
    'ease-[var(--ease-smooth)]',
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-accent text-white',
          'hover:bg-accent-hover',
          'shadow-sm',
        ],
        ghost: [
          'bg-transparent text-text-muted',
          'hover:bg-surface-2 hover:text-text',
        ],
        outline: [
          'bg-transparent text-text border border-border',
          'hover:bg-surface-2 hover:border-border',
        ],
        destructive: [
          'bg-error text-white',
          'hover:opacity-90',
        ],
        muted: [
          'bg-surface-2 text-text-muted',
          'hover:bg-surface-3 hover:text-text',
        ],
      },
      size: {
        xs: 'h-6 px-2 text-[11px] rounded-[var(--radius-xs)] gap-1',
        sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
        md: 'h-9 px-4 text-sm rounded-[var(--radius-sm)]',
        lg: 'h-11 px-5 text-base rounded-[var(--radius-md)]',
        icon: 'h-9 w-9 rounded-[var(--radius-sm)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      leftIcon,
      rightIcon,
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : isDisabled}
        aria-busy={loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              leftIcon && <span className="shrink-0">{leftIcon}</span>
            )}
            {children}
            {!loading && rightIcon && (
              <span className="shrink-0">{rightIcon}</span>
            )}
          </>
        )}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
