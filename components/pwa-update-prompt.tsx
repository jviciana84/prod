"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    // Escuchar mensajes del Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SW_UPDATED") {
        console.log("🔄 Nueva versión detectada:", event.data.version)
        setShowPrompt(true)
      }
    }

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

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 duration-500">
      <Card
        className={cn(
          "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-2xl border-0",
          "p-4 pr-12 max-w-sm relative"
        )}
      >
        {/* Botón cerrar */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Contenido */}
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <RefreshCw className={cn("h-5 w-5", isUpdating && "animate-spin")} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1">Nueva versión disponible</h3>
            <p className="text-xs opacity-90 mb-3">
              Hay una actualización importante. Haz clic para actualizar ahora.
            </p>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-white/90 font-semibold"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Actualizar ahora
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

