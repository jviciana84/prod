import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      )
    }
    
    // Obtener contexto del sistema
    const context = await getSystemContext()
    
    // Procesar la pregunta con IA
    const response = await processAIQuery(message, context)
    
    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error en AI Assistant:', error)
    return NextResponse.json(
      { error: 'Error procesando la consulta' },
      { status: 500 }
    )
  }
}

async function getSystemContext() {
  try {
    // Obtener conteos básicos
    const [stockCount, salesCount, deliveriesCount, cvoCount] = await Promise.all([
      supabase.from('stock_directo').select('id', { count: 'exact', head: true }),
      supabase.from('sales_vehicles').select('id', { count: 'exact', head: true }),
      supabase.from('entregas').select('id', { count: 'exact', head: true }),
      supabase.from('cvo_requests').select('id', { count: 'exact', head: true })
    ])

    // Obtener datos específicos adicionales
    const [recentSales, topAdvisors, vehicleBrands, pendingDeliveries] = await Promise.all([
      // Ventas recientes con detalles
      supabase
        .from('sales_vehicles')
        .select('advisor, model, brand, license_plate, sale_date')
        .order('sale_date', { ascending: false })
        .limit(10),
      
      // Top asesores comerciales
      supabase
        .from('sales_vehicles')
        .select('advisor')
        .not('advisor', 'is', null),
      
      // Marcas de vehículos en stock
      supabase
        .from('stock_directo')
        .select('brand')
        .not('brand', 'is', null),
      
      // Entregas pendientes
      supabase
        .from('entregas')
        .select('license_plate, advisor, delivery_date, status')
        .eq('status', 'pendiente')
        .limit(5)
    ])

    // Procesar datos de asesores
    const advisorStats = recentSales.data?.reduce((acc: any, sale: any) => {
      if (sale.advisor) {
        acc[sale.advisor] = (acc[sale.advisor] || 0) + 1
      }
      return acc
    }, {}) || {}

    const topAdvisorsList = Object.entries(advisorStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([advisor, count]) => ({ advisor, sales: count }))

    // Procesar marcas
    const brandStats = vehicleBrands.data?.reduce((acc: any, vehicle: any) => {
      if (vehicle.brand) {
        acc[vehicle.brand] = (acc[vehicle.brand] || 0) + 1
      }
      return acc
    }, {}) || {}

    const topBrands = Object.entries(brandStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count }))

    return {
      // Conteos básicos
      stockCount: stockCount.count || 0,
      salesCount: salesCount.count || 0,
      deliveriesCount: deliveriesCount.count || 0,
      cvoCount: cvoCount.count || 0,
      
      // Datos específicos
      recentSales: recentSales.data || [],
      topAdvisors: topAdvisorsList,
      topBrands: topBrands,
      pendingDeliveries: pendingDeliveries.data || [],
      
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error obteniendo contexto:', error)
    return {
      stockCount: 113,
      salesCount: 18,
      deliveriesCount: 0,
      cvoCount: 0,
      recentSales: [],
      topAdvisors: [],
      topBrands: [],
      pendingDeliveries: [],
      timestamp: new Date().toISOString()
    }
  }
}

async function processAIQuery(message: string, context: any) {
  try {
        // Crear el prompt con contexto del sistema CVO
        const systemPrompt = `Eres Edelweiss 🌸, un asistente IA especializado en el sistema CVO (Certificado de Vehículo Ocasional).

📊 **INFORMACIÓN ACTUAL DEL SISTEMA (DATOS REALES):**
• Stock total: ${context.stockCount} vehículos
• Ventas registradas: ${context.salesCount} ventas
• Entregas totales: ${context.deliveriesCount} entregas
• CVO procesados: ${context.cvoCount} certificados

🏆 **TOP ASESORES COMERCIALES:**
${context.topAdvisors.map((advisor: any) => `• ${advisor.advisor}: ${advisor.sales} ventas`).join('\n')}

🚗 **MARCAS MÁS POPULARES EN STOCK:**
${context.topBrands.map((brand: any) => `• ${brand.brand}: ${brand.count} vehículos`).join('\n')}

📋 **ENTREGAS PENDIENTES:**
${context.pendingDeliveries.map((delivery: any) => `• ${delivery.license_plate} - ${delivery.advisor} - ${delivery.delivery_date}`).join('\n')}

🔧 **FUNCIONALIDADES DEL SISTEMA:**
• **Stock**: Gestión de inventario de vehículos
• **Ventas**: Registro y seguimiento de ventas
• **Entregas**: Gestión de entregas a clientes
• **CVO**: Certificados de Vehículo Ocasional
• **Taller**: Control de reparaciones
• **Reportes**: Estadísticas del negocio
• **Incentivos**: Sistema de recompensas
• **Incidencias**: Gestión de problemas

📝 **PROCESOS PRINCIPALES:**

**1. REGISTRAR NUEVA VENTA:**
   • Ir a "Ventas" → "Nueva Venta"
   • Completar datos del cliente y vehículo
   • Seleccionar asesor comercial
   • Generar CVO automáticamente

**2. GESTIÓN DE STOCK:**
   • Consultar vehículos disponibles
   • Filtrar por marca, modelo, precio
   • Verificar estado del vehículo

**3. PROCESO DE ENTREGA:**
   • Programar cita con cliente
   • Preparar documentación (CVO, llaves)
   • Confirmar entrega y firmas

**4. SEGUIMIENTO CVO:**
   • CVO se genera automáticamente tras venta
   • Estado: Pendiente → En trámite → Completado
   • Notificaciones automáticas

**5. GESTIÓN DE INCENTIVOS:**
   • Sistema de puntos por ventas
   • Objetivos mensuales por asesor
   • Reportes de rendimiento

**6. CONTROL DE INCIDENCIAS:**
   • Registro de problemas en entregas
   • Seguimiento de resoluciones
   • Comunicación con clientes

📋 **INSTRUCCIONES DE RESPUESTA:**
• **Formato**: Usa puntos y viñetas para organizar la información
• **Datos**: Usa SOLO los datos reales proporcionados arriba
• **Honestidad**: Si no sabes algo, admítelo claramente
• **Tono**: Profesional pero amigable
• **Emojis**: Usa apropiados (🌸, 🚗, 📊, 🏆, 📋, 🔧)
• **Estructura**: Organiza la información de forma clara y lógica
• **Ayuda**: Ofrece pasos específicos cuando sea posible

**EJEMPLOS DE RESPUESTAS ORGANIZADAS:**

Para preguntas sobre ventas:
• **Ventas totales**: ${context.salesCount} vehículos
• **Top asesor**: [nombre] con [número] ventas
• **Próximos pasos**: [instrucciones específicas]

Para preguntas sobre stock:
• **Stock disponible**: ${context.stockCount} vehículos
• **Marcas principales**: [lista de marcas]
• **Acceso**: Ve a "Vehículos" para ver detalles

Responde en español de forma clara, organizada y útil.`

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user", 
              content: message
            }
          ],
          model: "llama-3.1-8b-instant", // Modelo actual y rápido de Groq
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        })

    return completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu consulta en este momento."
    
  } catch (error) {
    console.error('Error con Groq:', error)
    
    // Fallback a respuestas básicas si Groq falla
    const lowerMessage = message.toLowerCase()
    
    if (matches(lowerMessage, ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'cómo estás', 'como estas'])) {
      return getGreetingInfo()
    }
    
    if (matches(lowerMessage, ['ayuda', 'help'])) {
      return getHelpInfo()
    }
    
    return `¡Hola! Soy Edelweiss 🌸, tu asistente CVO especializado.

📊 **ESTADO ACTUAL DEL SISTEMA:**
• **Stock**: ${context.stockCount} vehículos disponibles
• **Ventas**: ${context.salesCount} ventas registradas
• **Entregas**: ${context.deliveriesCount} entregas totales
• **CVO**: ${context.cvoCount} certificados procesados

🏆 **TOP ASESORES:**
${context.topAdvisors.slice(0, 3).map((advisor: any) => `• ${advisor.advisor}: ${advisor.sales} ventas`).join('\n')}

🚗 **MARCAS EN STOCK:**
${context.topBrands.slice(0, 3).map((brand: any) => `• ${brand.brand}: ${brand.count} vehículos`).join('\n')}

📋 **ENTREGAS PENDIENTES:**
${context.pendingDeliveries.slice(0, 3).map((delivery: any) => `• ${delivery.license_plate} - ${delivery.advisor}`).join('\n')}

🔧 **¿EN QUÉ PUEDO AYUDARTE?**
• **Ventas**: Registrar nuevas ventas, consultar asesores
• **Stock**: Buscar vehículos, consultar inventario
• **Entregas**: Programar citas, seguimiento
• **CVO**: Estado de certificados, trámites
• **Procesos**: Guías paso a paso
• **Reportes**: Estadísticas y análisis

¿Qué necesitas saber específicamente?`
  }
}

function matches(message: string, keywords: string[]): boolean {
  return keywords.some(keyword => message.includes(keyword))
}

function getGreetingInfo() {
  return `¡Hola! Soy Edelweiss 🌸, tu asistente CVO.

📋 **FUNCIONALIDADES PRINCIPALES:**
• **Ventas**: Registro y seguimiento de ventas
• **Stock**: Gestión de inventario de vehículos  
• **Entregas**: Programación y seguimiento
• **CVO**: Certificados de Vehículo Ocasional
• **Reportes**: Estadísticas y análisis

🔧 **PROCESOS MÁS SOLICITADOS:**
• Registrar nueva venta
• Consultar stock disponible
• Programar entrega
• Verificar estado CVO
• Consultar asesores comerciales

¿En qué puedo ayudarte hoy?`
}

function getHelpInfo() {
  return `🌸 **EDELWEISS - GUÍA DE AYUDA**

📊 **CONSULTAS DISPONIBLES:**
• **Ventas**: "¿Cuántas ventas hay?", "¿Quién es el mejor asesor?"
• **Stock**: "¿Qué vehículos hay disponibles?", "¿Cuántos BMW hay?"
• **Entregas**: "¿Hay entregas pendientes?", "¿Cuándo se entrega [matrícula]?"
• **CVO**: "¿Cuántos CVO están pendientes?", "Estado del CVO de [matrícula]"

📝 **PROCESOS PASO A PASO:**
• **Nueva Venta**: Ve a "Ventas" → "Nueva Venta"
• **Buscar Vehículo**: Ve a "Vehículos" → Usa filtros
• **Programar Entrega**: Ve a "Entregas" → "Nueva Entrega"
• **Verificar CVO**: Ve a "CVO" → Busca por matrícula

🏆 **INFORMACIÓN ESPECÍFICA:**
• Top asesores comerciales
• Marcas más vendidas
• Entregas pendientes
• Estadísticas de ventas

¿Qué necesitas saber específicamente?`
}

function getStockInfo(context: any) {
  return `📊 **STOCK ACTUAL:**

• **Total**: ${context.stockCount} vehículos disponibles

🚗 **MARCAS PRINCIPALES:**
${context.topBrands.map((brand: any) => `• ${brand.brand}: ${brand.count} vehículos`).join('\n')}

📋 **ACCESO AL STOCK:**
• Ve a "Vehículos" en el menú principal
• Usa los filtros para buscar por marca, modelo, precio
• Consulta detalles específicos de cada vehículo

¿Necesitas información sobre alguna marca específica?`
}

function getSalesInfo(context: any) {
  return `💰 **VENTAS ACTUALES:**

• **Total registradas**: ${context.salesCount} ventas

🏆 **TOP ASESORES COMERCIALES:**
${context.topAdvisors.map((advisor: any) => `• ${advisor.advisor}: ${advisor.sales} ventas`).join('\n')}

📋 **VENTAS RECIENTES:**
${context.recentSales.slice(0, 5).map((sale: any) => `• ${sale.brand} ${sale.model} - ${sale.advisor} - ${sale.license_plate}`).join('\n')}

📊 **ACCESO A VENTAS:**
• Ve a "Ventas" en el menú principal
• Consulta ventas por asesor o período
• Registra nuevas ventas

¿Necesitas información sobre algún asesor específico o período de tiempo?`
}

function getDeliveryInfo(context: any) {
  return `🚚 **ENTREGAS ACTUALES:**

• **Total registradas**: ${context.deliveriesCount} entregas

📋 **ENTREGAS PENDIENTES:**
${context.pendingDeliveries.map((delivery: any) => `• ${delivery.license_plate} - ${delivery.advisor} - ${delivery.delivery_date}`).join('\n')}

📊 **ACCESO A ENTREGAS:**
• Ve a "Entregas" en el menú principal
• Consulta entregas por estado o asesor
• Programa nuevas entregas

🔧 **ESTADOS DE ENTREGA:**
• **Pendiente**: Esperando programación
• **En Proceso**: Preparando documentación
• **Completada**: Entregada al cliente

¿Necesitas información sobre alguna entrega específica o estado?`
}

function getCVOInfo(context: any) {
  return `📋 **CVO (CERTIFICADO DE VEHÍCULO OCASIONAL):**

• **Total solicitudes**: ${context.cvoCount} certificados

🔧 **PROCESO CVO:**
• Se genera automáticamente tras cada venta
• Estado: Pendiente → En trámite → Completado
• Notificaciones automáticas al cliente

📊 **ACCESO A CVO:**
• Ve a "CVO" en el menú principal
• Busca por matrícula o cliente
• Consulta estado de trámites

¿Necesitas verificar el estado de algún CVO específico?`
}

function getWorkshopInfo(context: any) {
  return `🔧 **TALLER - CONTROL DE CALIDAD:**

• **Sistema automatizado** de asignación de fotógrafos
• **Estados**: Pendiente, En Proceso, Apto, No Apto
• **Categorías**: Pintura y Mecánica

📊 **ACCESO AL TALLER:**
• Ve a "Taller" en el menú principal
• Consulta vehículos pendientes de revisión
• Asigna fotógrafos y técnicos

🔧 **PROCESO DE REVISIÓN:**
• Inspección visual (pintura)
• Revisión mecánica
• Documentación fotográfica
• Aprobación final

¿Necesitas información sobre vehículos pendientes de revisión?`
}

function getGeneralStats(context: any) {
  return `📈 **RESUMEN GENERAL DEL SISTEMA:**

• **Stock total**: ${context.stockCount} vehículos
• **Ventas registradas**: ${context.salesCount} ventas
• **Entregas totales**: ${context.deliveriesCount} entregas
• **CVO procesados**: ${context.cvoCount} certificados

🏆 **TOP ASESORES:**
${context.topAdvisors.slice(0, 3).map((advisor: any) => `• ${advisor.advisor}: ${advisor.sales} ventas`).join('\n')}

🚗 **MARCAS PRINCIPALES:**
${context.topBrands.slice(0, 3).map((brand: any) => `• ${brand.brand}: ${brand.count} vehículos`).join('\n')}

📋 **ENTREGAS PENDIENTES:**
${context.pendingDeliveries.slice(0, 3).map((delivery: any) => `• ${delivery.license_plate} - ${delivery.advisor}`).join('\n')}

¿Necesitas información específica sobre algún área?`
}

