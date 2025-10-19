#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" })

const NEWS_API_KEY = process.env.NEWS_API_KEY

if (!NEWS_API_KEY) {
  console.error("❌ NEWS_API_KEY no configurada")
  process.exit(1)
}

async function fetchNews(query) {
  const url = new URL("https://newsapi.org/v2/everything")
  url.searchParams.append("q", query)
  url.searchParams.append("language", "es")
  url.searchParams.append("sortBy", "publishedAt")
  url.searchParams.append("pageSize", "5")
  url.searchParams.append("apiKey", NEWS_API_KEY)
  
  // Últimos 2 días
  const today = new Date()
  today.setDate(today.getDate() - 2)
  url.searchParams.append("from", today.toISOString().split("T")[0])

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`🔍 Consulta: "${query}"`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  
  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.status === "error") {
    console.error(`❌ Error: ${data.message}`)
    return []
  }

  if (!data.articles || data.articles.length === 0) {
    console.log("❌ No se encontraron noticias")
    return []
  }

  console.log(`✅ Encontradas: ${data.articles.length} noticias\n`)
  
  data.articles.forEach((art, i) => {
    console.log(`${i + 1}. ${art.title}`)
    console.log(`   📰 Fuente: ${art.source.name}`)
    console.log(`   📅 Fecha: ${new Date(art.publishedAt).toLocaleDateString("es-ES", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`)
    console.log(`   🔗 URL: ${art.url}`)
    
    // Mostrar si menciona BMW
    const text = `${art.title} ${art.description || ""}`.toLowerCase()
    const mencionaBMW = text.includes("bmw") || text.includes("motorrad")
    console.log(`   ${mencionaBMW ? "✅ Menciona BMW" : "❌ NO menciona BMW"}`)
    
    if (art.description) {
      console.log(`   💬 "${art.description.substring(0, 150)}..."`)
    }
    console.log("")
  })

  return data.articles
}

async function main() {
  console.log("\n🏁 ANÁLISIS DE NOTICIAS DE SUPERBIKES\n")

  const queries = [
    "BMW superbikes Jerez",
    "superbikes campeonato mundial BMW",
    "WorldSBK BMW",
  ]

  for (const query of queries) {
    await fetchNews(query)
    await new Promise((r) => setTimeout(r, 1500))
  }
}

main().catch(console.error)


