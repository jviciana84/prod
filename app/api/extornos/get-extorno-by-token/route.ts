import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({
        success: false,
        message: "Token de confirmación requerido",
      }, { status: 400 })
    }

    console.log("🔍 Obteniendo datos del extorno con token:", token)

    // Buscar el extorno por token
    const { data: extorno, error } = await supabase
      .from("extornos")
      .select("*")
      .eq("confirmation_token", token)
      .eq("estado", "tramitado")
      .single()

    if (error || !extorno) {
      console.error("❌ Error obteniendo extorno:", error)
      return NextResponse.json({
        success: false,
        message: "Token no válido o extorno no encontrado",
      }, { status: 404 })
    }

    console.log("✅ Extorno encontrado:", extorno.id)

    return NextResponse.json({
      success: true,
      extorno: {
        id: extorno.id,
        matricula: extorno.matricula,
        cliente: extorno.cliente,
        numero_cliente: extorno.numero_cliente,
        concepto: extorno.concepto,
        importe: extorno.importe,
        numero_cuenta: extorno.numero_cuenta,
        concesion: extorno.concesion,
        estado: extorno.estado,
        fecha_solicitud: extorno.fecha_solicitud,
        created_at: extorno.created_at,
      },
    })

  } catch (error) {
    console.error("❌ Error crítico en get-extorno-by-token:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
    }, { status: 500 })
  }
} 