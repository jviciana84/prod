"use client"

import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScrollIndicatorProps {
  className?: string
  isExpanded?: boolean
}

export function ScrollIndicator({ className, isExpanded = false }: ScrollIndicatorProps) {
  const [showIndicator, setShowIndicator] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  useEffect(() => {
    // Solo mostrar indicadores cuando esté expandido
    if (!isExpanded) {
      setShowIndicator(false)
      return
    }

    const checkScrollability = () => {
      // Buscar el contenedor de navegación del sidebar
      const nav = document.querySelector('.dashboard-sidebar nav')
      if (!nav) return

      const { scrollTop, scrollHeight, clientHeight } = nav
      
      setCanScrollUp(scrollTop > 0)
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 1)
      
      // Mostrar indicador si hay scroll disponible
      setShowIndicator(scrollHeight > clientHeight)
    }

    // Verificar al cargar
    checkScrollability()

    // Verificar en scroll del nav
    const nav = document.querySelector('.dashboard-sidebar nav')
    if (nav) {
      nav.addEventListener('scroll', checkScrollability)
    }
    
    // Verificar en resize
    window.addEventListener('resize', checkScrollability)

    return () => {
      if (nav) {
        nav.removeEventListener('scroll', checkScrollability)
      }
      window.removeEventListener('resize', checkScrollability)
    }
  }, [isExpanded])

  if (!showIndicator) return null

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {/* Indicador superior */}
      {canScrollUp && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 shadow-lg animate-bounce">
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Indicador inferior */}
      {canScrollDown && (
        <div className="absolute bottom-2 right-2 z-10">
          <div className="bg-background/90 backdrop-blur-sm border border-border rounded-full p-1.5 shadow-lg animate-bounce">
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  )
}
