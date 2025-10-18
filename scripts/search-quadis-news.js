require("dotenv").config({ path: ".env.local" })

const NEWS_API_KEY = process.env.NEWS_API_KEY

const queries = [
  "Quadis Sabadell",
  "Quadis Munich",
  "Quadis BMW",
  "Diario Sabadell Quadis",
  "Quadis concesionario",
]

async function search() {
  for (const q of queries) {
    console.log(`\n🔍 Buscando: "${q}"`)
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=es&pageSize=5&apiKey=${NEWS_API_KEY}`

    try {
      const res = await fetch(url)
      const data = await res.json()

      if (data.articles && data.articles.length > 0) {
        console.log(`   ✅ Encontradas: ${data.articles.length}`)
        data.articles.forEach((a) => {
          console.log(`      - ${a.title}`)
          console.log(`        Fuente: ${a.source.name}`)
          console.log(`        URL: ${a.url}`)
        })
      } else {
        console.log("   ❌ No encontradas")
      }

      await new Promise((r) => setTimeout(r, 1000))
    } catch (error) {
      console.error(`   Error: ${error.message}`)
    }
  }
}

search()

