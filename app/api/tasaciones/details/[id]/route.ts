import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const tasacionId = id

    // Obtener tasación completa
    const { data: tasacion, error: tasacionError } = await supabase
      .from("tasaciones")
      .select("*")
      .eq("id", tasacionId)
      .single()

    if (tasacionError) {
      return NextResponse.json({ error: "Tasación no encontrada" }, { status: 404 })
    }

    // Obtener fotos
    const { data: fotos } = await supabase
      .from("tasacion_fotos")
      .select("*")
      .eq("tasacion_id", tasacionId)
      .order("created_at", { ascending: true })

    // Agrupar fotos por categoría
    const fotosPorCategoria: Record<string, any[]> = {
      vehiculo: [],
      cuentakm: [],
      interior_delantero: [],
      interior_trasero: [],
      documentacion: [],
      otras: [],
    }

    fotos?.forEach((foto) => {
      if (fotosPorCategoria[foto.categoria]) {
        fotosPorCategoria[foto.categoria].push(foto)
      }
    })

    // Parsear metadata y JSONBs
    let metadata = tasacion.metadata
    let danosExteriores = tasacion.danos_exteriores
    let danosInteriores = tasacion.danos_interiores
    let testigosEncendidos = tasacion.testigos_encendidos

    try {
      if (typeof tasacion.metadata === 'string') {
        metadata = JSON.parse(tasacion.metadata)
      }
      if (typeof tasacion.danos_exteriores === 'string') {
        danosExteriores = JSON.parse(tasacion.danos_exteriores)
      }
      if (typeof tasacion.danos_interiores === 'string') {
        danosInteriores = JSON.parse(tasacion.danos_interiores)
      }
      if (typeof tasacion.testigos_encendidos === 'string') {
        testigosEncendidos = JSON.parse(tasacion.testigos_encendidos)
      }
    } catch (e) {
      console.error("Error parseando JSON:", e)
    }

    return NextResponse.json({
      tasacion: { 
        ...tasacion, 
        metadata,
        danos_exteriores: danosExteriores,
        danos_interiores: danosInteriores,
        testigos_encendidos: testigosEncendidos,
      },
      fotos: fotosPorCategoria,
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

