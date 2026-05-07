'use client'

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group

function DropdownMenuContent({
  children,
  align = 'end',
  sideOffset = 6,
  className,
}: {
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  className?: string
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content align={align} sideOffset={sideOffset} asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12 }}
          className={cn(
            'min-w-[180px] z-50 rounded-[var(--radius-md)]',
            'bg-[var(--color-surface)] border border-[var(--color-border)]',
            'shadow-[0_8px_32px_rgba(0,0,0,0.32)] p-1.5 flex flex-col gap-0.5',
            'focus:outline-none',
            className
          )}
        >
          {children}
        </motion.div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuItem({
  children,
  icon,
  shortcut,
  destructive = false,
  disabled = false,
  onSelect,
  className,
}: {
  children: ReactNode
  icon?: ReactNode
  shortcut?: string
  destructive?: boolean
  disabled?: boolean
  onSelect?: () => void
  className?: string
}) {
  return (
    <DropdownMenuPrimitive.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-1.5 text-sm rounded-[var(--radius-sm)]',
        'cursor-pointer select-none outline-none',
        'transition-colors duration-[var(--duration-fast)]',
        destructive
          ? 'text-[var(--color-error)] data-[highlighted]:bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)]'
          : 'text-[var(--color-text)] data-[highlighted]:bg-[var(--color-surface-2)]',
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="text-[10px] text-[var(--color-text-faint)] font-mono">{shortcut}</span>
      )}
    </DropdownMenuPrimitive.Item>
  )
}

function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-faint)]">
      {children}
    </div>
  )
}

const DropdownMenuSeparator = () => (
  <div className="my-1 h-px bg-[var(--color-border-subtle)] mx-1" />
)

function DropdownMenuCheckboxItem({
  children,
  checked,
  onCheckedChange,
  className,
}: {
  children: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'relative flex items-center gap-2.5 px-2.5 py-1.5 pl-8 text-sm rounded-[var(--radius-sm)]',
        'cursor-pointer select-none outline-none',
        'transition-colors duration-[var(--duration-fast)]',
        'text-[var(--color-text)] data-[highlighted]:bg-[var(--color-surface-2)]',
        className
      )}
    >
      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
}
