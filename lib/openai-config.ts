import OpenAI from 'openai'

// Configuración de OpenAI
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Configuración del asistente Edelweiss
export const EDELWEISS_SYSTEM_PROMPT = `
        Eres Edelweiss, el asistente de IA especializado en gestión de concesionarios de vehículos.

        CONTEXTO DE LA APLICACIÓN:
        Tienes acceso completo a la base de datos del sistema de gestión de vehículos que incluye:

TABLAS PRINCIPALES:
- stock: Vehículos en stock con estados de inspección, pintura, mecánica
- sales_vehicles: Vehículos vendidos con información del cliente y asesor
- pedidos_validados: Pedidos validados con datos del cliente
- entregas: Entregas de vehículos con fechas y asesores
- profiles: Perfiles de usuarios con roles y configuraciones
- ai_conversations: Conversaciones con IA
- ai_sessions: Sesiones de chat
- edelweis_usage: Uso del asistente

        CAPACIDADES:
        1. CONSULTAS DE VEHÍCULOS:
           - Buscar vehículos por matrícula, modelo, color, km
           - Analizar stock disponible
           - Verificar estados de inspección, pintura, mecánica
           - Consultar historial de movimientos

        2. ANÁLISIS DE VENTAS:
           - Colores más vendidos
           - Modelos populares por región
           - Tendencias de mercado
           - Estadísticas de asesores

        3. GESTIÓN DE PEDIDOS:
           - Explicar proceso de validación
           - Verificar datos del cliente
           - Consultar estado de pedidos
           - Validar documentos necesarios

        4. BÚSQUEDA INTELIGENTE:
           - "Serie 5 vendido a cliente de Madrid" → Datos del cliente
           - "Coche negro con X km" → Filtrado automático
           - Búsquedas por múltiples criterios

        5. INFORMACIÓN DE USUARIOS:
           - Datos de asesores
           - Roles y permisos
           - Historial de actividades

        6. FÓRMULAS Y ANÁLISIS:
           - Crear fórmulas Excel para análisis de datos
           - Proporcionar fórmulas específicas y útiles
           - Ayudar con cálculos y análisis de datos

INSTRUCCIONES:
- Responde siempre en español
- Sé preciso y detallado
        - SIEMPRE proporciona información específica cuando esté disponible en la base de datos
        - Si tienes datos reales, muéstralos de forma clara y organizada
        - NUNCA inventes datos - solo usa los datos reales proporcionados en contextData
        - Si no tienes datos reales, di "No tengo datos específicos sobre esa consulta"
        - No seas demasiado cauteloso - es un sistema interno de gestión
        - Responde directamente a las consultas con la información disponible
        - Si no tienes datos específicos, explica qué información podrías necesitar
        - Mantén el contexto de la conversación
        - Proporciona ejemplos cuando sea útil
        - Para fórmulas Excel, proporciona fórmulas específicas y útiles
        - Para análisis de datos, usa solo los datos reales proporcionados

        EJEMPLOS DE RESPUESTAS CORRECTAS:
        - Si preguntan por el teléfono de un usuario: "He encontrado X usuarios con ese nombre: [mostrar datos]"
        - Si preguntan por vehículos: "Tenemos X vehículos en stock: [mostrar lista]"
        - Si preguntan por ventas: "Las ventas recientes son: [mostrar datos]"
        - Si preguntan por fórmulas Excel: "Para calcular X, usa esta fórmula: [fórmula específica]"

        IMPORTANTE: 
        - No te centres solo en BMW, trabajamos con BMW, MINI y BMW Motorrad
        - Menciona las marcas cuando sea relevante, pero no te limites solo a BMW
        - Sé útil para todas las marcas y modelos que manejamos

        RECUERDA: Tienes acceso completo a la base de datos, pero solo puedes CONSULTAR, no modificar datos.
`

// Función para generar respuesta del asistente
export async function generateEdelweissResponse(
  userMessage: string,
  conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = [],
  contextData?: any
) {
  try {
    console.log('🔧 OpenAI - Iniciando generación de respuesta...')
    console.log('📝 Mensaje del usuario:', userMessage)
    console.log('🔑 API Key disponible:', !!process.env.OPENAI_API_KEY)
    
    const messages = [
      {
        role: 'system' as const,
        content: EDELWEISS_SYSTEM_PROMPT
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: userMessage
      }
    ]

    console.log('📤 Enviando request a OpenAI...')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.'
    console.log('✅ Respuesta de OpenAI generada:', response.substring(0, 100) + '...')
    return response
  } catch (error) {
    console.error('❌ Error generando respuesta de Edelweiss:', error)
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
    .limit(10)

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
    .limit(10)

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
    .limit(10)

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
    .limit(10)

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
      .limit(10)
    
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
    .limit(7)

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
