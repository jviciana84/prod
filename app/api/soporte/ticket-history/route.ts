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

    // Buscar tickets del cliente
    const { data: tickets, error: ticketsError } = await supabase
      .from("soporte_tickets")
      .select(`
        id,
        ticket_number,
        created_at,
        time_since_sale,
        client_email,
        client_phone,
        status
      `)
      .eq("license_plate", license_plate.toUpperCase())
      .eq("client_dni", client_dni.toUpperCase())
      .order("created_at", { ascending: false })

    if (ticketsError) {
      console.error("Error obteniendo tickets:", ticketsError)
      return NextResponse.json(
        { error: "Error obteniendo historial" },
        { status: 500 }
      )
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron tickets para este vehículo" },
        { status: 404 }
      )
    }

    // Obtener el ticket más reciente con sus incidencias
    const latestTicket = tickets[0]
    
    const { data: incidencias, error: incidenciasError } = await supabase
      .from("soporte_incidencias")
      .select(`
        id,
        tipo_incidencia,
        descripcion,
        estado,
        respuesta_admin,
        respondido_at,
        created_at
      `)
      .eq("ticket_id", latestTicket.id)
      .order("created_at", { ascending: true })

    if (incidenciasError) {
      console.error("Error obteniendo incidencias:", incidenciasError)
    }

    return NextResponse.json({
      ticket: {
        ...latestTicket,
        incidencias: incidencias || []
      }
    })

  } catch (error) {
    console.error("Error obteniendo historial:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 