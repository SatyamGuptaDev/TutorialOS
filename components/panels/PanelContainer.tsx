'use client'

import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, Pin, EyeOff } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { useStudioStore } from '@/stores/studioStore'
import { cn } from '@/lib/utils'
import type { PanelName } from '@/types'

interface PanelContainerProps {
  name: PanelName
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: ReactNode
}

export function PanelContainer({ name, title, icon: Icon, children }: PanelContainerProps) {
  const panel = useStudioStore((s) => s.panels[name])
  const togglePanel = useStudioStore((s) => s.togglePanel)
  const hidePanel = useStudioStore((s) => s.hidePanel)
  const pinPanel = useStudioStore((s) => s.pinPanel)

  if (!panel.visible) return null

  return (
    <div className={cn(
      'flex flex-col rounded-[var(--radius-md)] overflow-hidden',
      'border border-[var(--color-border)] bg-[var(--color-surface)]',
      panel.pinned && 'ring-1 ring-[var(--color-accent)]'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2 shrink-0',
        'bg-[var(--color-surface-2)] border-b border-[var(--color-border-subtle)]',
        'cursor-pointer select-none'
      )}
        onClick={() => togglePanel(name)}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          <span className="text-xs font-semibold text-[var(--color-text)]">{title}</span>
        </div>

        <div className="flex items-center gap-0.5">
          <Tooltip content={panel.pinned ? 'Unpin' : 'Pin panel'}>
            <button
              onClick={(e) => { e.stopPropagation(); pinPanel(name) }}
              className={cn(
                'h-5 w-5 flex items-center justify-center rounded-[3px]',
                'transition-colors duration-[var(--duration-fast)]',
                panel.pinned
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]'
              )}
            >
              <Pin className="h-3 w-3" />
            </button>
          </Tooltip>
          <Tooltip content="Hide panel">
            <button
              onClick={(e) => { e.stopPropagation(); hidePanel(name) }}
              className="h-5 w-5 flex items-center justify-center rounded-[3px] text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)]"
            >
              <EyeOff className="h-3 w-3" />
            </button>
          </Tooltip>
          {panel.collapsed
            ? <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            : <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          }
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!panel.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
