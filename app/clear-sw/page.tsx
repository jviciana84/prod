'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ClearSWPage() {
  const [status, setStatus] = useState<string>('Preparando...')
  const [registrations, setRegistrations] = useState<any[]>([])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        setRegistrations(regs)
        setStatus(`Encontrados ${regs.length} Service Workers registrados`)
      })
    } else {
      setStatus('Service Workers no soportados en este navegador')
    }
  }, [])

  const clearAllSW = async () => {
    if ('serviceWorker' in navigator) {
      try {
        setStatus('Limpiando Service Workers...')
        const registrations = await navigator.serviceWorker.getRegistrations()
        
        for (let registration of registrations) {
          console.log('🗑️ Desregistrando SW:', registration.scope)
          await registration.unregister()
        }
        
        setStatus(`✅ ${registrations.length} Service Workers eliminados`)
        setRegistrations([])
        
        // Recargar la página después de 2 segundos
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
        
      } catch (error) {
        setStatus(`❌ Error: ${error}`)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">🧹 Limpiar Service Workers</h1>
        
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Estado:</p>
          <p className="font-mono text-sm">{status}</p>
        </div>

        {registrations.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Service Workers encontrados:</p>
            <ul className="text-xs space-y-1">
              {registrations.map((reg, index) => (
                <li key={index} className="font-mono">
                  {reg.scope}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Button 
            onClick={clearAllSW}
            className="w-full"
            disabled={registrations.length === 0}
          >
            🗑️ Limpiar Service Workers
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            ← Volver al Dashboard
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded text-xs">
          <p><strong>Instrucciones:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Haz clic en "Limpiar Service Workers"</li>
            <li>Espera a que se complete la limpieza</li>
            <li>La página se recargará automáticamente</li>
            <li>Prueba navegar entre "Fotos" y "Ventas"</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
