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
  console.log("[API Change Password] Received POST request.")
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)

    // Verificar sesión del usuario
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn("[API Change Password] Unauthorized access attempt.")
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body
    console.log("[API Change Password] Request received for user ID:", session.user.id)

    if (!currentPassword || !newPassword) {
      console.warn("[API Change Password] Missing required fields.")
      return NextResponse.json({ message: "Se requiere la contraseña actual y la nueva contraseña" }, { status: 400 })
    }

    // Validaciones
    if (newPassword.length < 6) {
      return NextResponse.json({ message: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ message: "La nueva contraseña debe ser diferente a la actual" }, { status: 400 })
    }

    // Verificar la contraseña actual
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: currentPassword,
    })

    if (signInError) {
      console.error("[API Change Password] Current password verification failed:", signInError)
      return NextResponse.json({ message: "La contraseña actual es incorrecta" }, { status: 400 })
    }

    // Cambiar la contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error("[API Change Password] Error updating password:", updateError)
      return NextResponse.json({ message: updateError.message || "Error al cambiar la contraseña" }, { status: 500 })
    }

    // Eliminar el flag de cambio forzado usando el cliente admin
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(session.user.id, {
      user_metadata: { force_password_change: false }
    })

    if (metadataError) {
      console.warn("[API Change Password] Error removing force_password_change flag:", metadataError)
      // No fallar la operación por esto, pero logear el error
    }

    console.log(`[API Change Password] Password changed successfully for user ${session.user.id}`)

    return NextResponse.json({
      message: "Contraseña cambiada exitosamente",
      success: true,
    })
  } catch (error: any) {
    console.error("[API Change Password] Unhandled error:", error)
    return NextResponse.json({ message: error.message || "Error al cambiar la contraseña" }, { status: 500 })
  }
}
