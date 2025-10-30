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

async function fetchNewsFromAPI(query: string, fromDate: string): Promise<NewsArticle[]> {
  const NEWS_API_KEY = process.env.NEWS_API_KEY_PROD || process.env.NEWS_API_KEY

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

          // FILTRO: Para Motorrad competición, verificar que menciona BMW
          if (search.marca === "Motorrad" && search.categoria === "competicion") {
            const texto = `${article.title} ${article.description || ""} ${article.content || ""}`.toLowerCase()
            const mencionaBMW = texto.includes("bmw") || texto.includes("motorrad")
            
            if (!mencionaBMW) {
              continue // Saltar esta noticia
            }
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

