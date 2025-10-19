#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log("🧹 LIMPIANDO NOTICIAS INCORRECTAS DE MOTORRAD\n")

  // Obtener todas las noticias de Motorrad competición
  const { data: noticias, error } = await supabase
    .from("bmw_noticias")
    .select("*")
    .eq("marca", "Motorrad")
    .eq("categoria", "competicion")

  if (error) {
    console.error("❌ Error:", error)
    return
  }

  if (!noticias || noticias.length === 0) {
    console.log("✅ No hay noticias de Motorrad-competición en BD")
    return
  }

  console.log(`📊 Encontradas ${noticias.length} noticias de Motorrad-competición\n`)

  let eliminadas = 0

  for (const noticia of noticias) {
    const texto = `${noticia.titulo} ${noticia.resumen || ""}`.toLowerCase()
    const mencionaBMW = texto.includes("bmw") || texto.includes("motorrad")

    if (!mencionaBMW) {
      console.log(`❌ ELIMINAR: ${noticia.titulo}`)
      console.log(`   Fuente: ${noticia.fuente}`)
      console.log(`   URL: ${noticia.url_original}\n`)

      const { error: deleteError } = await supabase
        .from("bmw_noticias")
        .delete()
        .eq("id", noticia.id)

      if (deleteError) {
        console.error(`   ⚠️  Error al eliminar: ${deleteError.message}\n`)
      } else {
        eliminadas++
      }
    } else {
      console.log(`✅ MANTENER: ${noticia.titulo.substring(0, 70)}...`)
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📊 Eliminadas: ${eliminadas} noticias incorrectas`)
  console.log(`✅ Mantenidas: ${noticias.length - eliminadas} noticias correctas`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main().catch(console.error)


