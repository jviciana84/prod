import fs from "fs"
import path from "path"

// Directorio donde se guardarán los avatares
const AVATARS_DIR = path.join(process.cwd(), "public", "avatars")

// Función para generar un avatar por defecto
function generateDefaultAvatar(): void {
  try {
    // Crear el directorio si no existe
    if (!fs.existsSync(AVATARS_DIR)) {
      fs.mkdirSync(AVATARS_DIR, { recursive: true })
    }

    // Crear un SVG simple para el avatar por defecto
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#e0e0e0" />
        <circle cx="100" cy="70" r="40" fill="#a0a0a0" />
        <rect x="60" y="120" width="80" height="60" rx="10" fill="#a0a0a0" />
      </svg>
    `

    const outputPath = path.join(AVATARS_DIR, "default.png")
    fs.writeFileSync(outputPath, svg)
    console.log(`Avatar por defecto generado en ${outputPath}`)
  } catch (error) {
    console.error("Error al generar el avatar por defecto:", error)
  }
}

// Ejecutar la función
generateDefaultAvatar()
