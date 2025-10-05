import { NextRequest, NextResponse } from 'next/server'
import { generateEdelweissResponse } from '@/lib/openai-config'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json()

    console.log('📝 Mensaje recibido:', message)
    console.log('📚 Historial de conversación:', conversationHistory.length, 'mensajes')

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje es requerido' },
        { status: 400 }
      )
    }

    // Verificar si hay API key de OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No hay API key de OpenAI')
      const response = `**⚠️ Configuración Requerida**

Hola! Recibí tu mensaje: "${message}". Soy Edelweiss, tu asistente de IA.

**Para usar las funciones completas:**
Necesitas configurar la API key de OpenAI en las variables de entorno.

**Contacto técnico:**
Jordi Viciana - jordi.viciana@quadis.es`
      return NextResponse.json({ response })
    }

    console.log('✅ API key encontrada, procesando consulta...')

    // Buscar datos en la base de datos
    let contextData = null
    
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
      
      console.log('🔍 Analizando consulta:', query)
      
      // Detectar tipo de consulta y buscar datos relevantes
      if (query.includes('matrícula') || query.includes('matricula') || /[A-Z0-9]{4,8}[A-Z]{2,3}/.test(message)) {
        console.log('🔍 Búsqueda por matrícula detectada')
        
        // Buscar por matrícula en todas las tablas
        const matriculaMatch = message.match(/\b[A-Z0-9]{4,8}[A-Z]{2,3}\b/g)
        if (matriculaMatch) {
          const matricula = matriculaMatch[0]
          
          const [stockResult, salesResult, entregasResult] = await Promise.all([
            supabase.from('stock').select('*').or(`matricula.ilike.%${matricula}%,license_plate.ilike.%${matricula}%`),
            supabase.from('sales_vehicles').select('*').or(`license_plate.ilike.%${matricula}%,matricula.ilike.%${matricula}%`),
            supabase.from('entregas').select('*').ilike('matricula', `%${matricula}%`)
          ])
          
          contextData = {
            query_type: 'matricula_search',
            matricula: matricula,
            stock: stockResult.data || [],
            sales: salesResult.data || [],
            entregas: entregasResult.data || [],
            total_found: (stockResult.data?.length || 0) + (salesResult.data?.length || 0) + (entregasResult.data?.length || 0)
          }
        }
      }
      else if (query.includes('stock') || query.includes('vehículo') || query.includes('vehiculo') || query.includes('coche')) {
        console.log('🔍 Consulta de stock detectada')
        
        const { data: vehicles, error } = await supabase
          .from('stock')
          .select('*')
          .limit(20)
        
        if (!error && vehicles) {
          contextData = {
            query_type: 'stock_search',
            vehicles: vehicles,
            total_found: vehicles.length
          }
        }
      }
      else if (query.includes('venta') || query.includes('vendido') || query.includes('asesor') || query.includes('jordi') || query.includes('pol') || query.includes('rodrigo')) {
        console.log('🔍 Consulta de ventas detectada')
        
        const { data: sales, error } = await supabase
          .from('sales_vehicles')
          .select('*')
          .order('sale_date', { ascending: false })
          .limit(20)
        
        if (!error && sales) {
          contextData = {
            query_type: 'sales_search',
            sales: sales,
            total_found: sales.length
          }
        }
      }
      else if (query.includes('teléfono') || query.includes('telefono') || query.includes('contacto') || query.includes('email') || 
               query.includes('sara') || query.includes('mendoza') || query.includes('jordi') || query.includes('pol') || 
               query.includes('rodrigo') || query.includes('javier') || query.includes('ivan') || query.includes('jose') || 
               query.includes('maria') || query.includes('jaume') || query.includes('ferran')) {
        console.log('🔍 Consulta de contactos detectada')
        
        // Extraer nombres del mensaje para búsqueda específica
        const searchTerms = message.toLowerCase().split(' ').filter(word => 
          word.length > 2 && !['teléfono', 'telefono', 'contacto', 'email', 'dime', 'el', 'de', 'la', 'del'].includes(word)
        )
        
        let searchQuery = ''
        if (searchTerms.length > 0) {
          // Crear consulta de búsqueda por nombre
          searchQuery = searchTerms.map(term => `full_name.ilike.%${term}%`).join(',')
        }
        
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .or(searchQuery || 'full_name.ilike.%sara%')
          .limit(10)
        
        if (!error && users) {
          contextData = {
            query_type: 'contact_search',
            users: users,
            total_found: users.length,
            search_terms: searchTerms
          }
        }
      }
      
      console.log('📊 ContextData obtenido:', contextData ? 'Sí' : 'No')
      
    } catch (dbError) {
      console.error('❌ Error en base de datos:', dbError)
    }

    // Generar respuesta con OpenAI
    console.log('🤖 Generando respuesta con OpenAI...')
    const response = await generateEdelweissResponse(message, conversationHistory, contextData)

    console.log('✅ Respuesta generada exitosamente')
    return NextResponse.json({ response })

  } catch (error) {
    console.error('❌ Error en API de chat:', error)
    
    const fallbackResponse = `**⚠️ Error del Sistema**

Lo siento, hubo un error al procesar tu consulta.

**Detalles del error:**
${error instanceof Error ? error.message : 'Error desconocido'}

**Solución:**
Inténtalo de nuevo o contacta a Jordi Viciana en jordi.viciana@quadis.es`
    
    return NextResponse.json({ response: fallbackResponse })
  }
}