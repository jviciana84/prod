import { useCallback } from 'react'

interface AutoCleanupOptions {
  vehicleId: string
  licensePlate?: string
  model?: string
}

export function useAutoCleanupSoldVehicle() {
  const cleanupSoldVehicle = useCallback(async (options: AutoCleanupOptions) => {
    try {
      console.log('🤖 Iniciando limpieza automática para vehículo:', options.vehicleId)
      
      const response = await fetch('/api/auto-cleanup-sold-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: options.vehicleId,
          licensePlate: options.licensePlate,
          model: options.model
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Error en limpieza automática:', data)
        return { success: false, error: data.message || 'Error en limpieza automática' }
      }

      console.log('✅ Limpieza automática exitosa:', data)
      return { success: true, data }

    } catch (error) {
      console.error('💥 Error crítico en limpieza automática:', error)
      return { success: false, error: error.message }
    }
  }, [])

  return { cleanupSoldVehicle }
}
