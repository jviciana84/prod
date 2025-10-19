import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { vehicleId, licensePlate } = body

    if (!vehicleId || !licensePlate) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("vehicle_documents")
      .insert({
        vehicle_id: vehicleId,
        license_plate: licensePlate,
        ficha_tecnica_status: "No entregado",
        permiso_circulacion_status: "No entregado",
        contrato_compra_status: "No entregado",
        recibo_compra_status: "No entregado",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Error initializing documents:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

