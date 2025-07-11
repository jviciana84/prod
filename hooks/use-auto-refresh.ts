import { useEffect, useRef, useCallback } from 'react'

interface UseAutoRefreshOptions {
  interval: number // en milisegundos
  enabled?: boolean
  onRefresh: () => void | Promise<void>
  onError?: (error: Error) => void
}

export function useAutoRefresh({
  interval,
  enabled = true,
  onRefresh,
  onError
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(enabled)

  const startInterval = useCallback(() => {
    if (!enabled || intervalRef.current) return

    intervalRef.current = setInterval(async () => {
      try {
        await onRefresh()
      } catch (error) {
        console.error('Error en auto refresh:', error)
        onError?.(error as Error)
      }
    }, interval)
  }, [enabled, interval, onRefresh, onError])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const restartInterval = useCallback(() => {
    stopInterval()
    startInterval()
  }, [stopInterval, startInterval])

  useEffect(() => {
    isActiveRef.current = enabled
    
    if (enabled) {
      startInterval()
    } else {
      stopInterval()
    }

    return () => {
      stopInterval()
    }
  }, [enabled, startInterval, stopInterval])

  return {
    startInterval,
    stopInterval,
    restartInterval,
    isActive: isActiveRef.current
  }
} 