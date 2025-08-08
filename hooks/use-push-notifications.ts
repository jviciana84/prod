import { useState, useCallback, useEffect } from "react"

// PUSH NOTIFICATIONS ANULADO - Solo campana activa
export function usePushNotifications() {
  const [isSupported] = useState(false) // Siempre false - push anulado
  const [isSubscribed] = useState(false) // Siempre false - push anulado
  const [permission] = useState<NotificationPermission>("denied") // Siempre denied - push anulado
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsPermission] = useState(false) // Siempre false - push anulado

  // Funciones anuladas - retornan valores por defecto
  const requestPermissionAndSubscribe = useCallback(async () => {
    throw new Error("Push notifications anuladas - solo campana activa")
  }, [])

  const subscribe = useCallback(async () => {
    throw new Error("Push notifications anuladas - solo campana activa")
  }, [])

  const unsubscribe = useCallback(async () => {
    throw new Error("Push notifications anuladas - solo campana activa")
  }, [])

  const dismissPermissionRequest = useCallback(() => {
    // No hacer nada - push anulado
  }, [])

  const refreshState = useCallback(() => {
    // No hacer nada - push anulado
  }, [])

  return {
    isSupported,
    isSubscribed,
    permission,
    subscription,
    isLoading,
    error,
    needsPermission,
    requestPermissionAndSubscribe,
    subscribe,
    unsubscribe,
    dismissPermissionRequest,
    refreshState,
  }
}
