import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[var(--color-border)]/50', className)}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 border border-[var(--color-border-subtle)] rounded-xl">
      <Skeleton className="h-[125px] w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-3 border-b border-[var(--color-border-subtle)]">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-[60%]' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}
