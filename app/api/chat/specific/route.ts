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
      
      // CONSULTAS DE USUARIOS/ASESORES
      if (message.toLowerCase().includes('rodrigo moreno') || message.toLowerCase().includes('teléfono')) {
        console.log('🔍 Buscando Rodrigo Moreno...')
        
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
            response += `   - Rol: ${user.role || 'No especificado'}\n`
            response += `   - Centro: ${user.work_center || 'No especificado'}\n`
            response += `   - Registro: ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron usuarios con el nombre "Rodrigo Moreno" en la base de datos.`
        }
      }
      
      // CONSULTAS DE VEHÍCULOS EN STOCK
      else if (message.toLowerCase().includes('vehículo') || message.toLowerCase().includes('bmw') || message.toLowerCase().includes('stock') || message.toLowerCase().includes('coche')) {
        console.log('🔍 Buscando vehículos en stock...')
        
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
            response += `   - Tipo: ${vehicle.vehicle_type || 'No especificado'}\n`
            response += `   - Pintura: ${vehicle.paint_status || 'No especificado'}\n`
            response += `   - Mecánica: ${vehicle.mechanical_status || 'No especificado'}\n`
            response += `   - Carrocería: ${vehicle.body_status || 'No especificado'}\n`
            response += `   - Fecha recepción: ${vehicle.reception_date ? new Date(vehicle.reception_date).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron vehículos en stock.`
        }
      }
      
      // CONSULTAS DE VEHÍCULOS VENDIDOS
      else if (message.toLowerCase().includes('vendido') || message.toLowerCase().includes('venta') || message.toLowerCase().includes('sales')) {
        console.log('🔍 Buscando vehículos vendidos...')
        
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
            response += `   - Cliente: ${sale.customer_name || 'No disponible'}\n`
            response += `   - Asesor: ${sale.advisor || 'No disponible'}\n`
            response += `   - Precio: ${sale.price ? `€${sale.price.toLocaleString()}` : 'No disponible'}\n`
            response += `   - Fecha venta: ${sale.sale_date ? new Date(sale.sale_date).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron ventas en la base de datos.`
        }
      }
      
      // CONSULTAS DE ENTREGAS
      else if (message.toLowerCase().includes('entrega') || message.toLowerCase().includes('delivery')) {
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
            response += `${index + 1}. **Entrega ${delivery.id}**\n`
            response += `   - Matrícula: ${delivery.matricula || 'No disponible'}\n`
            response += `   - Modelo: ${delivery.modelo || 'No disponible'}\n`
            response += `   - Asesor: ${delivery.asesor || 'No disponible'}\n`
            response += `   - Fecha venta: ${delivery.fecha_venta ? new Date(delivery.fecha_venta).toLocaleDateString() : 'No disponible'}\n`
            response += `   - Fecha entrega: ${delivery.fecha_entrega ? new Date(delivery.fecha_entrega).toLocaleDateString() : 'No disponible'}\n`
            response += `   - Incidencia: ${delivery.incidencia ? 'Sí' : 'No'}\n\n`
          })
        } else {
          response = `No se encontraron entregas en la base de datos.`
        }
      }
      
      // CONSULTAS DE PEDIDOS
      else if (message.toLowerCase().includes('pedido') || message.toLowerCase().includes('order') || message.toLowerCase().includes('validado')) {
        console.log('🔍 Buscando pedidos...')
        
        const { data: orders, error } = await supabase
          .from('pedidos_validados')
          .select('*')
          .limit(10)
        
        if (error) {
          response = `Error al consultar pedidos: ${error.message}`
        } else if (orders && orders.length > 0) {
          response = `**Pedidos validados (${orders.length}):**\n\n`
          orders.forEach((order, index) => {
            response += `${index + 1}. **Pedido ${order.id}**\n`
            response += `   - Cliente: ${order.customer_name || 'No disponible'}\n`
            response += `   - Modelo: ${order.model || 'No disponible'}\n`
            response += `   - Matrícula: ${order.license_plate || 'No disponible'}\n`
            response += `   - Comercial: ${order.commercial || 'No disponible'}\n`
            response += `   - Total: ${order.total ? `€${order.total.toLocaleString()}` : 'No disponible'}\n`
            response += `   - Fecha: ${order.order_date ? new Date(order.order_date).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron pedidos en la base de datos.`
        }
      }
      
      // CONSULTAS DE INCENTIVOS
      else if (message.toLowerCase().includes('incentivo') || message.toLowerCase().includes('incentive')) {
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
            response += `${index + 1}. **Incentivo ${incentive.id}**\n`
            response += `   - Matrícula: ${incentive.matricula || 'No disponible'}\n`
            response += `   - Modelo: ${incentive.modelo || 'No disponible'}\n`
            response += `   - Asesor: ${incentive.asesor || 'No disponible'}\n`
            response += `   - Precio venta: ${incentive.precio_venta ? `€${incentive.precio_venta.toLocaleString()}` : 'No disponible'}\n`
            response += `   - Margen: ${incentive.margen ? `€${incentive.margen.toLocaleString()}` : 'No disponible'}\n`
            response += `   - Importe total: ${incentive.importe_total ? `€${incentive.importe_total.toLocaleString()}` : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron incentivos en la base de datos.`
        }
      }
      
      // CONSULTAS DE FOTOS
      else if (message.toLowerCase().includes('foto') || message.toLowerCase().includes('photo') || message.toLowerCase().includes('imagen')) {
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
            response += `${index + 1}. **Foto ${photo.id}**\n`
            response += `   - Matrícula: ${photo.license_plate || 'No disponible'}\n`
            response += `   - Modelo: ${photo.model || 'No disponible'}\n`
            response += `   - Asignado a: ${photo.assigned_to || 'No asignado'}\n`
            response += `   - Estado pintura: ${photo.estado_pintura || 'No especificado'}\n`
            response += `   - Completado: ${photo.photos_completed ? 'Sí' : 'No'}\n`
            response += `   - Fecha: ${photo.created_at ? new Date(photo.created_at).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron fotos en la base de datos.`
        }
      }
      
      // CONSULTAS DE EXTORNOS
      else if (message.toLowerCase().includes('extorno') || message.toLowerCase().includes('refund')) {
        console.log('🔍 Buscando extornos...')
        
        const { data: extornos, error } = await supabase
          .from('extornos')
          .select('*')
          .limit(10)
        
        if (error) {
          response = `Error al consultar extornos: ${error.message}`
        } else if (extornos && extornos.length > 0) {
          response = `**Extornos (${extornos.length}):**\n\n`
          extornos.forEach((extorno, index) => {
            response += `${index + 1}. **Extorno ${extorno.id}**\n`
            response += `   - Matrícula: ${extorno.matricula || 'No disponible'}\n`
            response += `   - Cliente: ${extorno.cliente || 'No disponible'}\n`
            response += `   - Concepto: ${extorno.concepto || 'No disponible'}\n`
            response += `   - Importe: ${extorno.importe ? `€${extorno.importe.toLocaleString()}` : 'No disponible'}\n`
            response += `   - Estado: ${extorno.estado || 'No especificado'}\n`
            response += `   - Fecha: ${extorno.created_at ? new Date(extorno.created_at).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron extornos en la base de datos.`
        }
      }
      
      // CONSULTAS DE GARANTÍAS
      else if (message.toLowerCase().includes('garantía') || message.toLowerCase().includes('warranty') || message.toLowerCase().includes('seguro')) {
        console.log('🔍 Buscando garantías...')
        
        const { data: garantias, error } = await supabase
          .from('garantias_brutas_mm')
          .select('*')
          .limit(10)
        
        if (error) {
          response = `Error al consultar garantías: ${error.message}`
        } else if (garantias && garantias.length > 0) {
          response = `**Garantías (${garantias.length}):**\n\n`
          garantias.forEach((garantia, index) => {
            response += `${index + 1}. **Garantía ${garantia.id}**\n`
            response += `   - Matrícula: ${garantia.Matrícula || 'No disponible'}\n`
            response += `   - Modelo: ${garantia.Modelo || 'No disponible'}\n`
            response += `   - Marca: ${garantia.Marca || 'No disponible'}\n`
            response += `   - Prima Total: ${garantia.Prima_Total ? `€${garantia.Prima_Total.toLocaleString()}` : 'No disponible'}\n`
            response += `   - Estado: ${garantia.Estado || 'No especificado'}\n\n`
          })
        } else {
          response = `No se encontraron garantías en la base de datos.`
        }
      }
      
      // CONSULTAS DE NOTIFICACIONES
      else if (message.toLowerCase().includes('notificación') || message.toLowerCase().includes('notification') || message.toLowerCase().includes('alerta')) {
        console.log('🔍 Buscando notificaciones...')
        
        const { data: notifications, error } = await supabase
          .from('notification_history')
          .select('*')
          .limit(10)
        
        if (error) {
          response = `Error al consultar notificaciones: ${error.message}`
        } else if (notifications && notifications.length > 0) {
          response = `**Notificaciones (${notifications.length}):**\n\n`
          notifications.forEach((notification, index) => {
            response += `${index + 1}. **${notification.title || 'Sin título'}**\n`
            response += `   - Mensaje: ${notification.body || 'No disponible'}\n`
            response += `   - Leída: ${notification.read_at ? 'Sí' : 'No'}\n`
            response += `   - Fecha: ${notification.created_at ? new Date(notification.created_at).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron notificaciones en la base de datos.`
        }
      }
      
      // CONSULTAS DE MÉTRICAS DIARIAS
      else if (message.toLowerCase().includes('métrica') || message.toLowerCase().includes('metric') || message.toLowerCase().includes('estadística') || message.toLowerCase().includes('estadistica') || message.toLowerCase().includes('kpi')) {
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
      
      // CONSULTAS DE CONVERSACIONES IA
      else if (message.toLowerCase().includes('conversación') || message.toLowerCase().includes('conversacion') || message.toLowerCase().includes('chat') || message.toLowerCase().includes('historial')) {
        console.log('🔍 Buscando conversaciones de IA...')
        
        const { data: conversations, error } = await supabase
          .from('ai_conversations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (error) {
          response = `Error al consultar conversaciones: ${error.message}`
        } else if (conversations && conversations.length > 0) {
          response = `**Conversaciones de IA (${conversations.length}):**\n\n`
          conversations.forEach((conv, index) => {
            response += `${index + 1}. **Conversación ${conv.id}**\n`
            response += `   - Mensaje: ${conv.message ? conv.message.substring(0, 50) + '...' : 'No disponible'}\n`
            response += `   - Respuesta: ${conv.response ? conv.response.substring(0, 50) + '...' : 'No disponible'}\n`
            response += `   - Fecha: ${conv.created_at ? new Date(conv.created_at).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron conversaciones en la base de datos.`
        }
      }
      
      // CONSULTA GENERAL - Solo si no coincide con nada específico
      else {
        response = `Hola! Soy Edelweiss, tu asistente de IA especializado en gestión de concesionarios BMW. 

He recibido tu mensaje: "${message}"

**Puedo ayudarte con datos específicos de:**
- 📞 **Usuarios**: "¿Cuál es el teléfono de Rodrigo Moreno?"
- 🚗 **Vehículos**: "¿Qué BMW hay en stock?"
- 💰 **Ventas**: "¿Cuáles son las ventas recientes?"
- 🚚 **Entregas**: "¿Cuántas entregas hay hoy?"
- 📋 **Pedidos**: "¿Qué pedidos están pendientes?"
- 💸 **Incentivos**: "¿Hay incentivos pendientes?"
- 📸 **Fotos**: "¿Qué fotos están pendientes?"
- 🔄 **Extornos**: "¿Hay extornos pendientes?"
- 🛡️ **Garantías**: "¿Qué garantías hay activas?"
- 🔔 **Notificaciones**: "¿Qué notificaciones hay?"
- 📊 **Métricas**: "¿Cuáles son las estadísticas diarias?"

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

