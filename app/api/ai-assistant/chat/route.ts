import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    const response = await processAIQuery(message, context)
    
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
    const [recentSales, topAdvisors, vehicleBrands, recentVehicles, users, pendingDeliveries] = await Promise.all([
      // Ventas recientes con detalles completos
      supabase
        .from('sales_vehicles')
        .select('license_plate, model, advisor, price, payment_method, created_at, client_name, client_phone, brand')
        .order('created_at', { ascending: false })
        .limit(15),
      
      // Top asesores comerciales con estadísticas
      supabase
        .from('sales_vehicles')
        .select('advisor, advisor_name, price, created_at')
        .not('advisor', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Marcas de vehículos en stock con modelos
      supabase
        .from('nuevas_entradas')
        .select('license_plate, model, purchase_price, vehicle_type')
        .limit(50),
      
      // Vehículos recientes en stock
      supabase
        .from('nuevas_entradas')
        .select('license_plate, model, purchase_price, vehicle_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Usuarios/empleados del sistema
      supabase
        .from('profiles')
        .select('full_name, phone, position, alias')
        .limit(20),

      // Entregas pendientes
      supabase
        .from('entregas')
        .select('matricula, modelo, asesor, fecha_entrega, observaciones')
        .limit(10)
    ])

    // Procesar datos de asesores con estadísticas mensuales
    const advisorStats = topAdvisors.data?.reduce((acc: any, sale: any) => {
      if (sale.advisor) {
        if (!acc[sale.advisor]) {
          acc[sale.advisor] = { sales: 0, revenue: 0, recentSales: [] }
        }
        acc[sale.advisor].sales += 1
        acc[sale.advisor].revenue += sale.price || 0
        acc[sale.advisor].recentSales.push({
          date: sale.created_at,
          price: sale.price
        })
      }
      return acc
    }, {}) || {}

    const topAdvisorsList = Object.entries(advisorStats)
      .sort(([,a], [,b]) => (b as any).sales - (a as any).sales)
      .slice(0, 10)
      .map(([advisor, data]: [string, any]) => ({ 
        advisor, 
        sales: data.sales, 
        revenue: data.revenue,
        recentSales: data.recentSales.slice(0, 5)
      }))

    // Procesar modelos de vehículos
    const modelStats = vehicleBrands.data?.reduce((acc: any, vehicle: any) => {
      if (vehicle.model) {
        if (!acc[vehicle.model]) {
          acc[vehicle.model] = { count: 0, vehicles: [] }
        }
        acc[vehicle.model].count += 1
        acc[vehicle.model].vehicles.push({
          license_plate: vehicle.license_plate,
          model: vehicle.model,
          price: vehicle.purchase_price,
          type: vehicle.vehicle_type
        })
      }
      return acc
    }, {}) || {}

    const topBrands = Object.entries(modelStats)
      .sort(([,a], [,b]) => (b as any).count - (a as any).count)
      .slice(0, 8)
      .map(([model, data]: [string, any]) => ({ 
        brand: model, 
        count: data.count,
        models: [model],
        vehicles: data.vehicles.slice(0, 5)
      }))

    const contextData = {
      // Conteos básicos
      stockCount: stockCount.count || 0,
      salesCount: salesCount.count || 0,
      deliveriesCount: pendingDeliveries.data?.length || 0,
      cvoCount: 0, // No tenemos tabla de CVO
      
      // Datos específicos y detallados
      recentSales: recentSales.data || [],
      topAdvisors: topAdvisorsList,
      topBrands: topBrands,
      pendingDeliveries: pendingDeliveries.data || [],
      recentVehicles: recentVehicles.data || [],
      recentCVOs: [], // No tenemos tabla de CVO
      users: users.data || [],
      
      timestamp: new Date().toISOString()
    }

    // Log para debug
    console.log('🔍 CONTEXTO OBTENIDO:', {
      stockCount: contextData.stockCount,
      salesCount: contextData.salesCount,
      recentSalesLength: contextData.recentSales.length,
      topAdvisorsLength: contextData.topAdvisors.length,
      topBrandsLength: contextData.topBrands.length,
      usersLength: contextData.users.length
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
      timestamp: new Date().toISOString()
    }
  }
}

async function processAIQuery(message: string, context: any) {
  try {
    // Crear el prompt conversacional e inteligente
    const systemPrompt = `Eres Edelweiss 🌸, un asistente IA conversacional especializado en el sistema CVO. Eres como un compañero de trabajo experto que conoce todo el sistema y puede ayudar con cualquier situación del día a día.

## TU PERSONALIDAD:
- Hablas de forma natural y amigable, como una persona real
- Eres proactivo y ofreces soluciones prácticas
- Te adaptas al contexto y tipo de pregunta
- Eres experto en todos los procesos del sistema CVO

## DATOS ACTUALES DEL SISTEMA:

**📊 RESUMEN GENERAL:**
- Stock total: ${context.stockCount} vehículos
- Ventas registradas: ${context.salesCount} ventas
- Entregas totales: ${context.deliveriesCount} entregas
- CVO procesados: ${context.cvoCount} certificados

**🏆 TOP ASESORES (últimos 30 días):**
${context.topAdvisors.slice(0, 5).map((advisor: any) => `• ${advisor.advisor}: ${advisor.sales} ventas, €${advisor.revenue?.toLocaleString() || 0} facturado`).join('\n')}

**🚗 MARCAS EN STOCK:**
${context.topBrands.slice(0, 5).map((brand: any) => `• ${brand.brand}: ${brand.count} vehículos (modelos: ${brand.models?.slice(0, 3).join(', ') || 'N/A'})`).join('\n')}

**📋 ENTREGAS PENDIENTES:**
${context.pendingDeliveries.slice(0, 5).map((delivery: any) => `• ${delivery.matricula} - ${delivery.modelo} - Asesor: ${delivery.asesor || 'Sin asesor'} - Fecha: ${delivery.fecha_entrega ? new Date(delivery.fecha_entrega).toLocaleDateString() : 'Sin fecha'} - Observaciones: ${delivery.observaciones || 'Sin observaciones'}`).join('\n')}

**👥 USUARIOS DEL SISTEMA:**
${context.users.slice(0, 10).map((user: any) => `• ${user.full_name}: ${user.position || 'Usuario'} (${user.phone || 'Sin teléfono'})`).join('\n')}

**👤 USUARIO ACTUAL:**
${context.currentUser ? `• Nombre: ${context.currentUser.name || 'No disponible'}
• Email: ${context.currentUser.email || 'No disponible'}
• Rol: ${context.currentUser.role || 'No disponible'}
• Teléfono: ${context.currentUser.phone || 'No disponible'}` : 'No hay información del usuario actual disponible'}

**🚗 VEHÍCULOS RECIENTES EN STOCK:**
${context.recentVehicles.slice(0, 10).map((vehicle: any) => `• ${vehicle.license_plate}: ${vehicle.model} (${vehicle.vehicle_type || 'Sin tipo'}) - €${vehicle.purchase_price?.toLocaleString() || 'N/A'} - Fecha: ${vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString() : 'Sin fecha'}`).join('\n')}

**💰 VENTAS RECIENTES DETALLADAS:**
${context.recentSales.slice(0, 10).map((sale: any) => `• ${sale.license_plate}: ${sale.brand || 'Sin marca'} ${sale.model} - Cliente: ${sale.client_name || 'Sin nombre'} - Teléfono: ${sale.client_phone || 'Sin teléfono'} - Asesor: ${sale.advisor || 'Sin asesor'} - Precio: €${sale.price?.toLocaleString() || 'N/A'} - Fecha: ${sale.created_at ? new Date(sale.created_at).toLocaleDateString() : 'Sin fecha'}`).join('\n')}

**📋 CVO RECIENTES:**
${context.recentCVOs.slice(0, 5).map((cvo: any) => `• ${cvo.license_plate}: ${cvo.status || 'Sin estado'} - ${cvo.advisor || 'Sin asesor'} - ${cvo.created_at ? new Date(cvo.created_at).toLocaleDateString() : 'Sin fecha'}`).join('\n')}

## CAPACIDADES ESPECIALES:

**🔍 BÚSQUEDAS ESPECÍFICAS:**
Puedo buscar información específica sobre:
- Vehículos por matrícula, marca, modelo
- Clientes por nombre, teléfono, DNI
- Asesores comerciales y sus ventas
- Estado de entregas y CVO
- Usuarios del sistema y sus datos

**📝 PROCESOS DEL SISTEMA:**
Conozco todos los procesos:
- Cómo registrar una nueva venta
- Cómo validar un pedido
- Cómo gestionar entregas
- Cómo manejar CVO
- Cómo resolver incidencias
- Cómo justificar retrasos
- Cómo recuperar ventas caídas

**💡 RESOLUCIÓN DE PROBLEMAS:**
Puedo ayudar con:
- Situaciones con clientes problemáticos
- Retrasos en entregas
- Problemas con CVO
- Gestión de incidencias
- Justificaciones administrativas
- Estrategias de venta

## INSTRUCCIONES DE CONVERSACIÓN:

1. **Sé conversacional**: Responde como si fueras un compañero de trabajo
2. **Sé proactivo**: Ofrece información adicional relevante
3. **Usa datos reales**: Siempre que sea posible, usa los datos específicos del sistema
4. **Da pasos concretos**: Para procesos, da instrucciones paso a paso
5. **Adapta tu respuesta**: Según el tipo de pregunta (técnica, práctica, problema)
6. **Sé útil**: Ofrece soluciones prácticas y realistas

## EJEMPLOS DE RESPUESTAS:

**Usuario**: "Dime el teléfono de Juan García"
**Tu respuesta**: "Buscando a Juan García... [busca en los datos] Encontré a Juan García en el sistema. ¿Te refieres al cliente con matrícula ABC123 o al de XYZ789? Te muestro ambos: [datos específicos]"

**Usuario**: "¿Cómo justifico un retraso en entrega?"
**Tu respuesta**: "Para justificar un retraso, tienes varias opciones según la causa:
1. **Problemas técnicos**: Si hay retrasos en taller o documentación
2. **Administrativos**: CVO en trámite, financiación pendiente
3. **Cliente**: Si el cliente no está disponible o falta documentación
¿Cuál es tu situación específica? Puedo ayudarte a redactar la justificación adecuada."

**Usuario**: "Tengo un problema con un cliente"
**Tu respuesta**: "Cuéntame qué está pasando específicamente. ¿Es sobre entrega, CVO, pago, o algo más? Mientras tanto, puedo revisar el historial del cliente si me das la matrícula o nombre para darte el contexto completo."

**IMPORTANTE**: SIEMPRE usa los datos reales proporcionados arriba. Si el usuario pregunta sobre algo específico (como "Rodrigo Moreno" o "BMW Serie 5"), busca en los datos reales del sistema. Si no encuentras la información específica, di exactamente qué datos SÍ tienes disponibles.

Responde siempre de forma natural, útil y con información específica cuando sea posible.`

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
      model: "gpt-4o", // Modelo más inteligente y conversacional
      temperature: 0.8,
      max_tokens: 1500,
          stream: false
        })

    return completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu consulta en este momento."
    
  } catch (error) {
    console.error('Error con OpenAI:', error)
    
    // Fallback a respuestas básicas si OpenAI falla
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

// Función para verificar el límite de uso diario
async function checkDailyUsage(userId: string, userRole?: string): Promise<{
  limited: boolean
  message: string
  usage: { current: number, limit: number }
}> {
  try {
    // Los administradores no tienen límite
    if (userRole?.toLowerCase().includes('admin')) {
      return {
        limited: false,
        message: '',
        usage: { current: 0, limit: -1 }
      }
    }

    // Verificar uso actual del día
    const { data: usageData, error } = await supabase
      .rpc('get_edelweis_usage_today', { user_uuid: userId })

    if (error) {
      console.error('Error verificando uso diario:', error)
      return {
        limited: false,
        message: '',
        usage: { current: 0, limit: 5 }
      }
    }

    const currentUsage = usageData || 0
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

