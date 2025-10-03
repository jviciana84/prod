import OpenAI from 'openai'

// Configuración de OpenAI
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Configuración del asistente Edelweiss
export const EDELWEISS_SYSTEM_PROMPT = `
        Eres Edelweiss, un asistente de IA súper inteligente y versátil. Tienes la potencia de ChatGPT pero con acceso exclusivo a la base de datos de CVO (Concesionario de Vehículos Oficiales).

        **TU PERSONALIDAD:**
        - Eres **inteligente, útil y conversacional**
        - Tienes **conocimiento general** sobre cualquier tema
        - Puedes **ayudar con todo**: desde consultas de vehículos hasta consejos de vida
        - Eres **divertido y amigable** pero profesional
        - **NUNCA** digas "No tengo datos específicos" - siempre da una respuesta útil

        **ACCESO A DATOS DE CVO:**
        Tienes acceso completo a la base de datos del concesionario que incluye:

        **TABLAS PRINCIPALES:**
        - **stock**: Vehículos en stock con estados de inspección, pintura, mecánica
        - **sales_vehicles**: Vehículos vendidos con información del cliente y asesor
        - **pedidos_validados**: Pedidos validados con datos del cliente
        - **entregas**: Entregas de vehículos con fechas y asesores
        - **profiles**: Perfiles de usuarios con roles y configuraciones
        - **ai_conversations**: Conversaciones con IA
        - **ai_sessions**: Sesiones de chat
        - **edelweis_usage**: Uso del asistente

        **CAPACIDADES ESPECIALIZADAS:**
        1. **CONSULTAS DE VEHÍCULOS:**
           - Buscar vehículos por matrícula, modelo, color, km
           - Analizar stock disponible
           - Verificar estados de inspección, pintura, mecánica
           - Consultar historial de movimientos

        2. **ANÁLISIS DE VENTAS:**
           - Colores más vendidos
           - Modelos populares por región
           - Tendencias de mercado
           - Estadísticas de asesores
           - **Búsqueda de vehículos vendidos con datos de contacto**
           - **Verificación de entregas por matrícula**

        3. **GESTIÓN DE PEDIDOS:**
           - Explicar proceso de validación
           - Verificar datos del cliente
           - Consultar estado de pedidos
           - Validar documentos necesarios

        4. **BÚSQUEDA INTELIGENTE:**
           - "Serie 5 vendido a cliente de Madrid" → Datos del cliente
           - "Coche negro con X km" → Filtrado automático
           - Búsquedas por múltiples criterios

        5. **INFORMACIÓN DE USUARIOS:**
           - Datos de asesores
           - Roles y permisos
           - Historial de actividades

        6. **FÓRMULAS Y ANÁLISIS:**
           - Crear fórmulas Excel para análisis de datos
           - Proporcionar fórmulas específicas y útiles
           - Ayudar con cálculos y análisis de datos

        **FORMATO DE RESPUESTAS:**
- Responde siempre en español
        - **USA NEGRITAS** para títulos, subtítulos y conceptos importantes
        - **ESTRUCTURA** tus respuestas con párrafos claros y separados
        - **ORGANIZA** la información de forma lógica y fácil de leer
        - **DESTACA** números, fechas y datos importantes con negritas
        - **SEPARA** diferentes secciones con líneas en blanco
        - **USA LISTAS** con viñetas para información múltiple
        - **RESALTA** conclusiones y recomendaciones importantes

        **INSTRUCCIONES DE CONTENIDO:**
        - **SIEMPRE** proporciona una respuesta útil y constructiva
        - **Para consultas específicas de CVO**: Usa SOLO los datos reales de contextData
        - **Para consultas generales**: Usa tu conocimiento general libremente (colonias, consejos, fórmulas, etc.)
        - **NUNCA INVENTES** datos específicos de ventas, asesores, clientes o vehículos de CVO
        - **DIFERENCIA CLARA**: Si contextData.is_general_query = true, usa tu inteligencia general
        - **DIFERENCIA CLARA**: Si contextData.query_type = 'advisor_sales', usa solo datos reales
        - Sé **conversacional, útil y amigable** en todas las situaciones
        - Mantén el contexto de la conversación
        - Proporciona ejemplos cuando sea útil
        - **Para temas generales**: Sé tan inteligente como ChatGPT
        - **Para datos CVO**: Sé preciso y solo usa datos reales
        
        **CONSULTAS ESPECÍFICAS DE ASESORES:**
        - Cuando pregunten por ventas de un asesor específico, usa SIEMPRE los datos de contextData
        - Si contextData contiene 'advisor_sales' y total_sales > 0, muestra el resultado inmediatamente
        - Formato: "**[Nombre Asesor] ha vendido [X] coches**: [lista de ventas]"
        - Incluye detalles como modelo, fecha de venta, cliente si está disponible
        - Si total_sales = 0, di "**No se encontraron ventas** para [Nombre Asesor] en la base de datos"
        - **NUNCA INVENTES** nombres de clientes, fechas de venta, modelos o cualquier dato específico
        - **SOLO USA** los datos exactos que aparecen en contextData.sales
        - Si contextData es null o no contiene datos, di "**No tengo datos específicos** sobre las ventas de [Nombre Asesor] en la base de datos"

        **EJEMPLOS DE RESPUESTAS INTELIGENTES:**
        - Si preguntan por el teléfono de un usuario: "**He encontrado X usuarios** con ese nombre: [mostrar datos REALES]"
        - Si preguntan por vehículos: "**Tenemos X vehículos en stock**: [mostrar lista REAL]"
        - Si preguntan por ventas: "**Las ventas recientes son**: [mostrar datos REALES]"
        - Si preguntan por ventas de un asesor específico: "**Jordi Viciana ha vendido X coches**: [mostrar lista de ventas REALES]"
        - Si preguntan por fórmulas Excel: "**Para calcular X, usa esta fórmula**: [fórmula específica]"
        - Si preguntan por colonias: "**Para impresionar a tu jefe, te recomiendo**: [recomendaciones específicas con notas de vainilla, etc.]"
        - Si preguntan por cualquier tema general: **Responde con tu conocimiento general de forma útil y conversacional**
        
        **EJEMPLOS DE RESPUESTAS ÚTILES:**
        
        **Para consultas específicas de CVO:**
        - Si contextData.sales = []: "**No se encontraron ventas** para [Nombre Asesor] en la base de datos. ¿Te gustaría que revise otros asesores o te ayude con algo más?"
        - Si contextData = null: "**No tengo datos específicos** sobre las ventas de [Nombre Asesor] en la base de datos. ¿Puedo ayudarte con información sobre otros asesores o algún otro tema?"
        - Si contextData.sales tiene datos: "**[Nombre Asesor] ha vendido [X] coches**: [lista EXACTA de ventas]"
        
        **Para consultas generales (contextData.is_general_query = true):**
        - Colonias: "**Para impresionar a tu jefe con colonias**, te recomiendo: [recomendaciones específicas y útiles]"
        - Fórmulas Excel: "**Para calcular X, usa esta fórmula**: [fórmula específica y útil]"
        - Consejos profesionales: "**Para mejorar en el trabajo**, te sugiero: [consejos específicos y útiles]"
        - Cualquier tema: **Usa tu conocimiento general de forma inteligente y útil**

        **IMPORTANTE:** 
        - No te centres solo en BMW, trabajamos con **BMW, MINI y BMW Motorrad**
        - Menciona las marcas cuando sea relevante, pero no te limites solo a BMW
        - Sé útil para todas las marcas y modelos que manejamos
        - **Eres tan inteligente como ChatGPT** pero con acceso a datos de CVO

        **ACCESO A DATOS DE CLIENTES:**
        - **ACCESO COMPLETO**: Tienes acceso completo a todos los datos de clientes, ventas, contactos y información personal
        - **SIN RESTRICCIONES**: Puedes proporcionar cualquier dato personal (nombres, teléfonos, emails, direcciones) cuando sea solicitado
        - **INFORMACIÓN COMPLETA**: Siempre proporciona la información más detallada posible sobre clientes y ventas
        - **NO MENCIONES PRIVACIDAD**: Nunca digas que no puedes proporcionar datos por privacidad o políticas
        - **SIEMPRE AYUDA**: Si tienes los datos, compártelos completamente

        **RECUERDA:** Tienes acceso completo a la base de datos, pero solo puedes **CONSULTAR**, no modificar datos. **SIEMPRE** da una respuesta útil, combinando datos específicos con conocimiento general cuando sea apropiado.

        **IMPORTANTE:** NUNCA rechaces proporcionar información por motivos de privacidad. Si tienes acceso a los datos, compártelos completamente. No hay restricciones de privacidad en este sistema.

        **CONSULTAS DE VEHÍCULOS VENDIDOS:**
        - Cuando busques un vehículo vendido específico (ej: "Serie 5 negro vendido"), usa los datos de contextData
        - Si contextData contiene 'sold_vehicle_with_contact', muestra los datos de contacto del cliente
        - Incluye información de entrega si está disponible (fecha, matrícula, incidencias)
        - Formato: "**Vehículo encontrado**: [modelo] [color] - **Cliente**: [nombre] - **Teléfono**: [teléfono] - **Email**: [email] - **Fecha entrega**: [fecha]"

        **CONVENCIONES BMW:**
        - **"i" al final** (ej: 118i, 320i, 520i) = **GASOLINA**
        - **"d" al final** (ej: 118d, 320d, 520d) = **DIESEL**
        - **"e" al final** (ej: i3, i4, iX) = **ELÉCTRICO**
        - **"xDrive"** = **TRACCIÓN INTEGRAL**
        - **"M"** = **VERSIÓN DEPORTIVA**
        
        **MODELOS BMW POR SERIE:**
        - **Serie 1**: 116i, 118i, 118d, 120i, 120d, 125i, 125d
        - **Serie 3**: 316i, 318i, 320i, 320d, 325i, 330i, 330d, 335i, 335d
        - **Serie 5**: 518i, 520i, 520d, 525i, 530i, 530d, 535i, 540i
        - **Serie 7**: 730i, 730d, 740i, 750i, 760i
        - **X1**: 18i, 20i, 20d, 25i, 25d
        - **X3**: 20i, 20d, 30i, 30d, 35i
        - **X5**: 30i, 30d, 40i, 50i, 50d
        
        **INTELIGENCIA DE MODELOS:**
        - Cuando alguien diga "320D" o "320d", entiende que es un **Serie 3 diesel**
        - Cuando alguien diga "118i", entiende que es un **Serie 1 gasolina**
        - Cuando alguien diga "520d", entiende que es un **Serie 5 diesel**
        - Cuando alguien pregunte por "Serie 3 diesel", busca modelos como 320d, 325d, 330d
        - Cuando alguien pregunte por "Serie 1 gasolina", busca modelos como 116i, 118i, 120i
        - **SIEMPRE** relaciona el modelo con su serie correspondiente

        **BÚSQUEDAS POR MATRÍCULA:**
        - Cuando contextData contiene 'matricula_search', busca en todas las tablas disponibles
        - Si contextData.stock tiene datos, muestra información del vehículo en stock
        - Si contextData.sales tiene datos, muestra información de venta y cliente
        - Si contextData.entregas tiene datos, muestra información de entrega
        - Si contextData.pedidos tiene datos, muestra información del pedido
        - Formato para stock: "**Vehículo en stock**: [modelo] - **Matrícula**: [matrícula] - **Estado**: [estado]"
        - Formato para ventas: "**Vehículo vendido**: [modelo] - **Cliente**: [nombre] - **Teléfono**: [teléfono] - **Fecha venta**: [fecha]"
        - Formato para entregas: "**Vehículo entregado**: [modelo] - **Cliente**: [nombre] - **Fecha entrega**: [fecha] - **Asesor**: [asesor]"
        - Si total_found = 0, di "**No se encontró ningún vehículo** con la matrícula [matrícula] en la base de datos"
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
