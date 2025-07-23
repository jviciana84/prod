import { useState, useEffect } from 'react'

interface AutoRefreshPreferences {
  enabled: boolean
  interval: number
}

const DEFAULT_PREFERENCES: AutoRefreshPreferences = {
  enabled: false, // Deshabilitado por defecto para evitar problemas de rendimiento
  interval: 10 * 60 * 1000 // 10 minutos
}

const STORAGE_KEY = 'auto-refresh-preferences'

export function useAutoRefreshPreferences() {
  const [preferences, setPreferences] = useState<AutoRefreshPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar preferencias desde localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch (error) {
      console.error('Error al cargar preferencias de auto refresh:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Guardar preferencias en localStorage
  const updatePreferences = (newPreferences: Partial<AutoRefreshPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Error al guardar preferencias de auto refresh:', error)
      }
    }
  }

  const setEnabled = (enabled: boolean) => {
    updatePreferences({ enabled })
  }

  const setInterval = (interval: number) => {
    updatePreferences({ interval })
  }

  return {
    preferences,
    isLoaded,
    setEnabled,
    setInterval,
    updatePreferences
  }
} 