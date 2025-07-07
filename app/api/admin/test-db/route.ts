import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase con rol de servicio para operaciones administrativas
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET() {
  try {
    console.log("🔍 Probando conexión a base de datos...")
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Definida" : "No definida")
    console.log("Service Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Definida" : "No definida")

    // Probar conexión básica a profiles
    console.log("📊 Probando tabla profiles...")
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("count")
      .limit(1)

    if (profilesError) {
      console.error("❌ Error en tabla profiles:", profilesError)
      return NextResponse.json({ 
        success: false, 
        error: profilesError.message,
        details: profilesError
      }, { status: 500 })
    }

    console.log("✅ Tabla profiles accesible")
    
    // Probar tabla roles
    console.log("📊 Probando tabla roles...")
    const { data: rolesData, error: rolesError } = await supabaseAdmin
      .from("roles")
      .select("id, name")
      .limit(5)

    if (rolesError) {
      console.error("❌ Error en tabla roles:", rolesError)
      return NextResponse.json({ 
        success: false, 
        error: rolesError.message,
        details: rolesError
      }, { status: 500 })
    }

    console.log("✅ Tabla roles accesible, roles encontrados:", rolesData?.length || 0)

    // Probar creación de usuario en auth (sin guardar)
    console.log("🔐 Probando creación de usuario en auth...")
    const testEmail = `test-${Date.now()}@example.com`
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      email_confirm: true,
      user_metadata: {
        full_name: "Test User",
        alias: "test",
      },
    })

    if (authError) {
      console.error("❌ Error creando usuario en auth:", authError)
      return NextResponse.json({ 
        success: false, 
        error: authError.message,
        details: authError
      }, { status: 500 })
    }

    console.log("✅ Usuario creado en auth:", authData.user?.id)

    // Limpiar usuario de prueba
    if (authData.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.log("✅ Usuario de prueba eliminado")
    }

    return NextResponse.json({ 
      success: true, 
      message: "Todas las pruebas pasaron",
      profiles: "OK",
      roles: rolesData?.length || 0,
      auth: "OK"
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