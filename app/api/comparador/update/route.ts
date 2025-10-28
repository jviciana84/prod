import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, kilometros, fecha_matriculacion, precio, marca, modelo, version, color, tapiceria, equipacion } = body

    if (!id) {
      return NextResponse.json({ 
        message: "ID requerido" 
      }, { status: 400 })
    }

    // Construir objeto de actualización con solo campos definidos
    const updateData: any = {}
    
    if (kilometros !== undefined) updateData.kilometros = kilometros
    if (fecha_matriculacion !== undefined) updateData.fecha_matriculacion = fecha_matriculacion
    if (precio !== undefined) updateData.precio = precio
    if (marca !== undefined) updateData.marca = marca
    if (modelo !== undefined) updateData.modelo = modelo
    if (version !== undefined) updateData.version = version
    if (color !== undefined) updateData.color = color
    if (tapiceria !== undefined) updateData.tapiceria = tapiceria
    if (equipacion !== undefined) updateData.equipacion = equipacion

    const { data, error } = await supabase
      .from("comparador_vehiculos")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", session.user.id) // Seguridad: solo actualizar propios vehículos
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)

  } catch (error: any) {
    console.error("Error actualizando vehículo:", error.message)
    return NextResponse.json({ 
      message: "Error al actualizar vehículo", 
      error: error.message 
    }, { status: 500 })
  }
}

