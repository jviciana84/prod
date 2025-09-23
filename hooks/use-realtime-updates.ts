import { useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'

interface UseRealtimeUpdatesOptions {
  table: string
  onUpdate?: () => void
  enabled?: boolean
}

export function useRealtimeUpdates({
  table,
  onUpdate,
  enabled = true
}: UseRealtimeUpdatesOptions) {
  const supabase = createClientComponentClient()

  const handleUpdate = useCallback(() => {
    if (onUpdate) {
      console.log(`🔄 Cambio detectado en tabla ${table}, actualizando...`)
      onUpdate()
    }
  }, [onUpdate, table])

  useEffect(() => {
    if (!enabled) return

    console.log(`👂 Suscribiéndose a cambios en tiempo real para tabla: ${table}`)

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`📡 Cambio detectado en ${table}:`, payload.eventType, payload.new?.id || payload.old?.id)
          
          // Pequeño delay para asegurar que la base de datos se ha actualizado completamente
          setTimeout(() => {
            handleUpdate()
          }, 500)
        }
      )
      .subscribe((status) => {
        console.log(`📡 Estado de suscripción para ${table}:`, status)
      })

    return () => {
      console.log(`🔌 Desconectando suscripción en tiempo real para tabla: ${table}`)
      supabase.removeChannel(channel)
    }
  }, [supabase, table, enabled, handleUpdate])

  return {
    // Función para forzar una actualización manual
    forceUpdate: handleUpdate
  }
}