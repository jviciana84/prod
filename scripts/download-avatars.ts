import fs from "fs"
import path from "path"
import axios from "axios"

// URLs de los avatares en Google Drive (reemplaza estos con tus URLs reales)
const AVATAR_URLS = [
  "https://drive.google.com/uc?export=download&id=1lzwPDLcUIEtgCCTJTgsKw9A0t3-ouHZo", // 1.png
  // Añade aquí el resto de URLs para los avatares 2.png a 36.png
]

// Directorio donde se guardarán los avatares
const AVATARS_DIR = path.join(process.cwd(), "public", "avatars")

// Función para descargar un archivo
async function downloadFile(url: string, outputPath: string): Promise<void> {
  try {
    // Crear el directorio si no existe
    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    }

    // Descargar el archivo
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    })

    // Guardar el archivo
    const writer = fs.createWriteStream(outputPath)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve)
      writer.on("error", reject)
    })
  } catch (error) {
    console.error(`Error al descargar ${url}:`, error)
    throw error
  }
}

// Función para generar un avatar de placeholder si la descarga falla
function generatePlaceholderAvatar(outputPath: string, index: number): void {
  try {
    // Crear un SVG simple con el número del avatar
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f0f0f0" />
        <text x="100" y="100" font-family="Arial" font-size="80" text-anchor="middle" dominant-baseline="middle" fill="#888888">
          ${index}
        </text>
      </svg>
    `

    fs.writeFileSync(outputPath, svg)
    console.log(`Generado avatar placeholder para ${path.basename(outputPath)}`)
  } catch (error) {
    console.error(`Error al generar placeholder para ${outputPath}:`, error)
  }
}

// Función principal
async function main() {
  console.log("Iniciando descarga de avatares...")

  // Crear el directorio de avatares si no existe
  if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true })
  }

  // Si no hay URLs definidas, generar placeholders para todos los avatares
  if (AVATAR_URLS.length === 0) {
    console.log("No hay URLs definidas. Generando placeholders para todos los avatares...")
    for (let i = 1; i <= 36; i++) {
      const outputPath = path.join(AVATARS_DIR, `${i}.png`)
      generatePlaceholderAvatar(outputPath, i)
    }
    return
  }

  // Descargar cada avatar
  for (let i = 0; i < AVATAR_URLS.length; i++) {
    const url = AVATAR_URLS[i]
    const avatarNumber = i + 1
    const outputPath = path.join(AVATARS_DIR, `${avatarNumber}.png`)

    try {
      console.log(`Descargando avatar ${avatarNumber}...`)
      await downloadFile(url, outputPath)
      console.log(`Avatar ${avatarNumber} descargado correctamente.`)
    } catch (error) {
      console.error(`Error al descargar el avatar ${avatarNumber}. Generando placeholder...`)
      generatePlaceholderAvatar(outputPath, avatarNumber)
    }
  }

  // Generar placeholders para los avatares restantes
  for (let i = AVATAR_URLS.length + 1; i <= 36; i++) {
    const outputPath = path.join(AVATARS_DIR, `${i}.png`)
    if (!fs.existsSync(outputPath)) {
      console.log(`Generando placeholder para avatar ${i}...`)
      generatePlaceholderAvatar(outputPath, i)
    }
  }

  console.log("Proceso de descarga de avatares completado.")
}

// Ejecutar la función principal
main().catch((error) => {
  console.error("Error en el script principal:", error)
  process.exit(1)
})
