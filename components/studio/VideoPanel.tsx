'use client'

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SourceType } from '@/types'

declare global {
  interface Window {
    YT: {
      Player: new (el: string | HTMLElement, options: {
        videoId?: string
        playerVars?: Record<string, number>
        events?: {
          onReady?: (event: { target: YTPlayer }) => void
          onError?: () => void
        }
      }) => YTPlayer
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  playVideo: () => void
  pauseVideo: () => void
  destroy: () => void
  getVideoData?: () => { title?: string }
}

export interface VideoPanelRef {
  seekTo: (seconds: number) => void
  getCurrentTime: () => number
  play: () => void
  pause: () => void
}

interface VideoPanelProps {
  url: string
  sourceType: SourceType
  onTitleReady?: (title: string) => void
  className?: string
}

// ── YouTube API Loader ───────────────────────────────────────

let ytApiLoaded = false
let ytApiCallbacks: (() => void)[] = []

function loadYouTubeApi(onReady: () => void) {
  if (ytApiLoaded && window.YT?.Player) {
    onReady()
    return
  }
  ytApiCallbacks.push(onReady)
  if (!document.getElementById('yt-iframe-api')) {
    const script = document.createElement('script')
    script.id = 'yt-iframe-api'
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true
      ytApiCallbacks.forEach((cb) => cb())
      ytApiCallbacks = []
    }
  }
}

// ── VideoPanel ───────────────────────────────────────────────

const VideoPanel = forwardRef<VideoPanelRef, VideoPanelProps>(
  ({ url, sourceType, onTitleReady, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<YTPlayer | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [retryKey, setRetryKey] = useState(0)

    useImperativeHandle(ref, () => ({
      seekTo: (seconds) => {
        playerRef.current?.seekTo(seconds, true)
      },
      getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
    }))

    // Extract YouTube video ID from embed URL
    const getYouTubeId = (embedUrl: string) => {
      const match = embedUrl.match(/embed\/([a-zA-Z0-9_-]+)/)
      return match?.[1] ?? null
    }

    const initYouTubePlayer = useCallback(() => {
      if (!containerRef.current) return
      const videoId = getYouTubeId(url)
      if (!videoId) {
        setHasError(true)
        setIsLoading(false)
        return
      }

      // Clean up existing player
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }

      const div = document.createElement('div')
      div.id = `yt-player-${retryKey}`
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(div)

      playerRef.current = new window.YT.Player(div.id, {
        videoId,
        playerVars: { enablejsapi: 1, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            setIsLoading(false)
            setHasError(false)
            try {
              const title = event.target.getVideoData?.()?.title
              if (title) onTitleReady?.(title)
            } catch {
              // getVideoData may not be available
            }
          },
          onError: () => { setIsLoading(false); setHasError(true) },
        },
      }) as unknown as YTPlayer
    }, [url, retryKey, onTitleReady])

    useEffect(() => {
      if (!url) return
      setIsLoading(true)
      setHasError(false)

      if (sourceType === 'youtube') {
        loadYouTubeApi(initYouTubePlayer)
      } else {
        // For non-YouTube: just let iframe load naturally
        setIsLoading(false)
      }

      return () => {
        if (playerRef.current) {
          playerRef.current.destroy()
          playerRef.current = null
        }
      }
    }, [url, sourceType, initYouTubePlayer])

    if (!url) {
      return (
        <div className={cn('flex items-center justify-center bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] border-dashed', className)}>
          <p className="text-sm text-[var(--color-text-faint)]">
            Paste a video URL above to get started
          </p>
        </div>
      )
    }

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {/* Video container — 16:9 */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {isLoading && (
            <div className="absolute inset-0 skeleton rounded-[var(--radius-lg)]" />
          )}

          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface-2)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
              <AlertTriangle className="h-6 w-6 text-[var(--color-warning)]" />
              <p className="text-sm text-[var(--color-text-muted)]">Failed to load video</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRetryKey((k) => k + 1)}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Retry
              </Button>
            </div>
          )}

          {sourceType === 'youtube' ? (
            <div
              ref={containerRef}
              className={cn(
                'absolute inset-0 rounded-[var(--radius-lg)] overflow-hidden',
                '[&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-none'
              )}
            />
          ) : (
            <iframe
              key={retryKey}
              src={url}
              className="absolute inset-0 w-full h-full rounded-[var(--radius-lg)] border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
              onError={() => { setIsLoading(false); setHasError(true) }}
            />
          )}
        </div>

        {/* Advisory for non-YouTube */}
        {sourceType !== 'youtube' && sourceType !== 'unknown' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)]">
            <AlertTriangle className="h-3.5 w-3.5 text-[var(--color-warning)] shrink-0" />
            <p className="text-xs text-[var(--color-warning)]">
              External video — timestamp seeking may be limited depending on the source platform.
            </p>
          </div>
        )}
      </div>
    )
  }
)

VideoPanel.displayName = 'VideoPanel'

export { VideoPanel }
