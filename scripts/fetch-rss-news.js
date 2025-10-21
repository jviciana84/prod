#!/usr/bin/env node

/**
 * Script para obtener noticias de RSS feeds españoles
 * Solo guarda noticias CON IMAGEN
 */

require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")
const { parseString } = require("xml2js")
const { promisify } = require("util")

const parseXML = promisify(parseString)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Variables de Supabase no configuradas")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// RSS Feeds de medios españoles de motor (solo los que funcionan)
const RSS_FEEDS = [
  {
    url: "https://e00-marca.uecdn.es/rss/motor.xml",
    fuente: "Marca Motor",
    defaultMarca: "BMW",
  },
  {
    url: "https://www.mundodeportivo.com/rss/motor",
    fuente: "Mundo Deportivo Motor",
    defaultMarca: "BMW",
  },
]

function detectarMarca(titulo, descripcion) {
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

  return null // No es relevante
}

function detectarCategoria(titulo, descripcion) {
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
    texto.includes("bolsa") ||
    texto.includes("acciones")
  ) {
    return "economica"
  }

  return "general"
}

function extraerImagen(item) {
  // Diferentes formas en que RSS puede tener imágenes
  
  // 1. Media:content (común en RSS 2.0)
  if (item["media:content"]) {
    const media = item["media:content"][0]
    if (media.$ && media.$.url) {
      return media.$.url
    }
  }

  // 2. Enclosure (imágenes adjuntas)
  if (item.enclosure && item.enclosure[0]) {
    const enc = item.enclosure[0]
    if (enc.$ && enc.$.url && enc.$.type && enc.$.type.startsWith("image")) {
      return enc.$.url
    }
  }

  // 3. Media:thumbnail
  if (item["media:thumbnail"]) {
    const thumb = item["media:thumbnail"][0]
    if (thumb.$ && thumb.$.url) {
      return thumb.$.url
    }
  }

  // 4. Imagen en el contenido HTML
  if (item.description || item["content:encoded"]) {
    const content = item["content:encoded"] ? item["content:encoded"][0] : item.description[0]
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/)
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1]
    }
  }

  return null
}

async function fetchRSS(feedUrl, fuente) {
  console.log(`\n📡 Leyendo: ${fuente}`)
  console.log(`   URL: ${feedUrl}`)

  try {
    const response = await fetch(feedUrl)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const xmlText = await response.text()
    const result = await parseXML(xmlText)

    const items = result.rss?.channel?.[0]?.item || []
    console.log(`   Encontradas: ${items.length} noticias en el feed`)

    return items
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return []
  }
}

async function saveNews(item, fuente, defaultMarca) {
  const titulo = item.title?.[0] || ""
  const descripcion = item.description?.[0] || ""
  const url = item.link?.[0] || ""
  const pubDate = item.pubDate?.[0] || new Date().toISOString()

  // Extraer imagen
  const imagen = extraerImagen(item)

  // ⚠️ FILTRO: Solo guardar si tiene imagen
  if (!imagen) {
    return { saved: false, reason: "Sin imagen" }
  }

  // Detectar marca
  const marca = detectarMarca(titulo, descripcion)
  if (!marca) {
    return { saved: false, reason: "No relevante para BMW/MINI/Motorrad/Quadis" }
  }

  // Detectar categoría
  const categoria = detectarCategoria(titulo, descripcion)

  // Verificar si ya existe
  const { data: existing } = await supabase.from("bmw_noticias").select("id").eq("url_original", url).single()

  if (existing) {
    return { saved: false, reason: "Ya existe" }
  }

  const newsItem = {
    titulo: titulo,
    resumen: descripcion.substring(0, 300),
    imagen_url: imagen,
    url_original: url,
    marca: marca,
    categoria: categoria,
    fuente: fuente,
    fecha_publicacion: new Date(pubDate).toISOString(),
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
  console.log("📰 BUSCANDO NOTICIAS EN RSS FEEDS ESPAÑOLES\n")
  console.log("📸 Solo se guardarán noticias CON IMAGEN\n")

  let totalSaved = 0
  let totalProcessed = 0
  let sinImagen = 0
  let noRelevantes = 0

  for (const feed of RSS_FEEDS) {
    const items = await fetchRSS(feed.url, feed.fuente)

    for (const item of items) {
      totalProcessed++
      const result = await saveNews(item, feed.fuente, feed.defaultMarca)

      if (result.saved) {
        totalSaved++
        const titulo = item.title?.[0] || ""
        console.log(`   ✅ ${titulo.substring(0, 60)}...`)
      } else if (result.reason === "Sin imagen") {
        sinImagen++
      } else if (result.reason === "No relevante para BMW/MINI/Motorrad/Quadis") {
        noRelevantes++
      }
    }

    // Delay entre feeds
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📊 Resumen:`)
  console.log(`   Total procesadas: ${totalProcessed}`)
  console.log(`   ✅ Nuevas guardadas: ${totalSaved}`)
  console.log(`   📸 Sin imagen (descartadas): ${sinImagen}`)
  console.log(`   ⏭️  No relevantes: ${noRelevantes}`)
  console.log(`   🔄 Ya existentes: ${totalProcessed - totalSaved - sinImagen - noRelevantes}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
}

main().catch((error) => {
  console.error("❌ Error fatal:", error)
  process.exit(1)
})

