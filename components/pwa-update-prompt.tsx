"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    // Verificar si hay un Service Worker esperando al cargar
    const checkForWaitingSW = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration?.waiting) {
          console.log("🔄 Service Worker esperando activación")
          setShowPrompt(true)
        }
      } catch (error) {
        console.log("Error verificando Service Worker:", error)
      }
    }

    // Escuchar mensajes del Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SW_UPDATED") {
        console.log("🔄 Nueva versión detectada:", event.data.version)
        setShowPrompt(true)
      }
    }

    // Verificar al cargar
    checkForWaitingSW()

    // Escuchar mensajes
    navigator.serviceWorker.addEventListener("message", handleMessage)

    // Detectar cuando Service Worker se actualiza
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return
      refreshing = true
      console.log("🔄 Service Worker actualizado - Recargando...")
      window.location.reload()
    })

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage)
    }
  }, [])

  const handleUpdate = () => {
    setIsUpdating(true)
    
    // Si hay un Service Worker esperando, activarlo
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          // Decirle al SW que se active
          reg.waiting.postMessage({ type: "SKIP_WAITING" })
        } else {
          // Si no hay waiting, simplemente recargar
          window.location.reload()
        }
      })
    } else {
      window.location.reload()
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed top-4 left-4 z-[9999] animate-in slide-in-from-top-5 duration-500">
      <Card
        className={cn(
          "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-2xl border-0",
          "p-4 max-w-sm animate-pulse"
        )}
      >
        {/* Contenido */}
        <div className="flex-1">
          <h3 className="font-bold text-sm mb-1">Actualización disponible</h3>
          <p className="text-xs opacity-90 mb-3">
            Nueva versión v1.2.0 lista. Haz clic para actualizar ahora.
          </p>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            size="sm"
            variant="secondary"
            className="bg-white text-green-600 hover:bg-white/90 font-semibold"
          >
            {isUpdating ? "Actualizando..." : "Actualizar ahora"}
          </Button>
        </div>
      </Card>
    </div>
  )
}

