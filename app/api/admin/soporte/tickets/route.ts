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

    // 1. Obtener tickets del sistema actual (soporte_tickets)
    console.log("🔍 Consultando tabla soporte_tickets...")
    const { data: soporteTickets, error: soporteTicketsError } = await supabase
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

    if (soporteTicketsError) {
      console.error("❌ Error obteniendo tickets de soporte:", soporteTicketsError)
    } else {
      console.log("✅ Tickets de soporte encontrados:", soporteTickets?.length || 0)
    }

    // 2. Obtener incidencias del portal cliente (entregas)
    console.log("🔍 Consultando tabla entregas...")
    const { data: entregasIncidencias, error: entregasError } = await supabase
      .from("entregas")
      .select(`
        id,
        matricula,
        created_at,
        incidencias
      `)
      .not("incidencias", "is", null)
      .not("incidencias", "eq", "[]")
      .not("incidencias", "eq", "")

    if (entregasError) {
      console.error("❌ Error obteniendo incidencias de entregas:", entregasError)
    } else {
      console.log("✅ Entregas con incidencias encontradas:", entregasIncidencias?.length || 0)
    }

    // 3. Obtener incidencias del historial (incidencias_historial)
    console.log("🔍 Consultando tabla incidencias_historial...")
    const { data: historialIncidencias, error: historialError } = await supabase
      .from("incidencias_historial")
      .select(`
        id,
        entrega_id,
        matricula,
        tipo_incidencia,
        comentario,
        resuelta,
        fecha,
        created_at,
        usuario_id
      `)
      .order("created_at", { ascending: false })
      .limit(100) // Agregar límite para asegurar que se obtengan datos

    if (historialError) {
      console.error("❌ Error obteniendo incidencias del historial:", historialError)
    } else {
      console.log("✅ Incidencias del historial encontradas:", historialIncidencias?.length || 0)
      if (historialIncidencias && historialIncidencias.length > 0) {
        console.log("📋 Primeras 3 incidencias del historial:", historialIncidencias.slice(0, 3))
      }
    }

    // 4. Procesar tickets del sistema actual
    const ticketsFromSoporte = await Promise.all(
      (soporteTickets || []).map(async (ticket) => {
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
          id: `soporte_${ticket.id}`,
          source: "soporte",
          ticket_number: ticket.ticket_number,
          license_plate: ticket.license_plate,
          client_dni: ticket.client_dni,
          client_email: ticket.client_email,
          client_phone: ticket.client_phone,
          sale_date: ticket.sale_date,
          time_since_sale: ticket.time_since_sale,
          status: ticket.status,
          created_at: ticket.created_at,
          incidencias: (incidencias || []).map(inc => ({
            ...inc,
            source: "soporte"
          }))
        }
      })
    )

    // 5. Procesar incidencias de entregas (JSON)
    const ticketsFromEntregas = (entregasIncidencias || []).map((entrega) => {
      try {
        const incidenciasParsed = JSON.parse(entrega.incidencias)
        if (Array.isArray(incidenciasParsed)) {
          return {
            id: `entregas_${entrega.id}`,
            source: "entregas",
            ticket_number: `ENT-${entrega.matricula}`,
            license_plate: entrega.matricula,
            client_dni: "",
            client_email: "",
            client_phone: "",
            sale_date: "",
            time_since_sale: "",
            status: "abierto",
            created_at: entrega.created_at,
            incidencias: incidenciasParsed.map((inc, index) => ({
              id: `${entrega.id}_${index}`,
              tipo_incidencia: inc.tipo || "Sin especificar",
              descripcion: inc.descripcion || "Sin descripción",
              estado: inc.estado || "Abierta",
              respuesta_admin: "",
              respondido_at: null,
              created_at: inc.fecha || entrega.created_at,
              imagenes: [],
              archivos_admin: [],
              source: "entregas"
            }))
          }
        }
      } catch (error) {
        console.error("Error parseando incidencias de entrega:", error)
      }
      return null
    }).filter(Boolean)

    // 6. Procesar incidencias del historial
    console.log("🔧 Procesando incidencias del historial...")
    const ticketsFromHistorial = (historialIncidencias || []).map((incidencia) => {
      console.log("📋 Procesando incidencia:", incidencia.id, incidencia.matricula, incidencia.tipo_incidencia)
      return {
        id: `historial_${incidencia.id}`,
        source: "historial",
        ticket_number: `HIST-${incidencia.matricula}`,
        license_plate: incidencia.matricula,
        client_dni: "",
        client_email: "",
        client_phone: "",
        sale_date: "",
        time_since_sale: "",
        status: incidencia.resuelta ? "cerrado" : "abierto",
        created_at: incidencia.created_at,
        incidencias: [{
          id: incidencia.id,
          tipo_incidencia: incidencia.tipo_incidencia,
          descripcion: incidencia.comentario || "Sin descripción",
          estado: incidencia.resuelta ? "Cerrada" : "Abierta",
          respuesta_admin: "",
          respondido_at: null,
          created_at: incidencia.fecha || incidencia.created_at,
          imagenes: [],
          archivos_admin: [],
          source: "historial"
        }]
      }
    })
    console.log("✅ Tickets procesados del historial:", ticketsFromHistorial.length)

    // 7. Combinar todos los tickets
    const allTickets = [
      ...ticketsFromSoporte,
      ...ticketsFromEntregas,
      ...ticketsFromHistorial
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log("📊 Tickets encontrados:")
    console.log(`  - Soporte: ${ticketsFromSoporte.length}`)
    console.log(`  - Entregas: ${ticketsFromEntregas.length}`)
    console.log(`  - Historial: ${ticketsFromHistorial.length}`)
    console.log(`  - Total: ${allTickets.length}`)
    
    // Logs detallados para debugging
    if (soporteTickets && soporteTickets.length > 0) {
      console.log("📋 Ejemplo de ticket de soporte:", soporteTickets[0])
    }
    if (entregasIncidencias && entregasIncidencias.length > 0) {
      console.log("📋 Ejemplo de entrega con incidencias:", entregasIncidencias[0])
    }
    if (historialIncidencias && historialIncidencias.length > 0) {
      console.log("📋 Ejemplo de incidencia del historial:", historialIncidencias[0])
    }

    return NextResponse.json({ 
      tickets: allTickets,
      stats: {
        soporte: ticketsFromSoporte.length,
        entregas: ticketsFromEntregas.length,
        historial: ticketsFromHistorial.length,
        total: allTickets.length
      }
    })

  } catch (error) {
    console.error("Error en GET /api/admin/soporte/tickets:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
} 