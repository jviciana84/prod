import { useEffect, useRef } from "react"

// PUSH PROCESSOR ANULADO - Solo campana activa
export function usePushProcessor() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // PUSH NOTIFICATIONS ANULADO - No procesar push
    console.log("Push processor anulado - solo campana activa")
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return null
}
