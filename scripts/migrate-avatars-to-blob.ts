import fs from "fs"
import path from "path"
import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"

// Configuración
const AVATARS_DIR = path.join(process.cwd(), "public/avatars")
const AVATARS_COUNT = 35 // Ajusta según la cantidad de avatares que tengas

// Cliente de Supabase con rol de servicio para operaciones administrativas
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function migrateAvatarsToBlob() {
  console.log("Iniciando migración de avatares a Vercel Blob...")

  // Crear tabla de mapeo si no existe
  await createMappingTable()

  // Verificar si ya existen mapeos
  const { data: existingMappings } = await supabaseAdmin.from("avatar_mappings").select("local_path, blob_url")

  const mappings = existingMappings || []
  console.log(`Se encontraron ${mappings.length} mapeos existentes.`)

  // Mapeo para evitar duplicados
  const mappingDict: Record<string, string> = {}
  mappings.forEach((m) => {
    mappingDict[m.local_path] = m.blob_url
  })

  // Procesar cada avatar
  for (let i = 1; i <= AVATARS_COUNT; i++) {
    const filename = `${i}.png`
    const localPath = `/avatars/${filename}`

    // Verificar si ya está mapeado
    if (mappingDict[localPath]) {
      console.log(`Avatar ${filename} ya está mapeado a ${mappingDict[localPath]}`)
      continue
    }

    const filePath = path.join(AVATARS_DIR, filename)

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      console.log(`Archivo ${filePath} no encontrado, omitiendo...`)
      continue
    }

    try {
      // Leer el archivo
      const fileBuffer = fs.readFileSync(filePath)
      const file = new Blob([fileBuffer])

      // Subir a Vercel Blob
      const { url } = await put(`avatars/${filename}`, file, {
        access: "public",
      })

      console.log(`Avatar ${filename} subido a Blob: ${url}`)

      // Guardar mapeo en Supabase
      const { error } = await supabaseAdmin.from("avatar_mappings").insert({
        local_path: localPath,
        blob_url: url,
        filename: filename,
      })

      if (error) {
        console.error(`Error al guardar mapeo para ${filename}:`, error)
      } else {
        console.log(`Mapeo guardado para ${filename}`)
      }
    } catch (error) {
      console.error(`Error al procesar ${filename}:`, error)
    }
  }

  console.log("Migración completada.")
}

async function createMappingTable() {
  // Verificar si la tabla existe
  const { error } = await supabaseAdmin.rpc("check_table_exists", { table_name: "avatar_mappings" })

  if (error) {
    console.log("Creando tabla avatar_mappings...")

    // Crear la tabla
    await supabaseAdmin.query(`
      CREATE TABLE IF NOT EXISTS avatar_mappings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        local_path TEXT NOT NULL UNIQUE,
        blob_url TEXT NOT NULL,
        filename TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    console.log("Tabla avatar_mappings creada.")
  } else {
    console.log("La tabla avatar_mappings ya existe.")
  }
}

// Ejecutar la migración
migrateAvatarsToBlob()
  .then(() => {
    console.log("Proceso completado exitosamente.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error en el proceso de migración:", error)
    process.exit(1)
  })
