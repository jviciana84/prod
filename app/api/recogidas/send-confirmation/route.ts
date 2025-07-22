import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { matricula, email, materiales, nombre_cliente, nombre_recoge, dni_recoge, email_recoge, usuario_solicitante } = body

    if (!matricula || !email || !materiales || materiales.length === 0 || !nombre_recoge) {
      return NextResponse.json({ 
        success: false, 
        error: "Datos incompletos" 
      }, { status: 400 })
    }

    // Generar token único para la confirmación
    const token = randomBytes(32).toString('hex')

    // Guardar la solicitud de entrega en mano en la base de datos
    const { data: entregaData, error: entregaError } = await supabase
      .from("entregas_en_mano")
      .insert([{
        matricula: matricula,
        email_cliente: email,
        materiales: materiales,
        nombre_cliente: nombre_cliente,
        nombre_recoge: nombre_recoge,
        dni_recoge: dni_recoge,
        email_recoge: email_recoge,
        usuario_solicitante: usuario_solicitante,
        token_confirmacion: token,
        estado: "pendiente",
        fecha_solicitud: new Date().toISOString()
      }])
      .select()
      .single()

    if (entregaError) {
      console.error("Error guardando entrega en mano:", entregaError)
      return NextResponse.json({ 
        success: false, 
        error: "Error guardando la solicitud" 
      }, { status: 500 })
    }

    // TODO: Enviar email con el token de confirmación
    // Por ahora solo simulamos el envío
    console.log("Email de confirmación enviado a:", email)
    console.log("Token de confirmación:", token)

    return NextResponse.json({
      success: true,
      message: "Confirmación enviada correctamente",
      data: {
        id: entregaData.id,
        token: token
      }
    })

  } catch (error) {
    console.error("Error enviando confirmación:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
} 