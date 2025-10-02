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
      
      // Detectar tipo de consulta de forma más simple
      const query = message.toLowerCase()
      
      // CONSULTAS DE USUARIOS
      if (query.includes('rodrigo') || query.includes('moreno') || query.includes('teléfono') || query.includes('telefono')) {
        console.log('🔍 Buscando usuarios...')
        
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .or('full_name.ilike.%Rodrigo%,full_name.ilike.%Moreno%')
          .limit(5)
        
        if (error) {
          response = `Error al consultar usuarios: ${error.message}`
        } else if (users && users.length > 0) {
          response = `**Usuarios encontrados (${users.length}):**\n\n`
          users.forEach((user, index) => {
            response += `${index + 1}. **${user.full_name || 'Sin nombre'}**\n`
            response += `   - Teléfono: ${user.phone || 'No disponible'}\n`
            response += `   - Email: ${user.email || 'No disponible'}\n`
            response += `   - Rol: ${user.role || 'No especificado'}\n\n`
          })
        } else {
          response = `No se encontraron usuarios con ese nombre en la base de datos.`
        }
      }
      
      // CONSULTAS DE VEHÍCULOS
      else if (query.includes('vehículo') || query.includes('vehiculo') || query.includes('bmw') || query.includes('stock') || query.includes('coche')) {
        console.log('🔍 Buscando vehículos...')
        
        const { data: vehicles, error } = await supabase
          .from('stock')
          .select('*')
          .eq('is_sold', false)
          .limit(10)
        
        if (error) {
          response = `Error al consultar vehículos: ${error.message}`
        } else if (vehicles && vehicles.length > 0) {
          response = `**Vehículos en stock (${vehicles.length}):**\n\n`
          vehicles.forEach((vehicle, index) => {
            response += `${index + 1}. **${vehicle.model || 'Modelo no disponible'}**\n`
            response += `   - Matrícula: ${vehicle.license_plate || 'No disponible'}\n`
            response += `   - Centro: ${vehicle.work_center || 'No especificado'}\n`
            response += `   - Estado: ${vehicle.paint_status || 'No especificado'}\n\n`
          })
        } else {
          response = `No se encontraron vehículos en stock.`
        }
      }
      
      // CONSULTAS DE VENTAS
      else if (query.includes('venta') || query.includes('vendido') || query.includes('sales')) {
        console.log('🔍 Buscando ventas...')
        
        const { data: sales, error } = await supabase
          .from('sales_vehicles')
          .select('*')
          .limit(10)
        
        if (error) {
          response = `Error al consultar ventas: ${error.message}`
        } else if (sales && sales.length > 0) {
          response = `**Vehículos vendidos (${sales.length}):**\n\n`
          sales.forEach((sale, index) => {
            response += `${index + 1}. **${sale.model || 'Modelo no disponible'}**\n`
            response += `   - Asesor: ${sale.advisor || 'No disponible'}\n`
            response += `   - Precio: ${sale.price ? `€${sale.price.toLocaleString()}` : 'No disponible'}\n`
            response += `   - Fecha: ${sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron ventas en la base de datos.`
        }
      }
      
      // CONSULTAS DE ENTREGAS
      else if (query.includes('entrega') || query.includes('delivery')) {
        console.log('🔍 Buscando entregas...')
        
        const { data: deliveries, error } = await supabase
          .from('entregas')
          .select('*')
          .limit(10)
        
        if (error) {
          response = `Error al consultar entregas: ${error.message}`
        } else if (deliveries && deliveries.length > 0) {
          response = `**Entregas (${deliveries.length}):**\n\n`
          deliveries.forEach((delivery, index) => {
            response += `${index + 1}. **${delivery.modelo || 'Modelo no disponible'}**\n`
            response += `   - Matrícula: ${delivery.matricula || 'No disponible'}\n`
            response += `   - Asesor: ${delivery.asesor || 'No disponible'}\n`
            response += `   - Fecha entrega: ${delivery.fecha_entrega ? new Date(delivery.fecha_entrega).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron entregas en la base de datos.`
        }
      }
      
      // CONSULTAS DE MÉTRICAS
      else if (query.includes('métrica') || query.includes('metric') || query.includes('estadística') || query.includes('estadistica') || query.includes('kpi')) {
        console.log('🔍 Buscando métricas...')
        
        const { data: metrics, error } = await supabase
          .from('daily_metrics')
          .select('*')
          .order('date_recorded', { ascending: false })
          .limit(5)
        
        if (error) {
          response = `Error al consultar métricas: ${error.message}`
        } else if (metrics && metrics.length > 0) {
          response = `**Métricas diarias (últimos ${metrics.length} días):**\n\n`
          metrics.forEach((metric, index) => {
            response += `${index + 1}. **${metric.date_recorded}**\n`
            response += `   - Total vehículos: ${metric.total_vehicles || 0}\n`
            response += `   - Pendientes inspección: ${metric.pending_inspection || 0}\n`
            response += `   - En proceso: ${metric.in_process || 0}\n`
            response += `   - Completados: ${metric.completed || 0}\n`
            response += `   - Nuevas entradas: ${metric.new_entries || 0}\n`
            response += `   - Vehículos vendidos: ${metric.sold_vehicles || 0}\n\n`
          })
        } else {
          response = `No se encontraron métricas en la base de datos.`
        }
      }
      
      // CONSULTAS DE INCENTIVOS
      else if (query.includes('incentivo') || query.includes('incentive')) {
        console.log('🔍 Buscando incentivos...')
        
        const { data: incentives, error } = await supabase
          .from('incentivos')
          .select('*')
          .limit(10)
        
        if (error) {
          response = `Error al consultar incentivos: ${error.message}`
        } else if (incentives && incentives.length > 0) {
          response = `**Incentivos (${incentives.length}):**\n\n`
          incentives.forEach((incentive, index) => {
            response += `${index + 1}. **${incentive.modelo || 'Modelo no disponible'}**\n`
            response += `   - Matrícula: ${incentive.matricula || 'No disponible'}\n`
            response += `   - Asesor: ${incentive.asesor || 'No disponible'}\n`
            response += `   - Precio venta: ${incentive.precio_venta ? `€${incentive.precio_venta.toLocaleString()}` : 'No disponible'}\n`
            response += `   - Margen: ${incentive.margen ? `€${incentive.margen.toLocaleString()}` : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron incentivos en la base de datos.`
        }
      }
      
      // CONSULTAS DE FOTOS
      else if (query.includes('foto') || query.includes('photo') || query.includes('imagen')) {
        console.log('🔍 Buscando fotos...')
        
        const { data: photos, error } = await supabase
          .from('fotos')
          .select('*')
          .limit(10)
        
        if (error) {
          response = `Error al consultar fotos: ${error.message}`
        } else if (photos && photos.length > 0) {
          response = `**Fotos asignadas (${photos.length}):**\n\n`
          photos.forEach((photo, index) => {
            response += `${index + 1}. **${photo.model || 'Modelo no disponible'}**\n`
            response += `   - Matrícula: ${photo.license_plate || 'No disponible'}\n`
            response += `   - Asignado a: ${photo.assigned_to || 'No asignado'}\n`
            response += `   - Estado: ${photo.estado_pintura || 'No especificado'}\n`
            response += `   - Completado: ${photo.photos_completed ? 'Sí' : 'No'}\n\n`
          })
        } else {
          response = `No se encontraron fotos en la base de datos.`
        }
      }
      
      // CONSULTA GENERAL
      else {
        response = `Hola! Soy Edelweiss, tu asistente de IA especializado en gestión de concesionarios BMW. 

He recibido tu mensaje: "${message}"

**Puedo ayudarte con datos específicos de:**
- 📞 **Usuarios**: "¿Cuál es el teléfono de Rodrigo Moreno?"
- 🚗 **Vehículos**: "¿Qué BMW hay en stock?"
- 💰 **Ventas**: "¿Cuáles son las ventas recientes?"
- 🚚 **Entregas**: "¿Cuántas entregas hay hoy?"
- 📊 **Métricas**: "¿Cuáles son las estadísticas diarias?"
- 💸 **Incentivos**: "¿Hay incentivos pendientes?"
- 📸 **Fotos**: "¿Qué fotos están pendientes?"

¿En qué puedo ayudarte específicamente?`
      }
      
    } catch (dbError) {
      console.error('❌ Error en base de datos:', dbError)
      response = `Lo siento, hubo un error al acceder a la base de datos: ${dbError.message}. Inténtalo de nuevo.`
    }

    console.log('✅ Respuesta generada:', response.substring(0, 100) + '...')
    return NextResponse.json({ response })

  } catch (error) {
    console.error('Error en API de chat:', error)
    
    // Respuesta de fallback en caso de error
    const fallbackResponse = `Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.`
    return NextResponse.json({ response: fallbackResponse })
  }
}

