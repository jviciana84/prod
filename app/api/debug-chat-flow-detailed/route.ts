import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { message, userInfo, sessionId } = await request.json()
    
    console.log('🔍 DEBUG CHAT FLOW DETAILED')
    console.log('Message:', message)
    console.log('UserInfo:', userInfo)
    console.log('SessionId:', sessionId)
    
    // Simular el flujo del chat
    const userIdToSave = userInfo?.id
    
    console.log('🔍 USER ID TO SAVE:', userIdToSave)
    
    if (userIdToSave) {
      console.log('✅ ENTRANDO EN GUARDADO')
      
      // Crear sesión
      const { data: newSession, error: sessionError } = await supabase
        .from('ai_sessions')
        .insert({
          user_id: userIdToSave,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select('id')
        .single()

      if (sessionError) {
        console.error('❌ Error creando sesión:', sessionError)
        return NextResponse.json({ 
          error: 'Error creando sesión',
          details: sessionError.message,
          code: sessionError.code
        }, { status: 500 })
      }

      console.log('✅ Sesión creada:', newSession.id)

      // Guardar conversación
      const { data: conversation, error: conversationError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userIdToSave,
          session_id: newSession.id,
          message,
          response: 'Respuesta de prueba',
          context_data: { test: true }
        })
        .select('id, created_at')
        .single()

      if (conversationError) {
        console.error('❌ Error guardando conversación:', conversationError)
        return NextResponse.json({ 
          error: 'Error guardando conversación',
          details: conversationError.message,
          code: conversationError.code
        }, { status: 500 })
      }

      console.log('✅ Conversación guardada:', conversation.id)

      return NextResponse.json({ 
        success: true,
        message: 'Conversación guardada exitosamente',
        sessionId: newSession.id,
        conversationId: conversation.id,
        userIdToSave
      })
    } else {
      console.log('❌ NO SE PUEDE GUARDAR - NO HAY USER ID')
      return NextResponse.json({ 
        success: false,
        message: 'No se puede guardar - no hay userId',
        userInfo,
        sessionId
      })
    }

  } catch (error) {
    console.error('❌ Error en debug chat flow:', error)
    return NextResponse.json({ 
      error: 'Error en debug chat flow',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
