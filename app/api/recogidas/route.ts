import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Construir query base
    let query = supabase
      .from("recogidas_historial")
      .select("*")
      .order("fecha_solicitud", { ascending: false })

    // Aplicar filtros de búsqueda
    if (search) {
      query = query.or(`matricula.ilike.%${search}%,nombre_cliente.ilike.%${search}%,usuario_solicitante.ilike.%${search}%`)
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1)

    const { data: recogidas, error } = await query

    if (error) {
      console.error("Error obteniendo recogidas:", error)
      return NextResponse.json({ error: "Error obteniendo recogidas" }, { status: 500 })
    }

    return NextResponse.json({ recogidas })
  } catch (error) {
    console.error("Error en GET /api/recogidas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    const body = await request.json()
    const {
      matricula,
      mensajeria,
      centro_recogida,
      materiales,
      nombre_cliente,
      direccion_cliente,
      codigo_postal,
      ciudad,
      provincia,
      telefono,
      email,
      observaciones_envio,
    } = body

    // Validar campos obligatorios
    if (!matricula || !mensajeria || !centro_recogida || !materiales || materiales.length === 0) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: matrícula, mensajería, centro de recogida y materiales" },
        { status: 400 }
      )
    }

    // Insertar recogida
    const { data: recogida, error } = await supabase
      .from("recogidas_historial")
      .insert({
        matricula,
        mensajeria,
        centro_recogida,
        materiales,
        nombre_cliente,
        direccion_cliente,
        codigo_postal,
        ciudad,
        provincia,
        telefono,
        email,
        observaciones_envio,
        usuario_solicitante: profile?.full_name || user.email || "Usuario",
        usuario_solicitante_id: user.id,
        estado: "solicitada",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creando recogida:", error)
      return NextResponse.json({ error: "Error creando recogida" }, { status: 500 })
    }

    return NextResponse.json({ recogida })
  } catch (error) {
    console.error("Error en POST /api/recogidas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 