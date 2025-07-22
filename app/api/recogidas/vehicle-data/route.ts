import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    console.log("=== INICIANDO VEHICLE-DATA API ===")
    
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("Error de autenticación:", userError)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("Usuario autenticado:", user.id)

    // Obtener matrícula de los parámetros
    const { searchParams } = new URL(request.url)
    const matricula = searchParams.get("matricula")

    if (!matricula) {
      console.log("Matrícula no proporcionada")
      return NextResponse.json({ error: "Matrícula requerida" }, { status: 400 })
    }

    console.log("Buscando matrícula:", matricula.toUpperCase())

    // Buscar datos del vehículo en sales_vehicles (única tabla con datos del cliente)
    console.log("Consultando sales_vehicles...")
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("sales_vehicles")
      .select("*")
      .eq("license_plate", matricula.toUpperCase())
      .single()

    console.log("Resultado sales_vehicles:", { data: vehicleData, error: vehicleError })

    if (vehicleError) {
      if (vehicleError.code === "PGRST116") {
        console.log("Vehículo no encontrado en sales_vehicles")
        return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
      } else {
        console.error("Error obteniendo datos del vehículo:", vehicleError)
        return NextResponse.json({ error: "Error obteniendo datos del vehículo" }, { status: 500 })
      }
    }

    console.log("Datos del vehículo encontrados:", vehicleData)
    return NextResponse.json({ vehicleData })
  } catch (error) {
    console.error("Error en GET /api/recogidas/vehicle-data:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 