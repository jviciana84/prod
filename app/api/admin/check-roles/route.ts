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
    console.log("🔍 Verificando roles en la tabla roles...")

    // Obtener todos los roles
    const { data: roles, error } = await supabaseAdmin
      .from("roles")
      .select("id, name, description")
      .order("name", { ascending: true })

    if (error) {
      console.error("❌ Error obteniendo roles:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    console.log("✅ Roles encontrados:", roles)

    // Verificar si existe el rol 'viewer'
    const viewerRole = roles?.find(role => role.name === 'viewer')
    console.log("🔍 Rol 'viewer' encontrado:", viewerRole ? "Sí" : "No")

    return NextResponse.json({ 
      success: true,
      roles: roles,
      viewer_exists: !!viewerRole,
      total_roles: roles?.length || 0
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