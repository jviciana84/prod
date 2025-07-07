// Script para analizar la estructura del CSV de garantías
async function analyzeCsvStructure() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/InformeProduccion_BMW-0CKFvw9DLEqrlCVWr0q5jqKfZIOHEu.csv",
    )
    const csvContent = await response.text()

    console.log("=== CONTENIDO DEL CSV ===")
    console.log(csvContent.substring(0, 1000)) // Primeros 1000 caracteres

    const lines = csvContent.split("\n")
    console.log("\n=== ESTRUCTURA ===")
    console.log("Total de líneas:", lines.length)
    console.log("Headers:", lines[0])

    // Analizar algunas líneas de ejemplo
    console.log("\n=== EJEMPLOS DE DATOS ===")
    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
      console.log(`Línea ${i}:`, lines[i])
    }
  } catch (error) {
    console.error("Error analizando CSV:", error)
  }
}

analyzeCsvStructure()
