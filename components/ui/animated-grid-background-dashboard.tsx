"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

interface AnimatedGridBackgroundDashboardProps {
  className?: string
}

export function AnimatedGridBackgroundDashboard({ className = "" }: AnimatedGridBackgroundDashboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar el tamaño del canvas para que coincida con el tamaño de la ventana
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Configuración de la cuadrícula
    const gridSize = 25
    const gridRows = Math.ceil(canvas.height / gridSize) + 1
    const gridCols = Math.ceil(canvas.width / gridSize) + 1

    // Función de animación
    const animate = () => {
      // Limpiar el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Determinar el color base de la cuadrícula según el tema
      const isDarkMode = theme === "dark"

      // Aumentar la intensidad del color de la cuadrícula en un 20%
      // Valores anteriores: 0.14 (oscuro) y 0.084 (claro)
      // Aumento del 20%: 0.14 * 1.2 = 0.168 y 0.084 * 1.2 = 0.1008
      const gridColor = isDarkMode ? "rgba(180, 180, 180, 0.168)" : "rgba(128, 128, 128, 0.1008)"

      // Dibujar líneas verticales de la cuadrícula
      for (let col = 0; col <= gridCols; col++) {
        ctx.beginPath()
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 1
        ctx.moveTo(col * gridSize, 0)
        ctx.lineTo(col * gridSize, canvas.height)
        ctx.stroke()
      }

      // Dibujar líneas horizontales de la cuadrícula
      for (let row = 0; row <= gridRows; row++) {
        ctx.beginPath()
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 1
        ctx.moveTo(0, row * gridSize)
        ctx.lineTo(canvas.width, row * gridSize)
        ctx.stroke()
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [theme])

  return <canvas ref={canvasRef} className={`fixed inset-0 -z-20 ${className}`} style={{ pointerEvents: "none" }} />
}
