#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const NEWS_API_KEY = process.env.NEWS_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fetchAndSave(query) {
  const url = new URL("https://newsapi.org/v2/everything")
  url.searchParams.append("q", query)
  url.searchParams.append("language", "es")
  url.searchParams.append("sortBy", "publishedAt")
  url.searchParams.append("pageSize", "5")
  url.searchParams.append("apiKey", NEWS_API_KEY)
  
  const today = new Date()
  today.setDate(today.getDate() - 1)
  url.searchParams.append("from", today.toISOString().split("T")[0])

  console.log(`🔍 "${query}"`)
  const res = await fetch(url.toString())
  const data = await res.json()

  if (!data.articles || data.articles.length === 0) {
    console.log("❌ No encontrado\n")
    return 0
  }

  console.log(`✅ ${data.articles.length} noticias:\n`)
  
  let saved = 0
  for (const art of data.articles) {
    console.log(`📰 ${art.title}`)
    console.log(`   ${art.source.name} | ${art.url}`)
    
    // Verificar si ya existe
    const { data: existing } = await supabase
      .from("bmw_noticias")
      .select("id")
      .eq("url_original", art.url)
      .single()

    if (existing) {
      console.log(`   ⏭️  Ya existe\n`)
      continue
    }

    const newsItem = {
      titulo: art.title,
      resumen: art.description || art.content?.substring(0, 300) || null,
      imagen_url: art.urlToImage,
      url_original: art.url,
      marca: "Motorrad",
      categoria: "competicion",
      fuente: art.source?.name,
      fecha_publicacion: art.publishedAt,
      nueva: true,
    }

    const { error } = await supabase.from("bmw_noticias").insert(newsItem)

    if (error) {
      console.log(`   ❌ Error: ${error.message}\n`)
    } else {
      console.log(`   ✅ GUARDADA\n`)
      saved++
    }
  }

  return saved
}

async function main() {
  console.log("🏆 BUSCANDO NOTICIA DEL TRICAMPEONATO BMW\n")

  const queries = [
    "Toprak Razgatlioglu tricampeón BMW superbike",
    "Toprak tricampeón mundial superbikes",
    "BMW campeonato mundial superbikes 2025",
  ]

  let total = 0
  for (const q of queries) {
    const saved = await fetchAndSave(q)
    total += saved
    await new Promise((r) => setTimeout(r, 1500))
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📊 Total guardadas: ${total}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main().catch(console.error)


