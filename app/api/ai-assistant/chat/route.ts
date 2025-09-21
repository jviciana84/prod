import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Array para almacenar logs
let debugLogs: string[] = []

// Función para agregar logs
function addLog(message: string) {
  const timestamp = new Date().toISOString()
  debugLogs.push(`[${timestamp}] ${message}`)
  console.log(message) // También log normal
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Función para obtener información del usuario actual
async function getCurrentUserInfo() {
  try {
    const cookieStore = await cookies()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('No hay usuario autenticado')
      return null
    }

    // Obtener perfil completo del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, position, phone, email, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError)
      return {
        id: user.id,
        email: user.email,
        name: user.email?.split('@')[0] || 'Usuario',
        role: 'usuario'
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: profile.full_name || user.email?.split('@')[0] || 'Usuario',
      role: profile.role || 'usuario',
      position: profile.position || 'Empleado',
      phone: profile.phone,
      avatar_url: profile.avatar_url
    }
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userInfo, sessionId } = await request.json()
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      )
    }

    // Obtener información del usuario actual automáticamente
    const currentUser = await getCurrentUserInfo()

    // Verificar límite de uso diario si hay información del usuario
    if (currentUser?.id) {
      const usageCheck = await checkDailyUsage(currentUser.id, currentUser.role)
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
    
    // Agregar información del usuario actual
    context.currentUser = currentUser
    
    // Procesar la pregunta con IA
    const response = await processAIQuery(message, context, { 
      preferredModel: "gpt-4o",
      creativity: "high",
      responseLength: "detailed"
    })
    
    // Guardar la conversación en la base de datos
    let savedSessionId = sessionId
    const userIdToSave = userInfo?.id || currentUser?.id
    
    addLog(`🔍 DEBUG GUARDADO: currentUser=${currentUser?.id}, userInfo=${userInfo?.id}, userIdToSave=${userIdToSave}, sessionId=${sessionId}`)
    
    if (userIdToSave) {
      try {
        addLog('🔄 INICIANDO GUARDADO...')
        
        // Crear un cliente de Supabase con service role para guardar conversaciones
        // Las políticas RLS permiten insertar si el user_id coincide
        const saveSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        addLog('🔄 CLIENTE SUPABASE CREADO')
        
        const saveResult = await saveConversation(saveSupabase, userIdToSave, message, response, sessionId, {
          timestamp: new Date().toISOString(),
          userRole: currentUser?.role || userInfo?.role || 'usuario'
        })
        
        addLog(`🔄 RESULTADO DEL GUARDADO: ${JSON.stringify(saveResult)}`)
        
        savedSessionId = saveResult.sessionId
        addLog(`✅ Conversación guardada exitosamente: ${saveResult.sessionId}`)
      } catch (error) {
        addLog(`❌ Error guardando conversación: ${error}`)
        addLog(`❌ Error details: ${JSON.stringify(error, null, 2)}`)
        // No fallar si no se puede guardar la conversación
      }
    } else {
      addLog('⚠️ No se puede guardar conversación: no hay userId disponible')
    }
    
    // Incrementar contador de uso si hay información del usuario
    if (userInfo?.id) {
      await incrementDailyUsage(userInfo.id)
    }
    
    addLog(`📤 ENVIANDO RESPUESTA FINAL: responseLength=${response.length}, sessionId=${savedSessionId}, originalSessionId=${sessionId}`)
    
    return NextResponse.json({ 
      response,
      sessionId: savedSessionId,
      debugLogs: debugLogs.slice(-10) // Últimos 10 logs para debug
    })
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
        .select('matricula, modelo, asesor, fecha_entrega, observaciones')
        .order('created_at', { ascending: false }),
      
      // Datos de clientes de PDFs (TODOS los registros históricos)
      supabase
        .from('pdf_extracted_data')
        .select('nombre_cliente, telefono, email, domicilio, ciudad, provincia, matricula, modelo, comercial, dni_nif, total, descuento, color, kilometros, marca, created_at')
        .order('created_at', { ascending: false }),
      
      // Pedidos validados (TODOS los registros históricos)
      supabase
        .from('pedidos_validados')
        .select('license_plate, model, advisor, advisor_name, price, payment_method, client_name, client_phone, client_email, client_address, brand, color, bank, is_failed_sale, failed_reason, failed_date, created_at, updated_at')
        .order('created_at', { ascending: false }),
      
      // Incidencias del sistema (TODOS los registros históricos)
      supabase
        .from('incidencias_historial')
        .select('id, matricula, tipo_incidencia, accion, usuario_nombre, fecha, comentario, resuelta, fecha_resolucion, estado, matricula_manual, fecha_incidencia')
        .order('fecha', { ascending: false })
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
      pdfClientsLength: contextData.pdfClients.length,
      pendingDeliveriesLength: contextData.pendingDeliveries.length,
      pendingDeliveriesSample: contextData.pendingDeliveries.slice(0, 3)
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
      currentUser: context.currentUser,
      usersCount: context.users?.length
    })
    
    // Crear el prompt conversacional e inteligente y personal
    const systemPrompt = `Eres Edelweiss 🌸, un asistente IA personal y cálido del sistema CVO.

CONOCIMIENTO COMPLETO DEL SISTEMA:
Tienes acceso a TODAS las tablas y datos del sistema CVO:

📊 **TABLAS DISPONIBLES:**
• **sales_vehicles**: Todas las ventas registradas (matrícula, modelo, asesor, precio, cliente, fecha)
• **pdf_extracted_data**: Datos extraídos de PDFs de ventas (cliente, teléfono, matrícula, modelo, comercial, total, descuento, color, km, ubicación, fecha)
• **pedidos_validados**: Pedidos validados del sistema (mismo formato que sales_vehicles)
• **nuevas_entradas**: Stock de vehículos (matrícula, modelo, marca, precio compra, fecha)
• **entregas**: Entregas programadas (matrícula, modelo, asesor, fecha, estado)
• **incidencias_historial**: Incidencias del sistema (matrícula, tipo, usuario, fecha, estado)
• **profiles**: Usuarios del sistema (nombre, rol, posición, teléfono, email)

🔍 **TIPOS DE BÚSQUEDAS QUE PUEDES HACER:**
• **Por cliente**: Nombre, teléfono, DNI, email
• **Por vehículo**: Matrícula, modelo, marca, color, kilómetros
• **Por comercial**: Nombre del asesor, ventas, descuentos
• **Por ubicación**: Ciudad, provincia, código postal
• **Por fechas**: Mes, año, período específico
• **Por precios**: Rango de precios, vehículo más caro/barato
• **Por estado**: Entregas pendientes, incidencias resueltas/pendientes

📈 **ANÁLISIS QUE PUEDES REALIZAR:**
• **Estadísticas**: Contar ventas por cualquier criterio
• **Rankings**: Mejores comerciales, vehículos más vendidos
• **Comparaciones**: Descuentos, precios, volúmenes
• **Filtros**: Por fecha, ubicación, tipo de vehículo
• **Búsquedas complejas**: Múltiples criterios combinados

INFORMACIÓN DEL USUARIO ACTUAL:
${context.currentUser ? `
• **Nombre**: ${context.currentUser.name}
• **Rol**: ${context.currentUser.role}
• **Posición**: ${context.currentUser.position}
• **Email**: ${context.currentUser.email}
• **Teléfono**: ${context.currentUser.phone || 'No disponible'}
` : '• No hay información del usuario disponible'}

DATOS DE CLIENTES (TODOS LOS REGISTROS HISTÓRICOS):
${context.pdfClients.map((client: any) => `• ${client.nombre_cliente || 'Sin nombre'}: ${client.telefono || 'Sin teléfono'} - ${client.matricula || 'Sin matrícula'} - ${client.modelo || 'Sin modelo'} - ${client.comercial || 'Sin comercial'} - ${client.color || 'Sin color'} - ${client.kilometros || 'Sin km'}km - ${client.ciudad || 'Sin ciudad'} (${client.provincia || 'Sin provincia'}) - Total: €${client.total?.toLocaleString() || 'N/A'} - Descuento: €${client.descuento?.toLocaleString() || '0'} - Fecha: ${client.created_at ? new Date(client.created_at).toLocaleDateString() : 'Sin fecha'}`).join('\n')}

USUARIOS DEL SISTEMA (para identificar jerarquías):
${context.users.slice(0, 15).map((user: any) => `• ${user.full_name || 'Sin nombre'}: ${user.position || 'Sin posición'} - ${user.role || 'Sin rol'} - ${user.phone || 'Sin teléfono'}`).join('\n')}

ENTREGAS (TODOS LOS REGISTROS HISTÓRICOS):
${context.pendingDeliveries.map((delivery: any) => `• ${delivery.matricula || 'Sin matrícula'}: ${delivery.modelo || 'Sin modelo'} - Asesor: ${delivery.asesor || 'Sin asesor'} - Fecha: ${delivery.fecha_entrega ? new Date(delivery.fecha_entrega).toLocaleDateString() : 'PENDIENTE (sin fecha)'}`).join('\n')}

STOCK DE VEHÍCULOS (TODOS LOS REGISTROS HISTÓRICOS):
${context.recentVehicles.map((vehicle: any) => `• ${vehicle.license_plate || 'Sin matrícula'}: ${vehicle.model || 'Sin modelo'} - Precio: €${vehicle.purchase_price?.toLocaleString() || 'N/A'} - Fecha: ${vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString() : 'Sin fecha'}`).join('\n')}

            INSTRUCCIONES PERSONALES:
            1. **SALUDO PERSONAL**: Siempre saluda al usuario por su nombre si lo conoces
            2. **Sé cálido y personal**: Habla como un compañero de trabajo real
            3. **Usa expresiones naturales**: "Vale", "Perfecto", "Ah, genial", "No pasa nada"
            4. **Identifica jerarquías**: Si mencionan "mi jefe", busca en usuarios con roles como "director", "jefe de ventas", "supervisor"
            5. **Redacta WhatsApp personalizados**: Incluye nombres específicos del usuario, cliente y jefe
            6. **Busca información específica**: Aplica filtros progresivos cuando te den múltiples pistas
            7. **SÉ HONESTO**: Si no tienes datos suficientes, dilo claramente
            8. **HACE PREGUNTAS**: Pregunta por más detalles cuando sea necesario para dar una respuesta precisa
            9. **EXPLICA LIMITACIONES**: Si algo es una aproximación o estimación, explícalo claramente
            
            **ESTILO DE ESCRITURA NATURAL:**
            - **OBLIGATORIO**: Usa negritas (**texto**), emojis y listas con puntos (•) para que sea claro y organizado
            - **NUNCA** escribas párrafos largos sin formato - siempre usa listas o negritas
            - Escribe con el tono de un humano real, no de robot
            - Sé cálido, natural y conversacional
            - Usa expresiones como "Vale", "Perfecto", "Ah, genial", "No pasa nada"
            - **DESTACA LO IMPORTANTE**: Usa negritas para nombres, teléfonos, matrículas, fechas
            - **SÉ CONCISO**: Ve al grano, no te extiendas innecesariamente
            - **FORMATO OBLIGATORIO**: Si das información, usa este formato:
              • **Nombre**: [valor]
              • **Teléfono**: [valor]  
              • **Matrícula**: [valor]

INSTRUCCIONES DE BÚSQUEDA INTELIGENTE:
- **Para buscar clientes**: Usa pdf_extracted_data (datos más completos)
- **Para buscar ventas**: Usa sales_vehicles o pedidos_validados
- **Para buscar stock**: Usa nuevas_entradas
- **Para buscar entregas**: Usa entregas
- **Para buscar incidencias**: Usa incidencias_historial
- **Para buscar usuarios**: Usa profiles

METODOLOGÍA DE BÚSQUEDA:
1. **Identifica el tipo de consulta** (cliente, vehículo, estadística, etc.)
2. **Selecciona la tabla más apropiada** según el tipo de información
3. **Aplica filtros inteligentes** (fechas, ubicaciones, criterios múltiples)
4. **Procesa y analiza** los datos encontrados
5. **Presenta resultados** de forma clara y útil

            REGLAS IMPORTANTES:
            - **Tienes acceso a TODOS los registros históricos** sin límites
            - **Busca en TODAS las tablas relevantes** para cada consulta
            - **NO te limites a registros recientes** - busca en todo el historial
            - **Combina información** de múltiples fuentes cuando sea necesario
            - **Sé específico** en tus respuestas con datos concretos
            - **Si no encuentras coincidencias exactas**: Muestra las más cercanas
            - **Para análisis**: Cuenta, suma, compara o filtra según lo solicitado
            - **Para datos antiguos**: Revisa TODO el historial, no solo lo reciente
            
            **HONESTIDAD Y PRECISIÓN:**
            - **Si no tienes datos suficientes**: Dilo claramente y pregunta por más detalles
            - **Si algo es una aproximación**: Explícalo brevemente (ej: "basándome en el DNI, la posibilidad de ser más joven sería **XXXXX**")
            - **Si no puedes determinar algo con certeza**: Sé transparente sobre las limitaciones
            - **Haz preguntas inteligentes**: Para obtener información más precisa
            - **No inventes datos**: Si no los tienes, dilo y pregunta
            - **Explica métodos alternativos**: Si usas aproximaciones, explica por qué y cómo
            - **SÉ CONCISO**: No te extiendas demasiado, ve al grano
            - **USA NEGRITAS**: Para destacar información importante como nombres, teléfonos, matrículas
            
            **ANÁLISIS AUTOMÁTICO DE DATOS:**
            - **Analiza automáticamente** las columnas disponibles en cada tabla
            - **Identifica patrones** en los datos sin que te lo pidan explícitamente
            - **Usa métodos alternativos** cuando los datos directos no están disponibles
            - **Para estimaciones de edad**: Analiza DNIs automáticamente si no hay fechas de nacimiento
            - **Para búsquedas**: Combina múltiples criterios automáticamente
            - **Para análisis**: Procesa y compara datos sin instrucciones específicas
            - **Sé proactivo**: Ofrece alternativas y métodos cuando sea apropiado
            
            **INFORMACIÓN BÁSICA QUE SIEMPRE PUEDES DAR:**
            - **Fecha y hora actual**: ${new Date().toLocaleString('es-ES')}
            - **Información general**: Restaurantes, direcciones, horarios comerciales
            - **Conocimiento general**: Cualquier información que no requiera datos específicos del sistema
            - **NO digas "no puedo"** para información básica que cualquier persona puede saber
            
            **LÓGICA DE ENTREGAS PENDIENTES:**
            - **Si fecha_entrega es null o undefined** = ENTREGA PENDIENTE
            - **Si fecha_entrega tiene una fecha** = ENTREGA PROGRAMADA/REALIZADA
            - **Para contar entregas pendientes**: Cuenta las que tienen fecha_entrega: null
            - **Para listar entregas pendientes**: Muestra las que tienen fecha_entrega: null
            - **IMPORTANTE**: En los datos de ENTREGAS, busca las que tienen "PENDIENTE (sin fecha)" en el campo Fecha
            - **EJEMPLO**: Si ves "• 9316LPP: X1 sDrive20i - Asesor: SaraMe - Fecha: PENDIENTE (sin fecha)" = ENTREGA PENDIENTE

EJEMPLOS DE RESPUESTAS PERSONALES:
Usuario: "Hola Edelweiss"
Respuesta: "¡Hola ${context.currentUser?.name || 'Usuario'}! ¿Qué tal? ¿En qué te puedo ayudar hoy?"

Usuario: "Busca información sobre [cualquier cosa]"
Respuesta: "Vale, voy a buscar esa información en los datos disponibles. [Proporciona la información encontrada de forma útil y detallada]"

Usuario: "¿Cuántos [cualquier criterio] tenemos?"
Respuesta: "Voy a revisar los datos para contarte exactamente cuántos [criterio] tenemos. [Da el número y lista los casos encontrados]"

Usuario: "¿Quién es el que más [cualquier métrica]?"
Respuesta: "Voy a analizar los datos para identificar quién tiene más [métrica]. [Proporciona el ranking y los detalles]"

            Usuario: "¿Cuántas entregas pendientes tenemos?"
            Respuesta: "Vale, déjame revisar las entregas que no tienen fecha asignada. Encuentro X entregas pendientes. Te las voy contando: **Matrícula 9316LPP**, modelo X1 sDrive20i con Sara Mendoza, **Matrícula 9909LKZ**, modelo Serie 1 116d también con Sara... [usa negritas para matrículas y tono humano]"

            Usuario: "¿Cuántas entregas tenemos pendientes?"
            Respuesta: "Perfecto, déjame ver qué entregas están pendientes. Encuentro X entregas sin fecha asignada. Aquí tienes las que están pendientes: **9316LPP** - X1 sDrive20i (Sara), **9909LKZ** - Serie 1 116d (Sara)... [combina claridad visual con conversación natural]"
            
            Usuario: "¿Quién es la clienta más joven de Javier Capellino?"
            Respuesta: "No tengo fechas de nacimiento, pero basándome en el DNI, la posibilidad de ser más joven sería **XXXXX**, aunque es muy impreciso. ¿Tienes algún otro dato?"
            
            **ANÁLISIS DE DNIs PARA ESTIMACIÓN DE EDAD:**
            - **DNI español**: Los primeros 8 dígitos indican fecha de nacimiento (YYMMDD)
            - **DNI extranjero**: No sigue este patrón, no se puede estimar edad
            - **Método**: Extrae año del DNI y calcula edad aproximada
            - **Precisión**: Solo aproximado, puede variar por emisión tardía
            - **Ejemplo**: DNI 95031512 = nacido en 1995, aproximadamente 28-29 años
            - **Respuesta**: "Basándome en el DNI **95031512**, nació en 1995, aproximadamente **28-29 años**"
            
            Usuario: "Busca el teléfono de [cliente]"
            Respuesta: "Vale, voy a buscar ese cliente. Encuentro X coincidencias con ese nombre. ¿Podrías darme más detalles como la matrícula del vehículo, la ciudad o el comercial que lo atendió? Así podré darte la información exacta que necesitas."
            
            Usuario: "¿Qué hora es?"
            Respuesta: "Son las **${new Date().toLocaleTimeString('es-ES')}** del **${new Date().toLocaleDateString('es-ES')}**."
            
            Usuario: "¿Qué día es hoy?"
            Respuesta: "Hoy es **${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**."
            
            Usuario: "Recomiéndame un restaurante en Girona"
            Respuesta: "Te recomiendo varios restaurantes en Girona: **Can Roca** (El Celler de Can Roca) - uno de los mejores del mundo, **Restaurante Massana** - especializado en cocina tradicional catalana, **Cal Sastre** - conocido por sus caracoles a la llauna."

Responde siempre de forma natural, personal y útil.`

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

// Función para guardar conversaciones
async function saveConversation(supabaseClient: any, userId: string, message: string, response: string, sessionId: string | null, contextData: any) {
  try {
    // Usar el cliente de Supabase que se pasa como parámetro

    // Si no hay sessionId, crear una nueva sesión
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabaseClient
        .from('ai_sessions')
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select('id')
        .single()

      if (sessionError) {
        console.error('Error creando sesión:', sessionError)
        throw sessionError
      }

      currentSessionId = newSession.id
    }

    // Guardar la conversación
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('ai_conversations')
      .insert({
        user_id: userId,
        session_id: currentSessionId,
        message,
        response,
        context_data: contextData
      })
      .select('id, created_at')
      .single()

    if (conversationError) {
      console.error('Error guardando conversación:', conversationError)
      throw conversationError
    }

    // Actualizar la fecha de último mensaje de la sesión
    await supabaseClient
      .from('ai_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', currentSessionId)

    return {
      conversationId: conversation.id,
      sessionId: currentSessionId,
      createdAt: conversation.created_at
    }
  } catch (error) {
    console.error('Error en saveConversation:', error)
    throw error
  }
}