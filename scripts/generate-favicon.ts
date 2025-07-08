import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'

async function generateFavicon() {
  try {
    console.log('🎨 Generando favicon tricolor con CVO...')
    
    // Crear canvas para favicon (32x32 es el tamaño estándar)
    const canvas = createCanvas(32, 32)
    const ctx = canvas.getContext('2d')
    
    // Colores de fondo
    const colorLeft = 'rgb(129, 196, 255)'
    const colorCenter = 'rgb(22, 88, 142)'
    const colorRight = 'rgb(231, 34, 46)'
    
    // Dibujar columna izquierda
    ctx.fillStyle = colorLeft
    ctx.fillRect(0, 0, 32 / 3, 32)
    // Dibujar columna central
    ctx.fillStyle = colorCenter
    ctx.fillRect(32 / 3, 0, 32 / 3, 32)
    // Dibujar columna derecha
    ctx.fillStyle = colorRight
    ctx.fillRect((32 / 3) * 2, 0, 32 / 3, 32)
    
    // Letras CVO en blanco, centradas
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.fillText('CVO', 16, 16)
    
    // Convertir a buffer
    const buffer = canvas.toBuffer('image/png')
    
    // Guardar como favicon.ico (aunque es PNG, los navegadores lo aceptan)
    const publicPath = path.join(process.cwd(), 'public')
    const faviconPath = path.join(publicPath, 'favicon.ico')
    
    fs.writeFileSync(faviconPath, buffer)
    
    console.log('✅ Favicon tricolor con CVO generado exitosamente en:', faviconPath)
    
    // También generar favicon.png para compatibilidad
    const faviconPngPath = path.join(publicPath, 'favicon.png')
    fs.writeFileSync(faviconPngPath, buffer)
    
    console.log('✅ Favicon PNG tricolor con CVO generado en:', faviconPngPath)
    
  } catch (error) {
    console.error('❌ Error generando favicon:', error)
  }
}

generateFavicon()
