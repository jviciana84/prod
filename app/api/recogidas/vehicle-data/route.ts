import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener matrícula de los parámetros
    const { searchParams } = new URL(request.url)
    const matricula = searchParams.get("matricula")

    if (!matricula) {
      return NextResponse.json({ error: "Matrícula requerida" }, { status: 400 })
    }

    // Buscar datos del vehículo en sales_vehicles
    const { data: vehicleData, error } = await supabase
      .from("sales_vehicles")
      .select("*")
      .eq("matricula", matricula.toUpperCase())
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No se encontró el vehículo
        return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
      }
      console.error("Error obteniendo datos del vehículo:", error)
      return NextResponse.json({ error: "Error obteniendo datos del vehículo" }, { status: 500 })
    }

    // Buscar también en la tabla entregas para obtener datos adicionales del cliente
    const { data: entregaData } = await supabase
      .from("entregas")
      .select("client_name, client_address, client_postal_code, client_city, client_province, client_phone, client_email")
      .eq("matricula", matricula.toUpperCase())
      .single()

    // Combinar datos del vehículo y entrega
    const combinedData = {
      ...vehicleData,
      ...entregaData,
    }

    return NextResponse.json({ vehicleData: combinedData })
  } catch (error) {
    console.error("Error en GET /api/recogidas/vehicle-data:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 