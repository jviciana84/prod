import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Obtener sesión del usuario
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener perfil del usuario
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Determinar filtro según rol
    const isAdmin = profileData?.role?.toLowerCase() === "admin"

    // Construir query de entregas
    let query = supabase.from("entregas").select("*").order("fecha_venta", { ascending: false })

    // Filtrar por asesor si no es admin
    if (!isAdmin && profileData?.full_name) {
      query = query.ilike("asesor", profileData.full_name)
    }

    const { data: entregas, error: entregasError } = await query

    if (entregasError) {
      console.error("Error fetching entregas:", entregasError)
      return NextResponse.json({ error: entregasError.message }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        entregas: entregas || [],
        user: {
          id: session.user.id,
          email: session.user.email,
        },
        profile: profileData,
      },
    })
  } catch (error) {
    console.error("Unexpected error in entregas list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

