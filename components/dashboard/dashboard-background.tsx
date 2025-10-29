"use client"

import { usePathname } from "next/navigation"

export function DashboardBackground() {
  const pathname = usePathname()
  
  // Rutas que NO deben tener el fondo gradiente (portales externos)
  const excludeRoutes = [
    '/dashboard/admin/soporte',
    '/tasacion',
    '/backoffice/tasaciones'
  ]
  
  const shouldExclude = excludeRoutes.some(route => pathname?.startsWith(route))
  
  if (shouldExclude) {
    // Fondo original para portales externos
    return (
      <div className="fixed inset-0 -z-10 pointer-events-none dark:block hidden" style={{background: '#111A23'}} />
    )
  }
  
  // Fondo gradiente premium SOLO en modo oscuro
  return (
    <>
      {/* Modo oscuro: gradiente premium */}
      <div className="fixed inset-0 -z-10 pointer-events-none dark:block hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
      
      {/* Otros temas: fondo original */}
      <div className="fixed inset-0 -z-10 pointer-events-none dark:hidden" style={{background: '#111A23'}} />
    </>
  )
}

