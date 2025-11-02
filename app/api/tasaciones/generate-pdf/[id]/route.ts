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

    // Obtener tasación
    const { data: tasacion, error: tasacionError } = await supabase
      .from("tasaciones")
      .select("*")
      .eq("id", params.id)
      .single()

    if (tasacionError || !tasacion) {
      return NextResponse.json({ error: "Tasación no encontrada" }, { status: 404 })
    }

    // Por ahora retornamos los datos, el PDF se generará en el cliente
    // usando el componente TasacionPDF existente
    return NextResponse.json({
      tasacion,
      message: "PDF se generará en el navegador"
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

