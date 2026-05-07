'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  destructiveConfirm?: boolean
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  destructiveConfirm = false,
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={destructiveConfirm ? undefined : onOpenChange}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={
                  destructiveConfirm ? undefined : () => onOpenChange(false)
                }
              />
            </Dialog.Overlay>

            <Dialog.Content asChild onEscapeKeyDown={() => onOpenChange(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{
                  duration: 0.2,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className={cn(
                  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                  'w-full mx-4 rounded-[var(--radius-lg)]',
                  'bg-[var(--color-surface)] border border-[var(--color-border)]',
                  'shadow-[0_24px_80px_rgba(0,0,0,0.4)]',
                  'focus:outline-none',
                  sizeClasses[size]
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 p-6 pb-4">
                  <div className="flex flex-col gap-1">
                    <Dialog.Title className="text-base font-semibold text-[var(--color-text)] leading-none">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="text-sm text-[var(--color-text-muted)]">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>

                  <Dialog.Close asChild>
                    <button
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        'shrink-0 h-7 w-7 rounded-[var(--radius-sm)]',
                        'flex items-center justify-center',
                        'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                        'hover:bg-[var(--color-surface-2)]',
                        'transition-colors duration-[var(--duration-fast)]',
                        'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]',
                        '-mt-0.5 -mr-1'
                      )}
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Body */}
                <div className="px-6 pb-4">{children}</div>

                {/* Footer */}
                {footer && (
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-subtle)]">
                    {footer}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
