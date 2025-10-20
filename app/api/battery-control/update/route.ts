import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/**
 * API Route para actualizar registros de control de baterías
 * Método: POST
 * Body: { id, data: { charge_percentage, status, is_charging, observations } }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient(await cookies())

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del body
    const body = await request.json()
    const { id, data } = body

    if (!id || !data) {
      return NextResponse.json({ error: "ID y datos son requeridos" }, { status: 400 })
    }

    // Validar charge_percentage si viene
    if (data.charge_percentage !== undefined) {
      const percentage = parseInt(data.charge_percentage)
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        return NextResponse.json({ error: "El porcentaje debe estar entre 0 y 100" }, { status: 400 })
      }
    }

    // Validar status si viene
    if (data.status !== undefined && !["pendiente", "revisado"].includes(data.status)) {
      return NextResponse.json({ error: "Estado inválido. Debe ser 'pendiente' o 'revisado'" }, { status: 400 })
    }

    // Si el estado cambia, validar lógica: pendiente no puede tener is_charging = true
    if (data.status === "pendiente" && data.is_charging === true) {
      return NextResponse.json(
        { error: "Un vehículo pendiente no puede estar cargando" },
        { status: 400 }
      )
    }

    // Preparar datos para actualizar
    const updateData: any = {
      ...data,
      updated_by: user.id, // Registrar quién actualiza (oculto para usuarios)
    }

    // Si el estado cambia a 'revisado', registrar la fecha
    if (data.status === "revisado") {
      updateData.status_date = new Date().toISOString()
    }

    // Realizar actualización
    const { data: updatedRecord, error: updateError } = await supabase
      .from("battery_control")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Error actualizando battery_control:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log("✅ Registro de batería actualizado:", id)

    return NextResponse.json({
      success: true,
      data: updatedRecord,
    })
  } catch (error) {
    console.error("❌ Error inesperado en battery-control/update:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

