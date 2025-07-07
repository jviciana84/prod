import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST() {
  try {
    console.log("🔍 Agregando rol 'viewer'...")

    // Verificar si ya existe el rol 'viewer'
    const { data: existingRole, error: checkError } = await supabaseAdmin
      .from("roles")
      .select("id, name")
      .eq("name", "viewer")
      .single()

    if (existingRole) {
      console.log("✅ Rol 'viewer' ya existe:", existingRole)
      return NextResponse.json({ 
        success: true,
        message: "Rol 'viewer' ya existe",
        role: existingRole
      })
    }

    // Crear el rol 'viewer'
    const { data: newRole, error: insertError } = await supabaseAdmin
      .from("roles")
      .insert({
        name: "viewer",
        description: "Usuario con permisos de solo lectura"
      })
      .select()
      .single()

    if (insertError) {
      console.error("❌ Error creando rol 'viewer':", insertError)
      return NextResponse.json({ 
        success: false, 
        error: insertError.message,
        details: insertError
      }, { status: 500 })
    }

    console.log("✅ Rol 'viewer' creado:", newRole)

    return NextResponse.json({ 
      success: true,
      message: "Rol 'viewer' creado exitosamente",
      role: newRole
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