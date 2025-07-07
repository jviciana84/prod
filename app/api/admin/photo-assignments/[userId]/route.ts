import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)
    const userId = params.userId

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { percentage, isActive, adjustOthers } = body

    if (percentage === undefined && isActive === undefined) {
      return NextResponse.json({ message: "Falta el porcentaje o estado de activación" }, { status: 400 })
    }

    // Obtener todas las asignaciones
    const { data: allAssignments, error: getAllError } = await supabase.from("photo_assignments").select("*")

    if (getAllError) {
      console.error("Error al obtener todas las asignaciones:", getAllError)
      return NextResponse.json({ message: getAllError.message }, { status: 500 })
    }

    // Obtener la asignación actual del usuario
    const currentAssignment = allAssignments.find((a) => a.user_id === userId)
    const currentPercentage = currentAssignment ? currentAssignment.percentage : 0
    const currentActive = currentAssignment ? currentAssignment.is_active !== false : false

    // Filtrar asignaciones activas que no son del usuario actual
    const otherActiveAssignments = allAssignments.filter((a) => a.user_id !== userId && a.is_active !== false)

    // Calcular el total de porcentajes de otros usuarios activos
    const otherActiveTotal = otherActiveAssignments.reduce((sum, a) => sum + a.percentage, 0)

    // Caso 1: Desactivar un usuario activo - redistribuir su porcentaje
    if (isActive === false && currentActive && currentPercentage > 0) {
      if (otherActiveAssignments.length > 0) {
        // Redistribuir el porcentaje entre los demás usuarios activos
        for (const assignment of otherActiveAssignments) {
          const proportion = assignment.percentage / otherActiveTotal
          const additionalPercentage = currentPercentage * proportion
          const newPercentage = Math.round(assignment.percentage + additionalPercentage)

          await supabase
            .from("photo_assignments")
            .update({
              percentage: newPercentage,
              updated_at: new Date().toISOString(),
            })
            .eq("id", assignment.id)
        }
      }
    }
    // Caso 2: Cambiar el porcentaje y ajustar otros
    else if (percentage !== undefined && adjustOthers && isActive !== false) {
      if (otherActiveAssignments.length > 0) {
        const percentageDiff = percentage - currentPercentage

        if (percentageDiff !== 0) {
          // Ajustar proporcionalmente los porcentajes de otros usuarios
          for (const assignment of otherActiveAssignments) {
            const proportion = assignment.percentage / otherActiveTotal
            const adjustment = percentageDiff * proportion
            const newPercentage = Math.max(0, Math.round(assignment.percentage - adjustment))

            await supabase
              .from("photo_assignments")
              .update({
                percentage: newPercentage,
                updated_at: new Date().toISOString(),
              })
              .eq("id", assignment.id)
          }
        }
      }
    }

    // Actualizar la asignación del usuario actual
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (percentage !== undefined) {
      updateData.percentage = percentage
    }

    if (isActive !== undefined) {
      updateData.is_active = isActive

      // Si estamos desactivando, poner el porcentaje a 0
      if (isActive === false) {
        updateData.percentage = 0
      }
    }

    let result
    if (currentAssignment) {
      // Actualizar asignación existente
      result = await supabase.from("photo_assignments").update(updateData).eq("id", currentAssignment.id).select()
    } else {
      // Crear nueva asignación
      updateData.user_id = userId
      updateData.created_at = new Date().toISOString()
      updateData.percentage = updateData.percentage || 0
      updateData.is_active = updateData.is_active !== undefined ? updateData.is_active : true

      result = await supabase.from("photo_assignments").insert(updateData).select()
    }

    if (result.error) {
      console.error("Error al guardar asignación:", result.error)
      return NextResponse.json({ message: result.error.message }, { status: 500 })
    }

    // Obtener todas las asignaciones actualizadas
    const { data: updatedAssignments, error: getUpdatedError } = await supabase
      .from("photo_assignments")
      .select("*")
      .eq("is_active", true)

    if (getUpdatedError) {
      console.error("Error al obtener asignaciones actualizadas:", getUpdatedError)
    }

    // Calcular el total actualizado
    const totalPercentage = updatedAssignments ? updatedAssignments.reduce((sum, a) => sum + a.percentage, 0) : null

    // Obtener información del usuario para el display_name
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single()

    let displayName = "Usuario sin nombre"
    if (!userError) {
      displayName = userData?.full_name || userData?.email || "Usuario sin nombre"
    }

    return NextResponse.json({
      userId,
      percentage: result.data[0].percentage,
      isActive: result.data[0].is_active,
      displayName,
      id: result.data[0].id,
      totalPercentage,
    })
  } catch (error: any) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json({ message: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
