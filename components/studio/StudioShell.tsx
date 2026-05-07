'use client'

import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useStudioStore } from '@/stores/studioStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StudioShellProps {
  children: ReactNode
}

export function StudioShell({ children }: StudioShellProps) {
  const focusMode = useStudioStore((s) => s.focusMode)
  const setFocusMode = useStudioStore((s) => s.setFocusMode)

  // Escape exits focus modes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode !== 'normal') {
        setFocusMode('normal')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusMode, setFocusMode])

  if (focusMode === 'normal') {
    return <div className="flex flex-col h-full">{children}</div>
  }

  // Focus modes: render as portal covering the full screen
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed inset-0 z-[200] flex flex-col',
        'bg-[var(--color-bg)]'
      )}
    >
      {children}

      {/* Floating exit button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-6 right-6 z-[210]"
      >
        <Button
          variant="muted"
          size="sm"
          onClick={() => setFocusMode('normal')}
          leftIcon={<X className="h-3.5 w-3.5" />}
          className="shadow-[var(--shadow-panel)] border border-[var(--color-border)]"
        >
          {focusMode === 'zen' ? 'Exit Zen' : 'Exit Focus'}
        </Button>
      </motion.div>
    </motion.div>,
    document.body
  )
}
