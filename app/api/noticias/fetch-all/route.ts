import { NextResponse } from "next/server"

/**
 * Endpoint combinado: busca en RSS (rápido) y News API (backup)
 * Para usar en cron jobs cada 4 horas
 */

export async function GET() {
  try {
    const results = {
      rss: { saved: 0, processed: 0 },
      newsapi: { saved: 0, processed: 0 },
      errors: [] as string[],
    }

    // 1. Buscar en RSS (más rápido y actualizado)
    try {
      const rssResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/noticias/fetch-rss`)
      if (rssResponse.ok) {
        const rssData = await rssResponse.json()
        results.rss.saved = rssData.totalSaved || 0
        results.rss.processed = rssData.totalProcessed || 0
      }
    } catch (error) {
      results.errors.push(`Error RSS: ${error}`)
    }

    // 2. Buscar en News API (backup)
    try {
      const newsApiResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/noticias/fetch`)
      if (newsApiResponse.ok) {
        const newsApiData = await newsApiResponse.json()
        results.newsapi.saved = newsApiData.totalSaved || 0
        results.newsapi.processed = newsApiData.totalProcessed || 0
      }
    } catch (error) {
      results.errors.push(`Error News API: ${error}`)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sources: {
        rss: results.rss,
        newsapi: results.newsapi,
      },
      totalSaved: results.rss.saved + results.newsapi.saved,
      totalProcessed: results.rss.processed + results.newsapi.processed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error general",
        details: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    )
  }
}

