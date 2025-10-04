import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeHidden = searchParams.get('includeHidden') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)
    
    // Verificar autenticación del usuario
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Construir la consulta base
    let query = supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    // Aplicar filtro de visibilidad
    if (!includeHidden) {
      query = query.eq('is_hidden', false)
    }

    // Aplicar búsqueda si se proporciona
    if (search) {
      query = query.or(`message.ilike.%${search}%,response.ilike.%${search}%`)
    }

    // Aplicar paginación
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: conversations, error, count } = await query

    if (error) {
      console.error('Error obteniendo conversaciones:', error)
      return NextResponse.json(
        { error: 'Error obteniendo conversaciones' },
        { status: 500 }
      )
    }

    // Obtener el total de conversaciones (sin paginación)
    let countQuery = supabase
      .from('ai_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (!includeHidden) {
      countQuery = countQuery.eq('is_hidden', false)
    }

    if (search) {
      countQuery = countQuery.or(`message.ilike.%${search}%,response.ilike.%${search}%`)
    }

    const { count: totalCount } = await countQuery

    return NextResponse.json({
      conversations: conversations || [],
      totalCount: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit)
    })

  } catch (error) {
    console.error('Error en user conversations:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
