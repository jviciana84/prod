import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: "Falta parámetro id" },
        { status: 400 }
      )
    }

    // Obtener estado actual
    const { data: current } = await supabase
      .from("fotos")
      .select("is_available, license_plate")
      .eq("id", id)
      .single()

    if (!current) {
      return NextResponse.json(
        { error: "Registro de fotos no encontrado" },
        { status: 404 }
      )
    }

    // Invertir estado
    const newStatus = !current.is_available

    // Actualizar
    const { data, error } = await supabase
      .from("fotos")
      .update({
        is_available: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("❌ [API] Error toggling fotos availability:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Fotos ${current.license_plate} disponibilidad: ${newStatus}`)

    return NextResponse.json({ 
      success: true, 
      data,
      message: newStatus ? "Marcado como disponible" : "Marcado como no disponible"
    })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

