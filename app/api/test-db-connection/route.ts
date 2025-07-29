import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test simple de conexión - contar registros en stock
    const { count, error } = await supabase
      .from('stock')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      return NextResponse.json(
        { error: 'Database connection failed', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        status: 'ok', 
        message: 'Database connection successful',
        recordCount: count || 0,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 