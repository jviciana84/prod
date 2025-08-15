import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  console.log("🚀 API /admin/soporte/tickets-simple iniciado")
  
  try {
    const supabase = await createServerClient()
    
    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log("❌ Usuario no autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    
    console.log("✅ Usuario autorizado:", user.email)
    
    // Solo consultar incidencias_historial
    console.log("🔍 Consultando tabla incidencias_historial...")
    const { data: historialIncidencias, error: historialError } = await supabase
      .from("incidencias_historial")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(100)
    
    if (historialError) {
      console.error("❌ Error obteniendo incidencias del historial:", historialError)
      return NextResponse.json({ 
        error: "Error consultando historial", 
        details: historialError.message 
      }, { status: 500 })
    }
    
    console.log("✅ Incidencias del historial encontradas:", historialIncidencias?.length || 0)
    
    // Procesar incidencias del historial
    const ticketsFromHistorial = (historialIncidencias || []).map((incidencia) => {
      return {
        id: `historial_${incidencia.id}`,
        source: "historial",
        ticket_number: `HIST-${incidencia.matricula || "N/A"}-${incidencia.id?.substring(0, 4)}`,
        license_plate: incidencia.matricula,
        client_dni: null,
        client_email: null,
        client_phone: null,
        sale_date: null,
        time_since_sale: null,
        status: incidencia.resuelta ? "Cerrado" : "Abierto",
        created_at: incidencia.fecha,
        incidencias: [{
          id: incidencia.id,
          tipo_incidencia: incidencia.tipo_incidencia || "Sin especificar",
          descripcion: incidencia.comentario || "Sin descripción",
          fecha: incidencia.fecha || incidencia.created_at,
          estado: incidencia.resuelta ? "Cerrada" : "Abierta",
          prioridad: "Media"
        }]
      }
    })
    
    console.log("✅ Tickets procesados del historial:", ticketsFromHistorial.length)
    
    const response = NextResponse.json({ 
      tickets: ticketsFromHistorial,
      stats: {
        soporte: 0,
        entregas: 0,
        historial: ticketsFromHistorial.length,
        total: ticketsFromHistorial.length
      },
      debug: {
        message: "API simple ejecutándose correctamente",
        timestamp: new Date().toISOString(),
        count: ticketsFromHistorial.length
      }
    })
    
    // Agregar headers para evitar caché
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    console.log("✅ API simple completada, devolviendo respuesta")
    return response
    
  } catch (error) {
    console.error("Error en GET /api/admin/soporte/tickets-simple:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}
