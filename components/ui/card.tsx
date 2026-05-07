'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  children,
  className,
  hover = false,
  onClick,
  padding = 'md',
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[var(--radius-lg)] bg-[var(--color-surface)]',
        'border border-[var(--color-border)]',
        'transition-all duration-[var(--duration-normal)]',
        paddingClasses[padding],
        hover && [
          'cursor-pointer',
          'hover:bg-[var(--color-surface-2)]',
          'hover:border-[var(--color-border)]',
          'hover:shadow-[0_4px_24px_rgba(0,0,0,0.16)]',
          'hover:-translate-y-0.5',
        ],
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold text-[var(--color-text)]', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>
}
