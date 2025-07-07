import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Obtener todas las asignaciones de fotos
    const { data: assignments, error } = await supabase
      .from("photo_assignments")
      .select("*")
      .order("percentage", { ascending: false })

    if (error) {
      console.error("Error al obtener asignaciones de fotos:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    // Obtener información de usuarios para cada asignación
    const formattedData = []

    for (const assignment of assignments) {
      // Obtener información del usuario desde auth.users
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", assignment.user_id)
        .single()

      if (userError && userError.code !== "PGRST116") {
        // Ignorar error si no se encuentra el usuario
        console.warn(`No se pudo obtener información para el usuario ${assignment.user_id}:`, userError)
      }

      formattedData.push({
        userId: assignment.user_id,
        percentage: assignment.percentage,
        displayName: userData?.full_name || userData?.email || "Usuario sin nombre",
        id: assignment.id,
        isActive: assignment.is_active !== false, // Si es null o undefined, considerarlo como true
      })
    }

    return NextResponse.json(formattedData)
  } catch (error: any) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json({ message: error.message || "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { userId, percentage, isActive } = body

    if (!userId || percentage === undefined) {
      return NextResponse.json({ message: "Faltan datos requeridos" }, { status: 400 })
    }

    // Verificar si ya existe una asignación para este usuario
    const { data: existingAssignment, error: checkError } = await supabase
      .from("photo_assignments")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error al verificar asignación existente:", checkError)
      return NextResponse.json({ message: checkError.message }, { status: 500 })
    }

    let result
    if (existingAssignment) {
      // Actualizar asignación existente
      result = await supabase
        .from("photo_assignments")
        .update({
          percentage,
          is_active: isActive !== undefined ? isActive : true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAssignment.id)
        .select()
    } else {
      // Crear nueva asignación
      result = await supabase
        .from("photo_assignments")
        .insert({
          user_id: userId,
          percentage,
          is_active: isActive !== undefined ? isActive : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
    }

    if (result.error) {
      console.error("Error al guardar asignación:", result.error)
      return NextResponse.json({ message: result.error.message }, { status: 500 })
    }

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
      percentage,
      displayName,
      id: result.data[0].id,
      isActive: result.data[0].is_active,
    })
  } catch (error: any) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json({ message: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
