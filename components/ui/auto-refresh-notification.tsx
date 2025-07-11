"use client"

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

interface AutoRefreshNotificationProps {
  isActive: boolean
  onRefresh: () => void
  showNotifications?: boolean
}

export function AutoRefreshNotification({
  isActive,
  onRefresh,
  showNotifications = true
}: AutoRefreshNotificationProps) {
  const [lastNotification, setLastNotification] = useState<Date | null>(null)

  useEffect(() => {
    if (!isActive || !showNotifications) return

    const handleRefresh = () => {
      const now = new Date()
      const timeSinceLastNotification = lastNotification 
        ? now.getTime() - lastNotification.getTime() 
        : Infinity

      // Solo mostrar notificación si han pasado al menos 30 segundos desde la última
      if (timeSinceLastNotification > 30000) {
        toast.success('Datos actualizados automáticamente', {
          icon: <RefreshCw className="h-4 w-4" />,
          duration: 3000,
          position: 'bottom-right'
        })
        setLastNotification(now)
      }
    }

    // Simular el refresh para mostrar la notificación
    const interval = setInterval(handleRefresh, 10 * 60 * 1000) // 10 minutos

    return () => clearInterval(interval)
  }, [isActive, showNotifications, lastNotification])

  return null // Este componente no renderiza nada visualmente
} 