import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("🚀 Iniciando GET /api/docuware/requests")
    
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log("✅ Cliente Supabase creado")

    console.log("📧 Obteniendo solicitudes Docuware...")

    // Obtener solo las solicitudes básicas
    const { data: requests, error } = await supabase
      .from("key_document_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error obteniendo solicitudes:", error)
      console.error("❌ Detalles del error:", JSON.stringify(error, null, 2))
      return NextResponse.json({ error: "Error obteniendo solicitudes" }, { status: 500 })
    }

    console.log(`✅ Solicitudes obtenidas: ${requests?.length || 0}`)
    
    // Obtener materiales para cada solicitud
    const requestsWithMaterials = []
    
    if (requests) {
      for (const request of requests) {
        const { data: materials, error: materialsError } = await supabase
          .from("key_document_materials")
          .select("*")
          .eq("key_document_request_id", request.id)
        
        if (materialsError) {
          console.error(`❌ Error obteniendo materiales para ${request.id}:`, materialsError)
        }
        
        requestsWithMaterials.push({
          ...request,
          key_document_materials: materials || []
        })
      }
    }
    
    console.log("📋 Datos de solicitudes con materiales:", JSON.stringify(requestsWithMaterials, null, 2))

    return NextResponse.json({
      success: true,
      requests: requestsWithMaterials
    })
  } catch (error) {
    console.error("❌ Error crítico:", error)
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()

    console.log("📧 Procesando solicitudes confirmadas...")

    const { confirmedRequests } = body

    if (!confirmedRequests || !Array.isArray(confirmedRequests)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    // Procesar cada solicitud confirmada
    for (const requestId of confirmedRequests) {
      // Extraer ID de solicitud y tipo de material del formato "requestId-materialType"
      const [requestIdPart, materialType] = requestId.split("-")
      
      if (!requestIdPart || !materialType) {
        console.warn(`⚠️ Formato inválido de requestId: ${requestId}`)
        continue
      }

      // Obtener la solicitud
      const { data: request, error: requestError } = await supabase
        .from("key_document_requests")
        .select(`
          *,
          key_document_materials (
            id,
            material_type,
            material_label,
            selected,
            observations
          )
        `)
        .eq("id", requestIdPart)
        .eq("key_document_materials.material_type", materialType)
        .single()

      if (requestError || !request) {
        console.error(`❌ Error obteniendo solicitud ${requestId}:`, requestError)
        continue
      }

      // Crear movimiento en el sistema de llaves
      const material = request.key_document_materials[0]
      
      if (!material) {
        console.warn(`⚠️ No se encontró material para ${requestId}`)
        continue
      }

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error("❌ Usuario no autenticado")
        continue
      }

      // Buscar o crear vehículo
      let vehicleId = null
      
      // Buscar en sales_vehicles
      const { data: salesVehicle } = await supabase
        .from("sales_vehicles")
        .select("id")
        .eq("license_plate", request.license_plate.toUpperCase())
        .single()

      if (salesVehicle) {
        vehicleId = salesVehicle.id
      } else {
        // Buscar en nuevas_entradas
        const { data: nuevaEntrada } = await supabase
          .from("nuevas_entradas")
          .select("id")
          .eq("license_plate", request.license_plate.toUpperCase())
          .single()

        if (nuevaEntrada) {
          vehicleId = nuevaEntrada.id
        } else {
          // Crear en external_material_vehicles
          const { data: newVehicle, error: createError } = await supabase
            .from("external_material_vehicles")
            .insert({ license_plate: request.license_plate.toUpperCase() })
            .select("id")
            .single()

          if (createError) {
            console.error(`❌ Error creando vehículo externo:`, createError)
            continue
          }
          vehicleId = newVehicle.id
        }
      }

      // Crear movimiento
      const { error: movementError } = await supabase
        .from("key_movements")
        .insert({
          vehicle_id: vehicleId,
          key_type: materialType,
          from_user_id: user.id,
          to_user_id: request.requester,
          reason: `Solicitud Docuware - ${material.observations || ""}`,
          confirmed: true,
          confirmed_at: new Date().toISOString()
        })

      if (movementError) {
        console.error(`❌ Error creando movimiento:`, movementError)
        continue
      }

      // Actualizar estado de la solicitud
      const { error: updateError } = await supabase
        .from("key_document_materials")
        .update({ selected: false })
        .eq("id", material.id)

      if (updateError) {
        console.error(`❌ Error actualizando material:`, updateError)
      }

      console.log(`✅ Solicitud ${requestId} procesada correctamente`)
    }

    return NextResponse.json({
      success: true,
      message: `${confirmedRequests.length} solicitudes procesadas`
    })
  } catch (error) {
    console.error("❌ Error crítico procesando solicitudes:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 