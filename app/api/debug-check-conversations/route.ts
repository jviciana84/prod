import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando conversaciones guardadas...')
    
    // Verificar sesiones
    const { data: sessions, error: sessionsError } = await supabase
      .from('ai_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (sessionsError) {
      console.error('❌ Error obteniendo sesiones:', sessionsError)
      return NextResponse.json({ 
        error: 'Error obteniendo sesiones',
        details: sessionsError.message 
      }, { status: 500 })
    }
    
    // Verificar conversaciones
    const { data: conversations, error: conversationsError } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (conversationsError) {
      console.error('❌ Error obteniendo conversaciones:', conversationsError)
      return NextResponse.json({ 
        error: 'Error obteniendo conversaciones',
        details: conversationsError.message 
      }, { status: 500 })
    }
    
    console.log('✅ Sesiones encontradas:', sessions?.length || 0)
    console.log('✅ Conversaciones encontradas:', conversations?.length || 0)
    
    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      conversations: conversations || [],
      counts: {
        sessions: sessions?.length || 0,
        conversations: conversations?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ Error verificando conversaciones:', error)
    return NextResponse.json({ 
      error: 'Error verificando conversaciones',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
