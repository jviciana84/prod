import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { parseString } from "xml2js"
import { promisify } from "util"

const parseXML = promisify(parseString)

const RSS_FEEDS = [
  {
    url: "https://e00-marca.uecdn.es/rss/motor.xml",
    fuente: "Marca Motor",
  },
  {
    url: "https://www.mundodeportivo.com/rss/motor",
    fuente: "Mundo Deportivo Motor",
  },
]

function detectarMarca(titulo: string, descripcion: string): string | null {
  const texto = `${titulo} ${descripcion}`.toLowerCase()

  if (texto.includes("motorrad") || (texto.includes("bmw") && (texto.includes("moto") || texto.includes("superbike") || texto.includes("worldsbk")))) {
    return "Motorrad"
  }
  if (texto.includes("mini cooper") || texto.includes("mini ")) {
    return "MINI"
  }
  if (texto.includes("quadis")) {
    return "Quadis"
  }
  if (texto.includes("bmw")) {
    return "BMW"
  }

  return null
}

function detectarCategoria(titulo: string, descripcion: string): string {
  const texto = `${titulo} ${descripcion}`.toLowerCase()

  if (
    texto.includes("carrera") ||
    texto.includes("competición") ||
    texto.includes("racing") ||
    texto.includes("campeonato") ||
    texto.includes("superbike") ||
    texto.includes("worldsbk") ||
    texto.includes("formula") ||
    texto.includes("rally")
  ) {
    return "competicion"
  }

  if (
    texto.includes("venta") ||
    texto.includes("mercado") ||
    texto.includes("financiero") ||
    texto.includes("economía") ||
    texto.includes("bolsa")
  ) {
    return "economica"
  }

  return "general"
}

function extraerImagen(item: any): string | null {
  // Media:content
  if (item["media:content"]) {
    const media = item["media:content"][0]
    if (media.$ && media.$.url) {
      return media.$.url
    }
  }

  // Enclosure
  if (item.enclosure && item.enclosure[0]) {
    const enc = item.enclosure[0]
    if (enc.$ && enc.$.url && enc.$.type && enc.$.type.startsWith("image")) {
      return enc.$.url
    }
  }

  // Media:thumbnail
  if (item["media:thumbnail"]) {
    const thumb = item["media:thumbnail"][0]
    if (thumb.$ && thumb.$.url) {
      return thumb.$.url
    }
  }

  // Imagen en HTML
  if (item.description || item["content:encoded"]) {
    const content = item["content:encoded"] ? item["content:encoded"][0] : item.description[0]
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/)
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1]
    }
  }

  return null
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Config faltante" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let totalSaved = 0
    let totalProcessed = 0
    const errors: string[] = []

    for (const feed of RSS_FEEDS) {
      try {
        const response = await fetch(feed.url)
        if (!response.ok) continue

        const xmlText = await response.text()
        const result = await parseXML(xmlText)
        const items = result.rss?.channel?.[0]?.item || []

        for (const item of items) {
          totalProcessed++

          const titulo = item.title?.[0] || ""
          const descripcion = item.description?.[0] || ""
          const url = item.link?.[0] || ""
          const pubDate = item.pubDate?.[0] || new Date().toISOString()
          const imagen = extraerImagen(item)

          // Solo guardar si tiene imagen
          if (!imagen) continue

          // Detectar marca
          const marca = detectarMarca(titulo, descripcion)
          if (!marca) continue

          // Verificar si existe
          const { data: existing } = await supabase
            .from("bmw_noticias")
            .select("id")
            .eq("url_original", url)
            .single()

          if (existing) continue

          // Guardar
          const categoria = detectarCategoria(titulo, descripcion)
          const newsItem = {
            titulo,
            resumen: descripcion.substring(0, 300),
            imagen_url: imagen,
            url_original: url,
            marca,
            categoria,
            fuente: feed.fuente,
            fecha_publicacion: new Date(pubDate).toISOString(),
            nueva: true,
          }

          const { error } = await supabase.from("bmw_noticias").insert(newsItem)

          if (!error) {
            totalSaved++
          }
        }
      } catch (error) {
        errors.push(`Error en ${feed.fuente}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      source: "RSS",
      totalProcessed,
      totalSaved,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Error en RSS fetch", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}

