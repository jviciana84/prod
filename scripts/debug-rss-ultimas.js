#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" })
const { parseString } = require("xml2js")
const { promisify } = require("util")

const parseXML = promisify(parseString)

async function checkFeed(url, name) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`📡 ${name}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  try {
    const response = await fetch(url)
    const xmlText = await response.text()
    const result = await parseXML(xmlText)
    const items = result.rss?.channel?.[0]?.item || []

    console.log(`Total en feed: ${items.length}`)
    console.log(`\nÚltimas 10 noticias:\n`)

    items.slice(0, 10).forEach((item, i) => {
      const titulo = item.title?.[0] || ""
      const pubDate = item.pubDate?.[0] || ""
      const descripcion = item.description?.[0] || ""
      
      // Detectar si menciona BMW/MINI/Motorrad
      const texto = `${titulo} ${descripcion}`.toLowerCase()
      const mencionaBMW = texto.includes("bmw")
      const mencionaMINI = texto.includes("mini")
      const mencionaMotorrad = texto.includes("motorrad") || texto.includes("superbike")
      const menciona = mencionaBMW || mencionaMINI || mencionaMotorrad

      console.log(`${i + 1}. ${titulo}`)
      console.log(`   📅 ${new Date(pubDate).toLocaleString("es-ES")}`)
      console.log(`   ${menciona ? "✅ Relevante" : "❌ No relevante"} (BMW:${mencionaBMW ? "✅" : "❌"} MINI:${mencionaMINI ? "✅" : "❌"} Motorrad:${mencionaMotorrad ? "✅" : "❌"})`)
      console.log()
    })
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
  }
}

async function main() {
  console.log(`🕐 Fecha actual: ${new Date().toLocaleString("es-ES")}\n`)

  await checkFeed("https://e00-marca.uecdn.es/rss/motor.xml", "MARCA MOTOR")
  await new Promise((r) => setTimeout(r, 1000))
  
  await checkFeed("https://www.mundodeportivo.com/rss/motor", "MUNDO DEPORTIVO MOTOR")
}

main().catch(console.error)

