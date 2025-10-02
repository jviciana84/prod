import { NextRequest, NextResponse } from 'next/server'
import { generateEdelweissResponse, getDatabaseContext } from '@/lib/openai-config'
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

    // Obtener contexto de la base de datos
    console.log('🔍 Obteniendo contexto de la base de datos...')
    const contextData = await getDatabaseContext('ai-user', message)
    console.log('📊 Contexto obtenido:', contextData ? 'Sí' : 'No')

    // Obtener historial de conversación
    console.log('💬 Obteniendo historial de conversación...')
    const supabase = createClient()
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
    const response = await generateEdelweissResponse(message, history, contextData)

    console.log('✅ Respuesta de OpenAI recibida:', response.substring(0, 100) + '...')

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

    return NextResponse.json({ response })

  } catch (error) {
    console.error('Error en API de chat:', error)
    
    // Respuesta de fallback en caso de error
    const fallbackResponse = `Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo o verifica la configuración de OpenAI.`
    return NextResponse.json({ response: fallbackResponse })
  }
}
