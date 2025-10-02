import { NextRequest, NextResponse } from 'next/server'

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
      
      const query = message.toLowerCase()
      
      // Detectar consultas de usuarios
      if (query.includes('telefono') || query.includes('teléfono') || query.includes('rodrigo') || query.includes('ferran') || query.includes('bufi')) {
        console.log('🔍 Buscando usuarios...')
        
        // Buscar por cualquier parte del nombre mencionado
        let searchTerm = 'rodrigo'
        if (query.includes('ferran')) searchTerm = 'ferran'
        if (query.includes('bufi')) searchTerm = 'bufi'
        
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('full_name', `%${searchTerm}%`)
          .limit(5)
        
        if (error) {
          console.error('Error buscando usuarios:', error)
          response = `Error buscando usuarios: ${error.message}`
        } else if (users && users.length > 0) {
          response = `Usuarios encontrados: ${JSON.stringify(users, null, 2)}`
        } else {
          response = `No se encontraron usuarios con el nombre Ferran en la base de datos.`
        }
      }
      
      // Detectar consultas de ventas
      else if (query.includes('comprado') || query.includes('venta') || query.includes('vendido')) {
        console.log('🔍 Buscando ventas...')
        
        const { data: sales, error } = await supabase
          .from('sales_vehicles')
          .select('*')
          .limit(10)
        
        if (error) {
          console.error('Error buscando ventas:', error)
          response = `Error buscando ventas: ${error.message}`
        } else if (sales && sales.length > 0) {
          response = `Ventas encontradas: ${JSON.stringify(sales, null, 2)}`
        } else {
          response = `No se encontraron ventas en la base de datos.`
        }
      }
      
      // Detectar consultas de vehículos
      else if (query.includes('vehículo') || query.includes('vehiculo') || query.includes('bmw') || query.includes('stock')) {
        console.log('🔍 Buscando vehículos...')
        
        const { data: vehicles, error } = await supabase
          .from('stock')
          .select('*')
          .limit(10)
        
        if (error) {
          console.error('Error buscando vehículos:', error)
          response = `Error buscando vehículos: ${error.message}`
        } else if (vehicles && vehicles.length > 0) {
          response = `Vehículos encontrados: ${JSON.stringify(vehicles, null, 2)}`
        } else {
          response = `No se encontraron vehículos en la base de datos.`
        }
      }
      
      // Detectar consultas de entregas
      else if (query.includes('entrega') || query.includes('delivery')) {
        console.log('🔍 Buscando entregas...')
        
        const { data: deliveries, error } = await supabase
          .from('entregas')
          .select('*')
          .limit(10)
        
        if (error) {
          console.error('Error buscando entregas:', error)
          response = `Error buscando entregas: ${error.message}`
        } else if (deliveries && deliveries.length > 0) {
          response = `Entregas encontradas: ${JSON.stringify(deliveries, null, 2)}`
        } else {
          response = `No se encontraron entregas en la base de datos.`
        }
      }
      
      // Detectar consultas de métricas
      else if (query.includes('métrica') || query.includes('metric') || query.includes('estadística') || query.includes('estadistica')) {
        console.log('🔍 Buscando métricas...')
        
        const { data: metrics, error } = await supabase
          .from('daily_metrics')
          .select('*')
          .limit(5)
        
        if (error) {
          console.error('Error buscando métricas:', error)
          response = `Error buscando métricas: ${error.message}`
        } else if (metrics && metrics.length > 0) {
          response = `Métricas encontradas: ${JSON.stringify(metrics, null, 2)}`
        } else {
          response = `No se encontraron métricas en la base de datos.`
        }
      }
      
      // Detectar consultas de incentivos
      else if (query.includes('incentivo') || query.includes('incentive')) {
        console.log('🔍 Buscando incentivos...')
        
        const { data: incentives, error } = await supabase
          .from('incentivos')
          .select('*')
          .limit(10)
        
        if (error) {
          console.error('Error buscando incentivos:', error)
          response = `Error buscando incentivos: ${error.message}`
        } else if (incentives && incentives.length > 0) {
          response = `Incentivos encontrados: ${JSON.stringify(incentives, null, 2)}`
        } else {
          response = `No se encontraron incentivos en la base de datos.`
        }
      }
      
      // Detectar consultas de fotos
      else if (query.includes('foto') || query.includes('photo') || query.includes('imagen')) {
        console.log('🔍 Buscando fotos...')
        
        const { data: photos, error } = await supabase
          .from('fotos')
          .select('*')
          .limit(10)
        
        if (error) {
          console.error('Error buscando fotos:', error)
          response = `Error buscando fotos: ${error.message}`
        } else if (photos && photos.length > 0) {
          response = `Fotos encontradas: ${JSON.stringify(photos, null, 2)}`
        } else {
          response = `No se encontraron fotos en la base de datos.`
        }
      }
      
      // Si no se detecta ningún tipo específico, mostrar estructura de tablas
      else {
        console.log('🔍 Mostrando estructura de tablas...')
        
        const tables = [
          'profiles', 'stock', 'sales_vehicles', 'entregas', 
          'daily_metrics', 'incentivos', 'fotos', 'extornos', 
          'garantias_brutas_mm', 'notification_history', 
          'pedidos_validados', 'ai_conversations', 'ai_sessions'
        ]
        
        response = `Tablas disponibles en la base de datos: ${tables.join(', ')}`
      }

    } catch (dbError) {
      console.error('❌ Error en base de datos:', dbError)
      response = `Error accediendo a la base de datos: ${dbError.message}`
    }

    return NextResponse.json({ response })

  } catch (error) {
    console.error('Error en API de chat:', error)
    
    const fallbackResponse = `Error procesando mensaje: ${error.message}`
    return NextResponse.json({ response: fallbackResponse })
  }
}