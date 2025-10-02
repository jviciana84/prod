import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase con permisos de administrador
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ message: "Email requerido" }, { status: 400 })
    }

    console.log(`[Debug Force Check] Verificando flag para usuario: ${email}`)

    // Buscar usuario por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ message: "Error obteniendo usuarios", details: listError.message }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    const forcePasswordChange = user.user_metadata?.force_password_change
    const shouldRedirect = !!forcePasswordChange

    console.log(`[Debug Force Check] Resultado:`, {
      email: user.email,
      forcePasswordChange,
      shouldRedirect,
      user_metadata: user.user_metadata
    })

    return NextResponse.json({
      email: user.email,
      forcePasswordChange,
      shouldRedirect,
      user_metadata: user.user_metadata,
      message: shouldRedirect 
        ? "Usuario DEBE cambiar contraseña - debería redirigir a /force-password-change"
        : "Usuario NO necesita cambiar contraseña"
    })
  } catch (error: any) {
    console.error("[Debug Force Check] Error:", error)
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 })
  }
}
