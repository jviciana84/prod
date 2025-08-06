import { useEffect, useRef } from "react"

export function usePushProcessor() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Procesar push notifications cada 30 segundos
    const processPushNotifications = async () => {
      try {
        const response = await fetch("/api/notifications/process-pending-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.processed > 0) {
            console.log(`📱 Procesadas ${result.processed} notificaciones, ${result.pushSent} push enviadas`)
          }
        }
      } catch (error) {
        console.error("Error procesando push notifications:", error)
      }
    }

    // Procesar inmediatamente al cargar
    processPushNotifications()

    // Configurar intervalo para procesar cada 30 segundos
    intervalRef.current = setInterval(processPushNotifications, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return null
} 