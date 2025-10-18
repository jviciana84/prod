require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

const NEWS_API_KEY = process.env.NEWS_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function getQuadisNewsWithImage() {
  console.log("🔍 Buscando noticia de Quadis con imagen...")

  const url = `https://newsapi.org/v2/everything?q=Quadis%20Munich%20BMW&language=es&pageSize=1&apiKey=${NEWS_API_KEY}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data.articles && data.articles.length > 0) {
      const article = data.articles[0]
      console.log("\n✅ Noticia encontrada:")
      console.log("   Título:", article.title)
      console.log("   Imagen:", article.urlToImage || "Sin imagen")
      console.log("   Descripción:", article.description)

      // Actualizar la noticia existente
      const { error } = await supabase
        .from("bmw_noticias")
        .update({
          imagen_url: article.urlToImage,
          resumen: article.description,
          fecha_publicacion: article.publishedAt,
        })
        .eq("marca", "Quadis")

      if (error) {
        console.error("❌ Error al actualizar:", error.message)
      } else {
        console.log("\n✅ Noticia de Quadis actualizada con imagen!")
      }
    } else {
      console.log("❌ No se encontró la noticia")
    }
  } catch (error) {
    console.error("Error:", error.message)
  }
}

getQuadisNewsWithImage()

