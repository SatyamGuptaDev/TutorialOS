'use client'

import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: ReactNode
  description?: string
  disabled?: boolean
  className?: string
}

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}: CheckboxProps) {
  const checkId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <CheckboxPrimitive.Root
        id={checkId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'h-4 w-4 shrink-0 mt-0.5 rounded-[var(--radius-xs)]',
          'border border-[var(--color-border)]',
          'bg-[var(--color-surface-2)]',
          'transition-all duration-[var(--duration-fast)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]',
          'data-[state=checked]:bg-[var(--color-accent)] data-[state=checked]:border-[var(--color-accent)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:border-[var(--color-accent)] data-[state=unchecked]:hover:border-[var(--color-text-muted)]'
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={checkId}
              className={cn(
                'text-sm font-medium text-[var(--color-text)] leading-none cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}
