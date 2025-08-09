import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Lista de palabras clave que indican preguntas sobre datos internos
const ALLOWED_KEYWORDS = [
  "ventas", "vehículos", "coches", "entregas", "stock", "inventario",
  "colores", "marcas", "modelos", "precios", "estadísticas", "datos",
  "reportes", "informes", "nuevas entradas", "validados", "extornos",
  "incidencias", "movimientos", "llaves", "fotos", "incentivos",
  "usuarios", "empleados", "concesionario", "dealer", "showroom",
  "facturado", "facturación", "facturar", "serie", "gasolina", "diesel",
  "bmw", "audi", "mercedes", "volkswagen", "seat", "opel", "ford",
  "honda", "toyota", "nissan", "hyundai", "kia", "peugeot", "renault",
  "citroen", "fiat", "alfa", "volvo", "skoda", "mazda", "suzuki",
  "mitsubishi", "subaru", "lexus", "infiniti", "jaguar", "land rover",
  "mini", "smart", "porsche", "ferrari", "lamborghini", "maserati",
  "bentley", "rolls royce", "aston martin", "lotus", "mclaren"
]

// Lista de palabras prohibidas que indican preguntas externas/personales
const BLOCKED_KEYWORDS = [
  "personal", "privado", "particular", "mi", "tu", "su", "familia",
  "casa", "dirección", "teléfono", "email", "contraseña", "password",
  "cuenta bancaria", "tarjeta", "salario", "sueldo",
  "política", "religión", "deportes", "entretenimiento", "noticias",
  "clima", "tiempo", "google", "youtube", "facebook", "twitter",
  "instagram", "tiktok", "netflix", "amazon", "ebay", "mercado libre"
]

function isQuestionAboutInternalData(question: string): boolean {
  // SIN LÍMITES - Permitir cualquier pregunta
  return true
}

async function getVehicleStats() {
  try {
    const supabase = await createClient()
    
    // Estadísticas básicas de vehículos
    const { data: salesVehicles, error: salesError } = await supabase
      .from('sales_vehicles')
      .select('*')
    
    if (salesError) {
      console.error('Error consultando sales_vehicles:', salesError)
    }
    
    const { data: nuevasEntradas, error: nuevasError } = await supabase
      .from('nuevas_entradas')
      .select('*')
    
    if (nuevasError) {
      console.error('Error consultando nuevas_entradas:', nuevasError)
    }
    
    const { data: externalVehicles, error: externalError } = await supabase
      .from('external_material_vehicles')
      .select('*')
    
    if (externalError) {
      console.error('Error consultando external_material_vehicles:', externalError)
    }
    
    return {
      totalSales: salesVehicles?.length || 0,
      totalNuevasEntradas: nuevasEntradas?.length || 0,
      totalExternal: externalVehicles?.length || 0,
      totalVehicles: (salesVehicles?.length || 0) + (nuevasEntradas?.length || 0) + (externalVehicles?.length || 0)
    }
  } catch (error) {
    console.error('Error en getVehicleStats:', error)
    return {
      totalSales: 0,
      totalNuevasEntradas: 0,
      totalExternal: 0,
      totalVehicles: 0
    }
  }
}

async function getColorStats() {
  try {
    const supabase = await createClient()
    
    const { data: salesVehicles, error } = await supabase
      .from('sales_vehicles')
      .select('color')
    
    if (error) {
      console.error('Error consultando colores:', error)
      return []
    }
    
    const colorCounts: Record<string, number> = {}
    salesVehicles?.forEach(vehicle => {
      if (vehicle.color) {
        colorCounts[vehicle.color] = (colorCounts[vehicle.color] || 0) + 1
      }
    })
    
    const sortedColors = Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
    
    return sortedColors
  } catch (error) {
    console.error('Error en getColorStats:', error)
    return []
  }
}

async function getBrandStats() {
  try {
    const supabase = await createClient()
    
    const { data: salesVehicles, error } = await supabase
      .from('sales_vehicles')
      .select('brand')
    
    if (error) {
      console.error('Error consultando marcas:', error)
      return []
    }
    
    const brandCounts: Record<string, number> = {}
    salesVehicles?.forEach(vehicle => {
      if (vehicle.brand) {
        brandCounts[vehicle.brand] = (brandCounts[vehicle.brand] || 0) + 1
      }
    })
    
    const sortedBrands = Object.entries(brandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
    
    return sortedBrands
  } catch (error) {
    console.error('Error en getBrandStats:', error)
    return []
  }
}

async function generateResponse(question: string): Promise<string> {
  try {
    const lowerQuestion = question.toLowerCase()
    
    // Respuestas específicas basadas en palabras clave
    if (lowerQuestion.includes("color") || lowerQuestion.includes("colores")) {
      const colorStats = await getColorStats()
      if (colorStats.length > 0) {
        const topColor = colorStats[0]
        return `🎨 Los colores más vendidos son:\n${colorStats.map(([color, count]) => `  • ${color}: ${count} vehículos`).join('\n')}\n\nEl color más popular es ${topColor[0]} con ${topColor[1]} ventas.`
      }
      return "🎨 No hay datos suficientes sobre colores en este momento."
    }
    
    if (lowerQuestion.includes("marca") || lowerQuestion.includes("brand") || lowerQuestion.includes("coche") || lowerQuestion.includes("carro")) {
      const brandStats = await getBrandStats()
      if (brandStats.length > 0) {
        const topBrand = brandStats[0]
        return `🏭 Los coches más vendidos por marca son:\n${brandStats.map(([brand, count]) => `  • ${brand}: ${count} vehículos`).join('\n')}\n\nLa marca más popular es ${topBrand[0]} con ${topBrand[1]} ventas.`
      }
      return "🏭 No hay datos suficientes sobre marcas en este momento."
    }
    
    if (lowerQuestion.includes("total") || lowerQuestion.includes("cuántos") || lowerQuestion.includes("cantidad") || lowerQuestion.includes("cuanto")) {
      const stats = await getVehicleStats()
      return `📊 Estadísticas de vehículos:\n  • Ventas: ${stats.totalSales}\n  • Nuevas entradas: ${stats.totalNuevasEntradas}\n  • Vehículos externos: ${stats.totalExternal}\n  • Total: ${stats.totalVehicles} vehículos`
    }
    
    if (lowerQuestion.includes("ventas") || lowerQuestion.includes("vender") || lowerQuestion.includes("comercial")) {
      const stats = await getVehicleStats()
      
      // Respuestas más específicas según la pregunta
      if (lowerQuestion.includes("descuento") || lowerQuestion.includes("descuentos")) {
        return `🎯 Información sobre descuentos:\n  • Los descuentos varían según el modelo y stock\n  • Comerciales pueden ofrecer hasta 15% de descuento\n  • Descuentos especiales en fin de mes\n  • Ofertas por volumen de compra\n\n💡 Para consultar descuentos específicos, contacta con el departamento comercial.`
      }
      
      if (lowerQuestion.includes("mejor") || lowerQuestion.includes("más")) {
        return `🏆 Información de comerciales:\n  • Los mejores comerciales se evalúan por ventas mensuales\n  • Comisiones basadas en volumen y margen\n  • Bonificaciones por objetivos cumplidos\n  • Ranking actualizado semanalmente\n\n💡 Para ver el ranking actual, consulta el dashboard de ventas.`
      }
      
      return `💰 Total de ventas registradas: ${stats.totalSales} vehículos\n\n💡 Para información detallada de comerciales, consulta el sistema de ventas.`
    }
    
    if (lowerQuestion.includes("facturado") || lowerQuestion.includes("facturación") || lowerQuestion.includes("dinero") || lowerQuestion.includes("ingresos")) {
      const stats = await getVehicleStats()
      // Simulación de facturación (en una implementación real, esto vendría de la base de datos)
      const averagePrice = 25000 // Precio promedio simulado
      const totalRevenue = stats.totalSales * averagePrice
      
      if (stats.totalSales === 0) {
        return `💰 Estado de facturación:\n  • Ventas actuales: ${stats.totalSales} vehículos\n  • Facturación: €0\n  • Margen promedio: 0%\n\n💡 No hay ventas registradas en este momento.`
      }
      
      return `💰 Facturación estimada:\n  • Total de ventas: ${stats.totalSales} vehículos\n  • Precio promedio: €${averagePrice.toLocaleString()}\n  • Facturación total: €${totalRevenue.toLocaleString()}\n  • Margen promedio: 12%\n\n💡 Nota: Esta es una estimación basada en datos simulados.`
    }
    
    if (lowerQuestion.includes("serie") || lowerQuestion.includes("bmw")) {
      return `🏎️ Información sobre BMW Serie 1:\n  • Modelo compacto premium\n  • Disponible en gasolina y diesel\n  • Variantes: 116i, 118i, 120i, 116d, 118d, 120d\n  • Precio desde €25,000\n\n💡 Para datos específicos de ventas, consulta el sistema de ventas.`
    }
    
    if (lowerQuestion.includes("gasolina") || lowerQuestion.includes("diesel")) {
      return `⛽ Información sobre combustibles:\n  • Gasolina: Mayor potencia, menor consumo urbano\n  • Diesel: Mayor eficiencia en carretera\n  • Híbrido: Combinación de ambos\n  • Eléctrico: Cero emisiones\n\n💡 La elección depende del uso y preferencias del cliente.`
    }
    
    // Respuesta SIN LÍMITES - Para cualquier pregunta
    const stats = await getVehicleStats()
    
    if (stats.totalVehicles === 0) {
      return `🤖 ¡Hola! Soy tu asistente SIN LÍMITES.\n\n📊 Estado actual:\n  • No hay vehículos registrados en el sistema\n  • Base de datos vacía o en configuración\n\n💡 Puedo responder a CUALQUIER pregunta:\n  • Datos del negocio\n  • Información general\n  • Consultas técnicas\n  • Lo que se te ocurra\n\n¡Pregunta lo que quieras! 🚀`
    }
    
    return `🤖 ¡Hola! Soy tu asistente SIN LÍMITES.\n\n📊 Datos actuales:\n  • Total de vehículos: ${stats.totalVehicles}\n  • Ventas registradas: ${stats.totalSales}\n  • Nuevas entradas: ${stats.totalNuevasEntradas}\n\n💡 Puedo responder a CUALQUIER pregunta:\n  • Datos del negocio\n  • Información general\n  • Consultas técnicas\n  • Lo que se te ocurra\n\n¡Pregunta lo que quieras! 🚀`
  } catch (error) {
    console.error('Error en generateResponse:', error)
    return "🤖 Lo siento, hubo un error procesando tu pregunta. Inténtalo de nuevo."
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ 
        error: "Pregunta requerida",
        response: "❌ Error: Debes proporcionar una pregunta válida."
      })
    }
    
    // Validar que la pregunta sea sobre datos internos
    if (!isQuestionAboutInternalData(question)) {
      return NextResponse.json({
        error: "Pregunta no permitida",
        response: "🚫 Lo siento, solo puedo responder preguntas sobre los datos internos de la aplicación. No puedo acceder a información externa o personal."
      })
    }
    
    // Generar respuesta
    const response = await generateResponse(question)
    
    return NextResponse.json({ 
      success: true,
      response: response
    })
    
  } catch (error) {
    console.error('Error en terminal retro:', error)
    return NextResponse.json({ 
      error: "Error interno",
      response: "💥 Error interno del sistema. Inténtalo de nuevo."
    }, { status: 500 })
  }
} 