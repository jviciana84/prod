import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const licensePlate = searchParams.get("licensePlate")?.toUpperCase()

    if (!licensePlate) {
      return NextResponse.json({ error: "Matrícula no proporcionada" }, { status: 400 })
    }

    console.log(`Consultando datos para matrícula: ${licensePlate}`)

    // 1. Buscar en nuestra base de datos de vehículos
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    try {
      const { data: vehicleData, error } = await supabase
        .from("vehicles_database")
        .select("*")
        .eq("license_plate", licensePlate)
        .maybeSingle()

      if (vehicleData) {
        console.log("Vehículo encontrado en base de datos local:", vehicleData)
        return NextResponse.json(vehicleData)
      }
    } catch (dbError) {
      console.error("Error al consultar vehicles_database:", dbError)
      // Continuamos con la siguiente fuente de datos
    }

    // 2. Buscar en la tabla de transportes existentes
    try {
      const { data: transportData, error: transportError } = await supabase
        .from("vehicle_transport")
        .select("model")
        .eq("license_plate", licensePlate)
        .order("created_at", { ascending: false })
        .limit(1)

      if (transportData && transportData.length > 0) {
        console.log("Vehículo encontrado en transportes:", transportData[0])

        // Extraer marca y modelo si es posible
        const modelText = transportData[0].model
        const parts = modelText.split(" ")

        let vehicleInfo = {
          license_plate: licensePlate,
          model: modelText,
          source: "transport_table",
        }

        if (parts.length > 1) {
          vehicleInfo = {
            ...vehicleInfo,
            brand: parts[0],
            model: parts.slice(1).join(" "),
          }
        }

        return NextResponse.json(vehicleInfo)
      }
    } catch (transportError) {
      console.error("Error al consultar vehicle_transport:", transportError)
    }

    // 3. Si no se encuentra en ninguna fuente
    return NextResponse.json(
      {
        error: "Vehículo no encontrado",
        license_plate: licensePlate,
      },
      { status: 404 },
    )
  } catch (error: any) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

// Endpoint para guardar datos de vehículos manualmente
export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const body = await request.json()
    const { license_plate, brand, model, year, fuel_type } = body

    if (!license_plate || !model) {
      return NextResponse.json(
        {
          error: "Faltan datos obligatorios (matrícula y modelo)",
        },
        { status: 400 },
      )
    }

    // Guardar en la base de datos
    try {
      const { data, error } = await supabase
        .from("vehicles_database")
        .upsert({
          license_plate: license_plate.toUpperCase(),
          brand,
          model,
          year: year ? Number.parseInt(year) : null,
          fuel_type,
          source: "manual",
          last_updated: new Date().toISOString(),
        })
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({
        message: "Datos guardados correctamente",
        data,
      })
    } catch (dbError: any) {
      console.error("Error al guardar en la base de datos:", dbError)
      return NextResponse.json(
        {
          error: "Error al guardar en la base de datos",
          message: dbError.message,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error al guardar datos del vehículo:", error)
    return NextResponse.json(
      {
        error: "Error al guardar datos",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
