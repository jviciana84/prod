'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, QrCode, Copy, Check } from 'lucide-react'

export function QRShare() {
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CVO Dashboard',
          text: 'Instala la app CVO Dashboard en tu teléfono',
          url: currentUrl
        })
      } catch (error) {
        console.log('Error al compartir:', error)
      }
    } else {
      handleCopy()
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.log('Error al copiar:', error)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-background border rounded-lg">
      <h3 className="font-semibold text-sm">Compartir CVO Dashboard</h3>
      
      <div className="flex gap-2">
        <Button
          onClick={handleShare}
          size="sm"
          className="flex-1"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartir
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQR(!showQR)}
        >
          <QrCode className="h-4 w-4 mr-2" />
          QR
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      {showQR && (
        <div className="flex flex-col items-center gap-2">
          <img 
            src={qrUrl} 
            alt="QR Code para CVO Dashboard"
            className="border rounded-lg"
          />
          <p className="text-xs text-muted-foreground text-center">
            Escanea este código QR para instalar la app
          </p>
        </div>
      )}

      {copied && (
        <p className="text-xs text-green-600">
          URL copiada al portapapeles
        </p>
      )}
    </div>
  )
}
