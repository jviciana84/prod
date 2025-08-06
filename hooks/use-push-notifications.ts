"use client"

import { useState, useEffect, useCallback } from "react"

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener el userId del cliente
  const getUserId = async () => {
    try {
      const { createClientComponentClient } = await import("@/lib/supabase/client")
      const supabaseClient = createClientComponentClient()
      const { data: { user } } = await supabaseClient.auth.getUser()
      return user?.id
    } catch (error) {
      console.error("Error obteniendo userId:", error)
      return null
    }
  }

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Check support without making any network requests
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      checkExistingSubscription()
    }
  }, [])

  const checkExistingSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const existingSubscription = await registration.pushManager.getSubscription()
        if (existingSubscription) {
          setSubscription(existingSubscription)
          setIsSubscribed(true)
        }
      }
    } catch (error) {
      console.error("Error checking existing subscription:", error)
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error("No disponible en el servidor")
    }

    if (!isSupported) {
      throw new Error("Las notificaciones push no están soportadas")
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Request permission
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== "granted") {
        throw new Error("Permisos no concedidos")
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      // Get VAPID key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error("VAPID public key no configurada")
      }

      // Create subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

      // Save to server
      const response = await fetch("/api/notifications/subscribe-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: newSubscription.endpoint,
            keys: {
              p256dh: newSubscription.getKey("p256dh")
                ? btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey("p256dh")!)))
                : null,
              auth: newSubscription.getKey("auth")
                ? btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey("auth")!)))
                : null,
            },
          },
          userId: await getUserId(), // Enviar userId del cliente
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 401) {
          throw new Error("Debes iniciar sesión para activar las notificaciones push")
        } else {
          throw new Error(errorData.error || "Error guardando suscripción")
        }
      }

      setSubscription(newSubscription)
      setIsSubscribed(true)

      return { success: true, message: "Notificaciones activadas correctamente" }
    } catch (error) {
      console.error("Error activando notificaciones:", error)
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (typeof window === "undefined") return

    setIsLoading(true)
    setError(null)
    
    try {
      if (subscription) {
        await subscription.unsubscribe()
        await fetch("/api/notifications/unsubscribe-simple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            subscription,
            userId: await getUserId()
          }),
        })
      }

      setSubscription(null)
      setIsSubscribed(false)
    } catch (error) {
      console.error("Error desactivando notificaciones:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  const refreshState = useCallback(async () => {
    if (typeof window === "undefined" || !isSupported) return

    try {
      setIsLoading(true)
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const existingSubscription = await registration.pushManager.getSubscription()
        if (existingSubscription) {
          setSubscription(existingSubscription)
          setIsSubscribed(true)
        } else {
          setSubscription(null)
          setIsSubscribed(false)
        }
      }
    } catch (error) {
      console.error("Error refreshing state:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscription,
    error,
    subscribe,
    unsubscribe,
    refreshState,
    clearError,
  }
}
