#!/usr/bin/env node

/**
 * Script para buscar y almacenar noticias de BMW, MINI y BMW Motorrad
 * Usa News API para obtener noticias en español
 * 
 * Configuración:
 * - Añade NEWS_API_KEY a tu archivo .env.local
 * - Ejecutar manualmente: node scripts/fetch-bmw-news.js
 * - Automatizar: Configurar cron job o similar
 */

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const NEWS_API_KEY = process.env.NEWS_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!NEWS_API_KEY) {
  console.error("❌ NEWS_API_KEY no configurada en .env")
  console.log("📝 Obtén tu API key en: https://newsapi.org/register")
  process.exit(1)
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Variables de Supabase no configuradas")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Configuración de búsquedas - Enfocado en medios españoles y competición/economía
const SEARCH_QUERIES = [
  // ===== BMW =====
  {
    query: "BMW ventas España OR BMW mercado automoción OR BMW resultados financieros",
    marca: "BMW",
    categoria: "economica",
  },
  {
    query: "BMW Formula E OR BMW motorsport España OR BMW competición automovilística",
    marca: "BMW",
    categoria: "competicion",
  },
  {
    query: "BMW España automoción OR BMW nuevos modelos España",
    marca: "BMW",
    categoria: "general",
  },

  // ===== BMW M =====
  {
    query: "BMW M competición OR BMW M racing OR BMW M GT3 OR BMW M4 carreras",
    marca: "BMW",
    categoria: "competicion",
  },
  {
    query: "BMW M nuevos modelos OR BMW M deportivo España",
    marca: "BMW",
    categoria: "general",
  },

  // ===== BMW i =====
  {
    query: "BMW eléctrico ventas OR BMW i4 OR BMW iX España mercado",
    marca: "BMW",
    categoria: "economica",
  },
  {
    query: "BMW eléctrico España OR BMW i tecnología OR BMW electromovilidad",
    marca: "BMW",
    categoria: "general",
  },

  // ===== BMW MOTORRAD =====
  {
    query: "BMW Motorrad ventas España OR BMW motocicletas mercado",
    marca: "Motorrad",
    categoria: "economica",
  },
  {
    query: "BMW Motorrad WorldSBK OR BMW superbikes campeonato",
    marca: "Motorrad",
    categoria: "competicion",
  },
  {
    query: "BMW WorldSBK Jerez OR BMW Motorrad carreras",
    marca: "Motorrad",
    categoria: "competicion",
  },
  {
    query: "BMW Motorrad nuevos modelos España OR BMW motocicletas",
    marca: "Motorrad",
    categoria: "general",
  },

  // ===== MINI =====
  {
    query: "MINI Cooper ventas España OR MINI mercado automoción",
    marca: "MINI",
    categoria: "economica",
  },
  {
    query: "MINI rally OR MINI Cooper competición OR MINI racing España",
    marca: "MINI",
    categoria: "competicion",
  },
  {
    query: "MINI Cooper nuevo España OR MINI eléctrico",
    marca: "MINI",
    categoria: "general",
  },

  // ===== QUADIS =====
  {
    query: "Quadis BMW concesionario OR Quadis automoción España",
    marca: "Quadis",
    categoria: "economica",
  },
  {
    query: "Quadis Munich OR Quadis Barcelona OR Quadis Sabadell",
    marca: "Quadis",
    categoria: "general",
  },
]

async function fetchNewsFromAPI(query, fromDate) {
  const url = new URL("https://newsapi.org/v2/everything")
  url.searchParams.append("q", query)
  url.searchParams.append("language", "es")
  url.searchParams.append("sortBy", "publishedAt")
  url.searchParams.append("pageSize", "5")
  url.searchParams.append("apiKey", NEWS_API_KEY)

  if (fromDate) {
    url.searchParams.append("from", fromDate)
  }

  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.message || "Error en News API")
  }

  return data.articles || []
}

async function saveNewsToSupabase(article, marca, categoria) {
  // Verificar si ya existe (por URL)
  const { data: existing } = await supabase.from("bmw_noticias").select("id").eq("url_original", article.url).single()

  if (existing) {
    return { saved: false, reason: "Ya existe" }
  }

  // FILTRO: Para Motorrad competición, verificar que menciona BMW
  if (marca === "Motorrad" && categoria === "competicion") {
    const texto = `${article.title} ${article.description || ""} ${article.content || ""}`.toLowerCase()
    const mencionaBMW = texto.includes("bmw") || texto.includes("motorrad")
    
    if (!mencionaBMW) {
      return { saved: false, reason: "No menciona BMW/Motorrad" }
    }
  }

  // Preparar datos
  const newsItem = {
    titulo: article.title,
    resumen: article.description || article.content?.substring(0, 300),
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
    console.error(`   ⚠️  Error al guardar: ${error.message}`)
    return { saved: false, reason: error.message }
  }

  return { saved: true }
}

async function main() {
  console.log("🚗 Iniciando búsqueda de noticias BMW...\n")

  // Buscar noticias de las últimas 24 horas
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 7) // Últimos 7 días para tener más resultados
  const fromDate = yesterday.toISOString().split("T")[0]

  let totalSaved = 0
  let totalProcessed = 0

  for (const search of SEARCH_QUERIES) {
    console.log(`📰 Buscando: ${search.marca} - ${search.categoria}`)

    try {
      const articles = await fetchNewsFromAPI(search.query, fromDate)
      console.log(`   Encontradas: ${articles.length} noticias`)

      for (const article of articles) {
        totalProcessed++
        const result = await saveNewsToSupabase(article, search.marca, search.categoria)

        if (result.saved) {
          totalSaved++
          console.log(`   ✅ Guardada: ${article.title.substring(0, 60)}...`)
        }
      }

      // Delay entre requests para no saturar la API
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
    }
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   Total procesadas: ${totalProcessed}`)
  console.log(`   Nuevas guardadas: ${totalSaved}`)
  console.log(`   Ya existentes: ${totalProcessed - totalSaved}`)
  console.log(`\n✅ Proceso completado`)
}

// Ejecutar
main().catch((error) => {
  console.error("❌ Error fatal:", error)
  process.exit(1)
})

