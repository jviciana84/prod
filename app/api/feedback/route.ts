import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// POST - Guardar feedback
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { conversationId, messageId, feedbackType, feedbackText } = await request.json()

    if (!conversationId || !messageId || !feedbackType) {
      return NextResponse.json({ 
        message: 'Missing required fields: conversationId, messageId, feedbackType' 
      }, { status: 400 })
    }

    if (!['positive', 'negative'].includes(feedbackType)) {
      return NextResponse.json({ 
        message: 'Invalid feedbackType. Must be "positive" or "negative"' 
      }, { status: 400 })
    }

    // Verificar que la conversación pertenece al usuario
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .eq('user_id', session.user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ 
        message: 'Conversation not found or access denied' 
      }, { status: 404 })
    }

    // Verificar si ya existe feedback para este mensaje
    const { data: existingFeedback } = await supabase
      .from('ai_feedback')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('message_id', messageId)
      .eq('user_id', session.user.id)
      .single()

    if (existingFeedback) {
      // Actualizar feedback existente
      const { error } = await supabase
        .from('ai_feedback')
        .update({
          feedback_type: feedbackType,
          feedback_text: feedbackText || null
        })
        .eq('id', existingFeedback.id)

      if (error) throw error

      return NextResponse.json({ 
        message: 'Feedback updated successfully',
        action: 'updated'
      })
    } else {
      // Crear nuevo feedback
      const { error } = await supabase
        .from('ai_feedback')
        .insert({
          conversation_id: conversationId,
          message_id: messageId,
          user_id: session.user.id,
          feedback_type: feedbackType,
          feedback_text: feedbackText || null
        })

      if (error) throw error

      return NextResponse.json({ 
        message: 'Feedback saved successfully',
        action: 'created'
      })
    }

  } catch (error: any) {
    console.error('Error saving feedback:', error.message)
    return NextResponse.json({ 
      message: 'Error saving feedback', 
      error: error.message 
    }, { status: 500 })
  }
}

// GET - Obtener feedback (para administradores)
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verificar si es admin
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', session.user.id)
      .single()

    const isAdmin = userRoleData?.role_id === 'admin' || userRoleData?.role_id === 'administrador'

    if (!isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const feedbackType = searchParams.get('type') // 'positive', 'negative', o null para todos

    const offset = (page - 1) * limit

    let query = supabase
      .from('ai_feedback')
      .select(`
        *,
        ai_conversations!inner(message, response),
        profiles!inner(full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (feedbackType && ['positive', 'negative'].includes(feedbackType)) {
      query = query.eq('feedback_type', feedbackType)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      feedback: data,
      totalCount: count,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    })

  } catch (error: any) {
    console.error('Error fetching feedback:', error.message)
    return NextResponse.json({ 
      message: 'Error fetching feedback', 
      error: error.message 
    }, { status: 500 })
  }
}
