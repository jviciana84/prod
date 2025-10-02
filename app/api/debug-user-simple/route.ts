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

    console.log(`[Debug User Simple] Buscando usuario: ${email}`)

    // Buscar usuario por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error("[Debug User Simple] Error obteniendo usuarios:", listError)
      return NextResponse.json({ message: "Error obteniendo usuarios", details: listError.message }, { status: 500 })
    }

    console.log(`[Debug User Simple] Total usuarios encontrados: ${users.users.length}`)

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      console.log(`[Debug User Simple] Usuario no encontrado: ${email}`)
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    console.log(`[Debug User Simple] Usuario encontrado: ${user.id}`)

    // Obtener información completa del usuario
    const { data: userDetails, error: userError } = await supabaseAdmin.auth.admin.getUserById(user.id)
    
    if (userError) {
      console.error("[Debug User Simple] Error obteniendo detalles:", userError)
      return NextResponse.json({ message: "Error obteniendo detalles del usuario", details: userError.message }, { status: 500 })
    }

    // Obtener perfil de la base de datos
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    const result = {
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
      hasForcePasswordChangeFlag: !!user.user_metadata?.force_password_change,
    }

    console.log(`[Debug User Simple] Resultado:`, {
      email: user.email,
      forcePasswordChange: user.user_metadata?.force_password_change,
      hasProfile: !!profile,
      profileName: profile?.full_name
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[Debug User Simple] Error:", error)
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 })
  }
}
