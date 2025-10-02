import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje es requerido' },
        { status: 400 }
      )
    }

    // Respuesta de prueba sin OpenAI
    const response = `Hola! Recibí tu mensaje: "${message}". Soy Edelweiss, tu asistente de IA. ¿En qué puedo ayudarte con la gestión de vehículos BMW?`

    return NextResponse.json({ response })

  } catch (error) {
    console.error('Error en API de chat:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

