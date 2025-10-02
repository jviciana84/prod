import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: sessions, error } = await supabase
      .from('ai_sessions')
      .select('id, title, last_message_at, created_at')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo sesiones:', error)
      return NextResponse.json(
        { error: 'Error obteniendo sesiones' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions })

  } catch (error) {
    console.error('Error en API de sesiones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

