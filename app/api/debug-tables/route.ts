import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando tablas...')
    
    // Verificar si las tablas existen
    const [sessionsCheck, conversationsCheck] = await Promise.all([
      supabase.from('ai_sessions').select('*').limit(1),
      supabase.from('ai_conversations').select('*').limit(1)
    ])
    
    console.log('Sessions check:', sessionsCheck.error ? sessionsCheck.error.message : 'OK')
    console.log('Conversations check:', conversationsCheck.error ? conversationsCheck.error.message : 'OK')
    
    return NextResponse.json({
      success: true,
      tables: {
        ai_sessions: {
          exists: !sessionsCheck.error,
          error: sessionsCheck.error?.message || null
        },
        ai_conversations: {
          exists: !conversationsCheck.error,
          error: conversationsCheck.error?.message || null
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
