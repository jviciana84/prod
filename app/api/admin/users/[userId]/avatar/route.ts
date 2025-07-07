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
    const supabase = await createServerClient(cookieStore)

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
    const { avatarUrl } = await request.json()

    if (!avatarUrl) {
      return NextResponse.json({ message: "Se requiere la URL del avatar" }, { status: 400 })
    }

    console.log("Actualizando avatar del usuario:", userId, "a", avatarUrl)

    // Actualizar el avatar en la tabla de perfiles
    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateProfileError) {
      console.error("Error al actualizar avatar en perfil:", updateProfileError)
      return NextResponse.json({ message: updateProfileError.message }, { status: 500 })
    }

    // Actualizar los metadatos del usuario en auth
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        avatar_url: avatarUrl,
      },
    })

    if (updateUserError) {
      console.error("Error al actualizar metadatos del usuario:", updateUserError)
      return NextResponse.json({ message: updateUserError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Avatar actualizado exitosamente" })
  } catch (error: any) {
    console.error("Error al actualizar avatar:", error)
    return NextResponse.json({ message: error.message || "Error al actualizar avatar" }, { status: 500 })
  }
}
