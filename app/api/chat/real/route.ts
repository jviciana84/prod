import { NextRequest, NextResponse } from 'next/server'
import { generateEdelweissResponse } from '@/lib/openai-config'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    console.log('🔍 API Key disponible:', !!process.env.OPENAI_API_KEY)
    console.log('📝 Mensaje recibido:', message)

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje es requerido' },
        { status: 400 }
      )
    }

    // Verificar si hay API key de OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No hay API key de OpenAI, usando respuesta simulada')
      const response = `Hola! Recibí tu mensaje: "${message}". Soy Edelweiss, tu asistente de IA. Para usar las funciones completas, necesitas configurar la API key de OpenAI en las variables de entorno.`
      return NextResponse.json({ response })
    }

    console.log('✅ API key encontrada, llamando a OpenAI...')

    // Buscar datos reales en la base de datos
    let contextData = null
    let realData = null
    
    try {
      const supabase = createClient()
      
      // Si es consulta de usuario específico
      if (message.toLowerCase().includes('rodrigo moreno') || message.toLowerCase().includes('teléfono')) {
        console.log('🔍 Buscando Rodrigo Moreno en la base de datos...')
        
        const { data: users, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, created_at')
          .or('full_name.ilike.%Rodrigo%,full_name.ilike.%Moreno%')
          .limit(5)
        
        if (!error && users && users.length > 0) {
          realData = users
          contextData = {
            query_type: 'user_search',
            users_found: users,
            message: `Se encontraron ${users.length} usuarios relacionados con Rodrigo Moreno`
          }
          console.log('✅ Usuarios encontrados:', users.length)
          console.log('📋 Datos:', users)
        } else {
          console.log('❌ No se encontraron usuarios:', error?.message)
        }
      }
      
      // Si es consulta de vehículos
      else if (message.toLowerCase().includes('vehículo') || message.toLowerCase().includes('bmw') || message.toLowerCase().includes('stock')) {
        console.log('🔍 Buscando vehículos en la base de datos...')
        
        const { data: vehicles, error } = await supabase
          .from('stock')
          .select('license_plate, model, color, km, price, status')
          .limit(10)
        
        if (!error && vehicles && vehicles.length > 0) {
          realData = vehicles
          contextData = {
            query_type: 'vehicle_search',
            vehicles_found: vehicles,
            message: `Se encontraron ${vehicles.length} vehículos en stock`
          }
          console.log('✅ Vehículos encontrados:', vehicles.length)
        } else {
          console.log('❌ No se encontraron vehículos:', error?.message)
        }
      }
      
    } catch (dbError) {
      console.error('❌ Error en base de datos:', dbError)
    }

    // Generar respuesta del asistente con datos reales
    console.log('🤖 Llamando a generateEdelweissResponse con datos reales...')
    const response = await generateEdelweissResponse(message, [], contextData)

    console.log('✅ Respuesta de OpenAI recibida:', response.substring(0, 100) + '...')
    return NextResponse.json({ response })

  } catch (error) {
    console.error('Error en API de chat:', error)
    
    // Respuesta de fallback en caso de error
    const fallbackResponse = `Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo o verifica la configuración de OpenAI.`
    return NextResponse.json({ response: fallbackResponse })
  }
}

