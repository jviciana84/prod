import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔄 Iniciando sincronización de solicitudes de permiso de circulación...")

    // Primero verificar si las tablas existen
    const { data: tableCheck, error: tableError } = await supabase
      .from("circulation_permit_requests")
      .select("id")
      .limit(1)

    if (tableError) {
      console.error("❌ Error verificando tabla circulation_permit_requests:", tableError)
      return NextResponse.json({ 
        error: "Tabla circulation_permit_requests no existe o no es accesible",
        details: tableError.message 
      }, { status: 500 })
    }

    console.log("✅ Tabla circulation_permit_requests accesible")

    // Obtener entregas con fecha_entrega (TODAS las entregas, no solo las del usuario)
    const { data: entregas, error: entregasError } = await supabase
      .from("entregas")
      .select("id, matricula, modelo, asesor, fecha_entrega")
      .not("asesor", "is", null)
      .neq("asesor", "")
      .not("fecha_entrega", "is", null)

    if (entregasError) {
      console.error("❌ Error obteniendo entregas:", entregasError)
      return NextResponse.json({ 
        error: "Error obteniendo entregas",
        details: entregasError.message 
      }, { status: 500 })
    }

    console.log(`📦 Encontradas ${entregas?.length || 0} entregas con fecha_entrega`)
    console.log("📋 Muestra de entregas:", entregas?.slice(0, 3))

    if (!entregas || entregas.length === 0) {
      return NextResponse.json({ 
        message: "No hay entregas con fecha_entrega para procesar",
        created: 0 
      })
    }

    // Obtener solicitudes existentes
    const { data: existingRequests, error: existingError } = await supabase
      .from("circulation_permit_requests")
      .select("entrega_id")

    if (existingError) {
      console.error("❌ Error obteniendo solicitudes existentes:", existingError)
      return NextResponse.json({ 
        error: "Error obteniendo solicitudes existentes",
        details: existingError.message 
      }, { status: 500 })
    }

    const existingEntregaIds = new Set(existingRequests?.map(r => r.entrega_id) || [])
    console.log(`📋 Solicitudes existentes: ${existingEntregaIds.size}`)

    // Filtrar entregas que no tienen solicitud
    const entregasSinSolicitud = entregas.filter(entrega => !existingEntregaIds.has(entrega.id))
    console.log(`🆕 Entregas sin solicitud: ${entregasSinSolicitud.length}`)

    if (entregasSinSolicitud.length === 0) {
      return NextResponse.json({ 
        message: "Todas las entregas ya tienen solicitudes de permiso de circulación",
        created: 0 
      })
    }

    // Crear solicitudes para las entregas que no las tienen
    const solicitudesACrear = entregasSinSolicitud.map(entrega => ({
      entrega_id: entrega.id,
      license_plate: entrega.matricula,
      model: entrega.modelo,
      asesor_alias: entrega.asesor,
      request_date: entrega.fecha_entrega || new Date().toISOString(),
      status: "pending",
      observations: ""
    }))

    console.log(`📝 Creando ${solicitudesACrear.length} solicitudes...`)
    console.log("📋 Primera solicitud a crear:", solicitudesACrear[0])

    const { data: solicitudesCreadas, error: createError } = await supabase
      .from("circulation_permit_requests")
      .insert(solicitudesACrear)
      .select()

    if (createError) {
      console.error("❌ Error creando solicitudes:", createError)
      return NextResponse.json({ 
        error: "Error creando solicitudes",
        details: createError.message 
      }, { status: 500 })
    }

    console.log(`✅ ${solicitudesCreadas?.length || 0} solicitudes creadas`)

    // Crear materiales para cada solicitud
    const materialesACrear = solicitudesCreadas?.map(solicitud => ({
      circulation_permit_request_id: solicitud.id,
      material_type: "circulation_permit",
      material_label: "Permiso de Circulación",
      selected: false,
      observations: ""
    })) || []

    if (materialesACrear.length > 0) {
      const { error: materialesError } = await supabase
        .from("circulation_permit_materials")
        .insert(materialesACrear)

      if (materialesError) {
        console.error("❌ Error creando materiales:", materialesError)
        // No fallar aquí, solo log del error
      } else {
        console.log(`✅ ${materialesACrear.length} materiales creados`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización completada`,
      created: solicitudesCreadas?.length || 0,
      total_entregas: entregas.length,
      existing_requests: existingEntregaIds.size
    })

  } catch (error) {
    console.error("❌ Error en sincronización:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
} 