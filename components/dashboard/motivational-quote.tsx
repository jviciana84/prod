"use client"

import { useEffect, useState, useRef } from "react"

interface MotivationalQuoteProps {
  quote: string
}

export function MotivationalQuote({ quote }: MotivationalQuoteProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  const [isErasing, setIsErasing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [showQuotes, setShowQuotes] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const changeQuoteIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cursorBlinkRef = useRef<NodeJS.Timeout | null>(null)

  // Efecto para la animación de escritura y borrado
  useEffect(() => {
    let index = 0

    // Función para simular la escritura con velocidad natural
    const typeText = () => {
      if (index <= quote.length) {
        setDisplayedText(quote.substring(0, index))
        index++

        // Velocidad más natural - más rápida pero con variaciones
        const randomDelay = Math.floor(Math.random() * 80) + 120 // Entre 120ms y 200ms
        intervalRef.current = setTimeout(typeText, randomDelay)
      } else {
        // Cuando termina de escribir
        setIsTyping(false)
        setIsLoading(true)

        // Mostrar las comillas al finalizar
        setShowQuotes(true)

        // Simular carga durante 1 segundo
        setTimeout(() => {
          setIsLoading(false)
          // Iniciar el parpadeo del cursor solo después de terminar
          startCursorBlink()
        }, 1000)
      }
    }

    // Función para simular el borrado con velocidad moderada
    const eraseText = () => {
      // Ocultar las comillas al comenzar a borrar
      setShowQuotes(false)

      if (index > 0) {
        index--
        setDisplayedText(quote.substring(0, index))

        // Velocidad para el borrado
        const randomDelay = Math.floor(Math.random() * 50) + 80 // Entre 80ms y 130ms
        intervalRef.current = setTimeout(eraseText, randomDelay)
      } else {
        // Cuando termina de borrar
        setIsErasing(false)
        setIsTyping(true)

        // Comenzar a escribir de nuevo después de una pequeña pausa
        intervalRef.current = setTimeout(typeText, 800)
      }
    }

    // Función para iniciar el parpadeo del cursor
    const startCursorBlink = () => {
      cursorBlinkRef.current = setInterval(() => {
        setShowCursor((prev) => !prev)
      }, 650) // Velocidad de parpadeo estilo retro
    }

    // Iniciar la animación de escritura con un pequeño retraso inicial
    if (isTyping && !isErasing) {
      // Asegurarse de que las comillas estén ocultas al inicio
      setShowQuotes(false)
      intervalRef.current = setTimeout(typeText, 600)
    }

    // Iniciar la animación de borrado si es necesario
    if (isErasing) {
      index = displayedText.length
      intervalRef.current = setTimeout(eraseText, 600)
    }

    // Configurar el cambio de frase cada 5 minutos
    changeQuoteIntervalRef.current = setInterval(
      () => {
        // Detener el parpadeo del cursor
        if (cursorBlinkRef.current) {
          clearInterval(cursorBlinkRef.current)
        }

        // Iniciar el proceso de borrado
        setIsTyping(false)
        setIsErasing(true)
        setShowCursor(true) // Asegurar que el cursor sea visible durante el borrado
      },
      5 * 60 * 1000,
    ) // 5 minutos

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
      if (changeQuoteIntervalRef.current) clearInterval(changeQuoteIntervalRef.current)
      if (cursorBlinkRef.current) clearInterval(cursorBlinkRef.current)
    }
  }, [quote, isErasing])

  return (
    <div className="mt-1 text-sm text-muted-foreground">
      <div className="flex items-center">
        {showQuotes && <span className="text-primary text-xs">❝</span>}
        <span className={`italic ${isLoading ? "text-loading" : ""}`}>{displayedText}</span>
        {showQuotes && <span className="text-primary text-xs">❞</span>}

        {/* Cursor más largo y realista */}
        <span
          className={`inline-block h-[16px] w-[2px] bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 ${
            isTyping || isErasing || showCursor ? "opacity-100" : "opacity-0"
          } ${isTyping || isErasing ? "" : "transition-opacity duration-100"}`}
          style={{
            marginLeft: showQuotes ? "0px" : "1px",
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0)",
          }}
        />
      </div>

      {/* Estilos para el efecto de carga */}
      <style jsx>{`
        @keyframes textLoading {
          0% { color: #d1d5db; }
          50% { color: #6b7280; }
          100% { color: #374151; }
        }
        .text-loading {
          animation: textLoading 1s ease-in-out;
        }
      `}</style>
    </div>
  )
}
