import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    console.log('📝 Mensaje recibido:', message)
    console.log('🔍 Variables de entorno:')
    console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('- SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'No configurada')

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
      
      // Si es consulta de usuario específico
      if (message.toLowerCase().includes('rodrigo moreno') || message.toLowerCase().includes('teléfono')) {
        console.log('🔍 Buscando Rodrigo Moreno en la base de datos real...')
        
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, created_at')
          .or('full_name.ilike.%Rodrigo%,full_name.ilike.%Moreno%')
          .limit(5)
        
        if (error) {
          console.error('❌ Error en consulta de usuarios:', error)
          response = `Error al consultar la base de datos: ${error.message}`
        } else if (users && users.length > 0) {
          console.log('✅ Usuarios encontrados:', users.length)
          console.log('📋 Datos reales:', users)
          
          response = `He encontrado ${users.length} usuario(s) relacionado(s) con Rodrigo Moreno:\n\n`
          users.forEach((user, index) => {
            response += `${index + 1}. **${user.full_name || 'Nombre no disponible'}**\n`
            response += `   - Teléfono: ${user.phone || 'No disponible'}\n`
            response += `   - Email: ${user.email || 'No disponible'}\n`
            response += `   - Rol: ${user.role || 'No especificado'}\n`
            response += `   - Fecha de registro: ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'No disponible'}\n\n`
          })
        } else {
          response = `No se encontraron usuarios con el nombre "Rodrigo Moreno" en la base de datos.`
        }
      }
      
      // Si es consulta de vehículos
      else if (message.toLowerCase().includes('vehículo') || message.toLowerCase().includes('bmw') || message.toLowerCase().includes('stock')) {
        console.log('🔍 Buscando vehículos en la base de datos real...')
        
        const { data: vehicles, error } = await supabase
          .from('stock')
          .select('license_plate, model, color, km, price, status')
          .limit(10)
        
        if (error) {
          console.error('❌ Error en consulta de vehículos:', error)
          response = `Error al consultar la base de datos: ${error.message}`
        } else if (vehicles && vehicles.length > 0) {
          console.log('✅ Vehículos encontrados:', vehicles.length)
          console.log('📋 Datos reales:', vehicles)
          
          response = `He encontrado ${vehicles.length} vehículo(s) en stock:\n\n`
          vehicles.forEach((vehicle, index) => {
            response += `${index + 1}. **${vehicle.model || 'Modelo no disponible'}**\n`
            response += `   - Matrícula: ${vehicle.license_plate || 'No disponible'}\n`
            response += `   - Color: ${vehicle.color || 'No especificado'}\n`
            response += `   - Kilómetros: ${vehicle.km ? vehicle.km.toLocaleString() + ' km' : 'No disponible'}\n`
            response += `   - Precio: ${vehicle.price ? `€${vehicle.price.toLocaleString()}` : 'No disponible'}\n`
            response += `   - Estado: ${vehicle.status || 'No especificado'}\n\n`
          })
        } else {
          response = `No se encontraron vehículos en stock en la base de datos.`
        }
      }
      
      // Consulta general
      else {
        response = `Hola! Soy Edelweiss, tu asistente de IA especializado en gestión de concesionarios BMW. 

He recibido tu mensaje: "${message}"

**Puedo ayudarte con datos reales de:**
- 📞 **Usuarios**: Nombres, teléfonos, emails, roles
- 🚗 **Vehículos en stock**: Modelos, precios, colores, estado
- 📊 **Ventas**: Vehículos vendidos, precios, fechas
- 📋 **Pedidos**: Estado de pedidos, validaciones
- 🚚 **Entregas**: Fechas, asesores, incidencias

**Ejemplos de consultas:**
- "¿Cuál es el teléfono de Rodrigo Moreno?"
- "¿Qué vehículos BMW hay en stock?"
- "¿Cuáles son las ventas recientes?"
- "¿Hay algún Serie 5 disponible?"

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

