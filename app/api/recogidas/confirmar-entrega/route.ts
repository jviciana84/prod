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
      return NextResponse.json({ error: "Token requerido" }, { status: 400 })
    }

    // Buscar la entrega por token
    const { data: entrega, error: entregaError } = await supabase
      .from("entregas_en_mano")
      .select("*")
      .eq("token_confirmacion", token)
      .single()

    if (entregaError || !entrega) {
      return NextResponse.json({ error: "Entrega no encontrada o token inválido" }, { status: 404 })
    }

    // Verificar que no esté ya confirmada
    if (entrega.estado === "confirmado" || entrega.fecha_confirmacion) {
      return NextResponse.json({ 
        success: true, 
        message: "La entrega ya fue confirmada anteriormente",
        entrega: entrega
      })
    }

    // Actualizar estado a confirmado
    const { data: entregaActualizada, error: updateError } = await supabase
      .from("entregas_en_mano")
      .update({
        estado: "confirmado",
        fecha_confirmacion: new Date().toISOString()
      })
      .eq("id", entrega.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Error actualizando confirmación" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Entrega confirmada correctamente",
      entrega: entregaActualizada
    })

  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 })
    }

    // Buscar la entrega por token
    const { data: entrega, error: entregaError } = await supabase
      .from("entregas_en_mano")
      .select("*")
      .eq("token_confirmacion", token)
      .single()

    if (entregaError || !entrega) {
      return NextResponse.json({ error: "Entrega no encontrada o token inválido" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      entrega: entrega
    })

  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 