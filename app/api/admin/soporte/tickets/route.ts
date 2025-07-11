import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verificar autenticación
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener todos los tickets con sus incidencias
    const { data: tickets, error: ticketsError } = await supabase
      .from("soporte_tickets")
      .select(`
        id,
        ticket_number,
        license_plate,
        client_dni,
        client_email,
        client_phone,
        sale_date,
        time_since_sale,
        status,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (ticketsError) {
      console.error("Error obteniendo tickets:", ticketsError)
      return NextResponse.json(
        { error: "Error obteniendo tickets" },
        { status: 500 }
      )
    }

    // Para cada ticket, obtener sus incidencias
    const ticketsWithIncidencias = await Promise.all(
      tickets.map(async (ticket) => {
        const { data: incidencias } = await supabase
          .from("soporte_incidencias")
          .select(`
            id,
            tipo_incidencia,
            descripcion,
            estado,
            respuesta_admin,
            respondido_at,
            created_at,
            imagenes,
            archivos_admin
          `)
          .eq("ticket_id", ticket.id)
          .order("created_at", { ascending: true })

        return {
          ...ticket,
          incidencias: incidencias || []
        }
      })
    )

    return NextResponse.json({ tickets: ticketsWithIncidencias })

  } catch (error) {
    console.error("Error en GET /api/admin/soporte/tickets:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 