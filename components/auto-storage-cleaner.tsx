"use client"

import { useEffect, useState } from "react"
import { autoCleanStorageIfNeeded } from "@/utils/safe-clean-storage"
import { CheckCircle2, AlertCircle } from "lucide-react"

/**
 * 🧹 AUTO LIMPIADOR DE STORAGE
 * 
 * Se ejecuta automáticamente después del login
 * Limpia cookies/localStorage de Supabase corruptos
 * Preserva preferencias de usuario
 * 
 * Solo se ejecuta UNA vez por versión
 */
export function AutoStorageCleaner() {
  const [cleaned, setCleaned] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    // Pequeño delay para no interferir con el login
    const timer = setTimeout(() => {
      try {
        const wasCleaningNeeded = autoCleanStorageIfNeeded()
        
        if (wasCleaningNeeded) {
          console.log('✅ Limpieza automática ejecutada')
          setCleaned(true)
          setShowNotification(true)
          
          // Ocultar notificación después de 5 segundos
          setTimeout(() => {
            setShowNotification(false)
          }, 5000)
        }
      } catch (error) {
        console.error('Error en limpieza automática:', error)
      }
    }, 1000) // 1 segundo después del montaje

    return () => clearTimeout(timer)
  }, [])

  // Notificación opcional (solo si se limpió)
  if (!showNotification || !cleaned) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <div className="rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Sistema optimizado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Datos temporales limpiados. Tus preferencias están intactas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

