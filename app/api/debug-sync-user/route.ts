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
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ message: "Email requerido" }, { status: 400 })
    }

    console.log(`[Debug Sync User] Sincronizando datos del usuario: ${email}`)

    // Buscar usuario por email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      return NextResponse.json({ message: "Error obteniendo usuarios", details: listError.message }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener datos actuales del perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ message: "Error obteniendo perfil", details: profileError.message }, { status: 500 })
    }

    console.log(`[Debug Sync User] Datos del perfil:`, {
      full_name: profile.full_name,
      alias: profile.alias,
      email: profile.email
    })

    console.log(`[Debug Sync User] Metadatos actuales:`, user.user_metadata)

    // Sincronizar los metadatos del usuario con los datos del perfil
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        full_name: profile.full_name,
        alias: profile.alias,
        phone: profile.phone,
        position: profile.position,
        avatar_url: profile.avatar_url,
        // Mantener el flag de cambio de contraseña si existe
        force_password_change: user.user_metadata?.force_password_change || false,
      }
    })

    if (updateError) {
      console.error("[Debug Sync User] Error actualizando metadatos:", updateError)
      return NextResponse.json({ message: "Error actualizando metadatos", details: updateError.message }, { status: 500 })
    }

    console.log(`[Debug Sync User] Metadatos sincronizados exitosamente`)

    return NextResponse.json({
      message: "Datos del usuario sincronizados exitosamente",
      success: true,
      before: {
        user_metadata: user.user_metadata
      },
      after: {
        full_name: profile.full_name,
        alias: profile.alias,
        email: profile.email,
        force_password_change: user.user_metadata?.force_password_change || false
      }
    })
  } catch (error: any) {
    console.error("[Debug Sync User] Error:", error)
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 })
  }
}
