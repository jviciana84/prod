import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando información de tablas...')
    
    // Verificar si las tablas existen y obtener información
    const [sessionsInfo, conversationsInfo] = await Promise.all([
      supabase.from('ai_sessions').select('*').limit(0),
      supabase.from('ai_conversations').select('*').limit(0)
    ])
    
    console.log('Sessions info:', sessionsInfo)
    console.log('Conversations info:', conversationsInfo)
    
    return NextResponse.json({
      success: true,
      tables: {
        ai_sessions: {
          exists: !sessionsInfo.error,
          error: sessionsInfo.error?.message || null,
          code: sessionsInfo.error?.code || null
        },
        ai_conversations: {
          exists: !conversationsInfo.error,
          error: conversationsInfo.error?.message || null,
          code: conversationsInfo.error?.code || null
        }
      }
    })

  } catch (error) {
    console.error('❌ Error verificando tablas:', error)
    return NextResponse.json({ 
      error: 'Error verificando tablas',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
