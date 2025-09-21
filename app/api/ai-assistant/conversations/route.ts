import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Obtener conversaciones de un usuario
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const action = searchParams.get('action')

    if (action === 'sessions') {
      // Obtener todas las sesiones del usuario
      const { data: sessions, error: sessionsError } = await supabase
        .rpc('get_user_sessions', { user_uuid: user.id })

      if (sessionsError) {
        console.error('Error obteniendo sesiones:', sessionsError)
        return NextResponse.json({ error: 'Error obteniendo sesiones' }, { status: 500 })
      }

      return NextResponse.json({ sessions })
    }

    if (sessionId) {
      // Obtener historial de una sesión específica
      const { data: history, error: historyError } = await supabase
        .rpc('get_conversation_history', { session_uuid: sessionId })

      if (historyError) {
        console.error('Error obteniendo historial:', historyError)
        return NextResponse.json({ error: 'Error obteniendo historial' }, { status: 500 })
      }

      return NextResponse.json({ history })
    }

    return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 })

  } catch (error) {
    console.error('Error en GET conversations:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Crear nueva conversación
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { message, response, sessionId, contextData } = await request.json()

    if (!message || !response) {
      return NextResponse.json({ error: 'Mensaje y respuesta requeridos' }, { status: 400 })
    }

    // Si no hay sessionId, crear una nueva sesión
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('ai_sessions')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select('id')
        .single()

      if (sessionError) {
        console.error('Error creando sesión:', sessionError)
        return NextResponse.json({ error: 'Error creando sesión' }, { status: 500 })
      }

      currentSessionId = newSession.id
    }

    // Guardar la conversación
    const { data: conversation, error: conversationError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        session_id: currentSessionId,
        message,
        response,
        context_data: contextData
      })
      .select('id, created_at')
      .single()

    if (conversationError) {
      console.error('Error guardando conversación:', conversationError)
      return NextResponse.json({ error: 'Error guardando conversación' }, { status: 500 })
    }

    // Actualizar la fecha de último mensaje de la sesión
    await supabase
      .from('ai_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', currentSessionId)

    return NextResponse.json({ 
      conversationId: conversation.id,
      sessionId: currentSessionId,
      createdAt: conversation.created_at
    })

  } catch (error) {
    console.error('Error en POST conversations:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Eliminar conversación o sesión
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const conversationId = searchParams.get('conversationId')
    const action = searchParams.get('action')

    if (action === 'cleanup') {
      // Limpiar conversaciones antiguas
      const { error: cleanupError } = await supabase
        .rpc('cleanup_old_conversations')

      if (cleanupError) {
        console.error('Error limpiando conversaciones:', cleanupError)
        return NextResponse.json({ error: 'Error limpiando conversaciones' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Conversaciones antiguas eliminadas' })
    }

    if (sessionId) {
      // Eliminar toda la sesión
      const { error: deleteError } = await supabase
        .from('ai_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error eliminando sesión:', deleteError)
        return NextResponse.json({ error: 'Error eliminando sesión' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Sesión eliminada' })
    }

    if (conversationId) {
      // Eliminar conversación específica
      const { error: deleteError } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error eliminando conversación:', deleteError)
        return NextResponse.json({ error: 'Error eliminando conversación' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Conversación eliminada' })
    }

    return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 })

  } catch (error) {
    console.error('Error en DELETE conversations:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
