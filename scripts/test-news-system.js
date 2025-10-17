#!/usr/bin/env node

/**
 * Script de prueba para el sistema de noticias BMW
 * Inserta noticias de ejemplo para verificar que todo funciona
 */

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Variables de Supabase no configuradas")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Noticias de prueba
const testNoticias = [
  {
    titulo: "BMW presenta su nuevo modelo eléctrico i5",
    resumen: "El nuevo BMW i5 llega con más autonomía y tecnología de punta. Disponible en España a partir de 2025.",
    imagen_url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
    url_original: "https://example.com/bmw-i5-nuevo",
    marca: "BMW",
    categoria: "general",
    fuente: "Noticia de prueba",
    fecha_publicacion: new Date().toISOString(),
    nueva: true,
  },
  {
    titulo: "BMW Motorrad arrasa en MotoGP",
    resumen: "El equipo BMW Motorrad consigue un histórico podio en el último Gran Premio.",
    imagen_url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800",
    url_original: "https://example.com/bmw-motorrad-motogp",
    marca: "Motorrad",
    categoria: "competicion",
    fuente: "Noticia de prueba",
    fecha_publicacion: new Date().toISOString(),
    nueva: true,
  },
  {
    titulo: "MINI Cooper presenta edición limitada retro",
    resumen: "La nueva edición especial del MINI Cooper rinde homenaje al modelo clásico de 1960.",
    imagen_url: "https://images.unsplash.com/photo-1555353540-064b9d2d6b52?w=800",
    url_original: "https://example.com/mini-cooper-retro",
    marca: "MINI",
    categoria: "general",
    fuente: "Noticia de prueba",
    fecha_publicacion: new Date().toISOString(),
    nueva: true,
  },
  {
    titulo: "BMW Group supera expectativas en ventas del Q3",
    resumen: "El grupo BMW reporta un aumento del 15% en ventas durante el tercer trimestre de 2024.",
    imagen_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    url_original: "https://example.com/bmw-ventas-q3",
    marca: "BMW",
    categoria: "economica",
    fuente: "Noticia de prueba",
    fecha_publicacion: new Date().toISOString(),
    nueva: true,
  },
  {
    titulo: "BMW M4 domina en el campeonato DTM",
    resumen: "El BMW M4 GT3 consigue la victoria en la última carrera del DTM en Alemania.",
    imagen_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
    url_original: "https://example.com/bmw-m4-dtm",
    marca: "BMW",
    categoria: "competicion",
    fuente: "Noticia de prueba",
    fecha_publicacion: new Date().toISOString(),
    nueva: true,
  },
]

async function insertTestNews() {
  console.log("🧪 Insertando noticias de prueba...\n")

  for (const noticia of testNoticias) {
    try {
      const { error } = await supabase.from("bmw_noticias").insert(noticia)

      if (error) {
        console.error(`   ❌ Error al insertar: ${noticia.titulo}`)
        console.error(`      ${error.message}`)
      } else {
        console.log(`   ✅ ${noticia.marca} - ${noticia.titulo.substring(0, 50)}...`)
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`)
    }
  }

  console.log("\n✅ Proceso completado")
  console.log("\n📋 Próximos pasos:")
  console.log("   1. Visita: http://localhost:3000/dashboard/noticias")
  console.log("   2. Espera 30 minutos o recarga para ver el toast")
  console.log("   3. Prueba los filtros por marca y categoría")
}

async function checkTable() {
  console.log("🔍 Verificando tabla bmw_noticias...\n")

  const { data, error } = await supabase.from("bmw_noticias").select("*").limit(1)

  if (error) {
    console.error("❌ Error al acceder a la tabla:")
    console.error(error.message)
    console.log("\n📝 Asegúrate de haber ejecutado el SQL de creación de tabla")
    console.log("   Ver: docs/SISTEMA_NOTICIAS_BMW.md")
    process.exit(1)
  }

  console.log("✅ Tabla bmw_noticias existe y es accesible\n")
}

async function main() {
  await checkTable()
  await insertTestNews()
}

main().catch((error) => {
  console.error("❌ Error fatal:", error)
  process.exit(1)
})

