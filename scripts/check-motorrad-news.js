#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log("=== NOTICIAS BMW MOTORRAD EN BD ===\n")
  
  const { data, error } = await supabase
    .from("bmw_noticias")
    .select("titulo, marca, categoria, fecha_publicacion, fuente")
    .eq("marca", "Motorrad")
    .order("fecha_publicacion", { ascending: false })
    .limit(10)

  if (error) {
    console.error("Error:", error)
    return
  }

  if (!data || data.length === 0) {
    console.log("❌ No hay noticias de Motorrad en la BD")
    return
  }

  data.forEach((n, i) => {
    const fecha = new Date(n.fecha_publicacion).toLocaleDateString("es-ES")
    console.log(`${i + 1}. [${n.categoria}] ${n.titulo}`)
    console.log(`   Fuente: ${n.fuente} | Fecha: ${fecha}\n`)
  })

  console.log("\n=== BUSCANDO EN NEWS API: BMW SUPERBIKES ===\n")

  const queries = [
    "BMW Motorrad WorldSBK",
    "BMW superbikes campeonato",
    "BMW Toprak Razgatlioglu",
    "BMW Motorrad WorldSBK 2025",
  ]

  const NEWS_API_KEY = process.env.NEWS_API_KEY
  
  if (!NEWS_API_KEY) {
    console.log("⚠️ NEWS_API_KEY no configurada, no puedo buscar en News API")
    return
  }

  for (const query of queries) {
    try {
      const url = new URL("https://newsapi.org/v2/everything")
      url.searchParams.append("q", query)
      url.searchParams.append("language", "es")
      url.searchParams.append("sortBy", "publishedAt")
      url.searchParams.append("pageSize", "5")
      url.searchParams.append("apiKey", NEWS_API_KEY)

      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 2)
      url.searchParams.append("from", yesterday.toISOString().split("T")[0])

      console.log(`🔍 Buscando: "${query}"`)
      const response = await fetch(url.toString())
      const data = await response.json()

      if (data.articles && data.articles.length > 0) {
        console.log(`   ✅ Encontradas ${data.articles.length} noticias:`)
        data.articles.forEach((art, i) => {
          console.log(`   ${i + 1}. ${art.title}`)
          console.log(`      ${art.source.name} | ${new Date(art.publishedAt).toLocaleDateString("es-ES")}`)
        })
      } else {
        console.log(`   ❌ No se encontraron noticias`)
      }
      console.log("")

      await new Promise((r) => setTimeout(r, 1000))
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`)
    }
  }
}

main().catch(console.error)


