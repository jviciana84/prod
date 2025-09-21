import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, message, response } = await request.json()
    
    console.log('🔍 TESTING SAVE CONVERSATION')
    console.log('UserId:', userId)
    console.log('Message:', message)
    console.log('Response:', response?.substring(0, 50))
    
    // Crear sesión
    const { data: newSession, error: sessionError } = await supabase
      .from('ai_sessions')
      .insert({
        user_id: userId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
      })
      .select('id')
      .single()

    if (sessionError) {
      console.error('❌ Error creando sesión:', sessionError)
      return NextResponse.json({ 
        error: 'Error creando sesión',
        details: sessionError.message 
      }, { status: 500 })
    }

    console.log('✅ Sesión creada:', newSession.id)

    // Guardar conversación
    const { data: conversation, error: conversationError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        session_id: newSession.id,
        message,
        response,
        context_data: { test: true, timestamp: new Date().toISOString() }
      })
      .select('id, created_at')
      .single()

    if (conversationError) {
      console.error('❌ Error guardando conversación:', conversationError)
      return NextResponse.json({ 
        error: 'Error guardando conversación',
        details: conversationError.message 
      }, { status: 500 })
    }

    console.log('✅ Conversación guardada:', conversation.id)

    return NextResponse.json({ 
      success: true,
      sessionId: newSession.id,
      conversationId: conversation.id,
      createdAt: conversation.created_at
    })

  } catch (error) {
    console.error('❌ Error en test save:', error)
    return NextResponse.json({ 
      error: 'Error en test save',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
