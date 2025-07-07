"use client"

import { useState, useEffect, useCallback } from "react"

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Check support without making any network requests
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
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
      const response = await fetch("/api/notifications/subscribe", {
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
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error guardando suscripción")
      }

      setSubscription(newSubscription)
      setIsSubscribed(true)

      return { success: true, message: "Notificaciones activadas correctamente" }
    } catch (error) {
      console.error("Error activando notificaciones:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    if (typeof window === "undefined") return

    setIsLoading(true)
    try {
      if (subscription) {
        await subscription.unsubscribe()
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        })
      }

      setSubscription(null)
      setIsSubscribed(false)
    } catch (error) {
      console.error("Error desactivando notificaciones:", error)
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
        }
      }
    } catch (error) {
      console.error("Error refreshing state:", error)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscription,
    subscribe,
    unsubscribe,
    refreshState,
  }
}
