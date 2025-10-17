// Supabase Edge Function para buscar noticias
// Usar con cron.schedule para ejecutar cada 4 horas

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  marca: 'BMW' | 'MINI' | 'Motorrad' | 'Quadis'
  categoria: 'economica' | 'competicion' | 'general'
}

const SEARCH_QUERIES: SearchQuery[] = [
  // BMW
  { query: "BMW financiero OR BMW ventas OR BMW mercado", marca: "BMW", categoria: "economica" },
  { query: "BMW racing OR BMW motorsport", marca: "BMW", categoria: "competicion" },
  { query: "BMW nuevos modelos OR BMW eléctrico", marca: "BMW", categoria: "general" },
  
  // MINI
  { query: "MINI Cooper ventas", marca: "MINI", categoria: "economica" },
  { query: "MINI rally", marca: "MINI", categoria: "competicion" },
  { query: "MINI Cooper nuevo", marca: "MINI", categoria: "general" },
  
  // Motorrad
  { query: "BMW Motorrad ventas", marca: "Motorrad", categoria: "economica" },
  { query: "BMW Motorrad racing", marca: "Motorrad", categoria: "competicion" },
  { query: "BMW Motorrad nuevos", marca: "Motorrad", categoria: "general" },
  
  // Quadis
  { query: "Quadis Munich OR Quadis BMW", marca: "Quadis", categoria: "general" },
  { query: "Quadis automoción", marca: "Quadis", categoria: "economica" },
]

async function fetchNewsFromAPI(query: string, newsApiKey: string): Promise<NewsArticle[]> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 7)
  const fromDate = yesterday.toISOString().split('T')[0]

  const url = new URL('https://newsapi.org/v2/everything')
  url.searchParams.append('q', query)
  url.searchParams.append('language', 'es')
  url.searchParams.append('sortBy', 'publishedAt')
  url.searchParams.append('pageSize', '5')
  url.searchParams.append('apiKey', newsApiKey)
  url.searchParams.append('from', fromDate)

  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.status === 'error') {
    throw new Error(data.message || 'Error en News API')
  }

  return data.articles || []
}

Deno.serve(async (req) => {
  try {
    // Obtener variables de entorno
    const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!NEWS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Faltan variables de entorno')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    let totalSaved = 0
    let totalProcessed = 0

    for (const search of SEARCH_QUERIES) {
      const articles = await fetchNewsFromAPI(search.query, NEWS_API_KEY)

      for (const article of articles) {
        totalProcessed++

        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('bmw_noticias')
          .select('id')
          .eq('url_original', article.url)
          .single()

        if (existing) continue

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

        const { error } = await supabase.from('bmw_noticias').insert(newsItem)
        if (!error) totalSaved++
      }

      // Delay entre requests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed,
        totalSaved,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

