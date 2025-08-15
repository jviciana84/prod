import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // 1. Obtener tickets del sistema actual (soporte_tickets)
    const { data: soporteTickets } = await supabase
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

    // 2. Obtener incidencias del portal cliente (entregas)
    const { data: entregasIncidencias } = await supabase
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

    // 3. Obtener incidencias del historial (incidencias_historial)
    const { data: historialIncidencias } = await supabase
      .from("incidencias_historial")
      .select(`
        id,
        entrega_id,
        matricula,
        tipo_incidencia,
        comentario,
        resuelta,
        fecha,
        usuario_id
      `)
      .order("fecha", { ascending: false })
      .limit(100)

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

    // Función para obtener datos del vehículo por matrícula
    const getVehicleData = async (matricula: string) => {
      try {
        const { data: salesRecord } = await supabase
          .from("sales_vehicles")
          .select("*")
          .eq("license_plate", matricula)
          .single()

        const { data: stockRecord } = await supabase
          .from("stock")
          .select("*")
          .eq("license_plate", matricula)
          .single()

        const { data: garantiasRecord } = await supabase
          .from("garantias_brutas_MM")
          .select("*")
          .eq("matricula", matricula)
          .single()

        const { data: garantiasMmcRecord } = await supabase
          .from("garantias_brutas_MMC")
          .select("*")
          .eq("matricula", matricula)
          .single()

        const { data: entregasRecord } = await supabase
          .from("entregas")
          .select("*")
          .eq("matricula", matricula)
          .single()

        return {
          sales: salesRecord,
          stock: stockRecord,
          garantias: garantiasRecord || garantiasMmcRecord,
          entrega: entregasRecord
        }
      } catch (error) {
        return null
      }
    }

    // 6. Procesar incidencias del historial
    const ticketsFromHistorial = await Promise.all(
      (historialIncidencias || []).map(async (incidencia) => {
        const vehicleData = await getVehicleData(incidencia.matricula)
        
        const ticket = {
          id: `historial_${incidencia.id}`,
          source: "historial",
          ticket_number: `HIST-${incidencia.matricula}`,
          license_plate: incidencia.matricula,
          client_dni: vehicleData?.sales?.client_dni || vehicleData?.stock?.client_dni || "",
          client_email: vehicleData?.sales?.client_email || vehicleData?.stock?.client_email || "",
          client_phone: vehicleData?.sales?.client_phone || vehicleData?.stock?.client_phone || "",
          sale_date: vehicleData?.sales?.sale_date || vehicleData?.stock?.sale_date || "",
          time_since_sale: vehicleData?.sales?.time_since_sale || "",
          status: incidencia.resuelta ? "cerrado" : "abierto",
          created_at: incidencia.fecha,
          vehicle_data: {
            marca: vehicleData?.sales?.brand || vehicleData?.stock?.brand || vehicleData?.garantias?.marca || "",
            modelo: vehicleData?.sales?.model || vehicleData?.stock?.model || vehicleData?.garantias?.modelo || "",
            año: vehicleData?.sales?.year || vehicleData?.stock?.year || "",
            kilometraje: vehicleData?.sales?.mileage || vehicleData?.stock?.mileage || vehicleData?.garantias?.kms || "",
            combustible: vehicleData?.sales?.fuel_type || vehicleData?.stock?.fuel_type || vehicleData?.garantias?.combustible || "",
            bastidor: vehicleData?.sales?.vin || vehicleData?.stock?.vin || vehicleData?.garantias?.chasis || "",
            fecha_matriculacion: vehicleData?.sales?.registration_date || vehicleData?.garantias?.["f_matricula"] || "",
            fecha_entrega: vehicleData?.entrega?.fecha_entrega || vehicleData?.entrega?.fecha || "",
            precio_venta: vehicleData?.sales?.sale_price || vehicleData?.garantias?.precio_venta || "",
            descuento: vehicleData?.sales?.discount || "",
            asesor: vehicleData?.sales?.sales_advisor || "",
            garantia_info: vehicleData?.garantias ? {
              tipo: vehicleData.garantias["f_fin"] ? "Extendida" : "Fábrica",
              fecha_fin: vehicleData.garantias["f_fin"] || "",
              descripcion: vehicleData.garantias["f_fin"] ? 
                `Garantía extendida hasta ${vehicleData.garantias["f_fin"]}` : 
                "Garantía de fábrica (36 meses)"
            } : null
          },
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
        
        return ticket
      })
    )

    // 7. Combinar todos los tickets
    const allTickets = [
      ...ticketsFromSoporte,
      ...ticketsFromEntregas,
      ...ticketsFromHistorial
    ].sort((a, b) => new Date(b.created_at || b.fecha).getTime() - new Date(a.created_at || a.fecha).getTime())

    const response = NextResponse.json({ 
      tickets: allTickets,
      stats: {
        soporte: ticketsFromSoporte.length,
        entregas: ticketsFromEntregas.length,
        historial: ticketsFromHistorial.length,
        total: allTickets.length
      }
    })
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    console.error("Error en GET /api/admin/soporte/tickets:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
} 