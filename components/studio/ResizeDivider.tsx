'use client'

import { useRef, useCallback, useEffect } from 'react'
import { useStudioStore } from '@/stores/studioStore'
import { cn } from '@/lib/utils'

export function ResizeDivider() {
  const setSplitRatio = useStudioStore((s) => s.setSplitRatio)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      isDragging.current = true
      ;(e.target as HTMLDivElement).setPointerCapture(e.pointerId)

      // Find parent container width
      const parent = (e.target as HTMLElement).parentElement as HTMLDivElement | null
      containerRef.current = parent

      const onMove = (moveEvent: PointerEvent) => {
        if (!isDragging.current || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const ratio = (moveEvent.clientX - rect.left) / rect.width
        setSplitRatio(ratio)
      }

      const onUp = () => {
        isDragging.current = false
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [setSplitRatio]
  )

  return (
    <div
      onPointerDown={onPointerDown}
      className={cn(
        'w-1.5 shrink-0 relative group cursor-col-resize select-none',
        'hover:bg-[var(--color-accent)] transition-colors duration-[var(--duration-fast)]',
        'flex items-center justify-center'
      )}
      title="Drag to resize"
    >
      {/* Visual handle pill */}
      <div className={cn(
        'w-0.5 h-8 rounded-full',
        'bg-[var(--color-border)] group-hover:bg-[var(--color-accent)]',
        'transition-colors duration-[var(--duration-fast)]'
      )} />
    </div>
  )
}
