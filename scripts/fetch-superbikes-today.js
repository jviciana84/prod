#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const NEWS_API_KEY = process.env.NEWS_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!NEWS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Variables de entorno no configuradas")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fetchNews(query) {
  const url = new URL("https://newsapi.org/v2/everything")
  url.searchParams.append("q", query)
  url.searchParams.append("language", "es")
  url.searchParams.append("sortBy", "publishedAt")
  url.searchParams.append("pageSize", "10")
  url.searchParams.append("apiKey", NEWS_API_KEY)
  
  // Últimos 2 días
  const today = new Date()
  today.setDate(today.getDate() - 2)
  url.searchParams.append("from", today.toISOString().split("T")[0])

  console.log(`\n🔍 Buscando: "${query}"`)
  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.status === "error") {
    console.error(`   ❌ Error API: ${data.message}`)
    return []
  }

  console.log(`   ✅ Encontradas: ${data.articles?.length || 0} noticias`)
  return data.articles || []
}

async function saveNews(article, marca, categoria) {
  // Verificar si ya existe
  const { data: existing } = await supabase
    .from("bmw_noticias")
    .select("id")
    .eq("url_original", article.url)
    .single()

  if (existing) {
    console.log(`   ⏭️  Ya existe: ${article.title.substring(0, 50)}...`)
    return false
  }

  const newsItem = {
    titulo: article.title,
    resumen: article.description || article.content?.substring(0, 300) || null,
    imagen_url: article.urlToImage,
    url_original: article.url,
    marca: marca,
    categoria: categoria,
    fuente: article.source?.name,
    fecha_publicacion: article.publishedAt,
    nueva: true,
  }

  const { error } = await supabase.from("bmw_noticias").insert(newsItem)

  if (error) {
    console.error(`   ❌ Error al guardar: ${error.message}`)
    return false
  }

  console.log(`   ✅ GUARDADA: ${article.title}`)
  console.log(`      Fuente: ${article.source?.name} | ${new Date(article.publishedAt).toLocaleDateString("es-ES")}`)
  return true
}

async function main() {
  console.log("🏁 BUSCANDO NOTICIAS DE SUPERBIKES (ÚLTIMOS 2 DÍAS)\n")

  const queries = [
    "superbikes campeonato mundial",
    "BMW superbikes Jerez",
    "WorldSBK campeonato",
    "Bulega superbikes",
    "BMW Motorrad WorldSBK",
  ]

  let totalSaved = 0

  for (const query of queries) {
    try {
      const articles = await fetchNews(query)

      for (const article of articles) {
        // Filtrar solo si menciona BMW o Motorrad
        const text = `${article.title} ${article.description || ""}`.toLowerCase()
        if (text.includes("bmw") || text.includes("motorrad")) {
          const saved = await saveNews(article, "Motorrad", "competicion")
          if (saved) totalSaved++
        }
      }

      await new Promise((r) => setTimeout(r, 1000))
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
    }
  }

  console.log(`\n📊 RESUMEN: ${totalSaved} noticias nuevas guardadas`)
}

main().catch(console.error)

