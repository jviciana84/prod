import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { del } from "@vercel/blob"

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ 
        message: "ID requerido" 
      }, { status: 400 })
    }

    // Obtener datos del vehículo para eliminar el PDF
    const { data: vehiculo, error: fetchError } = await supabase
      .from("comparador_vehiculos")
      .select("pdf_url")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single()

    if (fetchError) throw fetchError

    // Eliminar PDF de Vercel Blob
    if (vehiculo?.pdf_url) {
      try {
        await del(vehiculo.pdf_url)
      } catch (error) {
        console.error("Error eliminando PDF:", error)
      }
    }

    // Eliminar registro de base de datos
    const { error } = await supabase
      .from("comparador_vehiculos")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id)

    if (error) throw error

    return NextResponse.json({ message: "Vehículo eliminado correctamente" })

  } catch (error: any) {
    console.error("Error eliminando vehículo:", error.message)
    return NextResponse.json({ 
      message: "Error al eliminar vehículo", 
      error: error.message 
    }, { status: 500 })
  }
}

