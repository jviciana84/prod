import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * GET: Lista usuarios que existen en Auth pero no tienen fila en profiles.
 * Sirve para mostrar en admin y permitir "Crear perfil" (ej. Ivan u otros).
 */
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuración de Supabase no disponible" },
        { status: 500 }
      )
    }

    const { data: profileIds } = await supabaseAdmin
      .from("profiles")
      .select("id")
    const idsWithProfile = new Set((profileIds || []).map((p) => p.id))

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })

    if (authError) {
      console.error("Error listando usuarios auth:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const missing = (authData?.users || [])
      .filter((u) => !idsWithProfile.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        full_name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Sin nombre",
        created_at: u.created_at,
      }))

    return NextResponse.json(missing)
  } catch (error: any) {
    console.error("Error en missing-profiles:", error)
    return NextResponse.json(
      { error: error?.message || "Error interno" },
      { status: 500 }
    )
  }
}
