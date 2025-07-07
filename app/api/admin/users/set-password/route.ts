import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase con permisos de administrador
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  console.log("[API Set Password] Received POST request.")
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)

    // Verificar sesión del admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn("[API Set Password] Unauthorized access attempt.")
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario actual es administrador
    const { data: userData } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", session.user.id)
      .single()

    const isAdmin = userData?.role_id === 1 || userData?.role_id === 5

    if (!isAdmin) {
      console.warn("[API Set Password] Non-admin user attempted to set password.")
      return NextResponse.json({ message: "Solo los administradores pueden realizar esta acción" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, password, forceChange } = body
    console.log("[API Set Password] Request received for user ID:", userId)

    if (!userId || !password) {
      console.warn("[API Set Password] Missing required fields.")
      return NextResponse.json({ message: "Se requiere el ID de usuario y la contraseña" }, { status: 400 })
    }

    // Obtener el email del usuario
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !user) {
      console.error("[API Set Password] Error getting user:", userError)
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    // Establecer la contraseña del usuario usando la API de administración
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    })

    if (error) {
      console.error("[API Set Password] Error setting password:", error)
      return NextResponse.json({ message: error.message || "Error al establecer la contraseña" }, { status: 500 })
    }

    // Si se requiere cambio forzado de contraseña, establecer el flag en la base de datos
    if (forceChange) {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { force_password_change: true },
      })

      if (metadataError) {
        console.warn("[API Set Password] Error setting force_password_change flag:", metadataError)
      }
    }

    console.log(`[API Set Password] Password set successfully for user ${userId}`)

    // Registrar la acción en la base de datos para auditoría (sin catch)
    try {
      await supabase.from("admin_actions").insert({
        admin_id: session.user.id,
        action_type: "set_password",
        target_user_id: userId,
        details: { force_change: forceChange },
      })
    } catch (auditError) {
      console.warn("[API Set Password] Failed to log admin action:", auditError)
      // No fallar la operación principal por un error de auditoría
    }

    return NextResponse.json({
      message: "Contraseña establecida exitosamente",
      success: true,
    })
  } catch (error: any) {
    console.error("[API Set Password] Unhandled error:", error)
    return NextResponse.json({ message: error.message || "Error al establecer la contraseña" }, { status: 500 })
  }
}
