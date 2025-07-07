import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET() {
  try {
    console.log("🔍 Verificando estructura de tablas...")

    // Verificar tabla profiles
    console.log("📊 Verificando tabla profiles...")
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .limit(1)

    if (profilesError) {
      console.error("❌ Error en tabla profiles:", profilesError)
      return NextResponse.json({ 
        success: false, 
        table: "profiles",
        error: profilesError.message,
        details: profilesError
      }, { status: 500 })
    }

    console.log("✅ Tabla profiles accesible")

    // Verificar estructura de profiles
    const { data: profilesColumns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_structure', { table_name: 'profiles' })

    if (columnsError) {
      console.error("❌ Error obteniendo estructura de profiles:", columnsError)
    } else {
      console.log("📋 Estructura de profiles:", profilesColumns)
    }

    // Verificar auth.users (solo contar)
    console.log("🔐 Verificando auth.users...")
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error("❌ Error en auth.users:", authError)
      return NextResponse.json({ 
        success: false, 
        table: "auth.users",
        error: authError.message,
        details: authError
      }, { status: 500 })
    }

    console.log("✅ Auth.users accesible, usuarios:", authUsers?.users?.length || 0)

    return NextResponse.json({ 
      success: true,
      profiles: "OK",
      auth_users: authUsers?.users?.length || 0,
      profiles_structure: profilesColumns || "No disponible"
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