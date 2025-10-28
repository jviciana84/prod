import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') // 'BPS' o 'MN' o null (todos)
    
    let query = supabase
      .from('comparador_scraper')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (source) {
      query = query.eq('source', source)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error consultando comparador:', error)
      return NextResponse.json(
        { error: 'Error consultando datos', details: error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })
    
  } catch (error: any) {
    console.error('Error en get comparador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

