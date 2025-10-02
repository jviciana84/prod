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
      
      // Obtener contexto de la base de datos
      let contextData = null
      const query = message.toLowerCase()
      
      // Detectar tipo de consulta y obtener datos relevantes
      if (query.includes('telefono') || query.includes('teléfono') || query.includes('contacto')) {
        console.log('🔍 Búsqueda de contactos...')
        
        // Extraer nombre del mensaje
        let searchTerm = ''
        const words = message.split(' ').filter(word => word.length > 2)
        for (const word of words) {
          if (!['telefono', 'teléfono', 'contacto', 'de', 'el', 'la', 'los', 'las'].includes(word.toLowerCase())) {
            searchTerm = word
            break
          }
        }
        
        if (searchTerm) {
          // Buscar en usuarios
          const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .ilike('full_name', `%${searchTerm}%`)
            .limit(5)
          
          // Buscar en clientes de ventas
          const { data: salesClients } = await supabase
            .from('sales_vehicles')
            .select('client_name, client_phone, client_email, advisor_name, model, sale_date')
            .ilike('client_name', `%${searchTerm}%`)
            .limit(5)
          
          // Buscar en entregas
          const { data: deliveryClients } = await supabase
            .from('entregas')
            .select('*')
            .ilike('asesor', `%${searchTerm}%`)
            .limit(5)
          
          // Buscar en pedidos
          const { data: orderClients } = await supabase
            .from('pedidos_validados')
            .select('*')
            .ilike('nombre_cliente', `%${searchTerm}%`)
            .limit(5)
          
          contextData = {
            query_type: 'contact_search',
            search_term: searchTerm,
            users: users || [],
            sales_clients: salesClients || [],
            delivery_clients: deliveryClients || [],
            order_clients: orderClients || []
          }
        }
      }
      
      // Detectar consultas de vehículos
      else if (query.includes('vehículo') || query.includes('vehiculo') || query.includes('bmw') || query.includes('stock') || query.includes('coche') || query.includes('moto')) {
        console.log('🔍 Consulta de vehículos...')
        
        const { data: vehicles } = await supabase
          .from('stock')
          .select('*')
          .eq('is_sold', false)
          .limit(10)
        
        contextData = {
          query_type: 'vehicles',
          vehicles: vehicles || []
        }
      }
      
      // Detectar consultas de ventas
      else if (query.includes('venta') || query.includes('vendido') || query.includes('sales') || query.includes('comprar')) {
        console.log('🔍 Consulta de ventas...')
        
        const { data: sales } = await supabase
          .from('sales_vehicles')
          .select('*')
          .limit(10)
        
        contextData = {
          query_type: 'sales',
          sales: sales || []
        }
      }
      
      // Detectar consultas de entregas
      else if (query.includes('entrega') || query.includes('delivery') || query.includes('entregar')) {
        console.log('🔍 Consulta de entregas...')
        
        const { data: deliveries } = await supabase
          .from('entregas')
          .select('*')
          .limit(10)
        
        contextData = {
          query_type: 'deliveries',
          deliveries: deliveries || []
        }
      }
      
      // Detectar consultas de métricas/estadísticas
      else if (query.includes('métrica') || query.includes('metric') || query.includes('estadística') || query.includes('estadistica') || query.includes('kpi') || query.includes('resumen')) {
        console.log('🔍 Consulta de métricas...')
        
        const { data: metrics } = await supabase
          .from('daily_metrics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(7)
        
        contextData = {
          query_type: 'metrics',
          metrics: metrics || []
        }
      }
      
      // Detectar consultas de incentivos
      else if (query.includes('incentivo') || query.includes('incentive') || query.includes('bonus')) {
        console.log('🔍 Consulta de incentivos...')
        
        const { data: incentives } = await supabase
          .from('incentivos')
          .select('*')
          .limit(10)
        
        contextData = {
          query_type: 'incentives',
          incentives: incentives || []
        }
      }
      
      // Detectar consultas de fotos
      else if (query.includes('foto') || query.includes('photo') || query.includes('imagen') || query.includes('fotografías')) {
        console.log('🔍 Consulta de fotos...')
        
        const { data: photos } = await supabase
          .from('fotos')
          .select('*')
          .limit(10)
        
        contextData = {
          query_type: 'photos',
          photos: photos || []
        }
      }
      
      // Detectar consultas de Excel/formulas
      else if (query.includes('excel') || query.includes('formula') || query.includes('fórmula') || query.includes('función') || query.includes('function')) {
        console.log('🔍 Consulta de Excel/formulas...')
        
        contextData = {
          query_type: 'excel_formulas',
          message: message
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
    
    const fallbackResponse = `Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.`
    return NextResponse.json({ response: fallbackResponse })
  }
}