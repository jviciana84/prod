import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Función para obtener información del usuario actual
async function getCurrentUserInfo() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('No hay usuario autenticado en getCurrentUserInfo:', error?.message)
      return null
    }

    console.log('✅ Usuario encontrado en getCurrentUserInfo:', user.id)

    // Obtener perfil completo del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role, position, phone, email, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error obteniendo perfil en getCurrentUserInfo:', profileError)
      // Devolver usuario básico si no se puede obtener el perfil
      return {
        id: user.id,
        email: user.email,
        name: user.email?.split('@')[0] || 'Usuario',
        role: 'usuario'
      }
    }

    console.log('✅ Perfil obtenido en getCurrentUserInfo:', profile.full_name, profile.role)

    return {
      id: user.id,
      email: user.email,
      name: profile.full_name || user.email?.split('@')[0] || 'Usuario',
      role: profile.role || 'usuario',
      position: profile.position,
      phone: profile.phone,
      avatar_url: profile.avatar_url
    }
  } catch (error) {
    console.error('Error en getCurrentUserInfo:', error)
    return null
  }
}

// Obtener conversaciones de un usuario
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserInfo()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const action = searchParams.get('action')

    if (action === 'sessions') {
      let sessions
      let sessionsError

      if (currentUser.role === 'admin') {
        // Si es admin, obtener todas las sesiones de todos los usuarios
        const supabase = await createServerClient()
        const { data: sessionsData, error: sessionsDataError } = await supabase
          .from('ai_sessions')
          .select('id, title, created_at, last_message_at, user_id')
          .order('last_message_at', { ascending: false })

        if (sessionsDataError) {
          sessions = null
          sessionsError = sessionsDataError
        } else if (sessionsData && sessionsData.length > 0) {
          // Obtener información de usuarios
          const userIds = [...new Set(sessionsData.map(s => s.user_id))]
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, position, avatar_url')
            .in('id', userIds)

          if (profilesError) {
            sessions = sessionsData
            sessionsError = profilesError
          } else {
            sessions = sessionsData.map(session => ({
              ...session,
              profiles: profiles?.find(p => p.id === session.user_id)
            }))
            sessionsError = null
          }
        } else {
          sessions = []
          sessionsError = null
        }
      } else {
        // Si no es admin, solo sus propias sesiones
        const supabase = await createServerClient()
        const { data: sessionsData, error: sessionsDataError } = await supabase
          .from('ai_sessions')
          .select('id, title, created_at, last_message_at, user_id')
          .eq('user_id', currentUser.id)
          .order('last_message_at', { ascending: false })

        if (sessionsDataError) {
          sessions = null
          sessionsError = sessionsDataError
        } else if (sessionsData && sessionsData.length > 0) {
          // Agregar información del perfil del usuario actual
          sessions = sessionsData.map(session => ({
            ...session,
            profiles: {
              id: currentUser.id,
              full_name: currentUser.name,
              email: currentUser.email,
              role: currentUser.role,
              position: currentUser.position,
              avatar_url: currentUser.avatar_url
            }
          }))
          sessionsError = null
        } else {
          sessions = []
          sessionsError = null
        }
      }

      if (sessionsError) {
        console.error('Error obteniendo sesiones:', sessionsError)
        console.error('User ID:', currentUser.id)
        return NextResponse.json({ 
          error: 'Error obteniendo sesiones',
          details: sessionsError.message,
          userId: currentUser.id
        }, { status: 500 })
      }

      console.log('Sesiones obtenidas:', sessions?.length || 0)
      return NextResponse.json({ sessions: sessions || [] })
    }

    if (sessionId) {
      // Obtener historial de una sesión específica
      let history
      let historyError

      if (currentUser.role === 'admin') {
        // Si es admin, puede ver el historial de cualquier sesión
        const supabase = await createServerClient()
        const { data: conversationsData, error: conversationsDataError } = await supabase
          .from('ai_conversations')
          .select('id, message, response, created_at, user_id')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })

        if (conversationsDataError) {
          history = null
          historyError = conversationsDataError
        } else if (conversationsData && conversationsData.length > 0) {
          // Obtener información de usuarios
          const userIds = [...new Set(conversationsData.map(c => c.user_id))]
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .in('id', userIds)

          if (profilesError) {
            history = conversationsData
            historyError = profilesError
          } else {
            history = conversationsData.map(conversation => ({
              ...conversation,
              profiles: profiles?.find(p => p.id === conversation.user_id)
            }))
            historyError = null
          }
        } else {
          history = []
          historyError = null
        }
      } else {
        // Si no es admin, solo puede ver sus propias conversaciones
        const supabase = await createServerClient()
        const { data, error } = await supabase
          .rpc('get_conversation_history', { session_uuid: sessionId })

        history = data
        historyError = error
      }

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
    const supabase = await createServerClient()
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
          user_id: currentUser.id,
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
        user_id: currentUser.id,
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
    const supabase = await createServerClient()
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
        .eq('user_id', currentUser.id)

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
        .eq('user_id', currentUser.id)

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
