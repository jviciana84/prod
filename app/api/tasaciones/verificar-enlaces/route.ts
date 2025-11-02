import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener todos los usuarios (solo admins pueden ver esto)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .order("email")

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Obtener todos los enlaces de tasación
    const { data: enlaces, error: enlacesError } = await supabase
      .from("advisor_tasacion_links")
      .select("*")

    if (enlacesError) {
      return NextResponse.json({ error: enlacesError.message }, { status: 500 })
    }

    // Mapear qué usuarios tienen enlace
    const resultado = profiles?.map(profile => {
      const enlace = enlaces?.find(e => e.advisor_id === profile.id)
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        tiene_enlace: !!enlace,
        slug: enlace?.slug || null,
        url: enlace?.slug ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tasacion/${enlace.slug}` : null
      }
    })

    return NextResponse.json({
      total_usuarios: resultado?.length || 0,
      con_enlace: resultado?.filter(u => u.tiene_enlace).length || 0,
      sin_enlace: resultado?.filter(u => !u.tiene_enlace).length || 0,
      usuarios: resultado
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

