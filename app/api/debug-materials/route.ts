import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("🔍 Debug de materiales...")
    
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Obtener todas las solicitudes con sus materiales
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

    // Contar materiales por tipo y estado
    const materialCounts = {
      second_key: { total: 0, selected: 0, pending: 0 },
      technical_sheet: { total: 0, selected: 0, pending: 0 },
      card_key: { total: 0, selected: 0, pending: 0 },
      circulation_permit: { total: 0, selected: 0, pending: 0 }
    }

    const materialsDetails = []

    requests?.forEach(request => {
      request.docuware_request_materials?.forEach(material => {
        // Contar por tipo
        if (materialCounts[material.material_type]) {
          materialCounts[material.material_type].total++
          if (material.selected) {
            materialCounts[material.material_type].selected++
          } else {
            materialCounts[material.material_type].pending++
          }
        }

        // Detalles del material
        materialsDetails.push({
          requestId: request.id,
          materialId: material.id,
          type: material.material_type,
          label: material.material_label,
          selected: material.selected,
          observations: material.observations
        })
      })
    })

    return NextResponse.json({
      success: true,
      totalRequests: requests?.length || 0,
      materialCounts,
      materialsDetails,
      requests: requests
    })
  } catch (error) {
    console.error("❌ Error crítico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 