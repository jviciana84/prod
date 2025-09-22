"use client"

import { useState, useEffect } from "react"

interface HydrationSafeProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Componente que previene errores de hidratación al asegurar
 * que el contenido se renderice de forma consistente entre servidor y cliente
 */
export function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // En el servidor y en la primera renderización del cliente, mostrar fallback
  if (!isClient) {
    return <>{fallback}</>
  }

  // Solo después de la hidratación, mostrar el contenido real
  return <>{children}</>
}

/**
 * Hook para manejar estado que puede causar hidratación inconsistente
 */
export function useHydrationSafe<T>(serverValue: T, clientValue: T): T {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient ? clientValue : serverValue
}
