import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient(cookieStore)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener todas las fotos
    const { data: fotos, error: fotosError } = await supabase
      .from("tasacion_fotos")
      .select("*")
      .eq("tasacion_id", params.id)

    if (fotosError || !fotos || fotos.length === 0) {
      return NextResponse.json({ error: "No hay fotos disponibles" }, { status: 404 })
    }

    // Retornar URLs de todas las fotos
    return NextResponse.json({
      fotos: fotos.map(f => ({
        url: f.url,
        nombre: f.foto_key,
        categoria: f.categoria
      }))
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

