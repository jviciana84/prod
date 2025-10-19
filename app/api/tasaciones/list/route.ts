import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient(await cookies())

    // Obtener usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Consultar tasaciones reales de la base de datos
    const { data: tasaciones, error: tasacionesError } = await supabase
      .from("tasaciones")
      .select("*")
      .order("created_at", { ascending: false })

    if (tasacionesError) {
      console.error("Error al cargar tasaciones:", tasacionesError)
      // Si la tabla no existe, retornar vacío
      if (tasacionesError.message.includes("does not exist")) {
        console.log("Tabla tasaciones no existe aún. Retornando vacío.")
        return NextResponse.json({
          data: {
            tasaciones: [],
            advisorLink: null,
            currentUser: {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name,
            },
          },
        })
      }
      return NextResponse.json({ error: tasacionesError.message }, { status: 500 })
    }

    // Obtener enlace del asesor (si existe tabla)
    const { data: advisorLink } = await supabase
      .from("advisor_links")
      .select("*")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      data: {
        tasaciones: tasaciones || [],
        advisorLink: advisorLink || null,
        currentUser: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name,
        },
      },
    })
  } catch (error) {
    console.error("Unexpected error in tasaciones list API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

