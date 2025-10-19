import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { entregaId, tipo, adding, matricula } = body

    if (!entregaId || !tipo || adding === undefined) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      )
    }

    // Obtener entrega actual
    const { data: entrega, error: fetchError } = await supabase
      .from("entregas")
      .select("tipos_incidencia")
      .eq("id", entregaId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Calcular nuevos tipos
    const nuevosTipos = adding
      ? [...(entrega.tipos_incidencia || []), tipo]
      : entrega.tipos_incidencia?.filter((t: string) => t !== tipo) || []

    // Actualizar entregas
    const { data, error } = await supabase
      .from("entregas")
      .update({ 
        tipos_incidencia: nuevosTipos,
        incidencia: nuevosTipos.length > 0 
      })
      .eq("id", entregaId)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Error updating incidencia:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Actualizar historial
    if (!adding) {
      // Marcar como resuelta
      await supabase
        .from("incidencias_historial")
        .update({ resuelta: true, fecha_resolucion: new Date().toISOString() })
        .eq("matricula", matricula)
        .eq("tipo_incidencia", tipo)
        .eq("resuelta", false)
    } else {
      // Insertar nueva
      await supabase
        .from("incidencias_historial")
        .insert({
          entrega_id: entregaId,
          matricula: matricula,
          tipo_incidencia: tipo,
          accion: "añadida",
          resuelta: false,
          fecha: new Date().toISOString(),
        })
    }

    return NextResponse.json({ success: true, data, nuevosTipos })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

