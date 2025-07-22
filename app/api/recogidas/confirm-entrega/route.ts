import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: "Token requerido" 
      }, { status: 400 })
    }

    // Buscar la entrega en mano por token
    const { data: entrega, error: entregaError } = await supabase
      .from("entregas_en_mano")
      .select("*")
      .eq("token_confirmacion", token)
      .eq("estado", "pendiente")
      .single()

    if (entregaError || !entrega) {
      return NextResponse.json({ 
        success: false, 
        error: "Token inválido o entrega ya confirmada" 
      }, { status: 404 })
    }

    // Actualizar el estado a confirmada
    const { error: updateError } = await supabase
      .from("entregas_en_mano")
      .update({
        estado: "confirmada",
        fecha_confirmacion: new Date().toISOString()
      })
      .eq("id", entrega.id)

    if (updateError) {
      console.error("Error actualizando entrega:", updateError)
      return NextResponse.json({ 
        success: false, 
        error: "Error confirmando la entrega" 
      }, { status: 500 })
    }

    // Actualizar la tabla entregas para marcar que tiene entrega en mano
    const { error: entregasError } = await supabase
      .from("entregas")
      .update({
        tiene_entrega_en_mano: true
      })
      .eq("matricula", entrega.matricula)

    if (entregasError) {
      console.error("Error actualizando tabla entregas:", entregasError)
      // No fallamos aquí, solo log del error
    }

    return NextResponse.json({
      success: true,
      message: "Entrega confirmada correctamente",
      data: {
        matricula: entrega.matricula,
        materiales: entrega.materiales,
        fecha_confirmacion: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Error confirmando entrega:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
} 