import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { vehicleId, documentType, fromUserId, toUserId, deliveryDate, notes } = body

    if (!vehicleId || !documentType || !fromUserId || !toUserId) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    // Calcular deadline (24 horas)
    const confirmationDeadline = new Date()
    confirmationDeadline.setHours(confirmationDeadline.getHours() + 24)

    // Registrar movimiento
    const { error: movementError } = await supabase.from("document_movements").insert({
      vehicle_id: vehicleId,
      document_type: documentType,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      delivery_date: deliveryDate,
      notes: notes || "",
      status: "Pendiente",
      confirmation_deadline: confirmationDeadline.toISOString(),
      created_at: new Date().toISOString(),
    })

    if (movementError) {
      console.error("❌ [API] Error creating movement:", movementError)
      return NextResponse.json({ error: movementError.message }, { status: 500 })
    }

    // Actualizar vehicle_documents
    const updateData: Record<string, any> = {
      [`${documentType}_status`]: "Entregado",
      [`${documentType}_holder`]: toUserId,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("vehicle_documents")
      .update(updateData)
      .eq("vehicle_id", vehicleId)

    if (updateError) {
      console.error("❌ [API] Error updating vehicle documents:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

