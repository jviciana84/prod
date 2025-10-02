import { NextRequest, NextResponse } from 'next/server'
import { generateEdelweissResponse } from '@/lib/openai-config'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    console.log('📝 Mensaje recibido:', message)

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje es requerido' },
        { status: 400 }
      )
    }

    // Verificar si hay API key de OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No hay API key de OpenAI')
      const response = `Hola! Recibí tu mensaje: "${message}". Soy Edelweiss, tu asistente de IA. Para usar las funciones completas, necesitas configurar la API key de OpenAI en las variables de entorno.`
      return NextResponse.json({ response })
    }

    console.log('✅ API key encontrada, llamando a OpenAI...')

    let response = ""
    
    try {
      // Crear cliente de Supabase directamente
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Variables de entorno de Supabase no configuradas')
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Obtener datos relevantes de la base de datos
      let contextData = null
      const query = message.toLowerCase()
      
      // Detectar consultas de usuarios de forma más amplia
      if (query.includes('teléfono') || query.includes('telefono') || query.includes('ferran') || query.includes('bufi') || query.includes('rodrigo') || query.includes('moreno')) {
        console.log('🔍 Obteniendo datos de usuarios...')
        
        // Buscar por cualquier parte del nombre
        const searchTerms = message.split(' ').filter(word => word.length > 2)
        const searchQuery = searchTerms.map(term => `full_name.ilike.%${term}%`).join(',')
        
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .or(searchQuery)
          .limit(5)
        
        if (!error && users && users.length > 0) {
          contextData = {
            query_type: 'users',
            users_found: users,
            message: `Se encontraron ${users.length} usuarios relacionados con la consulta`
          }
          console.log('✅ Usuarios encontrados:', users.length)
        } else {
          console.log('❌ No se encontraron usuarios')
        }
      }
      
      // Si es consulta de vehículos
      else if (query.includes('vehículo') || query.includes('vehiculo') || query.includes('bmw') || query.includes('stock') || query.includes('coche')) {
        console.log('🔍 Obteniendo datos de vehículos...')
        
        const { data: vehicles, error } = await supabase
          .from('stock')
          .select('*')
          .eq('is_sold', false)
          .limit(10)
        
        if (!error && vehicles && vehicles.length > 0) {
          contextData = {
            query_type: 'vehicles',
            vehicles_found: vehicles,
            message: `Se encontraron ${vehicles.length} vehículos en stock`
          }
        }
      }
      
      // Si es consulta de ventas
      else if (query.includes('venta') || query.includes('vendido') || query.includes('sales')) {
        console.log('🔍 Obteniendo datos de ventas...')
        
        const { data: sales, error } = await supabase
          .from('sales_vehicles')
          .select('*')
          .limit(10)
        
        if (!error && sales && sales.length > 0) {
          contextData = {
            query_type: 'sales',
            sales_found: sales,
            message: `Se encontraron ${sales.length} ventas recientes`
          }
        }
      }
      
      // Si es consulta de entregas
      else if (query.includes('entrega') || query.includes('delivery')) {
        console.log('🔍 Obteniendo datos de entregas...')
        
        const { data: deliveries, error } = await supabase
          .from('entregas')
          .select('*')
          .limit(10)
        
        if (!error && deliveries && deliveries.length > 0) {
          contextData = {
            query_type: 'deliveries',
            deliveries_found: deliveries,
            message: `Se encontraron ${deliveries.length} entregas`
          }
        }
      }
      
      // Si es consulta de métricas
      else if (query.includes('métrica') || query.includes('metric') || query.includes('estadística') || query.includes('estadistica') || query.includes('kpi')) {
        console.log('🔍 Obteniendo datos de métricas...')
        
        const { data: metrics, error } = await supabase
          .from('daily_metrics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(5)
        
        if (!error && metrics && metrics.length > 0) {
          contextData = {
            query_type: 'metrics',
            metrics_found: metrics,
            message: `Se encontraron ${metrics.length} registros de métricas`
          }
        }
      }
      
      // Si es consulta de incentivos
      else if (query.includes('incentivo') || query.includes('incentive')) {
        console.log('🔍 Obteniendo datos de incentivos...')
        
        const { data: incentives, error } = await supabase
          .from('incentivos')
          .select('*')
          .limit(10)
        
        if (!error && incentives && incentives.length > 0) {
          contextData = {
            query_type: 'incentives',
            incentives_found: incentives,
            message: `Se encontraron ${incentives.length} incentivos`
          }
        }
      }
      
      // Si es consulta de fotos
      else if (query.includes('foto') || query.includes('photo') || query.includes('imagen')) {
        console.log('🔍 Obteniendo datos de fotos...')
        
        const { data: photos, error } = await supabase
          .from('fotos')
          .select('*')
          .limit(10)
        
        if (!error && photos && photos.length > 0) {
          contextData = {
            query_type: 'photos',
            photos_found: photos,
            message: `Se encontraron ${photos.length} fotos asignadas`
          }
        }
      }
      
      // Obtener historial de conversación
      console.log('💬 Obteniendo historial de conversación...')
      const { data: conversationHistory } = await supabase
        .from('ai_conversations')
        .select('message, response')
        .eq('user_id', 'ai-user')
        .eq('session_id', 'ai-session')
        .order('created_at', { ascending: true })
        .limit(10)

      const history = conversationHistory?.map(conv => [
        { role: 'user', content: conv.message },
        { role: 'assistant', content: conv.response }
      ]).flat() || []

      console.log('📚 Historial obtenido:', history.length, 'mensajes')

      // Generar respuesta del asistente con OpenAI
      console.log('🤖 Llamando a generateEdelweissResponse...')
      response = await generateEdelweissResponse(message, history, contextData)

      console.log('✅ Respuesta de OpenAI generada:', response.substring(0, 100) + '...')

      // Guardar la conversación en la base de datos
      console.log('💾 Guardando conversación...')
      const { error: insertError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: 'ai-user',
          session_id: 'ai-session',
          message: message,
          response: response,
          context_data: contextData
        })

      if (insertError) {
        console.error('❌ Error guardando conversación:', insertError)
      } else {
        console.log('✅ Conversación guardada correctamente')
      }

      // Actualizar última actividad de la sesión
      await supabase
        .from('ai_sessions')
        .upsert({
          id: 'ai-session',
          user_id: 'ai-user',
          title: 'Chat con Edelweiss',
          last_message_at: new Date().toISOString()
        })

    } catch (dbError) {
      console.error('❌ Error en base de datos:', dbError)
      response = `Lo siento, hubo un error al acceder a la base de datos: ${dbError.message}. Inténtalo de nuevo.`
    }

    return NextResponse.json({ response })

  } catch (error) {
    console.error('Error en API de chat:', error)
    
    // Respuesta de fallback en caso de error
    const fallbackResponse = `Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.`
    return NextResponse.json({ response: fallbackResponse })
  }
}

