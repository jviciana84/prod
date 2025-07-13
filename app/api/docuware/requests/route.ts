import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    console.log("📧 Obteniendo solicitudes Docuware...")

    // Obtener solicitudes con sus materiales
    const { data: requests, error } = await supabase
      .from("docuware_requests")
      .select(`
        *,
        docuware_request_materials (
          id,
          material_type,
          material_label,
          selected,
          observations
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error obteniendo solicitudes:", error)
      return NextResponse.json({ error: "Error obteniendo solicitudes" }, { status: 500 })
    }

    console.log(`✅ Solicitudes obtenidas: ${requests?.length || 0}`)
    console.log("📋 Datos de solicitudes:", JSON.stringify(requests, null, 2))

    return NextResponse.json({
      success: true,
      requests: requests || []
    })
  } catch (error) {
    console.error("❌ Error crítico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
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
        .from("docuware_requests")
        .select(`
          *,
          docuware_request_materials!inner (
            id,
            material_type,
            material_label,
            selected,
            observations
          )
        `)
        .eq("id", requestIdPart)
        .eq("docuware_request_materials.material_type", materialType)
        .single()

      if (requestError || !request) {
        console.error(`❌ Error obteniendo solicitud ${requestId}:`, requestError)
        continue
      }

      // Crear movimiento en el sistema de llaves
      const material = request.docuware_request_materials[0]
      
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
        .from("docuware_request_materials")
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