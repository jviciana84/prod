"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadingFallbackProps {
  message?: string
  timeout?: number
  showDebugInfo?: boolean
}

export function LoadingFallback({ 
  message = "Cargando aplicación...", 
  timeout = 10000,
  showDebugInfo = false
}: LoadingFallbackProps) {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isReloading, setIsReloading] = useState(false)

  useEffect(() => {
    const startTime = Date.now()
    
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true)
    }, timeout)

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [timeout])

  const handleReload = () => {
    setIsReloading(true)
    window.location.reload()
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

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
            {showDebugInfo && (
              <p className="text-xs text-muted-foreground">
                Tiempo transcurrido: {formatTime(elapsedTime)}
              </p>
            )}
          </div>
          
          {showTimeoutMessage && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Carga lenta detectada</p>
              </div>
              <p className="text-xs text-muted-foreground">
                La carga está tomando más tiempo de lo esperado. 
                Esto puede indicar un problema de conexión o rendimiento.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleReload}
                  disabled={isReloading}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  {isReloading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Recargando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Recargar página
                    </>
                  )}
                </Button>
              </div>
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

// Hook para monitorear el rendimiento de carga
export function useLoadingPerformance() {
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  return {
    elapsedTime,
    isSlow: elapsedTime > 5000, // Considerar lento después de 5 segundos
    isVerySlow: elapsedTime > 15000 // Muy lento después de 15 segundos
  }
} 