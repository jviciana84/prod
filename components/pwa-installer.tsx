'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Smartphone, Share2 } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [isTaskacionRoute, setIsTaskacionRoute] = useState(false)

  // Función para cerrar el modal
  const handleDismiss = useCallback(() => {
    setShowInstallPrompt(false)
    setCountdown(5) // Reiniciar para la próxima vez
  }, [])

  useEffect(() => {
    // Detectar si estamos en ruta de tasaciones
    const checkRoute = () => {
      const path = window.location.pathname
      const isTasacion = path.startsWith('/tasacion') || path.includes('/backoffice/tasaciones')
      setIsTaskacionRoute(isTasacion)
      
      // Si estamos en tasaciones, cerrar prompt inmediatamente
      if (isTasacion && showInstallPrompt) {
        setShowInstallPrompt(false)
      }
    }
    
    checkRoute()
    
    // Verificar ruta en cada cambio de URL
    const intervalCheck = setInterval(checkRoute, 500)
    
    // Detectar si es móvil
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registrado: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registro falló: ', registrationError)
        })
    }

    // Escuchar evento de instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      // NO mostrar en tasaciones NUNCA
      const path = window.location.pathname
      if (path.startsWith('/tasacion')) {
        e.preventDefault()
        return
      }
      
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
      setCountdown(5) // Reiniciar countdown al mostrar
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('resize', checkMobile)
      clearInterval(intervalCheck)
    }
  }, [showInstallPrompt]), [])

  // Countdown timer
  useEffect(() => {
    if (!showInstallPrompt) return

    if (countdown === 0) {
      handleDismiss()
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [showInstallPrompt, countdown, handleDismiss])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('Usuario aceptó la instalación')
    } else {
      console.log('Usuario rechazó la instalación')
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CVO Dashboard',
          text: 'Instala la app CVO Dashboard en tu teléfono',
          url: window.location.href
        })
      } catch (error) {
        console.log('Error al compartir:', error)
      }
    } else {
      // Fallback: copiar URL al portapapeles
      navigator.clipboard.writeText(window.location.href)
      alert('URL copiada al portapapeles')
    }
  }

  // No mostrar en rutas de tasaciones
  if (!showInstallPrompt || isTaskacionRoute) return null

  // Calcular progreso del círculo (0 a 100)
  const progress = ((5 - countdown) / 5) * 100

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">
          {isMobile ? 'Instalar CVO en tu teléfono' : 'Instalar CVO Dashboard'}
        </h3>
        
        {/* Botón de cerrar con countdown circular */}
        <button
          onClick={handleDismiss}
          className="relative h-8 w-8 flex items-center justify-center hover:opacity-80 transition-opacity"
          aria-label="Cerrar"
        >
          {/* Círculo de fondo */}
          <svg className="absolute inset-0 w-8 h-8 -rotate-90" viewBox="0 0 36 36">
            {/* Círculo gris de fondo */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted-foreground/20"
            />
            {/* Círculo de progreso */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="100"
              strokeDashoffset={100 - progress}
              className="text-primary transition-all duration-1000 ease-linear"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Número del countdown */}
          <span className="relative z-10 text-sm font-semibold text-foreground">
            {countdown}
          </span>
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {isMobile 
          ? 'Instala la app para acceder más rápido desde tu pantalla de inicio'
          : 'Instala la app para acceder más rápido y sin barra de direcciones'
        }
      </p>
      <div className="flex gap-2">
        <Button
          onClick={handleInstallClick}
          size="sm"
          className="flex-1"
        >
          {isMobile ? <Smartphone className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          Instalar
        </Button>
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDismiss}
        >
          Más tarde
        </Button>
      </div>
    </div>
  )
}
