import { createRouteHandlerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createRouteHandlerClient(cookieStore)

    const body = await request.json()
    const { photographerId, licensePlate, model } = body

    if (!photographerId || !licensePlate) {
      return NextResponse.json({ message: "Faltan datos requeridos" }, { status: 400 })
    }

    // Crear un vehículo de prueba para activar el trigger
    const { data: testVehicle, error: insertError } = await supabase
      .from("fotos")
      .insert({
        license_plate: licensePlate,
        model: model || "Vehículo de prueba",
        assigned_to: photographerId,
        photos_completed: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creando vehículo de prueba:", insertError)
      return NextResponse.json({ message: "Error creando vehículo de prueba" }, { status: 500 })
    }

    // Obtener información del fotógrafo
    const { data: photographer, error: photographerError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", photographerId)
      .single()

    const photographerName = photographer?.full_name || photographer?.email || "Fotógrafo"

    // Eliminar el vehículo de prueba después de un momento
    setTimeout(async () => {
      await supabase
        .from("fotos")
        .delete()
        .eq("id", testVehicle.id)
    }, 5000)

    return NextResponse.json({ 
      success: true, 
      message: "Trigger ejecutado correctamente",
      photographer: photographerName,
      testVehicle: testVehicle.id
    })

  } catch (error: any) {
    console.error("Error ejecutando trigger:", error)
    return NextResponse.json({ 
      message: "Error interno del servidor" 
    }, { status: 500 })
  }
} 