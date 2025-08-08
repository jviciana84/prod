import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { license_plate, model, advisor, or_value } = body

    if (!license_plate || !model || !advisor) {
      return NextResponse.json(
        { error: "license_plate, model y advisor son requeridos" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Simular inserción en entregas (esto activará el trigger automáticamente)
    const { data: insertedData, error: insertError } = await supabase
      .from("entregas")
      .insert([{
        fecha_venta: new Date().toISOString(),
        fecha_entrega: null,
        matricula: license_plate,
        modelo: model,
        asesor: advisor,
        or: or_value || "",
        incidencia: false,
        observaciones: "Simulación de certificación automática",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()

    if (insertError) {
      console.error("Error insertando en entregas:", insertError)
      return NextResponse.json(
        { error: "Error simulando certificación" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Simulación completada - trigger activado",
      inserted: insertedData?.[0],
      notification: "La notificación debería haberse enviado automáticamente al asesor"
    })

  } catch (error) {
    console.error("Error en simulación:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
