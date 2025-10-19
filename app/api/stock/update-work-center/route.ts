import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { id, value, item } = body

    if (!id || !value) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const updateData: any = {
      work_center: value,
      updated_at: now,
    }

    // Si no es "Externo", limpiar external_provider
    if (value !== "Externo") {
      updateData.external_provider = null
    }

    // Intentar update normal
    const { data, error } = await supabase
      .from("stock")
      .update(updateData)
      .eq("id", id)
      .select()

    if (error) {
      console.error("❌ [API] Error updating work center:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      // Fallback a upsert
      const upsertPayload = {
        id: item.id,
        license_plate: item.license_plate,
        model: item.model,
        vehicle_type: item.vehicle_type || "Coche",
        reception_date: item.reception_date,
        work_center: value,
        external_provider: item.external_provider,
        expense_charge: item.expense_charge,
        body_status: item.body_status || "pendiente",
        mechanical_status: item.mechanical_status || "pendiente",
        inspection_date: item.inspection_date,
        paint_status: item.paint_status || "pendiente",
        updated_at: now,
      }

      const { data: upsertResult, error: upsertError } = await supabase
        .from("stock")
        .upsert(upsertPayload)
        .select()

      if (upsertError) {
        console.error("❌ [API] Error en upsert:", upsertError)
        return NextResponse.json({ error: upsertError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data: upsertResult[0] })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

