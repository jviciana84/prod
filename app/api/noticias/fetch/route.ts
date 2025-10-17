import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * API endpoint para buscar noticias de BMW, MINI y Motorrad
 * Se puede ejecutar manualmente o programar con cron jobs
 */

interface NewsArticle {
  title: string
  description: string | null
  content: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  source: {
    name: string
  }
}

interface SearchQuery {
  query: string
  marca: "BMW" | "MINI" | "Motorrad" | "Quadis"
  categoria: "economica" | "competicion" | "general"
}

const SEARCH_QUERIES: SearchQuery[] = [
  // BMW - Económicas
  {
    query: "BMW financiero OR BMW ventas OR BMW mercado OR BMW acciones",
    marca: "BMW",
    categoria: "economica",
  },
  // BMW - Competiciones
  {
    query: "BMW racing OR BMW motorsport OR BMW M competición OR BMW Formula E",
    marca: "BMW",
    categoria: "competicion",
  },
  // BMW - General
  { query: "BMW nuevos modelos OR BMW tecnología OR BMW eléctrico", marca: "BMW", categoria: "general" },

  // MINI
  { query: "MINI Cooper ventas OR MINI mercado", marca: "MINI", categoria: "economica" },
  { query: "MINI rally OR MINI racing", marca: "MINI", categoria: "competicion" },
  { query: "MINI Cooper nuevo OR MINI eléctrico", marca: "MINI", categoria: "general" },

  // BMW Motorrad
  { query: "BMW Motorrad ventas OR BMW motocicletas mercado", marca: "Motorrad", categoria: "economica" },
  { query: "BMW Motorrad MotoGP OR BMW Motorrad racing", marca: "Motorrad", categoria: "competicion" },
  { query: "BMW Motorrad nuevos modelos", marca: "Motorrad", categoria: "general" },

  // Quadis
  { query: "Quadis Munich OR Quadis BMW concesionario", marca: "Quadis", categoria: "general" },
  { query: "Quadis automoción OR Quadis vehículos", marca: "Quadis", categoria: "economica" },
]

async function fetchNewsFromAPI(query: string, fromDate: string): Promise<NewsArticle[]> {
  const NEWS_API_KEY = process.env.NEWS_API_KEY

  if (!NEWS_API_KEY) {
    throw new Error("NEWS_API_KEY no configurada")
  }

  const url = new URL("https://newsapi.org/v2/everything")
  url.searchParams.append("q", query)
  url.searchParams.append("language", "es")
  url.searchParams.append("sortBy", "publishedAt")
  url.searchParams.append("pageSize", "5")
  url.searchParams.append("apiKey", NEWS_API_KEY)
  url.searchParams.append("from", fromDate)

  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.status === "error") {
    throw new Error(data.message || "Error en News API")
  }

  return data.articles || []
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuración de Supabase faltante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar noticias de los últimos 7 días
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 7)
    const fromDate = yesterday.toISOString().split("T")[0]

    let totalSaved = 0
    let totalProcessed = 0
    const errors: string[] = []

    for (const search of SEARCH_QUERIES) {
      try {
        const articles = await fetchNewsFromAPI(search.query, fromDate)

        for (const article of articles) {
          totalProcessed++

          // Verificar si ya existe
          const { data: existing } = await supabase
            .from("bmw_noticias")
            .select("id")
            .eq("url_original", article.url)
            .single()

          if (existing) {
            continue
          }

          // Guardar noticia
          const newsItem = {
            titulo: article.title,
            resumen: article.description || article.content?.substring(0, 300) || null,
            imagen_url: article.urlToImage,
            url_original: article.url,
            marca: search.marca,
            categoria: search.categoria,
            fuente: article.source?.name || null,
            fecha_publicacion: article.publishedAt,
            nueva: true,
          }

          const { error } = await supabase.from("bmw_noticias").insert(newsItem)

          if (error) {
            errors.push(`Error al guardar: ${error.message}`)
          } else {
            totalSaved++
          }
        }

        // Delay entre requests
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        errors.push(`Error en búsqueda ${search.marca}-${search.categoria}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed,
      totalSaved,
      alreadyExisting: totalProcessed - totalSaved,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error al buscar noticias:", error)
    return NextResponse.json(
      {
        error: "Error al buscar noticias",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

