import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando estructura de tablas...')
    
    // Verificar estructura de ai_sessions
    const { data: sessionsSample, error: sessionsError } = await supabase
      .from('ai_sessions')
      .select('*')
      .limit(1)
    
    // Verificar estructura de ai_conversations
    const { data: conversationsSample, error: conversationsError } = await supabase
      .from('ai_conversations')
      .select('*')
      .limit(1)
    
    console.log('Sessions sample:', sessionsSample)
    console.log('Conversations sample:', conversationsSample)
    console.log('Sessions error:', sessionsError)
    console.log('Conversations error:', conversationsError)
    
    return NextResponse.json({
      success: true,
      tables: {
        ai_sessions: {
          sample: sessionsSample,
          error: sessionsError?.message || null,
          columns: sessionsSample?.[0] ? Object.keys(sessionsSample[0]) : []
        },
        ai_conversations: {
          sample: conversationsSample,
          error: conversationsError?.message || null,
          columns: conversationsSample?.[0] ? Object.keys(conversationsSample[0]) : []
        }
      }
    })

  } catch (error) {
    console.error('❌ Error verificando estructura:', error)
    return NextResponse.json({ 
      error: 'Error verificando estructura',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}