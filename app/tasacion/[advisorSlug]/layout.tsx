'use client'

import type { Metadata } from 'next'
import { useEffect } from 'react'

export const metadata: Metadata = {
  title: 'Portal Tasaciones',
  description: 'Sistema para tasación de vehículos',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    title: 'Portal Tasaciones',
    description: 'Sistema para tasación de vehículos',
    type: 'website',
    siteName: 'Portal Tasaciones',
    images: [
      {
        url: '/svg/tasaciones-icon.svg',
        width: 512,
        height: 512,
        alt: 'Portal Tasaciones',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal Tasaciones',
    description: 'Sistema para tasación de vehículos',
    images: ['/svg/tasaciones-icon.svg'],
  },
  icons: {
    icon: '/svg/tasaciones-icon.svg',
    apple: '/svg/tasaciones-icon.svg',
  },
}

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

