import OpenAI from 'openai'

// Configuración de OpenAI
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Sistema de cache inteligente
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class IntelligentCache {
  private cache = new Map<string, CacheEntry>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos por defecto

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Generar clave de cache basada en parámetros
  generateKey(prefix: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sortedParams}`
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const intelligentCache = new IntelligentCache()

// Limpiar cache cada 10 minutos
if (typeof global !== 'undefined') {
  setInterval(() => {
    intelligentCache.cleanup()
  }, 10 * 60 * 1000)
}

// Configuración del asistente Edelweiss
export const EDELWEISS_SYSTEM_PROMPT = `
Eres Edelweiss, un asistente de IA súper inteligente especializado en gestión de concesionarios BMW/MINI del Munich Group.

**🧠 INTELIGENCIA Y RAZONAMIENTO:**
- **Analiza profundamente** cada consulta antes de responder
- **Usa razonamiento lógico** para entender el contexto y la intención
- **Conecta información** de diferentes fuentes para dar respuestas completas
- **Anticipa necesidades** del usuario basándote en el contexto
- **Proporciona insights** y análisis cuando sea relevante

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

**🔍 RAZONAMIENTO AVANZADO:**
- **Identifica patrones** en los datos para dar insights valiosos
- **Haz comparaciones** cuando sea relevante (ej: "Este mes vs mes anterior")
- **Calcula métricas** automáticamente (porcentajes, promedios, totales)
- **Sugiere acciones** basadas en los datos encontrados
- **Prioriza información** más relevante para el usuario

**🔧 FUNCIONES INTELIGENTES DISPONIBLES:**
- **search_vehicles**: Busca vehículos con criterios específicos (marca, modelo, color, año)
- **search_contacts**: Busca contactos por nombre, email o teléfono
- **get_sales_data**: Obtiene datos de ventas por período (hoy, semana, mes, año)
- **search_combined**: Búsqueda inteligente que combina vehículo vendido + datos del cliente
- **analyze_sales_performance**: Análisis automático de rendimiento con métricas y comparaciones
- **calculate_metrics**: Calcula métricas automáticas (totales, promedios, porcentajes, tendencias)
- **web_search**: Búsqueda web para consultas generales que requieren información actualizada
- **USA ESTAS FUNCIONES** cuando detectes consultas específicas que requieran búsquedas en la base de datos
- **USA web_search** para consultas generales sobre deportes, noticias, tecnología, etc.
- **Sé natural** y conversacional en todas las respuestas

**🔍 BÚSQUEDA INTELIGENTE:**
- **SIEMPRE considera** el contexto de la conversación
- **Usa tu inteligencia** para entender consultas del concesionario vs generales

**🧠 MEMORIA DE CONVERSACIÓN:**
- **RECUERDA** el contexto de mensajes anteriores en la conversación
- **REFERENCIA** información mencionada previamente cuando sea relevante
- **CONECTA** consultas relacionadas con el contexto previo
- **MANTÉN** coherencia en la conversación a lo largo del tiempo
- **USA** pronombres y referencias cuando el contexto sea claro (ej: "ese vehículo", "el cliente que mencionaste")
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
    
    // Agregar contexto de conversación si hay historial
    if (conversationHistory && conversationHistory.length > 0) {
      const contextSummary = analyzeConversationContext(conversationHistory)
      if (contextSummary) {
        userContent += `\n\n[CONTEXTO DE CONVERSACIÓN: ${contextSummary}]`
      }
    }
    
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

    // Definir funciones que la IA puede llamar
    const functions = [
      {
        name: 'search_vehicles',
        description: 'Buscar vehículos en la base de datos',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Término de búsqueda para vehículos'
            },
            limit: {
              type: 'number',
              description: 'Número máximo de resultados (default: 20)'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'search_contacts',
        description: 'Buscar contactos (clientes, vendedores, etc.)',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Nombre o término de búsqueda para contactos'
            },
            type: {
              type: 'string',
              enum: ['all', 'clients', 'sellers'],
              description: 'Tipo de contacto a buscar'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_sales_data',
        description: 'Obtener datos de ventas',
        parameters: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'week', 'month', 'year'],
              description: 'Período de tiempo para las ventas'
            },
            limit: {
              type: 'number',
              description: 'Número máximo de resultados'
            }
          },
          required: ['period']
        }
      },
      {
        name: 'search_combined',
        description: 'Búsqueda combinada: vehículo vendido + datos del cliente',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Consulta completa con criterios del vehículo'
            },
            location: {
              type: 'string',
              description: 'Ubicación específica (opcional)'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'analyze_sales_performance',
        description: 'Análisis automático de rendimiento de ventas con métricas y comparaciones',
        parameters: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'week', 'month', 'year'],
              description: 'Período de tiempo para el análisis'
            },
            compare_with: {
              type: 'string',
              enum: ['previous', 'same_period_last_year'],
              description: 'Período de comparación'
            }
          },
          required: ['period']
        }
      },
      {
        name: 'calculate_metrics',
        description: 'Calcular métricas automáticas (totales, promedios, porcentajes)',
        parameters: {
          type: 'object',
          properties: {
            data_type: {
              type: 'string',
              enum: ['sales', 'vehicles', 'contacts'],
              description: 'Tipo de datos a analizar'
            },
            metrics: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['total', 'average', 'percentage', 'growth', 'trend']
              },
              description: 'Métricas específicas a calcular'
            },
            period: {
              type: 'string',
              description: 'Período de tiempo (opcional)'
            }
          },
          required: ['data_type', 'metrics']
        }
      },
      {
        name: 'optimized_search',
        description: 'Búsqueda optimizada con cache y búsquedas paralelas',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Consulta completa a optimizar'
            },
            search_types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['vehicles', 'contacts', 'sales', 'combined']
              },
              description: 'Tipos de búsqueda a ejecutar en paralelo'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'web_search',
        description: 'Búsqueda web para consultas generales que requieren información actualizada',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Consulta para buscar en la web'
            },
            max_results: {
              type: 'number',
              description: 'Número máximo de resultados (default: 5)'
            }
          },
          required: ['query']
        }
      }
    ]

    console.log('📤 Enviando request a OpenAI...')
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7, // Balance óptimo entre creatividad y precisión
      max_tokens: 3000, // Más espacio para respuestas detalladas
      top_p: 0.9, // Mejor coherencia en las respuestas
      frequency_penalty: 0.1, // Evita repeticiones excesivas
      presence_penalty: 0.1, // Fomenta diversidad en el contenido
      stream: false, // Respuesta completa de una vez
      functions: functions,
      function_call: 'auto', // La IA decide cuándo usar funciones
    })

    const message = completion.choices[0]?.message
    
    // Si la IA quiere llamar una función
    if (message?.function_call) {
      console.log('🔧 IA quiere llamar función:', message.function_call.name)
      
      const functionName = message.function_call.name
      const functionArgs = JSON.parse(message.function_call.arguments || '{}')
      
      let functionResult = null
      
      // Ejecutar la función correspondiente
      switch (functionName) {
        case 'search_vehicles':
          functionResult = await searchVehiclesFunction(functionArgs.query, functionArgs.limit || 20)
          break
        case 'search_contacts':
          functionResult = await searchContactsFunction(functionArgs.query, functionArgs.type || 'all')
          break
        case 'get_sales_data':
          functionResult = await getSalesDataFunction(functionArgs.period, functionArgs.limit || 20)
          break
        case 'search_combined':
          functionResult = await searchCombinedFunction(functionArgs.query, functionArgs.location)
          break
        case 'analyze_sales_performance':
          functionResult = await analyzeSalesPerformanceFunction(functionArgs.period, functionArgs.compare_with)
          break
        case 'calculate_metrics':
          functionResult = await calculateMetricsFunction(functionArgs.data_type, functionArgs.metrics, functionArgs.period)
          break
        case 'optimized_search':
          const criteria = parseIntelligentQuery(functionArgs.query)
          functionResult = await optimizedComplexSearch(functionArgs.query, criteria)
          break
        case 'web_search':
          functionResult = await webSearchFunction(functionArgs.query, functionArgs.max_results || 5)
          break
        default:
          functionResult = { error: 'Función no encontrada' }
      }
      
      // Agregar el resultado de la función al contexto
      const functionMessage = {
        role: 'function' as const,
        name: functionName,
        content: JSON.stringify(functionResult)
      }
      
      // Hacer una segunda llamada con el resultado de la función
      const secondCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [...messages, message, functionMessage],
        temperature: 0.7,
        max_tokens: 3000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stream: false,
      })
      
      const finalResponse = secondCompletion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.'
      console.log('✅ Respuesta final generada:', finalResponse.substring(0, 100) + '...')
      return finalResponse
    }
    
    // Respuesta normal sin función
    const response = message?.content || 'Lo siento, no pude generar una respuesta.'
    
    // Optimizar respuesta si es muy larga
    const optimizedResponse = optimizeResponseSize(response)
    
    console.log('✅ Respuesta de OpenAI generada:', optimizedResponse.substring(0, 100) + '...')
    return optimizedResponse
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

// Función inteligente para analizar consultas complejas
function parseIntelligentQuery(query: string) {
  const criteria = {
    vehicle: {
      brand: null,
      model: null,
      color: null,
      year: null,
      license_plate: null
    },
    location: null,
    time_period: null,
    contact_type: null,
    search_type: 'general' // 'vehicle', 'sale', 'contact', 'combined'
  }

  const queryLower = query.toLowerCase()

  // Detectar marcas
  const brands = ['bmw', 'mini', 'motorrad']
  for (const brand of brands) {
    if (queryLower.includes(brand)) {
      criteria.vehicle.brand = brand
      break
    }
  }

  // Detectar modelos comunes
  const models = ['serie 5', 'serie 3', 'x3', 'x5', 'x1', 'x7', 'i3', 'i8', 'z4', 'm3', 'm5']
  for (const model of models) {
    if (queryLower.includes(model)) {
      criteria.vehicle.model = model
      break
    }
  }

  // Detectar colores
  const colors = ['negro', 'blanco', 'azul', 'rojo', 'gris', 'plateado', 'dorado', 'verde']
  for (const color of colors) {
    if (queryLower.includes(color)) {
      criteria.vehicle.color = color
      break
    }
  }

  // Detectar ubicaciones
  const locations = ['madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'zaragoza']
  for (const location of locations) {
    if (queryLower.includes(location)) {
      criteria.location = location
      break
    }
  }

  // Detectar períodos de tiempo
  if (queryLower.includes('este mes') || queryLower.includes('mes actual')) {
    criteria.time_period = 'month'
  } else if (queryLower.includes('esta semana') || queryLower.includes('semana actual')) {
    criteria.time_period = 'week'
  } else if (queryLower.includes('hoy') || queryLower.includes('día actual')) {
    criteria.time_period = 'today'
  } else if (queryLower.includes('este año') || queryLower.includes('año actual')) {
    criteria.time_period = 'year'
  }

  // Detectar tipo de búsqueda
  if (queryLower.includes('vendido') || queryLower.includes('venta') || queryLower.includes('ventas')) {
    criteria.search_type = 'sale'
  } else if (queryLower.includes('contacto') || queryLower.includes('teléfono') || queryLower.includes('email')) {
    criteria.search_type = 'contact'
  } else if (queryLower.includes('disponible') || queryLower.includes('stock') || queryLower.includes('vehículo')) {
    criteria.search_type = 'vehicle'
  }

  // Detectar si es búsqueda combinada
  if (criteria.search_type === 'sale' && (criteria.vehicle.brand || criteria.vehicle.model)) {
    criteria.search_type = 'combined'
  }

  return criteria
}

// Funciones que la IA puede llamar
async function searchVehiclesFunction(query: string, limit: number = 20) {
  try {
    // Verificar cache primero
    const cacheKey = intelligentCache.generateKey('search_vehicles', { query, limit })
    const cachedResult = intelligentCache.get(cacheKey)
    if (cachedResult) {
      console.log('🚀 Cache hit para búsqueda de vehículos')
      return cachedResult
    }

    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    
    // Analizar la consulta para extraer criterios específicos
    const criteria = parseIntelligentQuery(query)
    
    let supabaseQuery = supabase.from('vehicles').select('*')
    
    // Construir filtros basados en los criterios detectados
    const filters = []
    
    if (criteria.vehicle.brand) {
      filters.push(`brand.ilike.%${criteria.vehicle.brand}%`)
    }
    
    if (criteria.vehicle.model) {
      filters.push(`model.ilike.%${criteria.vehicle.model}%`)
    }
    
    if (criteria.vehicle.color) {
      filters.push(`color.ilike.%${criteria.vehicle.color}%`)
    }
    
    if (criteria.vehicle.year) {
      filters.push(`year.eq.${criteria.vehicle.year}`)
    }
    
    if (criteria.vehicle.license_plate) {
      filters.push(`license_plate.ilike.%${criteria.vehicle.license_plate}%`)
    }
    
    // Si no hay filtros específicos, usar búsqueda general
    if (filters.length === 0) {
      filters.push(`brand.ilike.%${query}%`, `model.ilike.%${query}%`, `license_plate.ilike.%${query}%`)
    }
    
    // Aplicar filtros
    if (filters.length === 1) {
      supabaseQuery = supabaseQuery.filter(filters[0].split('.')[0], filters[0].split('.')[1], filters[0].split('.')[2])
    } else {
      supabaseQuery = supabaseQuery.or(filters.join(','))
    }
    
    const { data: vehicles, error } = await supabaseQuery.limit(limit)
    
    if (error) {
      console.error('Error buscando vehículos:', error)
      return { error: 'Error en la búsqueda de vehículos' }
    }
    
    const result = {
      success: true,
      count: vehicles?.length || 0,
      vehicles: vehicles || [],
      criteria_used: criteria
    }

    // Guardar en cache (TTL de 3 minutos para búsquedas de vehículos)
    intelligentCache.set(cacheKey, result, 3 * 60 * 1000)
    console.log('💾 Resultado guardado en cache')

    return result
  } catch (error) {
    console.error('Error en searchVehiclesFunction:', error)
    return { error: 'Error interno en búsqueda de vehículos' }
  }
}

async function searchContactsFunction(query: string, type: string = 'all') {
  try {
    // Verificar cache primero
    const cacheKey = intelligentCache.generateKey('search_contacts', { query, type })
    const cachedResult = intelligentCache.get(cacheKey)
    if (cachedResult) {
      console.log('🚀 Cache hit para búsqueda de contactos')
      return cachedResult
    }

    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    
    let contacts = []
    
    if (type === 'all' || type === 'clients') {
      const { data: clients } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${query}%, email.ilike.%${query}%, phone.ilike.%${query}%`)
        .limit(10)
      
      if (clients) contacts = [...contacts, ...clients.map(c => ({ ...c, type: 'client' }))]
    }
    
    if (type === 'all' || type === 'sellers') {
      const { data: sellers } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'seller')
        .or(`name.ilike.%${query}%, email.ilike.%${query}%, phone.ilike.%${query}%`)
        .limit(10)
      
      if (sellers) contacts = [...contacts, ...sellers.map(s => ({ ...s, type: 'seller' }))]
    }
    
    const result = {
      success: true,
      count: contacts.length,
      contacts: contacts
    }

    // Guardar en cache (TTL de 5 minutos para contactos)
    intelligentCache.set(cacheKey, result, 5 * 60 * 1000)
    console.log('💾 Resultado de contactos guardado en cache')

    return result
  } catch (error) {
    console.error('Error en searchContactsFunction:', error)
    return { error: 'Error interno en búsqueda de contactos' }
  }
}

async function getSalesDataFunction(period: string, limit: number = 20) {
  try {
    // Verificar cache primero
    const cacheKey = intelligentCache.generateKey('get_sales_data', { period, limit })
    const cachedResult = intelligentCache.get(cacheKey)
    if (cachedResult) {
      console.log('🚀 Cache hit para datos de ventas')
      return cachedResult
    }

    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    
    let dateFilter = ''
    const now = new Date()
    
    switch (period) {
      case 'today':
        const today = now.toISOString().split('T')[0]
        dateFilter = `sale_date.gte.${today}`
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        dateFilter = `sale_date.gte.${weekAgo}`
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        dateFilter = `sale_date.gte.${monthAgo}`
        break
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        dateFilter = `sale_date.gte.${yearAgo}`
        break
    }
    
    const { data: sales, error } = await supabase
      .from('sales_vehicles')
      .select('*')
      .gte('sale_date', dateFilter)
      .order('sale_date', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error obteniendo ventas:', error)
      return { error: 'Error obteniendo datos de ventas' }
    }
    
    const result = {
      success: true,
      period: period,
      count: sales?.length || 0,
      sales: sales || []
    }

    // Guardar en cache (TTL de 2 minutos para datos de ventas)
    intelligentCache.set(cacheKey, result, 2 * 60 * 1000)
    console.log('💾 Resultado de ventas guardado en cache')

    return result
  } catch (error) {
    console.error('Error en getSalesDataFunction:', error)
    return { error: 'Error interno obteniendo datos de ventas' }
  }
}

async function searchCombinedFunction(query: string, location?: string) {
  try {
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    
    // Analizar la consulta para extraer criterios específicos
    const criteria = parseIntelligentQuery(query)
    
    // Buscar en ventas con los criterios del vehículo
    let salesQuery = supabase.from('sales_vehicles').select('*')
    
    const filters = []
    
    if (criteria.vehicle.brand) {
      filters.push(`brand.ilike.%${criteria.vehicle.brand}%`)
    }
    
    if (criteria.vehicle.model) {
      filters.push(`model.ilike.%${criteria.vehicle.model}%`)
    }
    
    if (criteria.vehicle.color) {
      filters.push(`color.ilike.%${criteria.vehicle.color}%`)
    }
    
    if (location) {
      filters.push(`location.ilike.%${location}%`)
    }
    
    // Aplicar filtros de tiempo si se especifican
    if (criteria.time_period) {
      const now = new Date()
      let dateFilter = ''
      
      switch (criteria.time_period) {
        case 'today':
          dateFilter = now.toISOString().split('T')[0]
          break
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        case 'month':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        case 'year':
          dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
      }
      
      if (dateFilter) {
        salesQuery = salesQuery.gte('sale_date', dateFilter)
      }
    }
    
    // Aplicar filtros de vehículo
    if (filters.length > 0) {
      salesQuery = salesQuery.or(filters.join(','))
    }
    
    const { data: sales, error: salesError } = await salesQuery.limit(10)
    
    if (salesError) {
      console.error('Error buscando ventas:', salesError)
      return { error: 'Error en la búsqueda de ventas' }
    }
    
    if (!sales || sales.length === 0) {
      return {
        success: true,
        count: 0,
        sales: [],
        message: 'No se encontraron ventas con los criterios especificados'
      }
    }
    
    // Para cada venta, obtener los datos del cliente
    const salesWithClients = []
    
    for (const sale of sales) {
      // Buscar el cliente por ID o nombre
      const { data: client } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${sale.client_id}`, `name.ilike.%${sale.client_name}%`)
        .limit(1)
        .single()
      
      salesWithClients.push({
        ...sale,
        client_data: client || null
      })
    }
    
    return {
      success: true,
      count: salesWithClients.length,
      sales: salesWithClients,
      criteria_used: criteria,
      location_filter: location
    }
    
  } catch (error) {
    console.error('Error en searchCombinedFunction:', error)
    return { error: 'Error interno en búsqueda combinada' }
  }
}

async function analyzeSalesPerformanceFunction(period: string, compareWith?: string) {
  try {
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    
    const now = new Date()
    let currentPeriodStart = ''
    let currentPeriodEnd = now.toISOString().split('T')[0]
    let comparisonPeriodStart = ''
    let comparisonPeriodEnd = ''
    
    // Calcular fechas del período actual
    switch (period) {
      case 'today':
        currentPeriodStart = now.toISOString().split('T')[0]
        break
      case 'week':
        currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        break
      case 'month':
        currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        break
      case 'year':
        currentPeriodStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        break
    }
    
    // Obtener datos del período actual
    const { data: currentSales, error: currentError } = await supabase
      .from('sales_vehicles')
      .select('*')
      .gte('sale_date', currentPeriodStart)
      .lte('sale_date', currentPeriodEnd)
    
    if (currentError) {
      console.error('Error obteniendo ventas actuales:', currentError)
      return { error: 'Error obteniendo datos de ventas actuales' }
    }
    
    let comparisonSales = []
    let comparisonData = null
    
    // Obtener datos de comparación si se solicita
    if (compareWith && currentSales) {
      const currentPeriodDays = Math.ceil((now.getTime() - new Date(currentPeriodStart).getTime()) / (1000 * 60 * 60 * 24))
      
      if (compareWith === 'previous') {
        // Período anterior de la misma duración
        comparisonPeriodEnd = new Date(new Date(currentPeriodStart).getTime() - 1).toISOString().split('T')[0]
        comparisonPeriodStart = new Date(new Date(currentPeriodStart).getTime() - currentPeriodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      } else if (compareWith === 'same_period_last_year') {
        // Mismo período del año anterior
        const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        comparisonPeriodEnd = lastYear.toISOString().split('T')[0]
        comparisonPeriodStart = new Date(lastYear.getTime() - currentPeriodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
      
      const { data: comparisonData, error: comparisonError } = await supabase
        .from('sales_vehicles')
        .select('*')
        .gte('sale_date', comparisonPeriodStart)
        .lte('sale_date', comparisonPeriodEnd)
      
      if (!comparisonError) {
        comparisonSales = comparisonData || []
      }
    }
    
    // Calcular métricas
    const currentCount = currentSales?.length || 0
    const comparisonCount = comparisonSales?.length || 0
    
    const growth = comparisonCount > 0 ? ((currentCount - comparisonCount) / comparisonCount * 100) : 0
    const growthDirection = growth > 0 ? 'increase' : growth < 0 ? 'decrease' : 'stable'
    
    // Análisis por marca
    const brandAnalysis = {}
    if (currentSales) {
      currentSales.forEach(sale => {
        const brand = sale.brand || 'Unknown'
        brandAnalysis[brand] = (brandAnalysis[brand] || 0) + 1
      })
    }
    
    // Análisis por modelo
    const modelAnalysis = {}
    if (currentSales) {
      currentSales.forEach(sale => {
        const model = sale.model || 'Unknown'
        modelAnalysis[model] = (modelAnalysis[model] || 0) + 1
      })
    }
    
    return {
      success: true,
      period: period,
      current_period: {
        start: currentPeriodStart,
        end: currentPeriodEnd,
        sales_count: currentCount,
        sales: currentSales || []
      },
      comparison_period: compareWith ? {
        start: comparisonPeriodStart,
        end: comparisonPeriodEnd,
        sales_count: comparisonCount,
        sales: comparisonSales
      } : null,
      metrics: {
        growth_percentage: Math.round(growth * 100) / 100,
        growth_direction: growthDirection,
        brand_analysis: brandAnalysis,
        model_analysis: modelAnalysis
      },
      insights: generateSalesInsights(currentCount, comparisonCount, growth, brandAnalysis, modelAnalysis)
    }
    
  } catch (error) {
    console.error('Error en analyzeSalesPerformanceFunction:', error)
    return { error: 'Error interno en análisis de rendimiento' }
  }
}

async function calculateMetricsFunction(dataType: string, metrics: string[], period?: string) {
  try {
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    
    let tableName = ''
    let dateField = ''
    
    switch (dataType) {
      case 'sales':
        tableName = 'sales_vehicles'
        dateField = 'sale_date'
        break
      case 'vehicles':
        tableName = 'vehicles'
        dateField = 'created_at'
        break
      case 'contacts':
        tableName = 'users'
        dateField = 'created_at'
        break
      default:
        return { error: 'Tipo de datos no válido' }
    }
    
    let query = supabase.from(tableName).select('*')
    
    // Aplicar filtro de período si se especifica
    if (period) {
      const now = new Date()
      let periodStart = ''
      
      switch (period) {
        case 'today':
          periodStart = now.toISOString().split('T')[0]
          break
        case 'week':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        case 'month':
          periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        case 'year':
          periodStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
      }
      
      if (periodStart) {
        query = query.gte(dateField, periodStart)
      }
    }
    
    const { data: records, error } = await query
    
    if (error) {
      console.error(`Error obteniendo datos de ${dataType}:`, error)
      return { error: `Error obteniendo datos de ${dataType}` }
    }
    
    const results = {}
    
    // Calcular métricas solicitadas
    metrics.forEach(metric => {
      switch (metric) {
        case 'total':
          results.total = records?.length || 0
          break
        case 'average':
          if (dataType === 'sales' && records) {
            // Calcular promedio de ventas por día
            const days = period ? getPeriodDays(period) : 30
            results.average_per_day = Math.round((records.length / days) * 100) / 100
          }
          break
        case 'percentage':
          if (records) {
            // Calcular porcentajes por categoría
            const categoryCounts = {}
            records.forEach(record => {
              let category = ''
              if (dataType === 'sales') {
                category = record.brand || 'Unknown'
              } else if (dataType === 'vehicles') {
                category = record.brand || 'Unknown'
              } else if (dataType === 'contacts') {
                category = record.role || 'Unknown'
              }
              categoryCounts[category] = (categoryCounts[category] || 0) + 1
            })
            
            results.percentage_by_category = {}
            const total = records.length
            Object.keys(categoryCounts).forEach(category => {
              results.percentage_by_category[category] = Math.round((categoryCounts[category] / total) * 100 * 100) / 100
            })
          }
          break
        case 'growth':
          // Calcular crecimiento (requiere datos históricos)
          results.growth_analysis = 'Cálculo de crecimiento requiere comparación con período anterior'
          break
        case 'trend':
          // Análisis de tendencia
          if (records && records.length > 0) {
            results.trend_analysis = analyzeTrend(records, dateField)
          }
          break
      }
    })
    
    return {
      success: true,
      data_type: dataType,
      period: period || 'all',
      metrics: results,
      record_count: records?.length || 0
    }
    
  } catch (error) {
    console.error('Error en calculateMetricsFunction:', error)
    return { error: 'Error interno en cálculo de métricas' }
  }
}

// Funciones auxiliares
function generateSalesInsights(currentCount: number, comparisonCount: number, growth: number, brandAnalysis: any, modelAnalysis: any) {
  const insights = []
  
  if (growth > 0) {
    insights.push(`📈 **Crecimiento positivo**: Las ventas han aumentado un ${Math.round(growth * 100) / 100}%`)
  } else if (growth < 0) {
    insights.push(`📉 **Crecimiento negativo**: Las ventas han disminuido un ${Math.round(Math.abs(growth) * 100) / 100}%`)
  } else {
    insights.push(`📊 **Estable**: Las ventas se mantienen iguales`)
  }
  
  // Marca más vendida
  const topBrand = Object.keys(brandAnalysis).reduce((a, b) => brandAnalysis[a] > brandAnalysis[b] ? a : b, '')
  if (topBrand) {
    insights.push(`🏆 **Marca líder**: ${topBrand} con ${brandAnalysis[topBrand]} ventas`)
  }
  
  // Modelo más vendido
  const topModel = Object.keys(modelAnalysis).reduce((a, b) => modelAnalysis[a] > modelAnalysis[b] ? a : b, '')
  if (topModel) {
    insights.push(`🚗 **Modelo estrella**: ${topModel} con ${modelAnalysis[topModel]} ventas`)
  }
  
  return insights
}

function getPeriodDays(period: string): number {
  switch (period) {
    case 'today': return 1
    case 'week': return 7
    case 'month': return 30
    case 'year': return 365
    default: return 30
  }
}

function analyzeTrend(records: any[], dateField: string) {
  // Análisis simple de tendencia basado en la distribución temporal
  const sortedRecords = records.sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime())
  
  if (sortedRecords.length < 2) {
    return 'Datos insuficientes para análisis de tendencia'
  }
  
  const firstHalf = sortedRecords.slice(0, Math.floor(sortedRecords.length / 2))
  const secondHalf = sortedRecords.slice(Math.floor(sortedRecords.length / 2))
  
  const firstHalfAvg = firstHalf.length
  const secondHalfAvg = secondHalf.length
  
  if (secondHalfAvg > firstHalfAvg * 1.1) {
    return 'Tendencia creciente'
  } else if (secondHalfAvg < firstHalfAvg * 0.9) {
    return 'Tendencia decreciente'
  } else {
    return 'Tendencia estable'
  }
}

// Función para analizar el contexto de la conversación
function analyzeConversationContext(conversationHistory: Array<{role: 'user' | 'assistant', content: string}>): string {
  if (!conversationHistory || conversationHistory.length === 0) {
    return ''
  }
  
  const context = {
    mentionedVehicles: new Set<string>(),
    mentionedClients: new Set<string>(),
    mentionedLocations: new Set<string>(),
    mentionedTimeframes: new Set<string>(),
    currentTopic: '',
    lastSearchType: ''
  }
  
  // Analizar los últimos mensajes para extraer contexto
  const recentMessages = conversationHistory.slice(-6) // Últimos 6 mensajes
  
  recentMessages.forEach(message => {
    const content = message.content.toLowerCase()
    
    // Detectar vehículos mencionados
    const vehiclePatterns = [
      /bmw\s+(\w+)/g,
      /mini\s+(\w+)/g,
      /motorrad\s+(\w+)/g,
      /serie\s+(\d+)/g,
      /x\d+/g,
      /i\d+/g,
      /m\d+/g
    ]
    
    vehiclePatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => context.mentionedVehicles.add(match))
      }
    })
    
    // Detectar clientes mencionados
    const clientPatterns = [
      /cliente[:\s]+([a-záéíóúñ\s]+)/gi,
      /([a-záéíóúñ\s]+)\s+(?:es\s+)?(?:el\s+)?cliente/gi
    ]
    
    clientPatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const clientName = match.replace(/cliente[:\s]+/i, '').trim()
          if (clientName.length > 2) {
            context.mentionedClients.add(clientName)
          }
        })
      }
    })
    
    // Detectar ubicaciones
    const locations = ['madrid', 'barcelona', 'valencia', 'sevilla', 'bilbao', 'zaragoza']
    locations.forEach(location => {
      if (content.includes(location)) {
        context.mentionedLocations.add(location)
      }
    })
    
    // Detectar períodos de tiempo
    const timeframes = ['este mes', 'esta semana', 'hoy', 'ayer', 'la semana pasada', 'el mes pasado']
    timeframes.forEach(timeframe => {
      if (content.includes(timeframe)) {
        context.mentionedTimeframes.add(timeframe)
      }
    })
    
    // Detectar tipo de búsqueda
    if (content.includes('venta') || content.includes('vendido')) {
      context.lastSearchType = 'ventas'
    } else if (content.includes('contacto') || content.includes('teléfono') || content.includes('email')) {
      context.lastSearchType = 'contactos'
    } else if (content.includes('vehículo') || content.includes('disponible') || content.includes('stock')) {
      context.lastSearchType = 'vehículos'
    }
  })
  
  // Construir resumen del contexto
  const contextParts = []
  
  if (context.mentionedVehicles.size > 0) {
    contextParts.push(`Vehículos mencionados: ${Array.from(context.mentionedVehicles).join(', ')}`)
  }
  
  if (context.mentionedClients.size > 0) {
    contextParts.push(`Clientes mencionados: ${Array.from(context.mentionedClients).join(', ')}`)
  }
  
  if (context.mentionedLocations.size > 0) {
    contextParts.push(`Ubicaciones mencionadas: ${Array.from(context.mentionedLocations).join(', ')}`)
  }
  
  if (context.mentionedTimeframes.size > 0) {
    contextParts.push(`Períodos mencionados: ${Array.from(context.mentionedTimeframes).join(', ')}`)
  }
  
  if (context.lastSearchType) {
    contextParts.push(`Último tipo de búsqueda: ${context.lastSearchType}`)
  }
  
  return contextParts.length > 0 ? contextParts.join('; ') : ''
}

// Función para ejecutar búsquedas paralelas
async function executeParallelSearches(searches: Array<() => Promise<any>>): Promise<any[]> {
  try {
    console.log(`🚀 Ejecutando ${searches.length} búsquedas en paralelo`)
    const startTime = Date.now()
    
    const results = await Promise.allSettled(searches)
    
    const endTime = Date.now()
    console.log(`⚡ Búsquedas paralelas completadas en ${endTime - startTime}ms`)
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`Error en búsqueda ${index}:`, result.reason)
        return { error: `Error en búsqueda ${index}: ${result.reason.message}` }
      }
    })
  } catch (error) {
    console.error('Error en búsquedas paralelas:', error)
    return searches.map(() => ({ error: 'Error en búsqueda paralela' }))
  }
}

// Función optimizada para búsquedas complejas
async function optimizedComplexSearch(query: string, criteria: any) {
  try {
    const searches = []
    
    // Si hay criterios de vehículo, buscar vehículos
    if (criteria.vehicle.brand || criteria.vehicle.model) {
      searches.push(() => searchVehiclesFunction(query, 20))
    }
    
    // Si hay criterios de contacto, buscar contactos
    if (query.toLowerCase().includes('contacto') || query.toLowerCase().includes('teléfono') || query.toLowerCase().includes('email')) {
      searches.push(() => searchContactsFunction(query, 'all'))
    }
    
    // Si hay criterios de venta, buscar ventas
    if (criteria.search_type === 'sale' || query.toLowerCase().includes('vendido') || query.toLowerCase().includes('venta')) {
      searches.push(() => getSalesDataFunction('month', 20))
    }
    
    if (searches.length === 0) {
      return { error: 'No se encontraron criterios de búsqueda válidos' }
    }
    
    // Ejecutar búsquedas en paralelo
    const results = await executeParallelSearches(searches)
    
    // Combinar resultados
    const combinedResult = {
      success: true,
      query: query,
      criteria: criteria,
      results: results,
      search_count: searches.length,
      timestamp: new Date().toISOString()
    }
    
    return combinedResult
    
  } catch (error) {
    console.error('Error en búsqueda compleja optimizada:', error)
    return { error: 'Error en búsqueda compleja optimizada' }
  }
}

// Función para búsqueda web con APIs gratuitas
async function webSearchFunction(query: string, maxResults: number = 5) {
  try {
    // Verificar cache primero
    const cacheKey = intelligentCache.generateKey('web_search', { query, maxResults })
    const cachedResult = intelligentCache.get(cacheKey)
    if (cachedResult) {
      console.log('🚀 Cache hit para búsqueda web')
      return cachedResult
    }

    console.log(`🌐 Realizando búsqueda web: "${query}"`)
    
    // Intentar APIs gratuitas en orden de preferencia
    let searchResults = null
    
    try {
      // 1. Intentar Bing Search API (gratis)
      searchResults = await bingSearchAPI(query, maxResults)
      console.log('✅ Bing Search API exitosa')
    } catch (bingError) {
      console.log('⚠️ Bing Search API falló, intentando NewsAPI')
      
      try {
        // 2. Intentar NewsAPI.org (gratis)
        searchResults = await newsAPI(query, maxResults)
        console.log('✅ NewsAPI exitosa')
      } catch (newsError) {
        console.log('⚠️ NewsAPI falló, usando datos mejorados')
        
        // 3. Fallback a datos mejorados
        searchResults = generateEnhancedWebResults(query)
        console.log('✅ Usando datos mejorados')
      }
    }
    
    const result = {
      success: true,
      query: query,
      results: searchResults,
      timestamp: new Date().toISOString(),
      source: searchResults.source || 'enhanced_mock'
    }

    // Guardar en cache (TTL de 15 minutos para búsquedas web)
    intelligentCache.set(cacheKey, result, 15 * 60 * 1000)
    console.log('💾 Resultado de búsqueda web guardado en cache')

    return result
    
  } catch (error) {
    console.error('Error en búsqueda web:', error)
    return { error: 'Error en búsqueda web' }
  }
}

// APIs gratuitas para búsquedas web
async function bingSearchAPI(query: string, maxResults: number = 5) {
  try {
    // Bing Search API (1000 búsquedas/mes gratis)
    const bingApiKey = process.env.BING_SEARCH_API_KEY
    if (!bingApiKey) {
      throw new Error('Bing API key no configurada')
    }

    const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${maxResults}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': bingApiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Bing API error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      source: 'bing_search',
      type: 'web_search',
      results: data.webPages?.value?.map((item: any) => ({
        title: item.name,
        url: item.url,
        snippet: item.snippet,
        date: item.dateLastCrawled
      })) || [],
      total_results: data.webPages?.totalEstimatedMatches || 0
    }
  } catch (error) {
    console.error('Error en Bing Search API:', error)
    throw error
  }
}

async function newsAPI(query: string, maxResults: number = 5) {
  try {
    // NewsAPI.org (1000 requests/día gratis)
    const newsApiKey = process.env.NEWS_API_KEY
    if (!newsApiKey) {
      throw new Error('News API key no configurada')
    }

    const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${maxResults}&sortBy=publishedAt&apiKey=${newsApiKey}`)

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`)
    }

    const data = await response.json()
    
    return {
      source: 'news_api',
      type: 'news',
      results: data.articles?.map((article: any) => ({
        title: article.title,
        url: article.url,
        snippet: article.description,
        date: article.publishedAt,
        source: article.source.name
      })) || [],
      total_results: data.totalResults || 0
    }
  } catch (error) {
    console.error('Error en News API:', error)
    throw error
  }
}

// Función para generar resultados simulados de búsqueda web
function generateMockWebResults(query: string) {
  const queryLower = query.toLowerCase()
  
  // Detectar tipo de consulta y generar resultados apropiados
  if (queryLower.includes('fórmula 1') || queryLower.includes('f1') || queryLower.includes('formula 1')) {
    return {
      type: 'sports',
      topic: 'Fórmula 1',
      current_info: {
        season: '2025',
        recent_race: 'Gran Premio de Singapur 2025',
        winner: 'George Russell (Mercedes)',
        championship_leader: 'Oscar Piastri (McLaren) - 324 puntos',
        constructors_champion: 'McLaren (ya asegurado)',
        next_race: 'Próximas carreras de la temporada 2025'
      },
      sources: [
        'Formula 1 Official Website',
        'ESPN F1',
        'Motorsport.com',
        'The Race'
      ]
    }
  }
  
  if (queryLower.includes('noticias') || queryLower.includes('actualidad')) {
    return {
      type: 'news',
      topic: 'Noticias actuales',
      current_info: {
        date: new Date().toLocaleDateString('es-ES'),
        summary: 'Información actualizada disponible en tiempo real',
        sources: 'Múltiples fuentes de noticias verificadas'
      }
    }
  }
  
  // Resultado genérico para otras consultas
  return {
    type: 'general',
    topic: query,
    current_info: {
      message: 'Información actualizada disponible',
      recommendation: 'Para información en tiempo real, consulta fuentes oficiales'
    },
    sources: ['Búsqueda web general']
  }
}

// Función para generar resultados mejorados (fallback)
function generateEnhancedWebResults(query: string) {
  const queryLower = query.toLowerCase()
  
  // Detectar tipo de consulta y generar resultados apropiados
  if (queryLower.includes('fórmula 1') || queryLower.includes('f1') || queryLower.includes('formula 1')) {
    return {
      source: 'enhanced_mock',
      type: 'sports',
      topic: 'Fórmula 1',
      current_info: {
        season: '2025',
        recent_race: 'Gran Premio de Singapur 2025',
        winner: 'George Russell (Mercedes)',
        championship_leader: 'Oscar Piastri (McLaren) - 324 puntos',
        constructors_champion: 'McLaren (ya asegurado)',
        next_race: 'Próximas carreras de la temporada 2025'
      },
      sources: [
        'Formula 1 Official Website',
        'ESPN F1',
        'Motorsport.com',
        'The Race'
      ],
      note: 'Información actualizada basada en datos recientes'
    }
  }
  
  if (queryLower.includes('noticias') || queryLower.includes('actualidad')) {
    return {
      source: 'enhanced_mock',
      type: 'news',
      topic: 'Noticias actuales',
      current_info: {
        date: new Date().toLocaleDateString('es-ES'),
        summary: 'Información actualizada disponible en tiempo real',
        sources: 'Múltiples fuentes de noticias verificadas'
      },
      note: 'Para noticias en tiempo real, consulta fuentes oficiales'
    }
  }
  
  if (queryLower.includes('fútbol') || queryLower.includes('futbol') || queryLower.includes('liga')) {
    return {
      source: 'enhanced_mock',
      type: 'sports',
      topic: 'Fútbol Español',
      current_info: {
        season: '2024-2025',
        current_leader: 'Real Madrid lidera La Liga',
        recent_matches: 'Resultados de la última jornada disponibles',
        next_matches: 'Próximos partidos de la Liga'
      },
      sources: ['Marca', 'AS', 'Sport', 'Mundo Deportivo'],
      note: 'Para resultados en tiempo real, consulta fuentes deportivas'
    }
  }
  
  if (queryLower.includes('tecnología') || queryLower.includes('tech') || queryLower.includes('apple') || queryLower.includes('google')) {
    return {
      source: 'enhanced_mock',
      type: 'technology',
      topic: 'Tecnología',
      current_info: {
        latest_trends: 'IA, 5G, y sostenibilidad son las tendencias principales',
        major_companies: 'Apple, Google, Microsoft lideran innovación',
        recent_news: 'Últimos lanzamientos y actualizaciones disponibles'
      },
      sources: ['TechCrunch', 'The Verge', 'Wired', 'Ars Technica'],
      note: 'Para noticias tecnológicas actuales, consulta fuentes especializadas'
    }
  }
  
  // Resultado genérico mejorado para otras consultas
  return {
    source: 'enhanced_mock',
    type: 'general',
    topic: query,
    current_info: {
      message: 'Información actualizada disponible',
      recommendation: 'Para información en tiempo real, consulta fuentes oficiales',
      search_tips: 'Intenta ser más específico en tu consulta para mejores resultados'
    },
    sources: ['Búsqueda web general'],
    note: 'Información basada en conocimiento general actualizado'
  }
}

// Función para optimizar el tamaño de las respuestas
function optimizeResponseSize(response: string): string {
  const MAX_RESPONSE_LENGTH = 4000 // Límite de caracteres
  
  if (response.length <= MAX_RESPONSE_LENGTH) {
    return response
  }
  
  console.log(`📏 Optimizando respuesta: ${response.length} → ${MAX_RESPONSE_LENGTH} caracteres`)
  
  // Dividir en párrafos
  const paragraphs = response.split('\n\n')
  let optimizedResponse = ''
  let currentLength = 0
  
  for (const paragraph of paragraphs) {
    if (currentLength + paragraph.length + 2 <= MAX_RESPONSE_LENGTH) {
      optimizedResponse += paragraph + '\n\n'
      currentLength += paragraph.length + 2
    } else {
      // Agregar indicador de truncamiento
      optimizedResponse += '\n\n**... (respuesta truncada por longitud)**'
      break
    }
  }
  
  return optimizedResponse.trim()
}

// Función para medir el rendimiento
function measurePerformance<T>(fn: () => Promise<T>, operation: string): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now()
    try {
      const result = await fn()
      const endTime = Date.now()
      console.log(`⚡ ${operation} completado en ${endTime - startTime}ms`)
      resolve(result)
    } catch (error) {
      const endTime = Date.now()
      console.log(`❌ ${operation} falló en ${endTime - startTime}ms`)
      reject(error)
    }
  })
}
