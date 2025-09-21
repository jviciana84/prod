import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { message, userInfo } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      )
    }

    // Verificar límite de uso diario si hay información del usuario
    if (userInfo?.id) {
      const usageCheck = await checkDailyUsage(userInfo.id, userInfo.role)
      if (usageCheck.limited) {
        return NextResponse.json(
          { 
            error: 'Límite diario alcanzado',
            message: usageCheck.message,
            usage: usageCheck.usage
          },
          { status: 429 }
        )
      }
    }
    
    // Obtener contexto del sistema
    const context = await getSystemContext()
    
    // Agregar información del usuario actual si está disponible
    if (userInfo) {
      context.currentUser = userInfo
    }
    
    // Procesar la pregunta con IA
    const response = await processAIQuery(message, context, { 
      preferredModel: "gpt-4o",
      creativity: "high",
      responseLength: "detailed"
    })
    
    // Incrementar contador de uso si hay información del usuario
    if (userInfo?.id) {
      await incrementDailyUsage(userInfo.id)
    }
    
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
    const [stockCount, salesCount] = await Promise.all([
      supabase.from('nuevas_entradas').select('id', { count: 'exact', head: true }),
      supabase.from('sales_vehicles').select('id', { count: 'exact', head: true })
    ])

    // Obtener datos específicos y detallados
    const [recentSales, topAdvisors, vehicleBrands, recentVehicles, users, pendingDeliveries, pdfClients, validatedOrders, incidents] = await Promise.all([
      // Ventas con detalles completos (TODOS los registros históricos)
      supabase
        .from('sales_vehicles')
        .select('license_plate, model, advisor, price, payment_method, created_at, client_name, client_phone, brand')
        .order('created_at', { ascending: false }),
      
      // Top asesores comerciales con estadísticas
      supabase
        .from('sales_vehicles')
        .select('advisor, advisor_name, price, created_at')
        .not('advisor', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Marcas de vehículos en stock con modelos (TODOS los registros)
      supabase
        .from('nuevas_entradas')
        .select('brand, model, license_plate, created_at')
        .order('created_at', { ascending: false }),
      
      // Vehículos recientes en stock (TODOS los registros)
      supabase
        .from('nuevas_entradas')
        .select('license_plate, model, vehicle_type, purchase_price, created_at')
        .order('created_at', { ascending: false }),

      // Usuarios del sistema (TODOS los usuarios)
      supabase
        .from('profiles')
        .select('full_name, position, phone, email, role')
        .order('created_at', { ascending: false }),

      // Entregas pendientes (TODOS los registros)
      supabase
        .from('entregas')
        .select('matricula, modelo, asesor, fecha_entrega, observaciones, estado')
        .order('created_at', { ascending: false }),
      
      // Datos de clientes de PDFs (TODOS los registros históricos)
      supabase
        .from('pdf_extracted_data')
        .select('nombre_cliente, telefono, email, domicilio, ciudad, provincia, matricula, modelo, comercial, dni_nif, total, color, kilometros, marca, created_at')
        .order('created_at', { ascending: false })
        .limit(100), // Limit for performance
      
      // Pedidos validados (TODOS los registros históricos)
      supabase
        .from('pedidos_validados')
        .select('license_plate, model, advisor, advisor_name, price, payment_method, client_name, client_phone, client_email, client_address, brand, color, bank, is_failed_sale, failed_reason, failed_date, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50), // Limit for performance
      
      // Incidencias del sistema (TODOS los registros históricos)
      supabase
        .from('incidencias_historial')
        .select('id, matricula, tipo_incidencia, accion, usuario_nombre, fecha, comentario, resuelta, fecha_resolucion, estado, matricula_manual, fecha_incidencia')
        .order('fecha', { ascending: false })
        .limit(30) // Limit for performance
    ])

    // Procesar datos de asesores
    const advisorStats = new Map()
    topAdvisors.data?.forEach((sale: any) => {
      const advisor = sale.advisor
      if (!advisorStats.has(advisor)) {
        advisorStats.set(advisor, { sales: 0, revenue: 0 })
      }
      const stats = advisorStats.get(advisor)
      stats.sales++
      stats.revenue += sale.price || 0
    })

    const topAdvisorsList = Array.from(advisorStats.entries())
      .map(([advisor, stats]) => ({ advisor, ...stats }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)

    // Procesar datos de marcas
    const brandStats = new Map()
    vehicleBrands.data?.forEach((vehicle: any) => {
      const brand = vehicle.brand
      if (!brandStats.has(brand)) {
        brandStats.set(brand, { count: 0, models: new Set() })
      }
      const stats = brandStats.get(brand)
      stats.count++
      if (vehicle.model) stats.models.add(vehicle.model)
    })

    const topBrandsList = Array.from(brandStats.entries())
      .map(([brand, stats]) => ({ 
        brand, 
        count: stats.count, 
        models: Array.from(stats.models) 
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const contextData = {
      stockCount: stockCount.count || 0,
      salesCount: salesCount.count || 0,
      deliveriesCount: pendingDeliveries.data?.length || 0,
      cvoCount: 0, // No tenemos tabla de CVO
      recentSales: recentSales.data || [],
      topAdvisors: topAdvisorsList,
      topBrands: topBrandsList,
      pendingDeliveries: pendingDeliveries.data || [],
      recentVehicles: recentVehicles.data || [],
      recentCVOs: [], // No tenemos tabla de CVO
      users: users.data || [],
      pdfClients: pdfClients.data || [], // Datos de clientes de PDFs
      validatedOrders: validatedOrders.data || [], // Pedidos validados
      incidents: incidents.data || [], // Incidencias del sistema
      
      timestamp: new Date().toISOString()
    }

    // Log para debug
    console.log('🔍 CONTEXTO OBTENIDO:', {
      stockCount: contextData.stockCount,
      salesCount: contextData.salesCount,
      recentSalesLength: contextData.recentSales.length,
      topAdvisorsLength: contextData.topAdvisors.length,
      topBrandsLength: contextData.topBrands.length,
      usersLength: contextData.users.length,
      pdfClientsLength: contextData.pdfClients.length
    })

    return contextData
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
      recentVehicles: [],
      recentCVOs: [],
      users: [],
      pdfClients: [],
      validatedOrders: [],
      incidents: [],
      timestamp: new Date().toISOString()
    }
  }
}

async function processAIQuery(message: string, context: any, userPreferences?: any) {
  try {
    console.log('🔍 INICIANDO PROCESAMIENTO IA:', { 
      message, 
      contextLength: context.pdfClients?.length,
      pdfClients: context.pdfClients?.slice(0, 2)
    })
    
    // Crear el prompt conversacional e inteligente (ultra simplificado para debug)
    const systemPrompt = `Eres Edelweiss, un asistente IA.

DATOS DE CLIENTES:
• RODRIGO MORENO CARNERO: +34638511487 - 3943MTH - Serie 5 520d - JORDI VICIANA - Negro - 13178km - Madrid

INSTRUCCIONES:
1. Responde de forma natural y conversacional
2. Busca información específica cuando te la pidan
3. Si buscan un cliente específico, busca en los datos de PDFs

Responde siempre de forma útil y específica.`

    console.log('📝 PROMPT CREADO:', systemPrompt.substring(0, 200) + '...')
    console.log('🔑 API KEY LENGTH:', process.env.OPENAI_API_KEY?.length)

    console.log('🚀 LLAMANDO A OPENAI...')
    
    const completion = await openai.chat.completions.create({
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
      model: "gpt-4o",
      temperature: 1.2,
      max_tokens: 1500,
      top_p: 0.9,
      frequency_penalty: 0.3,
      presence_penalty: 0.2,
      response_format: {
        type: "text"
      },
      stream: false
    })

    console.log('✅ OPENAI RESPONSE RECIBIDA:', completion.choices[0]?.message?.content?.substring(0, 100))
    
    const response = completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu consulta en este momento."
    
    console.log('📤 ENVIANDO RESPUESTA:', response.substring(0, 100))
    return response
    
  } catch (error) {
    console.error('Error con OpenAI:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    
    // Fallback a respuestas básicas si OpenAI falla
    const lowerMessage = message.toLowerCase()
    
    if (matches(lowerMessage, ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'cómo estás', 'como estas'])) {
      return getGreetingInfo()
    }
    
    if (matches(lowerMessage, ['ayuda', 'help'])) {
      return getHelpInfo()
    }
    
    if (matches(lowerMessage, ['stock', 'inventario', 'vehículos'])) {
      return getStockInfo(context)
    }
    
    if (matches(lowerMessage, ['ventas', 'vender', 'venta'])) {
      return getSalesInfo(context)
    }
    
    if (matches(lowerMessage, ['entregas', 'entrega', 'delivery'])) {
      return getDeliveryInfo(context)
    }
    
    if (matches(lowerMessage, ['cvo', 'certificado'])) {
      return getCVOInfo(context)
    }
    
    if (matches(lowerMessage, ['taller', 'fotos', 'fotógrafo'])) {
      return getWorkshopInfo(context)
    }
    
    return "Lo siento, no pude procesar tu consulta. ¿Podrías reformular tu pregunta?"
  }
}

// Función auxiliar para coincidencias
function matches(text: string, keywords: string[]): boolean {
  return keywords.some(keyword => text.includes(keyword))
}

// Funciones de información básica
function getGreetingInfo() {
  return `¡Hola! Soy Edelweiss 🌸, tu asistente CVO especializado.

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
  return `🔧 **AYUDA - EDELWEISS**

📋 **FUNCIONALIDADES DISPONIBLES:**
• **Ventas**: Consultar, registrar y gestionar ventas
• **Stock**: Buscar vehículos, consultar inventario
• **Entregas**: Programar y seguir entregas
• **CVO**: Estado de certificados y trámites
• **Usuarios**: Consultar información de usuarios
• **Reportes**: Estadísticas y análisis

💡 **EJEMPLOS DE CONSULTAS:**
• "Busca el teléfono de [cliente]"
• "¿Cuántos vehículos hay en stock?"
• "Muestra las ventas de [asesor]"
• "¿Qué entregas están pendientes?"

¿Qué necesitas saber específicamente?`
}

function getStockInfo(context: any) {
  return `🚗 **STOCK DE VEHÍCULOS:**

• **Total disponible**: ${context.stockCount} vehículos

🔧 **PROCESO DE STOCK:**
• Vehículos nuevos ingresan automáticamente
• Control de calidad en taller
• Asignación de fotógrafos
• Disponible para venta

📊 **ACCESO AL STOCK:**
• Ve a "Stock" en el menú principal
• Filtra por marca, modelo, precio
• Consulta detalles de cada vehículo

¿Necesitas información sobre algún vehículo específico?`
}

function getSalesInfo(context: any) {
  return `💰 **VENTAS:**

• **Total registradas**: ${context.salesCount} ventas

🏆 **TOP ASESORES:**
${context.topAdvisors.slice(0, 5).map((advisor: any) => `• ${advisor.advisor}: ${advisor.sales} ventas, €${advisor.revenue?.toLocaleString() || 0} facturado`).join('\n')}

🔧 **PROCESO DE VENTA:**
• Registro de cliente y vehículo
• Validación de pedido
• Programación de entrega
• Generación de CVO

📊 **ACCESO A VENTAS:**
• Ve a "Ventas" en el menú principal
• Consulta por asesor o cliente
• Registra nuevas ventas

¿Necesitas información sobre alguna venta específica?`
}

function getDeliveryInfo(context: any) {
  return `📦 **ENTREGAS:**

• **Total programadas**: ${context.deliveriesCount} entregas

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

¿Necesitas información sobre el estado del taller?`
}

// Función para verificar el límite de uso diario
async function checkDailyUsage(userId: string, userRole: string) {
  try {
    // Los administradores no tienen límite
    if (userRole === 'admin') {
      return {
        limited: false,
        message: '',
        usage: { current: 0, limit: 999 }
      }
    }

    // Obtener el uso actual del día
    const today = new Date().toISOString().split('T')[0]
    const { data: usageData, error } = await supabase
      .from('edelweis_usage')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error obteniendo uso diario:', error)
    }

    const currentUsage = usageData?.usage_count || 0
    const dailyLimit = 5

    if (currentUsage >= dailyLimit) {
      return {
        limited: true,
        message: `Has alcanzado el límite diario de ${dailyLimit} preguntas. Vuelve mañana para continuar usando Edelweis.`,
        usage: { current: currentUsage, limit: dailyLimit }
      }
    }

    return {
      limited: false,
      message: '',
      usage: { current: currentUsage, limit: dailyLimit }
    }
  } catch (error) {
    console.error('Error en checkDailyUsage:', error)
    return {
      limited: false,
      message: '',
      usage: { current: 0, limit: 5 }
    }
  }
}

// Función para incrementar el contador de uso diario
async function incrementDailyUsage(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('increment_edelweis_usage', { user_uuid: userId })

    if (error) {
      console.error('Error incrementando uso diario:', error)
    }
  } catch (error) {
    console.error('Error en incrementDailyUsage:', error)
  }
}