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
  const onRefreshRef = useRef(onRefresh)
  const onErrorRef = useRef(onError)

  // Actualizar las referencias cuando cambien las funciones
  useEffect(() => {
    onRefreshRef.current = onRefresh
    onErrorRef.current = onError
  }, [onRefresh, onError])

  // Efecto principal para manejar el intervalo
  useEffect(() => {
    // Limpiar intervalo existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Solo crear nuevo intervalo si está habilitado
    if (enabled && interval > 0) {
      isActiveRef.current = true
      
      intervalRef.current = setInterval(async () => {
        try {
          await onRefreshRef.current()
        } catch (error) {
          console.error('Error en auto refresh:', error)
          onErrorRef.current?.(error as Error)
        }
      }, interval)
    } else {
      isActiveRef.current = false
    }

    // Cleanup al desmontar o cambiar dependencias
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval])

  const startInterval = useCallback(() => {
    if (intervalRef.current) return
    
    if (enabled && interval > 0) {
      isActiveRef.current = true
      intervalRef.current = setInterval(async () => {
        try {
          await onRefreshRef.current()
        } catch (error) {
          console.error('Error en auto refresh:', error)
          onErrorRef.current?.(error as Error)
        }
      }, interval)
    }
  }, [enabled, interval])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      isActiveRef.current = false
    }
  }, [])

  const restartInterval = useCallback(() => {
    stopInterval()
    startInterval()
  }, [stopInterval, startInterval])

  return {
    startInterval,
    stopInterval,
    restartInterval,
    isActive: isActiveRef.current
  }
} 