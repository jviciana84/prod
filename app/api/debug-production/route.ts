import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
        serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
      },
      site: {
        url: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET'
      },
      cookies: {
        hasCookies: request.headers.get('cookie') ? 'YES' : 'NO',
        cookieCount: request.headers.get('cookie')?.split(';').length || 0
      }
    }

    // Probar autenticación
    try {
      const supabase = await createServerClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      debug.auth = {
        hasUser: !!user,
        userId: user?.id || null,
        error: error?.message || null,
        success: !error && !!user
      }
    } catch (authError) {
      debug.auth = {
        error: authError instanceof Error ? authError.message : 'Unknown error',
        success: false
      }
    }

    // Probar conexión a base de datos
    try {
      const supabase = await createServerClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      debug.database = {
        connected: !error,
        error: error?.message || null,
        success: !error
      }
    } catch (dbError) {
      debug.database = {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        success: false
      }
    }

    return NextResponse.json({
      success: true,
      debug,
      status: 'OK'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
