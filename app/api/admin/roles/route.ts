import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase con rol de servicio para operaciones administrativas
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Endpoint /api/admin/roles llamado")
    
    // Por ahora, permitir acceso sin autenticación para debug
    // TODO: Restaurar autenticación cuando se resuelva el problema
    
    console.log("✅ Acceso permitido (debug mode)")

    // Obtener todos los roles de la tabla 'roles'
    const { data: roles, error } = await supabaseAdmin
      .from("roles")
      .select("id, name, description")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error al obtener roles:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json(roles)
  } catch (error: any) {
    console.error("Error al obtener roles:", error)
    return NextResponse.json({ message: error.message || "Error al obtener roles" }, { status: 500 })
  }
}
