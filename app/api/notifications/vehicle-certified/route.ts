import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      license_plate, 
      model, 
      advisor, 
      advisor_id,
      or_value,
      certified_at 
    } = body

    if (!license_plate || !advisor) {
      return NextResponse.json(
        { error: "license_plate y advisor son requeridos" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar el asesor en profiles para obtener su user_id
    const { data: asesorProfile, error: asesorError } = await supabase
      .from("profiles")
      .select("id, full_name, alias")
      .or(`full_name.ilike.${advisor},alias.ilike.${advisor}`)
      .single()

    if (asesorError || !asesorProfile) {
      console.error("Error encontrando asesor:", asesorError)
      return NextResponse.json(
        { error: "Asesor no encontrado" },
        { status: 404 }
      )
    }

    // Crear la notificación
    const notification = {
      user_id: asesorProfile.id,
      title: "🚗 Vehículo Certificado",
      body: `El vehículo ${license_plate} (${model}) ha sido certificado y está listo para entrega`,
      data: {
        category: "vehicle_certified",
        url: "/dashboard/entregas",
        license_plate,
        model,
        advisor,
        or_value,
        certified_at: certified_at || new Date().toISOString()
      },
      created_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase
      .from("notification_history")
      .insert([notification])

    if (insertError) {
      console.error("Error insertando notificación:", insertError)
      return NextResponse.json(
        { error: "Error guardando notificación" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Notificación de vehículo certificado enviada",
      sent: 1,
      asesor: asesorProfile.full_name || asesorProfile.alias,
      vehicle: license_plate
    })

  } catch (error) {
    console.error("Error enviando notificación de vehículo certificado:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
