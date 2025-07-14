"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface LoadingFallbackProps {
  message?: string
  timeout?: number
}

export function LoadingFallback({ 
  message = "Cargando aplicación...", 
  timeout = 10000 
}: LoadingFallbackProps) {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"></div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold">CVO Dashboard</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          
          {showTimeoutMessage && (
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                La carga está tomando más tiempo de lo esperado...
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-primary hover:underline"
              >
                Recargar página
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Hook para detectar problemas de carga
export function useLoadingTimeout(timeout = 10000) {
  const [hasTimedOut, setHasTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasTimedOut(true)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  return hasTimedOut
} 