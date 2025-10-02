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
      
      // Buscar usuarios por nombre
      if (query.includes('telefono') || query.includes('teléfono')) {
        console.log('🔍 Buscando usuarios...')
        
        // Extraer nombre del mensaje
        let searchTerm = ''
        if (query.includes('jordi')) searchTerm = 'jordi'
        else if (query.includes('pol')) searchTerm = 'pol'
        else if (query.includes('sara')) searchTerm = 'sara'
        else if (query.includes('javier')) searchTerm = 'javier'
        else if (query.includes('ivan')) searchTerm = 'ivan'
        else if (query.includes('jose')) searchTerm = 'jose'
        else if (query.includes('maria')) searchTerm = 'maria'
        else if (query.includes('jaume')) searchTerm = 'jaume'
        else {
          response = `No se especificó un nombre válido. Usuarios disponibles: Jordi, Pol, Sara, Javier, Ivan, Jose, Maria, Jaume`
          return NextResponse.json({ response })
        }
        
        console.log('🔍 Buscando por:', searchTerm)
        
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('full_name', `%${searchTerm}%`)
          .limit(5)
        
        console.log('🔍 Resultado búsqueda:', { users, error })
        
        if (error) {
          console.error('Error buscando usuarios:', error)
          response = `Error buscando usuarios: ${error.message}`
        } else if (users && users.length > 0) {
          const user = users[0]
          response = `Usuario encontrado: ${user.full_name} - Teléfono: ${user.phone} - Email: ${user.email} - Posición: ${user.position}`
        } else {
          response = `No se encontraron usuarios con el nombre ${searchTerm} en la base de datos.`
        }
      } else {
        response = `Consulta no reconocida. Intenta con: "telefono jordi" o "telefono pol"`
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
