import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { clearAvatarCache } from "@/lib/avatars/blob-storage"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    const { data: userRoles } = await supabase.rpc("get_user_role_names", {
      user_id_param: session.user.id,
    })

    const isAdmin = userRoles && (userRoles.includes("admin") || userRoles.includes("Administrador"))

    if (!isAdmin) {
      return NextResponse.json({ message: "No tienes permisos para realizar esta acción" }, { status: 403 })
    }

    // Limpiar caché
    clearAvatarCache()

    return NextResponse.json({ message: "Caché actualizada correctamente" })
  } catch (error: any) {
    console.error("Error al actualizar caché:", error)
    return NextResponse.json({ message: error.message || "Error al actualizar caché" }, { status: 500 })
  }
}
