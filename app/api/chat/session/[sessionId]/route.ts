import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId es requerido' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: messages, error } = await supabase
      .from('ai_conversations')
      .select('message, response, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error obteniendo mensajes:', error)
      return NextResponse.json(
        { error: 'Error obteniendo mensajes' },
        { status: 500 }
      )
    }

    // Convertir a formato del chat
    const chatMessages = messages?.map((msg, index) => [
      {
        id: `${sessionId}-${index}-user`,
        text: msg.message,
        isUser: true,
        timestamp: new Date(msg.created_at)
      },
      {
        id: `${sessionId}-${index}-ai`,
        text: msg.response,
        isUser: false,
        timestamp: new Date(msg.created_at)
      }
    ]).flat() || []

    return NextResponse.json({ messages: chatMessages })

  } catch (error) {
    console.error('Error en API de sesión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

