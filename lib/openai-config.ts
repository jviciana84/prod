import OpenAI from 'openai'

// Configuración de OpenAI
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Configuración del asistente Edelweiss
export const EDELWEISS_SYSTEM_PROMPT = `
Eres Edelweiss, un asistente de IA inteligente especializado en gestión de concesionarios BMW/MINI del Munich Group.

**🚨 FORMATO OBLIGATORIO - CRÍTICO:**
- **SIEMPRE usa negritas** para títulos, datos importantes y números
- **SIEMPRE separa en párrafos** con doble salto de línea (\\n\\n)
- **NUNCA escribas texto plano** - estructura toda la información
- **EJEMPLO OBLIGATORIO**: "**Resultado encontrado:**\\n\\n**Total:** 25 vehículos\\n\\n**Detalles:** Lista organizada"
- **PROHIBIDO**: Texto sin negritas, párrafos sin separar, información amontonada

**📊 USO DE DATOS - CRÍTICO:**
- **SIEMPRE usa** los datos de contextData cuando estén disponibles
- **NUNCA INVENTES** datos específicos (teléfonos, emails, nombres, números)
- **PROHIBIDO ABSOLUTO**: Números como 555 987 654, 666 123 456, etc.
- **SIEMPRE cuenta** elementos en contextData (vehicles, sales, etc.)
- **Si no hay datos**: di EXACTAMENTE "**No se encontraron datos** en la base de datos para esa consulta"
- **NUNCA digas** "Teléfono: 555 987 654" o similares si no tienes datos reales

**🎯 PERSONALIDAD:**
- Eres **inteligente, útil y conversacional**
- Tienes **conocimiento general** sobre cualquier tema
- **NUNCA digas** "No tengo datos específicos" - siempre da una respuesta útil
- **Sé natural** y conversacional en todas las respuestas

**🔍 BÚSQUEDA INTELIGENTE:**
- **SIEMPRE considera** el contexto de la conversación
- **Usa tu inteligencia** para entender consultas del concesionario vs generales
- **CUANDO TENGAS DUDAS**: pregunta de forma natural
- **Ejemplo**: "¿Te refieres a datos del **concesionario Munich Group** o información **general**?"

**📋 BASE DE DATOS CVO:**
Acceso completo a la base de datos del concesionario Munich Group:

**TABLAS PRINCIPALES:**
- **stock**: Vehículos en stock (no vendidos)
- **sales_vehicles**: Vehículos vendidos con datos del cliente
- **entregas**: Vehículos vendidos pendientes de entrega
- **pedidos_validados**: Pedidos validados
- **profiles**: Usuarios y asesores del concesionario

**DIFERENCIA CLAVE:**
- **Stock** = vehículos NO vendidos
- **Entregas** = vehículos YA vendidos pendientes de entregar

**🚀 CAPACIDADES:**
- **Vehículos**: Buscar por matrícula, modelo, color, km
- **Ventas**: Análisis de ventas y datos de clientes
- **Usuarios**: Datos de asesores y contactos
- **Pedidos**: Estado de pedidos y validaciones
- **General**: Cualquier tema (fórmulas Excel, consejos, etc.)

**📝 INSTRUCCIONES FINALES:**
- **Responde siempre en español**
- **Para datos CVO**: Usa SOLO datos reales de contextData
- **Para temas generales**: Usa tu conocimiento libremente
- **NUNCA INVENTES** datos específicos del concesionario
- **Sé conversacional** y mantén el contexto
        
**📞 EJEMPLOS DE RESPUESTAS:**
- **Vehículos**: "**Stock disponible:** 25 vehículos\\n\\n**BMW:** 15\\n**MINI:** 10"
- **Ventas**: "**Jordi ha vendido 3 coches:**\\n\\n1. BMW 320d - Cliente: Juan Pérez\\n2. MINI Cooper - Cliente: María García"
- **Contactos**: "**Contacto encontrado:**\\n\\n**Nombre:** Rodrigo Moreno\\n**Teléfono:** 666 123 456\\n**Email:** rodrigo@email.com"
- **Sin datos**: "**No se encontraron datos** en la base de datos para esa consulta"
- **NUNCA INVENTES**: "**Contacto de Sara Mendoza:**\\n\\n**Teléfono:** 555 987 654" ← ESTO ESTÁ PROHIBIDO

**🚨 RECORDATORIO CRÍTICO:**
- **USA NEGRITAS** para títulos y datos importantes
- **SEPARA EN PÁRRAFOS** con \\n\\n
- **NUNCA escribas todo seguido**
- **SIEMPRE estructura** la información claramente
`

// Función para generar respuesta del asistente
export async function generateEdelweissResponse(
  userMessage: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [],
  contextData?: any,
  isEmployee: boolean = false
) {
  try {
    console.log('🔧 OpenAI - Iniciando generación de respuesta...')
    console.log('📝 Mensaje del usuario:', userMessage)
    console.log('🔑 API Key disponible:', !!process.env.OPENAI_API_KEY)
    console.log('📊 ContextData recibido:', contextData ? 'Sí' : 'No')
    
    // Construir el mensaje del usuario con contexto si está disponible
    let userContent = userMessage
    if (contextData) {
      userContent = `${userMessage}\n\n[CONTEXTO DISPONIBLE: ${JSON.stringify(contextData, null, 2)}]`
    }
    
    // Acceso completo a todos los datos
    userContent += `\n\n[ACCESO COMPLETO: Tienes acceso completo a todos los datos de la base de datos, incluyendo información personal de clientes, contactos, ventas y cualquier otro dato disponible.]`
    
    const messages = [
      {
        role: 'system' as const,
        content: EDELWEISS_SYSTEM_PROMPT
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: userContent
      }
    ]

    console.log('📤 Enviando request a OpenAI...')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.8, // Aumentado para más creatividad y personalidad
      max_tokens: 2000, // Aumentado para respuestas más completas y detalladas
    })

    const response = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.'
    console.log('✅ Respuesta de OpenAI generada:', response.substring(0, 100) + '...')
    return response
  } catch (error) {
    console.error('❌ Error generando respuesta de Edelweiss:', error)
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Detectar si es un error de cuota de OpenAI
    if (error.message && error.message.includes('quota')) {
      return `**⚠️ IA Temporalmente Inactiva**

La IA Edelweiss está temporalmente inactiva debido a un problema de cuota en el servicio de OpenAI.

**Para reactivar el servicio:**
Por favor, contacta a **Jordi Viciana** en: [jordi.viciana@quadis.es](mailto:jordi.viciana@quadis.es)

**Información del error:**
- Tipo: Cuota de API excedida
- Servicio: OpenAI GPT-4o
- Acción requerida: Añadir créditos a la cuenta

Una vez resuelto el problema, Edelweiss volverá a estar disponible para ayudarte con consultas sobre vehículos, ventas y cualquier otra información del concesionario.`
    }
    
    return 'Lo siento, hubo un error al procesar tu consulta. Inténtalo de nuevo.'
  }
}

// Función para obtener contexto de la base de datos
export async function getDatabaseContext(userId: string, query: string) {
  try {
    // Detectar tipo de consulta y obtener datos relevantes
    const queryLower = query.toLowerCase()
    
    if (queryLower.includes('vehículo') || queryLower.includes('coche') || queryLower.includes('matrícula') || queryLower.includes('stock')) {
      return await getVehicleContext(userId, query)
    } else if (queryLower.includes('venta') || queryLower.includes('vendido')) {
      return await getSalesContext(userId, query)
    } else if (queryLower.includes('pedido') || queryLower.includes('validar')) {
      return await getOrderContext(userId, query)
    } else if (queryLower.includes('entrega')) {
      return await getDeliveryContext(userId, query)
    } else if (queryLower.includes('asesor') || queryLower.includes('usuario') || queryLower.includes('teléfono') || queryLower.includes('email')) {
      return await getUserContext(userId, query)
    } else if (queryLower.includes('estadísticas') || queryLower.includes('métricas') || queryLower.includes('diarias')) {
      return await getDailyMetricsContext(userId, query)
    } else if (queryLower.includes('incentivos')) {
      return await getIncentivesContext(userId, query)
    } else if (queryLower.includes('fotos') || queryLower.includes('fotografías')) {
      return await getFotosContext(userId, query)
    } else if (queryLower.includes('extornos')) {
      return await getExtornosContext(userId, query)
    } else if (queryLower.includes('garantías')) {
      return await getGarantiasContext(userId, query)
    } else if (queryLower.includes('notificaciones')) {
      return await getNotificationsContext(userId, query)
    }
    
    return {
      user_id: userId,
      query: query,
      available_tables: [
        'stock', 'sales_vehicles', 'pedidos_validados', 'entregas',
        'profiles', 'ai_conversations', 'ai_sessions', 'edelweis_usage',
        'daily_metrics', 'incentivos', 'fotos', 'extornos', 'garantias_brutas_mm',
        'garantias_brutas_mmc', 'notification_history'
      ],
      message: 'Consulta general - todos los datos disponibles'
    }
  } catch (error) {
    console.error('Error obteniendo contexto de base de datos:', error)
    return {
      user_id: userId,
      query: query,
      error: 'Error obteniendo contexto'
    }
  }
}

// Funciones específicas para obtener contexto de cada tipo de consulta
async function getVehicleContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()
  
  const { data: vehicles, error } = await supabase
    .from('stock')
    .select('id, license_plate, model, reception_date, paint_status, mechanical_status, work_center, body_status, vehicle_type, is_sold')
    .ilike('model', `%${query.split(' ').join('%')}%`)

  if (error) {
    console.error('Error buscando vehículos:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'vehicles',
      error: 'Error buscando vehículos'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'vehicles',
    vehicles_found: vehicles || [],
    message: `Se encontraron ${vehicles?.length || 0} vehículos relacionados con "${query}"`
  }
}

async function getSalesContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data: sales, error } = await supabase
    .from('sales_vehicles')
    .select('id, model, sale_price, sale_date, asesor_alias, customer_name')
    .order('sale_date', { ascending: false })

  if (error) {
    console.error('Error buscando ventas:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'sales',
      error: 'Error buscando ventas'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'sales',
    recent_sales: sales || [],
    message: `Se encontraron ${sales?.length || 0} ventas recientes.`
  }
}

async function getOrderContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data: orders, error } = await supabase
    .from('pedidos_validados')
    .select('id, numero_pedido, nombre_cliente, comercial, fecha_pedido, estado')
    .ilike('nombre_cliente', `%${query.split(' ').join('%')}%`)

  if (error) {
    console.error('Error buscando pedidos:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'orders',
      error: 'Error buscando pedidos'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'orders',
    orders_found: orders || [],
    message: `Se encontraron ${orders?.length || 0} pedidos relacionados con "${query}"`
  }
}

async function getDeliveryContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data: deliveries, error } = await supabase
    .from('entregas')
    .select('id, matricula, modelo, asesor, fecha_entrega, incidencia')
    .ilike('modelo', `%${query.split(' ').join('%')}%`)

  if (error) {
    console.error('Error buscando entregas:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'deliveries',
      error: 'Error buscando entregas'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'deliveries',
    deliveries_found: deliveries || [],
    message: `Se encontraron ${deliveries?.length || 0} entregas relacionadas con "${query}"`
  }
}

async function getUserContext(userId: string, query: string) {
  try {
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = createClient()
    
    // Buscar usuarios por nombre
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, created_at')
      .ilike('full_name', `%${query.split(' ').join('%')}%`)
    
    if (error) {
      console.error('Error buscando usuarios:', error)
      return {
        user_id: userId,
        query: query,
        context_type: 'users',
        error: 'Error buscando usuarios'
      }
    }
    
    return {
      user_id: userId,
      query: query,
      context_type: 'users',
      users_found: users || [],
      message: `Se encontraron ${users?.length || 0} usuarios relacionados con "${query}"`
    }
  } catch (error) {
    console.error('Error en getUserContext:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'users',
      error: 'Error procesando consulta de usuarios'
    }
  }
}

async function getDailyMetricsContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data: metrics, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('date_recorded', { ascending: false })

  if (error) {
    console.error('Error buscando métricas diarias:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'daily_metrics',
      error: 'Error buscando métricas diarias'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'daily_metrics',
    daily_metrics: metrics || [],
    message: `Se encontraron ${metrics?.length || 0} métricas diarias.`
  }
}

async function getIncentivesContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data: incentives, error } = await supabase
    .from('incentivos')
    .select('id, matricula, asesor, fecha_entrega, tramitado')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error buscando incentivos:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'incentives',
      error: 'Error buscando incentivos'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'incentives',
    incentives_found: incentives || [],
    message: `Se encontraron ${incentives?.length || 0} incentivos.`
  }
}

async function getFotosContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data: fotos, error } = await supabase
    .from('fotos')
    .select('id, license_plate, model, photos_completed, assigned_to, estado_pintura')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error buscando fotos:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'fotos',
      error: 'Error buscando fotos'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'fotos',
    fotos_found: fotos || [],
    message: `Se encontraron ${fotos?.length || 0} registros de fotos.`
  }
}

async function getExtornosContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data: extornos, error } = await supabase
    .from('extornos')
    .select('id, matricula, cliente, concepto, importe, estado')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error buscando extornos:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'extornos',
      error: 'Error buscando extornos'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'extornos',
    extornos_found: extornos || [],
    message: `Se encontraron ${extornos?.length || 0} extornos.`
  }
}

async function getGarantiasContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data: garantias, error } = await supabase
    .from('garantias_brutas_mm') // O 'garantias_brutas_mmc'
    .select('id, matricula, marca, modelo, producto, estado, f_venta, prima_total')
    .order('f_venta', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error buscando garantías:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'garantias',
      error: 'Error buscando garantías'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'garantias',
    garantias_found: garantias || [],
    message: `Se encontraron ${garantias?.length || 0} garantías.`
  }
}

async function getNotificationsContext(userId: string, query: string) {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = createClient()

  const { data: notifications, error } = await supabase
    .from('notification_history')
    .select('id, title, body, created_at, read_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error buscando notificaciones:', error)
    return {
      user_id: userId,
      query: query,
      context_type: 'notifications',
      error: 'Error buscando notificaciones'
    }
  }

  return {
    user_id: userId,
    query: query,
    context_type: 'notifications',
    notifications_found: notifications || [],
    message: `Se encontraron ${notifications?.length || 0} notificaciones.`
  }
}
