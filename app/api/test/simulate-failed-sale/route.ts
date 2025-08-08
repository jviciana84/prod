import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { license_plate, model, advisor, failed_reason } = body

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

    // Simular actualización en pedidos_validados (esto activará el trigger automáticamente)
    const { data: updatedData, error: updateError } = await supabase
      .from("pedidos_validados")
      .update({
        is_failed_sale: true,
        failed_reason: failed_reason || "Prueba de simulación",
        failed_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("license_plate", license_plate)
      .select()

    if (updateError) {
      console.error("Error actualizando pedidos_validados:", updateError)
      return NextResponse.json(
        { error: "Error simulando venta caída" },
        { status: 500 }
      )
    }

    if (!updatedData || updatedData.length === 0) {
      // Si no existe, crear un registro de prueba
      const { data: insertedData, error: insertError } = await supabase
        .from("pedidos_validados")
        .insert([{
          license_plate: license_plate,
          model: model,
          advisor: advisor,
          advisor_name: advisor,
          is_failed_sale: true,
          failed_reason: failed_reason || "Prueba de simulación",
          failed_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()

      if (insertError) {
        console.error("Error insertando pedido de prueba:", insertError)
        return NextResponse.json(
          { error: "Error creando pedido de prueba" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: "Simulación completada - trigger activado (creado nuevo registro)",
        updated: insertedData?.[0],
        notification: "Las notificaciones deberían haberse enviado automáticamente a Admin/Supervisor/Director"
      })
    }

    return NextResponse.json({
      message: "Simulación completada - trigger activado",
      updated: updatedData?.[0],
      notification: "Las notificaciones deberían haberse enviado automáticamente a Admin/Supervisor/Director"
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
