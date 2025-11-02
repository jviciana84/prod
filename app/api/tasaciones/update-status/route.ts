import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
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

    const { tasacion_id, tramitada } = await request.json()

    console.log('🔍 Intentando actualizar tasación:', tasacion_id, 'a tramitada:', tramitada)

    if (!tasacion_id || tramitada === undefined) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    // Primero verificar si la tasación existe
    const { data: existing, error: checkError } = await supabase
      .from("tasaciones")
      .select("id, matricula, tramitada")
      .eq("id", tasacion_id)
      .single()

    if (checkError || !existing) {
      console.error('❌ Tasación no encontrada:', tasacion_id, checkError)
      return NextResponse.json({ error: "Tasación no encontrada" }, { status: 404 })
    }

    console.log('✅ Tasación encontrada:', existing.matricula, 'tramitada actual:', existing.tramitada)

    // Actualizar estado de tramitación usando servicio de admin bypass RLS
    const updatePayload = tramitada 
      ? { tramitada, tramitada_at: new Date().toISOString() }
      : { tramitada, tramitada_at: null }
    
    const { data: updateData, error: updateError } = await supabase
      .from("tasaciones")
      .update(updatePayload)
      .eq("id", tasacion_id)
      .select()

    console.log("📊 Resultado del UPDATE:", { data: updateData, error: updateError })

    if (updateError) {
      console.error("❌ Error actualizando tasación:", updateError)
      console.error("Detalles del error:", JSON.stringify(updateError, null, 2))
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Verificar que realmente se actualizó
    const { data: verificacion, error: verifyError } = await supabase
      .from("tasaciones")
      .select("id, matricula, tramitada")
      .eq("id", tasacion_id)
      .single()

    console.log("🔎 Verificación después del UPDATE:", verificacion)

    if (!verificacion) {
      console.error("❌ No se pudo verificar la actualización")
      return NextResponse.json({ error: "No se pudo verificar la actualización" }, { status: 500 })
    }

    if (verificacion.tramitada !== tramitada) {
      console.error("❌ El valor NO se actualizó. Esperado:", tramitada, "Actual:", verificacion.tramitada)
      console.error("⚠️ Probablemente hay políticas RLS bloqueando el UPDATE")
      return NextResponse.json({ 
        error: "Posible problema de permisos (RLS). Verifica las políticas de la tabla 'tasaciones' en Supabase" 
      }, { status: 500 })
    }

    console.log("✅ Tasación actualizada y verificada correctamente:", verificacion.matricula, "tramitada:", verificacion.tramitada)
    
    return NextResponse.json({ success: true, data: verificacion })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

