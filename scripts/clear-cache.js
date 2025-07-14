const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🧹 Limpiando caché y archivos temporales...')

const projectRoot = process.cwd()

// Directorios a limpiar
const dirsToClean = [
  '.next',
  'node_modules/.cache',
  '.turbo',
  'dist',
  'build'
]

// Limpiar directorios
dirsToClean.forEach(dir => {
  const dirPath = path.join(projectRoot, dir)
  if (fs.existsSync(dirPath)) {
    console.log(`🗑️  Eliminando ${dir}`)
    try {
      fs.rmSync(dirPath, { recursive: true, force: true })
    } catch (error) {
      console.log(`⚠️  No se pudo eliminar ${dir}:`, error.message)
    }
  }
})

// Limpiar caché de npm
console.log('📦 Limpiando caché de npm...')
try {
  execSync('npm cache clean --force', { stdio: 'inherit' })
} catch (error) {
  console.log('⚠️  Error limpiando caché de npm:', error.message)
}

// Reinstalar dependencias
console.log('📦 Reinstalando dependencias...')
try {
  execSync('npm install', { stdio: 'inherit' })
} catch (error) {
  console.log('⚠️  Error reinstalando dependencias:', error.message)
}

console.log('✅ Limpieza completada')
console.log('🚀 Ejecuta "npm run dev" para iniciar el servidor de desarrollo') 