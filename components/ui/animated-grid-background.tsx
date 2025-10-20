"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "@/components/theme-provider"

interface AnimatedGridBackgroundProps {
  className?: string
}

export function AnimatedGridBackground({ className = "" }: AnimatedGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!theme) return // Esperar a que el tema esté listo
    
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

    // Colores de BMW M
    const bmwBlue = "#0066B1"
    const bmwPurple = "#6600AA"
    const bmwRed = "#FF0000"

    // Definir la zona central donde está el formulario de login/reset
    const centerZone = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: Math.min(400, canvas.width * 0.8), // Ancho aproximado del formulario
      height: Math.min(500, canvas.height * 0.8), // Alto aproximado del formulario
    }

    // Configuración de las esferas con propiedades de pulsación y cambio dinámico de tamaño
    // MODIFICADO: Reducido significativamente el maxRadiusMultiplier para que no crezcan tanto
    const spheres = [
      {
        x: canvas.width * 0.3,
        y: canvas.height * 0.3,
        baseRadius: 150,
        radius: 150,
        vx: 1.008,
        vy: 0.756,
        color: bmwBlue,
        pulsePhase: 0,
        pulseSpeed: 0.02,
        pulseAmplitude: 15,
        // Nuevas propiedades para cambio dinámico de tamaño
        targetRadius: 150,
        radiusTransitionSpeed: 0.002,
        nextRadiusChangeTime: Date.now() + 5000,
        maxRadiusMultiplier: 1.12, // Reducido de 1.3 a 1.12 (solo 12% más grande)
      },
      {
        x: canvas.width * 0.5,
        y: canvas.height * 0.5,
        baseRadius: 180,
        radius: 180,
        vx: -0.756,
        vy: 1.008,
        color: bmwPurple,
        pulsePhase: Math.PI * 0.6,
        pulseSpeed: 0.015,
        pulseAmplitude: 20,
        // Nuevas propiedades para cambio dinámico de tamaño
        targetRadius: 180,
        radiusTransitionSpeed: 0.0015,
        nextRadiusChangeTime: Date.now() + 7000,
        maxRadiusMultiplier: 1.1, // Reducido de 1.25 a 1.1 (solo 10% más grande)
      },
      {
        x: canvas.width * 0.7,
        y: canvas.height * 0.7,
        baseRadius: 120,
        radius: 120,
        vx: 0.882,
        vy: -0.882,
        color: bmwRed,
        pulsePhase: Math.PI * 1.2,
        pulseSpeed: 0.025,
        pulseAmplitude: 12,
        // Nuevas propiedades para cambio dinámico de tamaño
        targetRadius: 120,
        radiusTransitionSpeed: 0.0018,
        nextRadiusChangeTime: Date.now() + 6000,
        maxRadiusMultiplier: 1.15, // Reducido de 1.35 a 1.15 (solo 15% más grande)
      },
    ]

    // Configuración de la cuadrícula
    const gridSize = 25
    const gridRows = Math.ceil(canvas.height / gridSize) + 1
    const gridCols = Math.ceil(canvas.width / gridSize) + 1

    // Función para calcular la distancia entre dos esferas
    const distanceBetweenSpheres = (sphere1: (typeof spheres)[0], sphere2: (typeof spheres)[0]) => {
      const dx = sphere1.x - sphere2.x
      const dy = sphere1.y - sphere2.y
      return Math.sqrt(dx * dx + dy * dy)
    }

    // Función para calcular la distancia entre una esfera y el centro del formulario
    const distanceToFormCenter = (sphere: (typeof spheres)[0]) => {
      const dx = sphere.x - centerZone.x
      const dy = sphere.y - centerZone.y
      return Math.sqrt(dx * dx + dy * dy)
    }

    // Función para calcular si una esfera está demasiado dentro de la zona central
    const isTooCloseToCenter = (sphere: (typeof spheres)[0]) => {
      // Calcular la distancia desde el centro de la esfera al borde más cercano del formulario
      const dx = Math.max(0, Math.abs(sphere.x - centerZone.x) - centerZone.width / 2)
      const dy = Math.max(0, Math.abs(sphere.y - centerZone.y) - centerZone.height / 2)
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Permitir que hasta un 20% del radio de la esfera entre en la zona del formulario
      const allowedOverlap = sphere.radius * 0.8

      return distance < allowedOverlap
    }

    // Función para calcular la deformación en un punto basado en la posición de las esferas
    const calculateDeformation = (x: number, y: number) => {
      let offsetX = 0
      let offsetY = 0

      // Array para almacenar las influencias individuales de cada esfera
      const influences: {
        dx: number
        dy: number
        distance: number
        influence: number
      }[] = []

      // Calcular la influencia de cada esfera
      spheres.forEach((sphere) => {
        const dx = x - sphere.x
        const dy = y - sphere.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Usar una función de suavizado para la influencia (curva más suave)
        const maxDistance = sphere.radius * 2
        if (distance < maxDistance) {
          // Calcular la influencia con una curva suave (función cúbica)
          const normalizedDistance = distance / maxDistance
          const influence = Math.max(0, 1 - normalizedDistance * normalizedDistance * normalizedDistance)

          influences.push({ dx, dy, distance, influence })
        }
      })

      // Si hay múltiples esferas influyendo en este punto, permitir más superposición
      if (influences.length > 1) {
        // Ordenar por influencia (mayor primero)
        influences.sort((a, b) => b.influence - a.influence)

        // Reducir menos la influencia de las esferas secundarias para permitir más superposición
        for (let i = 1; i < influences.length; i++) {
          influences[i].influence *= 0.8 // Reducción más suave (antes era 0.5/i)
        }
      }

      // Aplicar las influencias ajustadas
      influences.forEach(({ dx, dy, distance, influence }) => {
        // Limitar el desplazamiento máximo para evitar líneas muy desplazadas
        const maxDisplacement = 20 // Valor fijo para todas las esferas
        const force = influence * maxDisplacement

        // Aplicar una función de suavizado adicional para el desplazamiento
        const smoothForce = force * (0.5 - 0.5 * Math.cos(Math.PI * influence))

        // Calcular el desplazamiento con vectores suavizados
        offsetX += (dx / (distance + 1)) * smoothForce
        offsetY += (dy / (distance + 1)) * smoothForce
      })

      return { offsetX, offsetY }
    }

    // Función de animación actualizada para incluir cambio dinámico de tamaño
    const animate = () => {
      // Limpiar el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Tiempo actual para cambios de tamaño
      const currentTime = Date.now()

      // Actualizar pulsación de las esferas y cambio dinámico de tamaño
      spheres.forEach((sphere) => {
        // Actualizar la fase de pulsación
        sphere.pulsePhase += sphere.pulseSpeed

        // Comprobar si es hora de cambiar el tamaño objetivo
        if (currentTime >= sphere.nextRadiusChangeTime) {
          // MODIFICADO: Rango más limitado para el cambio de tamaño
          // Establecer un nuevo radio objetivo (entre el tamaño base y el máximo permitido)
          sphere.targetRadius = sphere.baseRadius * (1 + Math.random() * (sphere.maxRadiusMultiplier - 1))

          // Establecer el próximo tiempo de cambio
          sphere.nextRadiusChangeTime = currentTime + 5000 + Math.random() * 5000
        }

        // Transición suave hacia el radio objetivo
        if (sphere.radius !== sphere.targetRadius) {
          const diff = sphere.targetRadius - sphere.radius
          sphere.radius += diff * sphere.radiusTransitionSpeed
        }

        // Calcular el nuevo radio basado en la pulsación
        sphere.radius += Math.sin(sphere.pulsePhase) * sphere.pulseAmplitude

        // Asegurar que el radio nunca sea menor que el tamaño base
        sphere.radius = Math.max(sphere.baseRadius, sphere.radius)
      })

      // Actualizar posición de las esferas
      spheres.forEach((sphere, index) => {
        // Guardar la posición anterior
        const prevX = sphere.x
        const prevY = sphere.y

        // Actualizar posición
        sphere.x += sphere.vx
        sphere.y += sphere.vy

        // Rebotar en los bordes
        if (sphere.x - sphere.radius < 0 || sphere.x + sphere.radius > canvas.width) {
          sphere.vx *= -1
          sphere.x = prevX // Restaurar posición para evitar que se atasque en el borde
        }
        if (sphere.y - sphere.radius < 0 || sphere.y + sphere.radius > canvas.height) {
          sphere.vy *= -1
          sphere.y = prevY // Restaurar posición para evitar que se atasque en el borde
        }

        // Evitar que las esferas entren demasiado en la zona central
        if (isTooCloseToCenter(sphere)) {
          // Calcular vector desde el centro del formulario hacia la esfera
          const dx = sphere.x - centerZone.x
          const dy = sphere.y - centerZone.y
          const angle = Math.atan2(dy, dx)

          // Aplicar una fuerza de repulsión más fuerte
          const repulsionForce = 0.2
          sphere.vx += Math.cos(angle) * repulsionForce
          sphere.vy += Math.sin(angle) * repulsionForce

          // Mover la esfera fuera de la zona de colisión
          const minDistance = sphere.radius * 0.8 // Permitir 20% de superposición
          const currentDistance = distanceToFormCenter(sphere)

          if (currentDistance < minDistance) {
            // Mover la esfera hacia afuera
            sphere.x = centerZone.x + Math.cos(angle) * minDistance
            sphere.y = centerZone.y + Math.sin(angle) * minDistance
          }
        }

        // Permitir más superposición entre esferas, pero evitar que se atraviesen completamente
        for (let i = 0; i < spheres.length; i++) {
          if (i !== index) {
            const otherSphere = spheres[i]
            const minDistance = (sphere.radius + otherSphere.radius) * 0.42 // Permitir más superposición (42% en lugar de 70%)
            const currentDistance = distanceBetweenSpheres(sphere, otherSphere)

            if (currentDistance < minDistance) {
              // Calcular vector de repulsión
              const dx = sphere.x - otherSphere.x
              const dy = sphere.y - otherSphere.y
              const angle = Math.atan2(dy, dx)

              // Ajustar velocidades para alejar las esferas, pero con menos fuerza
              const repulsionForce = 0.03 // Reducido para permitir más superposición
              sphere.vx += Math.cos(angle) * repulsionForce
              sphere.vy += Math.sin(angle) * repulsionForce
              otherSphere.vx -= Math.cos(angle) * repulsionForce
              otherSphere.vy -= Math.sin(angle) * repulsionForce

              // Limitar la velocidad máxima
              const maxSpeed = 3.78
              const speedSphere = Math.sqrt(sphere.vx * sphere.vx + sphere.vy * sphere.vy)
              const speedOther = Math.sqrt(otherSphere.vx * otherSphere.vx + otherSphere.vy * otherSphere.vy)

              if (speedSphere > maxSpeed) {
                sphere.vx = (sphere.vx / speedSphere) * maxSpeed
                sphere.vy = (sphere.vy / speedSphere) * maxSpeed
              }

              if (speedOther > maxSpeed) {
                otherSphere.vx = (otherSphere.vx / speedOther) * maxSpeed
                otherSphere.vy = (otherSphere.vy / speedOther) * maxSpeed
              }
            }
          }
        }
      })

      // Dibujar la cuadrícula deformada
      const isDarkMode = theme === "dark"
      const gridColor = isDarkMode ? "rgba(180, 180, 180, 0.3)" : "rgba(128, 128, 128, 0.18)"

      // Dibujar líneas verticales
      for (let col = 0; col <= gridCols; col++) {
        ctx.beginPath()
        ctx.strokeStyle = gridColor // Usar siempre el color de la cuadrícula

        for (let row = 0; row <= gridRows; row++) {
          const x = col * gridSize
          const y = row * gridSize
          const { offsetX, offsetY } = calculateDeformation(x, y)

          if (row === 0) {
            ctx.moveTo(x + offsetX, y + offsetY)
          } else {
            ctx.lineTo(x + offsetX, y + offsetY)
          }
        }
        ctx.stroke()
      }

      // Dibujar líneas horizontales
      for (let row = 0; row <= gridRows; row++) {
        ctx.beginPath()
        ctx.strokeStyle = gridColor // Usar siempre el color de la cuadrícula

        for (let col = 0; col <= gridCols; col++) {
          const x = col * gridSize
          const y = row * gridSize
          const { offsetX, offsetY } = calculateDeformation(x, y)

          if (col === 0) {
            ctx.moveTo(x + offsetX, y + offsetY)
          } else {
            ctx.lineTo(x + offsetX, y + offsetY)
          }
        }
        ctx.stroke()
      }

      // Dibujar las esferas con transparencia
      // MODIFICADO: Ajustado el gradiente para mantener mejor la forma esférica
      spheres.forEach((sphere) => {
        const gradient = ctx.createRadialGradient(sphere.x, sphere.y, 0, sphere.x, sphere.y, sphere.radius)
        gradient.addColorStop(0, `${sphere.color}40`) // Aumentado de 33 a 40 (25% opacidad)
        gradient.addColorStop(0.5, `${sphere.color}20`) // Añadido punto intermedio (12.5% opacidad)
        gradient.addColorStop(0.8, `${sphere.color}10`) // Ajustado de 0.7 a 0.8 (6% opacidad)
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.beginPath()
        ctx.arc(sphere.x, sphere.y, sphere.radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // AÑADIDO: Dibujar un borde sutil para reforzar la forma esférica
        ctx.beginPath()
        ctx.arc(sphere.x, sphere.y, sphere.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `${sphere.color}15` // Borde muy sutil (8% opacidad)
        ctx.lineWidth = 1
        ctx.stroke()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [theme])

  return <canvas ref={canvasRef} className={`fixed inset-0 -z-10 ${className}`} style={{ pointerEvents: "none" }} />
}
