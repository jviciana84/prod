import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'

// Crear un favicon redondo con las iniciales CVO
function createRoundFavicon() {
  const size = 32
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Fondo transparente
  ctx.clearRect(0, 0, size, size)

  // Crear círculo de fondo
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI)
  ctx.fillStyle = '#1e40af' // Azul BMW
  ctx.fill()

  // Añadir borde sutil
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.stroke()

  // Texto CVO
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('CVO', size / 2, size / 2)

  // Guardar como PNG
  const buffer = canvas.toBuffer('image/png')
  const outputPath = path.join(process.cwd(), 'public', 'favicon-round.png')
  fs.writeFileSync(outputPath, buffer)

  console.log('✅ Favicon redondo creado en:', outputPath)
}

// Crear también versión ICO (más simple, solo PNG)
function createIcoVersion() {
  const size = 32
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Fondo transparente
  ctx.clearRect(0, 0, size, size)

  // Crear círculo de fondo
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI)
  ctx.fillStyle = '#1e40af' // Azul BMW
  ctx.fill()

  // Añadir borde sutil
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.stroke()

  // Texto CVO
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('CVO', size / 2, size / 2)

  // Guardar como PNG (para usar como ICO)
  const buffer = canvas.toBuffer('image/png')
  const outputPath = path.join(process.cwd(), 'public', 'favicon-round.ico')
  fs.writeFileSync(outputPath, buffer)

  console.log('✅ Favicon ICO redondo creado en:', outputPath)
}

// Ejecutar
try {
  createRoundFavicon()
  createIcoVersion()
} catch (error) {
  console.error('❌ Error creando favicon:', error)
} 