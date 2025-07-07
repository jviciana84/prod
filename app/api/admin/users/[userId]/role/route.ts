import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase con rol de servicio para operaciones administrativas
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Verificar si el usuario está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ message: "Se requiere el ID del usuario" }, { status: 400 })
    }

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { roleId } = body

    if (!roleId) {
      return NextResponse.json({ message: "Se requiere el ID del rol" }, { status: 400 })
    }

    console.log("Actualizando rol del usuario:", userId, "a:", roleId)

    // Primero eliminar todos los roles existentes del usuario usando el cliente admin
    const { error: deleteError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId)

    if (deleteError) {
      console.error("Error al eliminar roles existentes:", deleteError)
      return NextResponse.json({ message: deleteError.message }, { status: 500 })
    }

    // Luego asignar el nuevo rol usando el cliente admin
    const { error: insertError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role_id: roleId,
    })

    if (insertError) {
      console.error("Error al asignar nuevo rol:", insertError)
      return NextResponse.json({ message: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Rol actualizado exitosamente" })
  } catch (error: any) {
    console.error("Error al actualizar rol:", error)
    return NextResponse.json({ message: error.message || "Error al actualizar rol" }, { status: 500 })
  }
}
