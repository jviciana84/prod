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

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)

    // Verificar sesión del admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
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
      return NextResponse.json({ message: "Solo los administradores pueden realizar esta acción" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ message: "Email requerido" }, { status: 400 })
    }

    // Buscar usuario por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ message: "Error obteniendo usuarios", details: listError.message }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener información completa del usuario
    const { data: userDetails, error: userError } = await supabaseAdmin.auth.admin.getUserById(user.id)
    
    if (userError) {
      return NextResponse.json({ message: "Error obteniendo detalles del usuario", details: userError.message }, { status: 500 })
    }

    // Obtener perfil de la base de datos
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      userDetails: userDetails,
      profile: profile,
      profileError: profileError?.message,
      forcePasswordChange: user.user_metadata?.force_password_change,
    })
  } catch (error: any) {
    console.error("[Debug User Metadata] Error:", error)
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 })
  }
}
