"use client"

import { useEffect } from 'react'

export function RoundFavicon() {
  useEffect(() => {
    // Crear un canvas para generar el favicon redondo
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // Fondo transparente
      ctx.clearRect(0, 0, 32, 32)

      // Crear círculo de fondo
      ctx.beginPath()
      ctx.arc(16, 16, 15, 0, 2 * Math.PI)
      ctx.fillStyle = '#1e40af' // Azul BMW
      ctx.fill()

      // Añadir borde sutil
      ctx.beginPath()
      ctx.arc(16, 16, 15, 0, 2 * Math.PI)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.stroke()

      // Texto CVO
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('CVO', 16, 16)

      // Convertir a data URL y establecer como favicon
      const dataURL = canvas.toDataURL('image/png')
      
      // Crear o actualizar el favicon
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.rel = 'icon'
        document.head.appendChild(favicon)
      }
      favicon.href = dataURL
    }
  }, [])

  return null
} 