'use client'

import { useEffect } from 'react'

export default function TasacionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Forzar orientación vertical en todas las páginas de tasación
    if (screen.orientation && 'lock' in screen.orientation) {
      screen.orientation.lock('portrait').catch((err) => {
        console.log('No se pudo bloquear la orientación:', err)
      })
    }
    
    return () => {
      // Liberar bloqueo al salir
      if (screen.orientation && 'unlock' in screen.orientation) {
        screen.orientation.unlock()
      }
    }
  }, [])
  
  return (
    <>
      <style jsx global>{`
        /* Ocultar sidebar y navegación del dashboard en tasaciones */
        .dashboard-sidebar,
        .dashboard-header,
        .dashboard-footer,
        .mobile-sidebar,
        nav,
        header {
          display: none !important;
        }
        
        /* Asegurar que el contenido ocupe toda la pantalla */
        body {
          overflow-x: hidden;
        }
      `}</style>
      {children}
    </>
  )
}

