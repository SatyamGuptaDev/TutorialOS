'use client'

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  inputSize?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 text-xs px-2.5',
  md: 'h-9 text-sm px-3',
  lg: 'h-11 text-base px-4',
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = 'md',
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text)] leading-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-[var(--color-text-muted)] pointer-events-none z-10">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]',
              'border border-[var(--color-border)]',
              'text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]',
              'transition-[border-color,box-shadow] duration-[var(--duration-fast)]',
              // Focus
              'focus:outline-none focus:border-[var(--color-accent)]',
              'focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]',
              // Error
              error &&
                'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-error)_20%,transparent)]',
              // Disabled
              disabled && 'opacity-50 cursor-not-allowed',
              // Icon padding
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              sizeClasses[inputSize],
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 flex items-center text-[var(--color-text-muted)] z-10">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-[var(--color-error)] leading-none">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-text-muted)] leading-none">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
