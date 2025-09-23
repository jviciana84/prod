"use client"

import { useEffect, useRef, useCallback } from 'react'

// Tipos de eventos de datos
export type DataEventType =
  | 'data-updated'
  | 'data-created'
  | 'data-deleted'
  | 'table-refresh-requested'
  | 'force-refresh'
  | 'custom'

// Interface para eventos de datos
export interface DataEvent {
  type: DataEventType
  source: string // Quién emite el evento
  table?: string // Tabla afectada (opcional)
  data?: any // Datos adicionales (opcional)
  timestamp: number
}

// Mapa de listeners por tipo de evento
type EventListeners = Map<string, Set<(event: DataEvent) => void>>

// Sistema global de eventos
class DataEventSystem {
  private listeners: EventListeners = new Map()
  private history: DataEvent[] = []

  // Emitir un evento
  emit(event: DataEvent) {
    console.log(`📡 DataEvent: ${event.type} from ${event.source}`, event)

    // Guardar en historial
    this.history.push(event)

    // Limitar historial a 100 eventos
    if (this.history.length > 100) {
      this.history.shift()
    }

    // Notificar listeners
    const typeListeners = this.listeners.get(event.type) || new Set()
    const allListeners = this.listeners.get('*') || new Set()

    const allListenersToNotify = new Set([...typeListeners, ...allListeners])

    allListenersToNotify.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in data event listener:', error)
      }
    })
  }

  // Suscribirse a eventos
  on(type: DataEventType | '*', listener: (event: DataEvent) => void) {
    const listeners = this.listeners.get(type) || new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)

    // Devolver función para desuscribirse
    return () => {
      const listeners = this.listeners.get(type) || new Set()
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  // Obtener historial de eventos
  getHistory(limit?: number): DataEvent[] {
    return this.history.slice(-limit)
  }

  // Limpiar historial
  clearHistory() {
    this.history = []
  }
}

// Instancia global del sistema de eventos
const globalEventSystem = new DataEventSystem()

// Hook para usar el sistema de eventos
export function useDataEvents() {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const emit = useCallback((event: DataEvent) => {
    globalEventSystem.emit(event)
  }, [])

  const on = useCallback((type: DataEventType | '*', listener: (event: DataEvent) => void) => {
    // Limpiar listener anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // Suscribirse al nuevo listener
    unsubscribeRef.current = globalEventSystem.on(type, listener)

    // Devolver función para desuscribirse
    return unsubscribeRef.current
  }, [])

  const getHistory = useCallback((limit?: number) => {
    return globalEventSystem.getHistory(limit)
  }, [])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  return {
    emit,
    on,
    getHistory
  }
}

// Funciones utilitarias para emitir eventos comunes
export const dataEvents = {
  // Emitir cuando se actualizan datos
  updated: (source: string, table?: string, data?: any) => {
    globalEventSystem.emit({
      type: 'data-updated',
      source,
      table,
      data,
      timestamp: Date.now()
    })
  },

  // Emitir cuando se crean nuevos datos
  created: (source: string, table?: string, data?: any) => {
    globalEventSystem.emit({
      type: 'data-created',
      source,
      table,
      data,
      timestamp: Date.now()
    })
  },

  // Emitir cuando se eliminan datos
  deleted: (source: string, table?: string, data?: any) => {
    globalEventSystem.emit({
      type: 'data-deleted',
      source,
      table,
      data,
      timestamp: Date.now()
    })
  },

  // Emitir para solicitar refresh de tabla
  refresh: (source: string, table?: string) => {
    globalEventSystem.emit({
      type: 'table-refresh-requested',
      source,
      table,
      timestamp: Date.now()
    })
  },

  // Emitir para forzar refresh global
  forceRefresh: (source: string) => {
    globalEventSystem.emit({
      type: 'force-refresh',
      source,
      timestamp: Date.now()
    })
  }
}