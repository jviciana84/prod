"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useChat } from "@/contexts/chat-context"

interface GothicEIconProps {
  onClick?: () => void
  className?: string
}

export function GothicEIcon({ onClick, className = "" }: GothicEIconProps) {
  const [isRotated, setIsRotated] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { openChat } = useChat()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const startCycle = () => {
      // Cara A (E gótica) por 4 segundos
      setIsRotated(false)
      
      timeoutId = setTimeout(() => {
        // Cara B (degradado) por 1.6 segundos
        setIsRotated(true)
        
        setTimeout(() => {
          // Volver a empezar el ciclo
          startCycle()
        }, 1600)
      }, 4000)
    }

    startCycle()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const handleClick = () => {
    openChat()
    if (onClick) onClick()
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <Button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      variant="outline"
      size="icon"
      className={`h-6 w-6 rounded-full shadow-sm bg-background/80 backdrop-blur-sm border-2 border-gray-300 dark:border-gray-600 hover:bg-background/90 transition-all duration-200 ${className}`}
    >
      <div className={`relative w-full h-full flip-card ${(isRotated || isHovered) ? 'rotate-y-180' : 'rotate-y-0'}`}>
        {/* Cara con la E gótica (cara frontal) */}
        <div className="absolute inset-0 flex items-center justify-center flip-card-front">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300" style={{ fontFamily: 'serif' }}>
            E
          </span>
        </div>
        
        {/* Cara con degradado y E blanca (cara trasera) */}
        <div className="absolute inset-0 rounded-full flex items-center justify-center flip-card-back bg-gradient-to-r from-blue-500 to-purple-600">
          <span className="text-xs font-bold text-white" style={{ fontFamily: 'serif' }}>
            E
          </span>
        </div>
      </div>
    </Button>
  )
}
