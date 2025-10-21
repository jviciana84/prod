"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function ForcedUpdatePopup() {
  const [showPopup, setShowPopup] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState("Actualización del sistema requerida")
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkForForcedUpdate()

    // Verificar cada 30 segundos si hay actualización forzada
    const interval = setInterval(checkForForcedUpdate, 30000)

    // Escuchar eventos de actualización forzada
    const handleForceUpdate = () => {
      console.log("🔄 Evento de actualización forzada recibido")
      checkForForcedUpdate()
    }

    window.addEventListener('force-update', handleForceUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('force-update', handleForceUpdate)
    }
  }, [])

  const checkForForcedUpdate = async () => {
    try {
      // Consulta directa - patrón correcto para SELECT
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Verificar si hay una actualización forzada activa
      const { data: forcedUpdate } = await supabase
        .from("forced_updates")
        .select("id, is_active, message")
        .single()

      if (!forcedUpdate || !forcedUpdate.is_active) {
        setShowPopup(false)
        return
      }

      // Verificar si el usuario ya actualizó
      const { data: userUpdate, error: userUpdateError } = await supabase
        .from("user_forced_updates")
        .select("id")
        .eq("user_id", user.id)
        .eq("forced_update_id", forcedUpdate.id)
        .maybeSingle()

      if (userUpdateError) {
        console.error("Error al verificar user_forced_updates:", userUpdateError)
        // Continuar sin mostrar popup si hay error
        setShowPopup(false)
        return
      }

      if (userUpdate && userUpdate.id) {
        // Ya actualizó
        setShowPopup(false)
        return
      }

      // Mostrar popup
      setMessage(forcedUpdate.message || "Actualización del sistema requerida")
      setShowPopup(true)
      console.log("🔄 Popup de actualización forzada mostrado")
    } catch (error) {
      console.error("Error al verificar actualización forzada:", error)
    }
  }

  const handleUpdate = async () => {
    setIsUpdating(true)

    try {
      // Obtener el userId actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error("No se pudo obtener el usuario actual")
        setIsUpdating(false)
        return
      }

      // Marcar que el usuario actualizó - usa API Route (mutación)
      await fetch("/api/forced-updates/mark-updated", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      })

      // Limpiar todo el localStorage relacionado con CVO
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) keysToRemove.push(key)
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Limpiar sessionStorage
      sessionStorage.clear()

      // Limpiar Service Worker cache si existe
      if ("serviceWorker" in navigator && "caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }

      // Hard reload (equivalente a Ctrl+Shift+R)
      window.location.reload()
    } catch (error) {
      console.error("Error al actualizar:", error)
      setIsUpdating(false)
    }
  }

  if (!showPopup) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      <Card
        className={cn(
          "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xl border-0",
          "p-3 max-w-xs animate-in zoom-in-95 duration-300"
        )}
      >
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center gap-0.5">
            <RefreshCw className={cn("h-4 w-4 flex-shrink-0", isUpdating && "animate-spin")} />
            <span className="text-[8px] opacity-75 whitespace-nowrap">~1s</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xs mb-1">Actualización requerida</h3>
            <p className="text-[10px] opacity-90 mb-2 leading-tight">
              {message}
            </p>
            <div className="flex justify-center">
              <Button
                onClick={handleUpdate}
                disabled={isUpdating}
                size="sm"
                className="bg-white text-red-600 hover:bg-white/90 font-semibold h-7 text-xs"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar ahora"
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

