"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

interface AutoRefreshOptions {
  interval?: number // Intervalo en milisegundos (default: 30000 = 30s)
  enabled?: boolean // Si el refresh automático está habilitado (default: true)
  onRefresh?: () => Promise<void> // Función callback para refrescar datos
  maxRetries?: number // Máximo número de reintentos (default: 3)
  retryDelay?: number // Delay entre reintentos en ms (default: 1000)
}

interface AutoRefreshState {
  isRefreshing: boolean
  lastRefresh: Date | null
  enabled: boolean
  error: string | null
  retryCount: number
}

export function useAutoRefresh({
  interval = 30000,
  enabled = true,
  onRefresh,
  maxRetries = 3,
  retryDelay = 1000
}: AutoRefreshOptions = {}) {
  const [state, setState] = useState<AutoRefreshState>({
    isRefreshing: false,
    lastRefresh: null,
    enabled,
    error: null,
    retryCount: 0
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  const refreshData = useCallback(async (force = false) => {
    if (!onRefresh || (!force && !state.enabled)) {
      return
    }

    setState(prev => ({ ...prev, isRefreshing: true, error: null }))

    try {
      await onRefresh()
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        lastRefresh: new Date(),
        error: null,
        retryCount: 0
      }))
    } catch (error) {
      console.error('Error during auto refresh:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

      setState(prev => {
        const newRetryCount = prev.retryCount + 1
        const shouldRetry = newRetryCount < maxRetries

        if (shouldRetry) {
          console.log(`Retry ${newRetryCount}/${maxRetries} in ${retryDelay}ms`)
          retryTimeoutRef.current = setTimeout(() => {
            refreshData(true)
          }, retryDelay)
        } else {
          toast.error(`Error al actualizar datos: ${errorMessage}`)
        }

        return {
          ...prev,
          isRefreshing: false,
          error: errorMessage,
          retryCount: newRetryCount
        }
      })
    }
  }, [onRefresh, state.enabled, maxRetries, retryDelay])

  const toggleEnabled = useCallback(() => {
    setState(prev => {
      const newEnabled = !prev.enabled

      if (newEnabled) {
        // Si se habilita, hacer un refresh inmediato
        setTimeout(() => refreshData(true), 100)
      } else {
        // Si se deshabilita, limpiar timers
        clearTimers()
      }

      toast.success(`Refresh automático ${newEnabled ? 'activado' : 'desactivado'}`)
      return { ...prev, enabled: newEnabled }
    })
  }, [refreshData, clearTimers])

  const manualRefresh = useCallback(() => {
    refreshData(true)
  }, [refreshData])

  // Efecto para manejar el intervalo de refresh automático
  useEffect(() => {
    if (state.enabled && onRefresh) {
      // Hacer refresh inmediato al habilitar
      refreshData(true)

      // Configurar intervalo
      intervalRef.current = setInterval(() => {
        refreshData(false)
      }, interval)
    } else {
      clearTimers()
    }

    return clearTimers
  }, [state.enabled, onRefresh, interval, refreshData, clearTimers])

  // Limpiar timers al desmontar
  useEffect(() => {
    return clearTimers
  }, [clearTimers])

  return {
    ...state,
    refresh: manualRefresh,
    toggleEnabled,
    setEnabled: (enabled: boolean) => {
      setState(prev => ({ ...prev, enabled }))
    }
  }
}