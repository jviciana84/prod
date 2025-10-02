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
      
      // Extraer nombre del mensaje
      let searchTerm = ''
      if (query.includes('rodrigo')) searchTerm = 'rodrigo'
      else if (query.includes('jordi')) searchTerm = 'jordi'
      else if (query.includes('pol')) searchTerm = 'pol'
      else if (query.includes('sara')) searchTerm = 'sara'
      else if (query.includes('javier')) searchTerm = 'javier'
      else if (query.includes('ivan')) searchTerm = 'ivan'
      else if (query.includes('jose')) searchTerm = 'jose'
      else if (query.includes('maria')) searchTerm = 'maria'
      else if (query.includes('jaume')) searchTerm = 'jaume'
      else if (query.includes('ferran')) searchTerm = 'ferran'
      else if (query.includes('bufi')) searchTerm = 'bufi'
      else {
        response = `No se especificó un nombre válido. Intenta con: "telefono rodrigo" o "telefono jordi"`
        return NextResponse.json({ response })
      }
      
      console.log('🔍 Buscando por:', searchTerm)
      
      // Buscar en usuarios (profiles)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${searchTerm}%`)
        .limit(5)
      
      // Buscar en clientes de ventas
      const { data: salesClients, error: salesError } = await supabase
        .from('sales_vehicles')
        .select('client_name, client_phone, client_email, advisor_name, model, sale_date')
        .ilike('client_name', `%${searchTerm}%`)
        .limit(5)
      
      // Buscar en entregas
      const { data: deliveryClients, error: deliveryError } = await supabase
        .from('entregas')
        .select('*')
        .ilike('asesor', `%${searchTerm}%`)
        .limit(5)
      
      // Buscar en pedidos validados
      const { data: orderClients, error: orderError } = await supabase
        .from('pedidos_validados')
        .select('*')
        .ilike('nombre_cliente', `%${searchTerm}%`)
        .limit(5)
      
      console.log('🔍 Resultados:', { 
        users: users?.length || 0, 
        salesClients: salesClients?.length || 0,
        deliveryClients: deliveryClients?.length || 0,
        orderClients: orderClients?.length || 0
      })
      
      let results = []
      
      // Procesar usuarios encontrados
      if (users && users.length > 0) {
        users.forEach(user => {
          results.push({
            tipo: 'Usuario/Empleado',
            nombre: user.full_name,
            telefono: user.phone,
            email: user.email,
            posicion: user.position,
            alias: user.alias
          })
        })
      }
      
      // Procesar clientes de ventas
      if (salesClients && salesClients.length > 0) {
        salesClients.forEach(client => {
          results.push({
            tipo: 'Cliente (Venta)',
            nombre: client.client_name,
            telefono: client.client_phone,
            email: client.client_email,
            asesor: client.advisor_name,
            modelo: client.model,
            fecha_venta: client.sale_date
          })
        })
      }
      
      // Procesar clientes de entregas
      if (deliveryClients && deliveryClients.length > 0) {
        deliveryClients.forEach(delivery => {
          results.push({
            tipo: 'Entrega',
            asesor: delivery.asesor,
            matricula: delivery.matricula,
            modelo: delivery.modelo,
            fecha_entrega: delivery.fecha_entrega
          })
        })
      }
      
      // Procesar clientes de pedidos
      if (orderClients && orderClients.length > 0) {
        orderClients.forEach(order => {
          results.push({
            tipo: 'Pedido',
            nombre: order.nombre_cliente,
            comercial: order.comercial,
            numero_pedido: order.numero_pedido,
            fecha_pedido: order.fecha_pedido
          })
        })
      }
      
      if (results.length > 0) {
        response = `He encontrado ${results.length} resultado(s) para "${searchTerm}":\n\n`
        results.forEach((result, index) => {
          response += `${index + 1}. **${result.tipo}**\n`
          if (result.nombre) response += `   Nombre: ${result.nombre}\n`
          if (result.telefono) response += `   Teléfono: ${result.telefono}\n`
          if (result.email) response += `   Email: ${result.email}\n`
          if (result.posicion) response += `   Posición: ${result.posicion}\n`
          if (result.asesor) response += `   Asesor: ${result.asesor}\n`
          if (result.modelo) response += `   Modelo: ${result.modelo}\n`
          if (result.fecha_venta) response += `   Fecha venta: ${result.fecha_venta}\n`
          if (result.fecha_entrega) response += `   Fecha entrega: ${result.fecha_entrega}\n`
          if (result.numero_pedido) response += `   Número pedido: ${result.numero_pedido}\n`
          response += '\n'
        })
      } else {
        response = `No se encontraron resultados para "${searchTerm}" en ninguna tabla de la aplicación.`
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
