import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const testExtorno = {
      matricula: "TEST001",
      cliente: "Cliente de Prueba",
      concepto: "Extorno de prueba para subida de documentos",
      importe: 100.0,
      numero_cuenta: "ES0000000000000000000000",
      concesion: 1,
      estado: "pendiente",
      solicitado_por: user.id,
      created_by: user.id,
      is_test: true, // Mark as test record
      documentos_adjuntos: [],
      documentos_tramitacion: [],
    }

    const { data, error } = await supabase.from("extornos").insert([testExtorno]).select().single()

    if (error) {
      console.error("Error creating test extorno:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data })
  } catch (error: any) {
    console.error("Critical error in create-test-extorno:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
