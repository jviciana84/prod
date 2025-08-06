import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, body: message, data = {} } = body

    if (!title || !message) {
      return NextResponse.json(
        {
          error: "title y body son requeridos",
        },
        { status: 400 },
      )
    }

    // Simular una notificación exitosa sin autenticación
    return NextResponse.json({
      message: "Notificación de prueba enviada (modo simple)",
      sent: 1,
      title,
      body: message,
      data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error en notificación simple:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
} 