'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone, Share2 } from 'lucide-react'

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

  useEffect(() => {
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
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

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

  const handleDismiss = () => {
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

  if (!showInstallPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">
          {isMobile ? 'Instalar CVO en tu teléfono' : 'Instalar CVO Dashboard'}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
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
