import React from 'react'
import { FolderOpen, Plus, SearchX, Sparkles } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full w-full">
      <div className="h-16 w-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4 text-[var(--color-text-muted)]">
        {icon || <FolderOpen className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export const NoSearchResults = () => (
  <EmptyState
    icon={<SearchX className="h-8 w-8" />}
    title="No results found"
    description="We couldn't find anything matching your search. Try adjusting your keywords."
  />
)

export const NoSessionsEmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <EmptyState
    icon={<Sparkles className="h-8 w-8 text-[var(--color-accent)]" />}
    title="Ready to start learning?"
    description="Create your first session by pasting a YouTube link or starting a blank note."
    actionLabel="New Session"
    onAction={onCreate}
  />
)
