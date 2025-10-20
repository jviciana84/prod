import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isActive, message, userId } = body

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    // Verificar que el usuario es admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (!profile || !profile.role || !profile.role.toLowerCase().includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener el ID de forced_updates (solo hay un registro)
    const { data: forcedUpdateRecord } = await supabaseAdmin
      .from("forced_updates")
      .select("id")
      .single()

    if (!forcedUpdateRecord) {
      return NextResponse.json({ error: "No se encontró registro de forced_updates" }, { status: 404 })
    }

    // Si se está desactivando, limpiar todos los registros de user_forced_updates
    if (!isActive) {
      const { error: deleteError } = await supabaseAdmin
        .from("user_forced_updates")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Eliminar todos los registros
      
      if (deleteError) {
        console.error("Error al limpiar user_forced_updates:", deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    }

    // Actualizar el estado de forced_updates
    const { data, error } = await supabaseAdmin
      .from("forced_updates")
      .update({
        is_active: isActive,
        activated_at: isActive ? new Date().toISOString() : null,
        activated_by: isActive ? userId : null,
        message: message || "Actualización del sistema requerida",
        updated_at: new Date().toISOString()
      })
      .eq("id", forcedUpdateRecord.id)
      .select()
      .single()

    if (error) {
      console.error("Error al actualizar forced_updates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const actionMessage = isActive 
      ? "Actualización forzada activada" 
      : "Actualización desactivada y registros limpiados"

    return NextResponse.json({ success: true, data, message: actionMessage })
  } catch (error) {
    console.error("Error en force-update API:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}

