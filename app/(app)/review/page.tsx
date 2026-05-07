'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Brain, Check, ExternalLink, BookOpen, Calendar } from 'lucide-react'
import { db } from '@/lib/db/schema'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatTimeAgo } from '@/lib/utils'
import type { ReviewItem } from '@/types'

// SM-2 algorithm
function sm2(quality: number, reps: number, ef: number, interval: number) {
  if (quality < 3) return { reps: 0, ef: Math.max(1.3, ef - 0.8), interval: 1 }
  const newEf = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  const newReps = reps + 1
  const newInterval = newReps === 1 ? 1 : newReps === 2 ? 6 : Math.round(interval * newEf)
  return { reps: newReps, ef: newEf, interval: newInterval }
}

function isDue(item: ReviewItem): boolean {
  return new Date(item.dueDate) <= new Date()
}

export default function ReviewPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''
  const [completingId, setCompletingId] = useState<string | null>(null)

  const items = useLiveQuery(
    () => db.reviewItems.where('userId').equals(userId).and((r) => r.status !== 'done').toArray(),
    [userId]
  )

  const dueItems = (items ?? []).filter(isDue)
  const upcomingItems = (items ?? []).filter((i) => !isDue(i))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const markDone = async (item: ReviewItem) => {
    setCompletingId(item.id)
    const quality = 4 // Good quality
    const { reps, ef, interval } = sm2(quality, item.repetitions, item.easeFactor, item.intervalDays)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + interval)

    await db.reviewItems.update(item.id, {
      status: 'done',
      repetitions: reps,
      easeFactor: ef,
      intervalDays: interval,
      dueDate: dueDate.toISOString(),
      completedAt: new Date().toISOString(),
    })
    setCompletingId(null)
  }

  const ReviewCard = ({ item }: { item: ReviewItem }) => {
    const due = isDue(item)
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-[var(--radius-lg)] border p-4 flex items-start gap-4',
          'bg-[var(--color-surface)] transition-colors',
          due
            ? 'border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_4%,transparent)]'
            : 'border-[var(--color-border)]'
        )}
      >
        <div className="h-9 w-9 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
          <Brain className="h-5 w-5 text-[var(--color-text-muted)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm text-[var(--color-text)]">{item.title}</h3>
            <Badge variant={due ? 'warning' : 'default'} size="sm">
              {due ? 'Due' : 'Upcoming'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {due ? `Overdue — ${formatTimeAgo(item.dueDate)}` : `Due ${formatTimeAgo(item.dueDate)}`}
            </span>
            <span>Interval: {item.intervalDays}d</span>
            <span>EF: {item.easeFactor.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/studio?session=${item.sessionId}`)}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          {due && (
            <Button
              size="sm"
              loading={completingId === item.id}
              onClick={() => markDone(item)}
              leftIcon={<Check className="h-3.5 w-3.5" />}
            >
              Done
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Review</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Spaced repetition — {dueItems.length} due, {upcomingItems.length} upcoming
        </p>
      </div>

      {/* Due now */}
      {dueItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Due Now</h2>
          <div className="flex flex-col gap-2">
            {dueItems.map((item) => <ReviewCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">Upcoming</h2>
          <div className="flex flex-col gap-2">
            {upcomingItems.map((item) => <ReviewCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(items ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Brain className="h-10 w-10 text-[var(--color-text-faint)]" />
          <div>
            <p className="font-medium text-[var(--color-text-muted)]">Nothing to review</p>
            <p className="text-sm text-[var(--color-text-faint)] mt-1">
              Add sessions to review from the Library page.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
