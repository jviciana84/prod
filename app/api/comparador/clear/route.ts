import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    // Eliminar todos los vehículos del comparador del usuario
    const { error } = await supabase
      .from("comparador_vehiculos")
      .delete()
      .eq("user_id", session.user.id)

    if (error) throw error

    return NextResponse.json({ message: "Comparador limpiado correctamente" })

  } catch (error: any) {
    console.error("Error limpiando comparador:", error.message)
    return NextResponse.json({ 
      message: "Error al limpiar comparador", 
      error: error.message 
    }, { status: 500 })
  }
}

