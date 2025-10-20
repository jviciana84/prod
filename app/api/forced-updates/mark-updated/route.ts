import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    // Obtener el ID de la actualización forzada
    const { data: forcedUpdate } = await supabaseAdmin
      .from("forced_updates")
      .select("id")
      .single()

    if (!forcedUpdate) {
      return NextResponse.json({ error: "No hay actualización activa" }, { status: 404 })
    }

    // Registrar que el usuario ya actualizó
    const { error } = await supabaseAdmin
      .from("user_forced_updates")
      .upsert({
        user_id: userId,
        forced_update_id: forcedUpdate.id,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error("Error al marcar actualización:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en mark-updated API:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}

