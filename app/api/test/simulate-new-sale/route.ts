import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { license_plate, model, advisor, sale_price, discount, client_name } = body

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

    // Simular inserción en sales_vehicles (esto activará el trigger automáticamente)
    const { data: insertedData, error: insertError } = await supabase
      .from("sales_vehicles")
      .insert([{
        license_plate: license_plate.toUpperCase(),
        model: model,
        advisor: advisor,
        sale_date: new Date().toISOString(),
        sale_price: sale_price || 45000,
        discount: discount || 2000,
        client_name: client_name || "Cliente Prueba",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()

    if (insertError) {
      console.error("Error insertando venta de prueba:", insertError)
      return NextResponse.json(
        { error: "Error simulando nueva venta" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Simulación completada - trigger activado",
      inserted: insertedData?.[0],
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
