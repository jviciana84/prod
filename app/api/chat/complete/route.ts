import { NextRequest, NextResponse } from 'next/server'
import { generateEdelweissResponse } from '@/lib/openai-config'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    console.log('📝 Mensaje recibido:', message)

    // Obtener información del usuario (sin restricciones)
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)
    
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let userId = 'ai-user' // Usuario por defecto
    let isEmployee = true // Acceso completo para todos

    if (session?.user) {
      userId = session.user.id
      console.log('✅ Usuario autenticado:', session.user.email)
    } else {
      console.log('ℹ️ Usuario no autenticado - acceso completo habilitado')
    }

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
      console.log('🔧 Iniciando proceso de respuesta...')
      
      // Crear cliente de Supabase directamente
      const { createClient } = await import('@supabase/supabase-js')
      console.log('✅ Supabase importado correctamente')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('🔍 Variables de entorno Supabase:')
      console.log('URL:', supabaseUrl ? 'Configurada' : 'NO CONFIGURADA')
      console.log('Key:', supabaseKey ? 'Configurada' : 'NO CONFIGURADA')
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables de entorno de Supabase no configuradas')
        throw new Error('Variables de entorno de Supabase no configuradas')
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      console.log('✅ Cliente de Supabase creado correctamente')
      
      // Obtener contexto de la base de datos
      let contextData = null
      const query = message.toLowerCase()
      
      // Detectar si es una consulta específica de CVO
    const isCVOQuery = (
      query.includes('cuantos') || query.includes('cuántos') || 
      query.includes('ha vendido') || query.includes('vendido') || 
      query.includes('realizado') || query.includes('asesor') ||
      query.includes('ventas') || query.includes('stock') ||
      query.includes('vehículo') || query.includes('vehiculo') ||
      query.includes('matrícula') || query.includes('matricula') ||
      query.includes('cliente') || query.includes('pedido') ||
      query.includes('entrega') || query.includes('foto') ||
      query.includes('incentivo') || query.includes('extorno') ||
      query.includes('garantía') || query.includes('garantia') ||
      query.includes('jordi') || query.includes('pol') || query.includes('viciana') ||
      query.includes('capellino') || query.includes('bmw') || query.includes('mercedes') ||
      query.includes('serie 5') || query.includes('serie5') || query.includes('serie 1') || query.includes('serie1') || 
      query.includes('serie 3') || query.includes('serie3') || query.includes('negro') ||
      query.includes('madrid') || query.includes('chico') || query.includes('contacto') ||
      query.includes('datos') || query.includes('tiempo') || query.includes('buscar') ||
      query.includes('1250') || query.includes('gs') || query.includes('adventure') || 
      query.includes('adventura') || query.includes('poblacion') || query.includes('población') || 
      query.includes('ultima') || query.includes('última') || query.includes('gasolina') ||
      query.includes('diesel') || query.includes('320d') || query.includes('320D') ||
      query.includes('118i') || query.includes('118d') || query.includes('520d') || query.includes('520D')
    )
      
      console.log('🔍 Tipo de consulta detectada:', isCVOQuery ? 'CVO específica' : 'General')
      
      // Solo intentar acceder a datos de CVO si es una consulta específica
      if (isCVOQuery) {
        console.log('🔍 Intentando acceder a datos de CVO...')
        
        // PRIORIDAD MÁXIMA: Detectar búsqueda por matrícula específica
        const matriculaMatch = message.match(/\b[A-Z0-9]{4,8}[A-Z]{2,3}\b/g);
        if (matriculaMatch && matriculaMatch.length > 0) {
          const matricula = matriculaMatch[0];
          console.log('🔍 Búsqueda por matrícula detectada:', matricula);
          
          // Buscar en todas las tablas por matrícula
          const { data: stockData } = await supabase
            .from('stock')
            .select('*')
            .or(`matricula.ilike.%${matricula}%,license_plate.ilike.%${matricula}%`);
          
          const { data: salesData } = await supabase
            .from('sales_vehicles')
            .select('*')
            .or(`license_plate.ilike.%${matricula}%,matricula.ilike.%${matricula}%`);
          
          const { data: entregasData } = await supabase
            .from('entregas')
            .select('*')
            .ilike('matricula', `%${matricula}%`);
          
          const { data: pedidosData } = await supabase
            .from('pedidos_validados')
            .select('*')
            .ilike('matricula', `%${matricula}%`);
          
          contextData = {
            query_type: 'matricula_search',
            matricula: matricula,
            stock: stockData || [],
            sales: salesData || [],
            entregas: entregasData || [],
            pedidos: pedidosData || [],
            total_found: (stockData?.length || 0) + (salesData?.length || 0) + (entregasData?.length || 0) + (pedidosData?.length || 0)
          };
        }
        // PRIORIDAD MÁXIMA: Detectar consultas específicas de vehículos vendidos con datos de contacto
        if ((query.includes('serie 5') || query.includes('serie5') || query.includes('serie 1') || query.includes('serie1') || query.includes('serie 3') || query.includes('serie3') || query.includes('negro') || query.includes('madrid') || query.includes('chico') || query.includes('bmw') || query.includes('1250') || query.includes('gs') || query.includes('adventure') || query.includes('adventura') || query.includes('poblacion') || query.includes('población') || query.includes('ultima') || query.includes('última') || query.includes('gasolina') || query.includes('diesel') || query.includes('320d') || query.includes('320D') || query.includes('118i') || query.includes('118d') || query.includes('520d') || query.includes('520D')) && (query.includes('vendido') || query.includes('vendi') || query.includes('contacto') || query.includes('datos') || query.includes('tiempo') || query.includes('buscar'))) {
          console.log('🔍 Consulta específica de vehículo vendido con datos de contacto...')
          
          // Buscar en sales_vehicles por modelo específico
          let searchConditions = []
          
          // Buscar por Serie 5
          if (query.includes('serie 5') || query.includes('serie5')) {
            searchConditions.push(`model.ilike.%serie 5%`, `model.ilike.%serie5%`)
          }
          
          // Buscar por Serie 1
          if (query.includes('serie 1') || query.includes('serie1')) {
            searchConditions.push(`model.ilike.%serie 1%`, `model.ilike.%serie1%`)
          }
          
          // Buscar por Serie 3
          if (query.includes('serie 3') || query.includes('serie3')) {
            searchConditions.push(`model.ilike.%serie 3%`, `model.ilike.%serie3%`)
          }
          
          // Buscar por 1250 GS Adventure
          if (query.includes('1250') || query.includes('gs') || query.includes('adventure') || query.includes('adventura')) {
            searchConditions.push(`model.ilike.%1250%`, `model.ilike.%gs%`, `model.ilike.%adventure%`, `model.ilike.%adventura%`)
          }
          
          // Buscar por color negro
          if (query.includes('negro')) {
            searchConditions.push(`color.ilike.%negro%`, `color.ilike.%black%`)
          }
          
          // Buscar por gasolina (modelos que terminen en "i")
          if (query.includes('gasolina')) {
            searchConditions.push(`fuel_type.ilike.%gasolina%`, `fuel_type.ilike.%gasoline%`, `model.ilike.%gasolina%`, `model.ilike.%i%`)
          }
          
          // Buscar por diesel (modelos que terminen en "d")
          if (query.includes('diesel')) {
            searchConditions.push(`fuel_type.ilike.%diesel%`, `model.ilike.%diesel%`, `model.ilike.%d%`)
          }
          
          // Buscar por modelos específicos
          if (query.includes('320d') || query.includes('320D')) {
            searchConditions.push(`model.ilike.%320d%`, `model.ilike.%320D%`)
          }
          
          if (query.includes('118i')) {
            searchConditions.push(`model.ilike.%118i%`)
          }
          
          if (query.includes('118d')) {
            searchConditions.push(`model.ilike.%118d%`)
          }
          
          if (query.includes('520d') || query.includes('520D')) {
            searchConditions.push(`model.ilike.%520d%`, `model.ilike.%520D%`)
          }
          
          // Si no hay condiciones específicas, buscar por BMW
          if (searchConditions.length === 0) {
            searchConditions.push(`model.ilike.%bmw%`)
          }
          
          const { data: salesVehicles } = await supabase
            .from('sales_vehicles')
            .select('*')
            .or(searchConditions.join(','))
          
          let salesWithDeliveries = []
          
          if (salesVehicles && salesVehicles.length > 0) {
            // Para cada venta, verificar si está entregada
            for (const sale of salesVehicles) {
              const { data: delivery } = await supabase
                .from('entregas')
                .select('*')
                .eq('matricula', sale.license_plate || sale.matricula)
                .single()
              
              if (delivery) {
                salesWithDeliveries.push({
                  ...sale,
                  delivery_info: delivery,
                  is_delivered: true,
                  delivery_date: delivery.fecha_entrega
                })
              } else {
                salesWithDeliveries.push({
                  ...sale,
                  is_delivered: false
                })
              }
            }
          }
          
          // Determinar criterio de búsqueda
          let searchCriteria = 'Vehículo vendido'
          if (query.includes('serie 5') || query.includes('serie5')) {
            searchCriteria = 'BMW Serie 5 vendido'
          } else if (query.includes('serie 1') || query.includes('serie1')) {
            searchCriteria = 'BMW Serie 1 vendido'
          } else if (query.includes('1250') || query.includes('gs') || query.includes('adventure')) {
            searchCriteria = 'BMW 1250 GS Adventure vendido'
          } else if (query.includes('bmw')) {
            searchCriteria = 'BMW vendido'
          }
          
          contextData = {
            query_type: 'sold_vehicle_with_contact',
            sales_vehicles: salesWithDeliveries,
            total_found: salesWithDeliveries.length,
            search_criteria: searchCriteria
          }
        }
        
        // PRIORIDAD ALTA: Detectar consultas específicas sobre asesores
        else if (query.includes('cuantos') || query.includes('cuántos') || query.includes('ha vendido') || query.includes('vendido') || query.includes('realizado')) {
          console.log('🔍 Consulta específica sobre ventas de asesor...')
          
          // Extraer nombre del asesor del mensaje - método mejorado
          let advisorName = ''
          const words = message.split(' ')
          
          // Palabras a ignorar
          const ignoreWords = ['cuantos', 'cuántos', 'coches', 'ha', 'he', 'vendido', 'venta', 'realizado', 'por', 'de', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas']
          
          // Buscar nombres propios (palabras que empiezan con mayúscula y tienen más de 2 caracteres)
          for (let i = 0; i < words.length; i++) {
            const word = words[i].trim()
            if (word.length > 2 && 
                !ignoreWords.includes(word.toLowerCase()) && 
                /^[A-ZÁÉÍÓÚÑ]/.test(word)) {
              // Si encontramos un nombre, verificar si hay un apellido siguiente
              if (i + 1 < words.length && 
                  words[i + 1].length > 2 && 
                  /^[A-ZÁÉÍÓÚÑ]/.test(words[i + 1]) && 
                  !ignoreWords.includes(words[i + 1].toLowerCase())) {
                advisorName = `${word} ${words[i + 1]}`
              } else {
                advisorName = word
              }
              break
            }
          }
          
          // Si no encontramos nombre con mayúscula, buscar cualquier palabra que no esté en la lista de ignorar
          if (!advisorName) {
            for (const word of words) {
              if (word.length > 2 && !ignoreWords.includes(word.toLowerCase())) {
                advisorName = word
                break
              }
            }
          }
          
          console.log(`🔍 Nombre del asesor extraído: "${advisorName}"`)
          
          if (advisorName) {
            console.log(`🔍 Buscando ventas del asesor: ${advisorName}`)
            
            // Buscar ventas por asesor con múltiples variaciones
            const searchTerms = [
              advisorName,
              advisorName.split(' ')[0], // Solo nombre
              advisorName.split(' ')[1] || '', // Solo apellido si existe
            ].filter(term => term.length > 0)
            
            let allSales = []
            
            for (const searchTerm of searchTerms) {
              // Buscar en asesor_alias
              const { data: advisorSales } = await supabase
                .from('sales_vehicles')
                .select('*')
                .ilike('asesor_alias', `%${searchTerm}%`)
                .limit(50)
              
              if (advisorSales && advisorSales.length > 0) {
                allSales = [...allSales, ...advisorSales]
              }
              
              // Buscar también en otros campos que puedan contener el nombre del asesor
              const { data: advisorSales2 } = await supabase
                .from('sales_vehicles')
                .select('*')
                .or(`asesor.ilike.%${searchTerm}%,comercial.ilike.%${searchTerm}%,vendedor.ilike.%${searchTerm}%`)
                .limit(50)
              
              if (advisorSales2 && advisorSales2.length > 0) {
                allSales = [...allSales, ...advisorSales2]
              }
            }
            
            // Buscar también en la tabla de entregas
            for (const searchTerm of searchTerms) {
              const { data: deliverySales } = await supabase
                .from('entregas')
                .select('*')
                .ilike('asesor', `%${searchTerm}%`)
                .limit(50)
              
              if (deliverySales && deliverySales.length > 0) {
                // Convertir entregas a formato de ventas para consistencia
                const convertedSales = deliverySales.map(delivery => ({
                  id: `delivery_${delivery.id}`,
                  model: delivery.modelo,
                  asesor_alias: delivery.asesor,
                  sale_date: delivery.fecha_entrega,
                  client_name: delivery.cliente || 'Cliente no especificado',
                  license_plate: delivery.matricula,
                  source: 'entregas'
                }))
                allSales = [...allSales, ...convertedSales]
              }
            }
            
            // Eliminar duplicados
            const uniqueSales = allSales.filter((sale, index, self) => 
              index === self.findIndex(s => s.id === sale.id)
            )
            
            console.log(`🔍 Ventas encontradas: ${uniqueSales.length}`)
            console.log(`🔍 Términos de búsqueda usados: ${searchTerms.join(', ')}`)
            if (uniqueSales.length > 0) {
              console.log(`🔍 Primera venta encontrada:`, uniqueSales[0])
            }
            
            contextData = {
              query_type: 'advisor_sales',
              advisor_name: advisorName,
              sales: uniqueSales,
              total_sales: uniqueSales.length,
              search_terms_used: searchTerms,
              debug_info: {
                message_received: message,
                advisor_extracted: advisorName,
                search_terms: searchTerms,
                total_found: uniqueSales.length
              }
            }
          }
        }
      } else {
        console.log('🔍 Consulta general detectada - usando inteligencia general')
        contextData = {
          query_type: 'general',
          message: message,
          is_general_query: true,
          note: 'Esta es una consulta general, no específica de CVO'
        }
      }
      
      // Detectar consultas de contactos (solo si es consulta CVO)
      if (isCVOQuery && (query.includes('telefono') || query.includes('teléfono') || query.includes('contacto'))) {
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
      
      // Detectar consultas específicas de vehículos vendidos con datos de contacto
      else if (isCVOQuery && (query.includes('serie 5') || query.includes('serie5') || query.includes('negro') || query.includes('madrid') || query.includes('chico') || query.includes('bmw')) && (query.includes('vendido') || query.includes('vendi') || query.includes('contacto') || query.includes('datos') || query.includes('tiempo') || query.includes('buscar'))) {
        console.log('🔍 Consulta específica de vehículo vendido con datos de contacto...')
        
        // Buscar en sales_vehicles por Serie 5 negro
        const { data: salesVehicles } = await supabase
          .from('sales_vehicles')
          .select('*')
          .or(`model.ilike.%serie 5%,model.ilike.%serie5%`)
          .or(`color.ilike.%negro%,color.ilike.%black%`)
        
        let salesWithDeliveries = []
        
        if (salesVehicles && salesVehicles.length > 0) {
          // Para cada venta, verificar si está entregada
          for (const sale of salesVehicles) {
            const { data: delivery } = await supabase
              .from('entregas')
              .select('*')
              .eq('matricula', sale.license_plate || sale.matricula)
              .single()
            
            if (delivery) {
              salesWithDeliveries.push({
                ...sale,
                delivery_info: delivery,
                is_delivered: true,
                delivery_date: delivery.fecha_entrega
              })
            } else {
              salesWithDeliveries.push({
                ...sale,
                is_delivered: false
              })
            }
          }
        }
        
        contextData = {
          query_type: 'sold_vehicle_with_contact',
          sales_vehicles: salesWithDeliveries,
          total_found: salesWithDeliveries.length,
          search_criteria: 'BMW Serie 5 negro vendido'
        }
      }
      
      // Detectar consultas de vehículos
      else if (isCVOQuery && (query.includes('vehículo') || query.includes('vehiculo') || query.includes('bmw') || query.includes('stock') || query.includes('coche') || query.includes('moto'))) {
        console.log('🔍 Consulta de vehículos...')
        
        const { data: vehicles } = await supabase
          .from('stock')
          .select('*')
          .eq('is_sold', false)
        
        contextData = {
          query_type: 'vehicles',
          vehicles: vehicles || []
        }
      }
      
      // Detectar consultas de ventas
      else if (isCVOQuery && (query.includes('venta') || query.includes('vendido') || query.includes('sales') || query.includes('comprar'))) {
        console.log('🔍 Consulta de ventas...')
        
        // Extraer nombre del asesor del mensaje
        let advisorName = ''
        const words = message.split(' ').filter(word => word.length > 2)
        for (const word of words) {
          if (!['venta', 'vendido', 'sales', 'comprar', 'cuantos', 'cuántos', 'coches', 'ha', 'he', 'de', 'el', 'la', 'los', 'las'].includes(word.toLowerCase())) {
            advisorName = word
            break
          }
        }
        
        let sales = []
        if (advisorName) {
          console.log(`🔍 Buscando ventas del asesor: ${advisorName}`)
          // Buscar ventas por asesor
          const { data: advisorSales } = await supabase
            .from('sales_vehicles')
            .select('*')
            .ilike('asesor_alias', `%${advisorName}%`)
          
          sales = advisorSales || []
        } else {
          // Si no se especifica asesor, obtener ventas recientes
          const { data: recentSales } = await supabase
          .from('sales_vehicles')
          .select('*')
            .order('sale_date', { ascending: false })
          
          sales = recentSales || []
        }
        
        contextData = {
          query_type: 'sales',
          advisor_name: advisorName,
          sales: sales,
          total_sales: sales.length
        }
      }
      
      // Detectar consultas de entregas
      else if (isCVOQuery && (query.includes('entrega') || query.includes('delivery') || query.includes('entregar'))) {
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
      else if (isCVOQuery && (query.includes('métrica') || query.includes('metric') || query.includes('estadística') || query.includes('estadistica') || query.includes('kpi') || query.includes('resumen'))) {
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
      else if (isCVOQuery && (query.includes('incentivo') || query.includes('incentive') || query.includes('bonus'))) {
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
      else if (isCVOQuery && (query.includes('foto') || query.includes('photo') || query.includes('imagen') || query.includes('fotografías'))) {
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
        .eq('user_id', userId)
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
      response = await generateEdelweissResponse(message, history, contextData, isEmployee)

      console.log('✅ Respuesta de OpenAI generada:', response.substring(0, 100) + '...')

      // Guardar la conversación en la base de datos
      console.log('💾 Guardando conversación...')
      const { error: insertError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
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
          user_id: userId,
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