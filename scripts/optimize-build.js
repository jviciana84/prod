const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Optimizando compilación...')

const projectRoot = process.cwd()

// Verificar si existe .next
const nextDir = path.join(projectRoot, '.next')
if (fs.existsSync(nextDir)) {
  console.log('🗑️  Eliminando build anterior...')
  try {
    fs.rmSync(nextDir, { recursive: true, force: true })
  } catch (error) {
    console.log('⚠️  No se pudo eliminar .next:', error.message)
  }
}

// Limpiar caché de Next.js
console.log('🧹 Limpiando caché de Next.js...')
try {
  execSync('npx next clean', { stdio: 'inherit' })
} catch (error) {
  console.log('⚠️  Error limpiando caché:', error.message)
}

// Compilar en modo producción
console.log('📦 Compilando en modo producción...')
try {
  execSync('npm run build', { stdio: 'inherit' })
  console.log('✅ Compilación completada exitosamente')
} catch (error) {
  console.log('❌ Error en la compilación:', error.message)
  process.exit(1)
}

// Mostrar estadísticas del build
const buildDir = path.join(projectRoot, '.next')
if (fs.existsSync(buildDir)) {
  console.log('📊 Estadísticas del build:')
  try {
    const stats = fs.statSync(buildDir)
    console.log(`   Tamaño total: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  } catch (error) {
    console.log('⚠️  No se pudieron obtener estadísticas')
  }
}

console.log('🎉 Optimización completada')
console.log('🚀 Ejecuta "npm run dev" para iniciar el servidor de desarrollo') 