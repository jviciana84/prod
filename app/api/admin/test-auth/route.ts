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
    console.log("🧪 Probando autenticación de Supabase...")
    
    const body = await request.json()
    const { email } = body

    console.log("📝 Email a probar:", email)

    // Probar solo la creación de usuario en auth
    console.log("🔐 Creando usuario en auth...")
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: "Test User",
      },
    })

    if (error) {
      console.error("❌ Error en auth:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code,
        status: error.status,
        details: error
      }, { status: 500 })
    }

    console.log("✅ Usuario creado en auth:", data.user?.id)

    // Limpiar usuario de prueba
    if (data.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      console.log("✅ Usuario de prueba eliminado")
    }

    return NextResponse.json({ 
      success: true, 
      message: "Autenticación funciona correctamente",
      user_id: data.user?.id
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