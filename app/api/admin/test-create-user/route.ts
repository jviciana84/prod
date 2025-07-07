import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: Request) {
  try {
    console.log("🧪 Probando creación simple de usuario...")
    
    const body = await request.json()
    const { email, fullName } = body

    console.log("📝 Datos:", { email, fullName })

    // Paso 1: Crear usuario en auth
    console.log("🔐 Creando usuario en auth...")
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError) {
      console.error("❌ Error en auth:", authError)
      return NextResponse.json({ 
        success: false, 
        step: "auth_creation",
        error: authError.message,
        details: authError
      }, { status: 500 })
    }

    console.log("✅ Usuario creado en auth:", authData.user?.id)

    // Paso 2: Crear profile
    console.log("👤 Creando profile...")
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user!.id,
        email,
        full_name: fullName,
        created_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error("❌ Error en profile:", profileError)
      // Limpiar usuario de auth si falla el profile
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id)
      return NextResponse.json({ 
        success: false, 
        step: "profile_creation",
        error: profileError.message,
        details: profileError
      }, { status: 500 })
    }

    console.log("✅ Profile creado")

    return NextResponse.json({ 
      success: true, 
      user: { id: authData.user!.id, email: authData.user!.email }
    })
  } catch (error: any) {
    console.error("❌ Error inesperado:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Error inesperado",
      details: error
    }, { status: 500 })
  }
} 