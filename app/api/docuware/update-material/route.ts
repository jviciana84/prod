import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Actualizando estado de material...")
    
    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const body = await request.json()
    const { materialId, selected, observations } = body

    if (!materialId) {
      return NextResponse.json({ error: "ID de material requerido" }, { status: 400 })
    }

    console.log(`📝 Actualizando material ${materialId}:`, { selected, observations })

    // Actualizar el material
    const { data: updatedMaterial, error: updateError } = await supabase
      .from("docuware_request_materials")
      .update({ 
        selected: selected !== undefined ? selected : true,
        observations: observations || ''
      })
      .eq("id", materialId)
      .select()
      .single()

    if (updateError) {
      console.error("❌ Error actualizando material:", updateError)
      return NextResponse.json({ error: "Error actualizando material" }, { status: 500 })
    }

    // Obtener la solicitud completa para verificar si todos los materiales están completados
    const { data: docuwareRequest, error: requestError } = await supabase
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
      .eq("id", updatedMaterial.docuware_request_id)
      .single()

    if (requestError) {
      console.error("❌ Error obteniendo solicitud:", requestError)
      return NextResponse.json({ error: "Error obteniendo solicitud" }, { status: 500 })
    }

    // Verificar si todos los materiales están seleccionados
    const allMaterialsSelected = docuwareRequest.docuware_request_materials.every(
      (material: any) => material.selected
    )

    // Si todos los materiales están seleccionados, actualizar el estado de la solicitud
    if (allMaterialsSelected) {
      const { error: statusError } = await supabase
        .from("docuware_requests")
        .update({ status: 'completed' })
        .eq("id", docuwareRequest.id)

      if (statusError) {
        console.error("❌ Error actualizando estado de solicitud:", statusError)
      } else {
        console.log("✅ Solicitud marcada como completada")
      }
    }

    console.log("✅ Material actualizado correctamente")

    return NextResponse.json({
      success: true,
      message: "Material actualizado correctamente",
      material: updatedMaterial,
      allCompleted: allMaterialsSelected
    })

  } catch (error) {
    console.error("❌ Error crítico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 