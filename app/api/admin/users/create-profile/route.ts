import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * POST body: { userId: string }
 * Crea la fila en profiles para un usuario que ya existe en Auth pero no tenía perfil.
 */
export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuración de Supabase no disponible" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const userId = body?.userId
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      )
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (authError || !authUser?.user) {
      return NextResponse.json(
        { error: authError?.message || "Usuario no encontrado en Auth" },
        { status: 404 }
      )
    }

    const u = authUser.user
    const email = u.email ?? ""
    const meta = u.user_metadata || {}
    const fullName = meta.full_name ?? email?.split("@")[0] ?? "Usuario"
    const alias = meta.alias ?? fullName.split(" ").map((n) => n[0]).join("").substring(0, 6)

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: u.id,
      email,
      full_name: fullName,
      alias: alias || null,
      phone: meta.phone ?? null,
      position: meta.position ?? null,
      avatar_url: meta.avatar_url ?? null,
      role: meta.role ?? null,
      welcome_email_sent: false,
    })

    if (profileError) {
      console.error("Error creando perfil:", profileError)
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Perfil creado correctamente",
      user: { id: u.id, email, full_name: fullName },
    })
  } catch (error: any) {
    console.error("Error en create-profile:", error)
    return NextResponse.json(
      { error: error?.message || "Error interno" },
      { status: 500 }
    )
  }
}
