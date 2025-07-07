"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

interface CardiogramLineProps {
  className?: string
}

export function CardiogramLine({ className = "" }: CardiogramLineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar el tamaño del canvas para que coincida exactamente con el tamaño de la ventana
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Colores BMW M
    const bmwBlue = "#0066B1" // Azul BMW M
    const bmwPurple = "#2E3192" // Violeta BMW M
    const bmwRed = "#E60000" // Rojo BMW M
    const lineColor = "#FFFFFF" // Color blanco para la línea del cardiograma
    const pointColor = "#FF0000" // Color del punto de luz (BMW Red)

    // Configuración del cardiograma
    const lineY = canvas.height / 2 // Posición vertical en el centro
    const lineWidth = 2 // Grosor de la línea normal
    const finalLineWidth = lineWidth * 4 // Grosor de la línea final (cuádruple)
    const pointRadius = 6 // Radio del punto de luz
    const pointGlowRadius = 12 // Radio del brillo del punto
    const topY = 0 // Posición Y final en la parte superior (sin margen)

    // Configuración de la animación
    let position = 0 // Posición actual de la punta del cardiograma
    const speed = 4 // Velocidad de avance (duplicada)
    const maxAmplitude = 50 // Amplitud máxima de las ondas
    const frequency = 0.1 // Frecuencia de las ondas (duplicada)
    const history: { x: number; y: number }[] = [] // Historial de puntos para dibujar la línea
    const maxHistoryLength = 2000 // Longitud máxima del historial (aumentado para mantener toda la línea)

    // Punto donde comienza la ondulación (8% del ancho de la pantalla)
    const flatEndPoint = canvas.width * 0.08

    // Estados de la animación
    let animationState = "normal" // "normal", "flattening", "colorChange", "rising", "completed", "wave", "returning"
    let flatteningProgress = 0 // Progreso de la fase de aplanamiento (0-100)
    const flatteningDuration = 50 // Duración de la fase de aplanamiento (reducida a la mitad)
    let colorChangeProgress = 0 // Progreso de la fase de cambio de color
    const colorChangeDuration = 30 // Duración de la fase de cambio de color (reducida a la mitad)
    let risingProgress = 0 // Progreso de la fase de subida
    const risingDuration = 75 // Duración de la fase de subida (reducida a la mitad)

    // Variables para la animación de onda
    let waveAnimationStartTime = 0
    const waveDuration = 3000 // Duración de la animación de onda en milisegundos (3 segundos)
    let returningProgress = 0
    const returningDuration = 60 // Duración de la fase de retorno (aumentada para transición más suave)

    // Bandera para controlar si la animación debe continuar
    let continueAnimation = true

    // Función para calcular la altura del cardiograma en un punto dado
    const calculateHeight = (x: number) => {
      // Si estamos en el primer 8% de la pantalla, la línea es plana
      if (x < flatEndPoint) {
        return 0
      }

      // Si estamos en fase de aplanamiento, reducir la amplitud gradualmente
      let amplitudeMultiplier = 1
      if (animationState === "flattening") {
        amplitudeMultiplier = 1 - flatteningProgress / flatteningDuration
      } else if (animationState === "colorChange" || animationState === "rising" || animationState === "completed") {
        amplitudeMultiplier = 0
      }

      // Combinación de ondas sinusoidales para crear un patrón de cardiograma
      const wave1 = Math.sin(x * frequency) * maxAmplitude * 0.5 * amplitudeMultiplier
      const wave2 = Math.sin(x * frequency * 2) * maxAmplitude * 0.3 * amplitudeMultiplier
      const wave3 = Math.sin(x * frequency * 3) * maxAmplitude * 0.2 * amplitudeMultiplier

      // Añadir picos ocasionales para simular latidos
      const heartbeat = x % 200 < 10 ? Math.sin((x % 200) * 0.6) * maxAmplitude * 1.5 * amplitudeMultiplier : 0

      return wave1 + wave2 + wave3 + heartbeat
    }

    // Función para actualizar el historial de puntos
    const updateHistory = () => {
      // Si estamos en fase de aplanamiento, necesitamos actualizar todos los puntos
      if (animationState === "flattening") {
        // Crear un nuevo historial con los mismos puntos X pero con alturas recalculadas
        const newHistory: { x: number; y: number }[] = []

        for (const point of history) {
          const newY = lineY + calculateHeight(point.x)
          newHistory.push({ x: point.x, y: newY })
        }

        // Reemplazar el historial
        history.length = 0
        history.push(...newHistory)
      }
      // Si estamos en fase de subida, mover todos los puntos hacia arriba
      else if (animationState === "rising") {
        const progress = risingProgress / risingDuration
        const currentY = lineY - (lineY - topY) * progress

        // Crear un nuevo historial con los mismos puntos X pero con alturas ajustadas
        const newHistory: { x: number; y: number }[] = []

        for (const point of history) {
          // Mantener la forma plana pero mover hacia arriba
          newHistory.push({ x: point.x, y: currentY })
        }

        // Reemplazar el historial
        history.length = 0
        history.push(...newHistory)
      }
      // En modo normal, solo añadir el punto actual
      else if (animationState === "normal") {
        const currentY = lineY + calculateHeight(position)
        history.push({ x: position, y: currentY })

        // Limitar el tamaño del historial
        if (history.length > maxHistoryLength) {
          history.shift()
        }
      }
    }

    // Función para dibujar la línea con colores
    const drawLine = () => {
      if (
        history.length <= 1 &&
        animationState !== "completed" &&
        animationState !== "wave" &&
        animationState !== "returning"
      )
        return

      // Si estamos en estado de cambio de color, subiendo, completado o retornando, dibujar la línea con tres colores
      if (
        animationState === "colorChange" ||
        animationState === "rising" ||
        animationState === "completed" ||
        animationState === "returning" ||
        animationState === "wave"
      ) {
        // Calcular el grosor actual de la línea (transición suave)
        let currentLineWidth = finalLineWidth // Por defecto usar el grosor final

        // Solo aplicar transición durante la fase de cambio de color
        if (animationState === "colorChange") {
          const progress = colorChangeProgress / colorChangeDuration
          currentLineWidth = lineWidth + (finalLineWidth - lineWidth) * progress
        }
        // No reducir el grosor durante la fase de retorno

        // Dividir la línea en tres segmentos exactos
        const totalLength = canvas.width
        const segmentLength = totalLength / 3

        // Determinar la posición Y actual
        let currentY = lineY
        if (animationState === "rising") {
          currentY = lineY - (lineY - topY) * (risingProgress / risingDuration)
        } else if (animationState === "completed" || animationState === "returning" || animationState === "wave") {
          currentY = topY
        }

        // Primer segmento (Azul BMW M) - Desde el borde izquierdo exacto
        ctx.beginPath()
        ctx.moveTo(0, currentY)
        ctx.lineTo(segmentLength, currentY)
        ctx.strokeStyle = bmwBlue
        ctx.lineWidth = currentLineWidth
        ctx.stroke()

        // Segundo segmento (Violeta BMW M) - Continuación exacta
        ctx.beginPath()
        ctx.moveTo(segmentLength, currentY)
        ctx.lineTo(segmentLength * 2, currentY)
        ctx.strokeStyle = bmwPurple
        ctx.lineWidth = currentLineWidth
        ctx.stroke()

        // Tercer segmento (Rojo BMW M) - Hasta el borde derecho exacto
        ctx.beginPath()
        ctx.moveTo(segmentLength * 2, currentY)
        ctx.lineTo(totalLength, currentY)
        ctx.strokeStyle = bmwRed
        ctx.lineWidth = currentLineWidth
        ctx.stroke()
      }
      // En otros estados, dibujar la línea normalmente
      else {
        ctx.beginPath()
        ctx.moveTo(history[0].x, history[0].y)

        for (let i = 1; i < history.length; i++) {
          ctx.lineTo(history[i].x, history[i].y)
        }

        ctx.strokeStyle = lineColor // Línea blanca
        ctx.lineWidth = lineWidth
        ctx.stroke()
      }
    }

    // Función para una transición suave (curva de Bezier)
    const smoothTransition = (t: number): number => {
      // Función de suavizado cúbica (ease-in-out)
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    // Función para dibujar la onda colorida con colores BMW M
    const drawColorWave = (elapsedTime: number) => {
      // Calcular el progreso de la animación (0 a 1)
      const rawProgress = Math.min(elapsedTime / waveDuration, 1)

      // Aplicar una función de suavizado para las transiciones
      const progress = smoothTransition(rawProgress)

      // Calcular la opacidad con una curva más suave
      // Fade in durante el primer 20%, mantener durante el 60% central, fade out durante el último 20%
      let opacity
      if (rawProgress < 0.2) {
        // Fade in más suave
        opacity = smoothTransition(rawProgress / 0.2)
      } else if (rawProgress > 0.8) {
        // Fade out más suave
        opacity = smoothTransition((1 - rawProgress) / 0.2)
      } else {
        // Mantener opacidad completa
        opacity = 1
      }

      // Calcular el centro y ancho de la región de ondas
      const centerX = canvas.width / 2
      const waveWidth = canvas.width * 0.6 // 60% del ancho de la pantalla

      // Parámetros de las ondas
      const waveLineWidth = 1 // Líneas muy finas
      const maxBarHeight = canvas.height * 0.15 * 0.35 // 35% del tamaño anterior

      // Dibujar barras de audio que emergen de la línea BMW M
      const drawAudioBars = () => {
        const startX = centerX - waveWidth / 2
        const endX = centerX + waveWidth / 2
        const barSpacing = 4 // Espacio entre barras
        const numBars = Math.floor(waveWidth / barSpacing)

        // Determinar el color basado en la posición en la pantalla
        const getColorForPosition = (x: number) => {
          if (x < canvas.width / 3) {
            return bmwBlue
          } else if (x < (2 * canvas.width) / 3) {
            return bmwPurple
          } else {
            return bmwRed
          }
        }

        // Dibujar cada barra
        for (let i = 0; i < numBars; i++) {
          const x = startX + i * barSpacing

          // Calcular la altura de la barra usando varias funciones sinusoidales
          // para crear un patrón de audio realista
          const time = elapsedTime / 1000 // Tiempo en segundos
          const normalizedI = i / numBars // Posición normalizada (0-1)

          // Combinar varias ondas sinusoidales con diferentes frecuencias
          const wave1 = Math.sin(normalizedI * 10 + time * 5) * 0.5
          const wave2 = Math.sin(normalizedI * 20 + time * 3) * 0.3
          const wave3 = Math.sin(normalizedI * 5 + time * 7) * 0.2

          // Añadir un poco de aleatoriedad para que parezca más natural
          const randomFactor = Math.sin(normalizedI * 100 + time * 10) * 0.1

          // Calcular la altura final de la barra
          let barHeight = (wave1 + wave2 + wave3 + randomFactor) * maxBarHeight

          // Asegurar que la altura sea positiva y tenga un mínimo
          barHeight = Math.max(maxBarHeight * 0.1, Math.abs(barHeight))

          // Calcular un factor de amplitud que sea máximo en el centro y se desvanezca hacia los bordes
          const distanceFromCenter = Math.abs((x - startX) / waveWidth - 0.5)
          const amplitudeFactor = Math.exp(-distanceFromCenter * distanceFromCenter * 5)

          // Aplicar el factor de amplitud
          barHeight *= amplitudeFactor

          // Determinar el color basado en la posición
          const barColor = getColorForPosition(x)

          // Dibujar la barra (línea vertical)
          ctx.beginPath()
          ctx.moveTo(x, topY) // Comenzar desde la línea BMW M
          ctx.lineTo(x, topY + barHeight) // Dibujar hacia abajo

          // Aplicar color con transparencia
          ctx.strokeStyle =
            barColor +
            Math.floor(opacity * 255)
              .toString(16)
              .padStart(2, "0")
          ctx.lineWidth = waveLineWidth
          ctx.stroke()
        }
      }

      // Dibujar las barras de audio
      drawAudioBars()
    }

    // Función de animación
    const animate = () => {
      // Limpiar el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Actualizar según el estado de la animación
      if (animationState === "wave") {
        // Calcular el tiempo transcurrido desde el inicio de la animación de onda
        const elapsedTime = Date.now() - waveAnimationStartTime

        // Si ha pasado el tiempo de duración, cambiar al estado de retorno
        if (elapsedTime > waveDuration) {
          animationState = "returning"
          returningProgress = 0
        } else {
          // Dibujar primero la línea base (con colores BMW M)
          drawLine()
          // Luego dibujar la onda de audio encima
          drawColorWave(elapsedTime)
        }
      } else if (animationState === "returning") {
        // Incrementar el progreso de retorno
        returningProgress++

        // Si hemos completado el retorno, volver al estado completado
        if (returningProgress >= returningDuration) {
          animationState = "completed"
        }

        // Dibujar la línea con transición suave
        drawLine()
      } else if (animationState === "normal") {
        // Actualizar la posición
        position += speed

        // Si llegamos al final de la pantalla, cambiar al estado de aplanamiento
        if (position >= canvas.width) {
          animationState = "flattening"
          position = canvas.width // Asegurar que no pase del borde
        }

        // Actualizar el historial con el nuevo punto
        updateHistory()
      } else if (animationState === "flattening") {
        // Incrementar el progreso de aplanamiento
        flatteningProgress++

        // Actualizar todo el historial para aplicar el aplanamiento gradual
        updateHistory()

        // Si hemos completado el aplanamiento, cambiar al estado de cambio de color
        if (flatteningProgress >= flatteningDuration) {
          animationState = "colorChange"
        }
      } else if (animationState === "colorChange") {
        // Incrementar el progreso de cambio de color
        colorChangeProgress++

        // Si hemos completado el cambio de color, comenzar a subir
        if (colorChangeProgress >= colorChangeDuration) {
          animationState = "rising"
        }
      } else if (animationState === "rising") {
        // Incrementar el progreso de subida
        risingProgress++

        // Actualizar todo el historial para mover la línea hacia arriba
        updateHistory()

        // Si hemos completado la subida, cambiar al estado completado
        if (risingProgress >= risingDuration) {
          animationState = "completed"
        }
      } else if (animationState === "completed") {
        // En estado completado, solo dibujamos la línea final
        // No hay más actualizaciones de estado
      }

      // Si no estamos en estado de onda o ya dibujamos la línea en el estado de onda, dibujar la línea del cardiograma
      if (animationState !== "wave") {
        drawLine()
      }

      // Dibujar el punto de luz en la punta solo si estamos en estado normal o aplanando
      if (animationState === "normal" || animationState === "flattening") {
        // Calcular opacidad basada en el progreso de aplanamiento
        const opacity = animationState === "flattening" ? 1 - flatteningProgress / flatteningDuration : 1

        if (opacity > 0) {
          const currentY = history.length > 0 ? history[history.length - 1].y : lineY

          // Primero el brillo (gradiente)
          const gradient = ctx.createRadialGradient(position, currentY, 0, position, currentY, pointGlowRadius)
          gradient.addColorStop(
            0,
            `${pointColor}${Math.floor(opacity * 255)
              .toString(16)
              .padStart(2, "0")}`,
          ) // Opacidad variable
          gradient.addColorStop(
            0.5,
            `${pointColor}${Math.floor(opacity * 136)
              .toString(16)
              .padStart(2, "0")}`,
          ) // 50% * opacidad
          gradient.addColorStop(1, `${pointColor}00`) // 0% opacidad

          ctx.beginPath()
          ctx.arc(position, currentY, pointGlowRadius, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()

          // Luego el punto central
          ctx.beginPath()
          ctx.arc(position, currentY, pointRadius, 0, Math.PI * 2)
          ctx.fillStyle = pointColor
          ctx.globalAlpha = opacity
          ctx.fill()
          ctx.globalAlpha = 1
        }
      }

      // Continuar la animación
      if (continueAnimation) {
        requestAnimationFrame(animate)
      }
    }

    // Iniciar la animación
    animate()

    // Configurar el intervalo para activar la animación de onda cada 3 segundos
    const waveInterval = setInterval(() => {
      if (animationState === "completed") {
        animationState = "wave"
        waveAnimationStartTime = Date.now()
      }
    }, 3000) // 3 segundos (cambiado de 15 segundos)

    // Función para manejar cambios de tamaño de ventana
    const handleResize = () => {
      resizeCanvas()

      // Si la animación ya está completada, redibujar la línea final
      if (animationState === "completed") {
        drawLine()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      continueAnimation = false
      clearInterval(waveInterval)
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [theme])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-5 ${className}`}
      style={{
        pointerEvents: "none",
        margin: 0,
        padding: 0,
        border: 0,
      }}
    />
  )
}
