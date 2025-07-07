import { createCanvas } from "canvas"
import fs from "fs"
import path from "path"

// This script generates a favicon and saves it to the public directory
// Run this script locally before deploying: npx tsx scripts/generate-favicon.ts

function generateFavicon() {
  // Create a canvas for generating the favicon
  const canvas = createCanvas(64, 64)
  const ctx = canvas.getContext("2d")

  // Colores de BMW M
  const bmwBlue = "#0066B1"
  const bmwPurple = "#6600AA"
  const bmwRed = "#FF0000"

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Fondo transparente
  ctx.fillStyle = "transparent"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Dibujar un círculo dividido en tres secciones con los colores de BMW M
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = canvas.width / 2 - 1

  // Sección azul (parte superior)
  ctx.beginPath()
  ctx.moveTo(centerX, centerY)
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, Math.PI / 6, false)
  ctx.closePath()
  ctx.fillStyle = bmwBlue
  ctx.fill()

  // Sección púrpura (parte inferior derecha)
  ctx.beginPath()
  ctx.moveTo(centerX, centerY)
  ctx.arc(centerX, centerY, radius, Math.PI / 6, (Math.PI * 5) / 6, false)
  ctx.closePath()
  ctx.fillStyle = bmwPurple
  ctx.fill()

  // Sección roja (parte inferior izquierda)
  ctx.beginPath()
  ctx.moveTo(centerX, centerY)
  ctx.arc(centerX, centerY, radius, (Math.PI * 5) / 6, (Math.PI * 3) / 2, false)
  ctx.closePath()
  ctx.fillStyle = bmwRed
  ctx.fill()

  // Añadir un borde blanco
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.strokeStyle = "white"
  ctx.lineWidth = 2
  ctx.stroke()

  // Añadir las letras "CVO" en el centro
  ctx.font = "bold 24px Arial"
  ctx.fillStyle = "white"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("CVO", centerX, centerY)

  // Convertir el canvas a una imagen PNG
  const buffer = canvas.toBuffer("image/png")

  // Guardar el favicon en la carpeta public
  const publicPath = path.join(process.cwd(), "public")
  const faviconPath = path.join(publicPath, "favicon.ico")

  fs.writeFileSync(faviconPath, buffer)
  console.log("Favicon generated successfully at", faviconPath)
}

generateFavicon()
