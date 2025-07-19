import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configurar Supabase client sin autenticación
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST: Recibir logs del scraper (sin autenticación)
export async function POST(request: NextRequest) {
  try {
    const { level, message, scraper_run_id } = await request.json()
    
    // Validar datos
    if (!level || !message) {
      return NextResponse.json(
        { error: 'level y message son requeridos' },
        { status: 400 }
      )
    }

    if (!['info', 'success', 'warning', 'error'].includes(level)) {
      return NextResponse.json(
        { error: 'level debe ser: info, success, warning, error' },
        { status: 400 }
      )
    }

    console.log(`📝 Recibiendo log: [${level}] ${message}`)

    // Insertar log en la base de datos
    const { data, error } = await supabase
      .from('scraper_logs')
      .insert({
        level,
        message,
        scraper_run_id: scraper_run_id || null
      })
      .select()

    if (error) {
      console.error('Error al insertar log:', error)
      return NextResponse.json(
        { error: 'Error al guardar log', details: error.message },
        { status: 500 }
      )
    }

    console.log(`✅ Log guardado: ${data[0].id}`)
    return NextResponse.json({ success: true, log: data[0] })

  } catch (error) {
    console.error('Error en POST /api/scraper-logs-public:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET: Obtener logs para la consola (sin autenticación)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const run_id = searchParams.get('run_id')

    let query = supabase
      .from('scraper_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtrar por run_id si se proporciona
    if (run_id) {
      query = query.eq('scraper_run_id', run_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener logs:', error)
      return NextResponse.json(
        { error: 'Error al obtener logs', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      logs: data || [],
      count: data?.length || 0,
      hasMore: (data?.length || 0) === limit
    })

  } catch (error) {
    console.error('Error en GET /api/scraper-logs-public:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 