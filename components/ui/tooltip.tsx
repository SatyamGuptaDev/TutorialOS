'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={400}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

export interface TooltipProps {
  children: ReactNode
  content: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            'z-50 px-2.5 py-1.5 text-xs font-medium',
            'rounded-[var(--radius-sm)]',
            'bg-[var(--color-surface-3)] text-[var(--color-text)]',
            'border border-[var(--color-border)]',
            'shadow-[0_4px_16px_rgba(0,0,0,0.24)]',
            'animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-[var(--color-surface-3)]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
