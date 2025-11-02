'use client'

import { useEffect } from 'react'

export default function TasacionClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Forzar orientación vertical en todas las páginas de tasación
    if (typeof window !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
      screen.orientation.lock('portrait').catch((err) => {
        console.log('No se pudo bloquear la orientación:', err)
      })
    }
    
    // Ocultar sidebar y navegación del dashboard en tasaciones
    const style = document.createElement('style')
    style.textContent = `
      .dashboard-sidebar,
      .dashboard-header,
      .dashboard-footer,
      .mobile-sidebar,
      nav,
      header {
        display: none !important;
      }
      
      body {
        overflow-x: hidden;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      // Liberar bloqueo al salir
      if (typeof window !== 'undefined' && screen.orientation && 'unlock' in screen.orientation) {
        screen.orientation.unlock()
      }
      // Remover estilos al desmontar
      document.head.removeChild(style)
    }
  }, [])
  
  return <>{children}</>
}

