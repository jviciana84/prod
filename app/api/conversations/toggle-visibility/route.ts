import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, isHidden } = await request.json()
    
    if (!conversationId || typeof isHidden !== 'boolean') {
      return NextResponse.json(
        { error: 'conversationId y isHidden son requeridos' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)
    
    // Verificar autenticación del usuario
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que la conversación pertenece al usuario actual
    const { data: conversation, error: fetchError } = await supabase
      .from('ai_conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single()

    if (fetchError) {
      console.error('Error obteniendo conversación:', fetchError)
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el usuario es el propietario de la conversación
    if (conversation.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta conversación' },
        { status: 403 }
      )
    }

    // Actualizar el estado de visibilidad
    const { error: updateError } = await supabase
      .from('ai_conversations')
      .update({ is_hidden: isHidden })
      .eq('id', conversationId)
      .eq('user_id', session.user.id) // Doble verificación de seguridad

    if (updateError) {
      console.error('Error actualizando visibilidad:', updateError)
      return NextResponse.json(
        { error: 'Error actualizando la conversación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: isHidden ? 'Conversación ocultada' : 'Conversación restaurada',
      isHidden
    })

  } catch (error) {
    console.error('Error en toggle-visibility:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
