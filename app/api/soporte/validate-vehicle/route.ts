import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { license_plate, client_dni } = await request.json()

    if (!license_plate || !client_dni) {
      return NextResponse.json(
        { error: "Matrícula y DNI son requeridos" },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Buscar el vehículo en sales_vehicles
    const { data: vehicle, error } = await supabase
      .from("sales_vehicles")
      .select(`
        license_plate,
        model,
        client_email,
        client_phone,
        sale_date,
        advisor,
        advisor_name
      `)
      .eq("license_plate", license_plate.toUpperCase())
      .eq("client_dni", client_dni.toUpperCase())
      .single()

    if (error || !vehicle) {
      return NextResponse.json(
        { error: "Revisa el pedido de venta, los datos introducidos no son correctos." },
        { status: 404 }
      )
    }

    // Calcular tiempo desde la venta
    const saleDate = new Date(vehicle.sale_date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - saleDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    let timeSinceSale = ""
    if (diffDays < 30) {
      timeSinceSale = `${diffDays} día${diffDays > 1 ? 's' : ''}`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      const remainingDays = diffDays % 30
      timeSinceSale = `${months} mes${months > 1 ? 'es' : ''}`
      if (remainingDays > 0) {
        timeSinceSale += ` ${remainingDays} día${remainingDays > 1 ? 's' : ''}`
      }
    } else {
      const years = Math.floor(diffDays / 365)
      const remainingDays = diffDays % 365
      const months = Math.floor(remainingDays / 30)
      const finalDays = remainingDays % 30
      
      timeSinceSale = `${years} año${years > 1 ? 's' : ''}`
      if (months > 0) {
        timeSinceSale += ` ${months} mes${months > 1 ? 'es' : ''}`
      }
      if (finalDays > 0) {
        timeSinceSale += ` ${finalDays} día${finalDays > 1 ? 's' : ''}`
      }
    }

    return NextResponse.json({
      vehicle: {
        ...vehicle,
        time_since_sale: timeSinceSale
      }
    })

  } catch (error) {
    console.error("Error validando vehículo:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 