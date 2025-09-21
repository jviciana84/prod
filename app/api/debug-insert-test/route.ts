import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 TESTING INSERT...')
    
    // Probar insertar en ai_sessions
    const { data: sessionData, error: sessionError } = await supabase
      .from('ai_sessions')
      .insert({
        user_id: 'test-user-insert',
        title: 'Test Session'
      })
      .select('id')
      .single()

    if (sessionError) {
      console.error('❌ Error insertando sesión:', sessionError)
      return NextResponse.json({ 
        error: 'Error insertando sesión',
        details: sessionError.message,
        code: sessionError.code,
        hint: sessionError.hint
      }, { status: 500 })
    }

    console.log('✅ Sesión insertada:', sessionData.id)

    // Probar insertar en ai_conversations
    const { data: conversationData, error: conversationError } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: 'test-user-insert',
        session_id: sessionData.id,
        message: 'Test message',
        response: 'Test response',
        context_data: { test: true }
      })
      .select('id')
      .single()

    if (conversationError) {
      console.error('❌ Error insertando conversación:', conversationError)
      return NextResponse.json({ 
        error: 'Error insertando conversación',
        details: conversationError.message,
        code: conversationError.code,
        hint: conversationError.hint
      }, { status: 500 })
    }

    console.log('✅ Conversación insertada:', conversationData.id)

    return NextResponse.json({ 
      success: true,
      sessionId: sessionData.id,
      conversationId: conversationData.id
    })

  } catch (error) {
    console.error('❌ Error en insert test:', error)
    return NextResponse.json({ 
      error: 'Error en insert test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
