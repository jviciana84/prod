import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function DELETE(request: NextRequest) {
  try {
    console.log("🚀 Eliminando material de solicitud Docuware")
    
    const body = await request.json()
    const { requestId, materialId } = body
    
    if (!requestId || !materialId) {
      return NextResponse.json({ 
        success: false, 
        message: "Faltan datos requeridos" 
      }, { status: 400 })
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verificar que el material existe y no es el principal
    const { data: material, error: materialError } = await supabase
      .from("docuware_request_materials")
      .select("material_type")
      .eq("id", materialId)
      .single()
    
    if (materialError || !material) {
      console.error("❌ Material no encontrado:", materialError)
      return NextResponse.json({ 
        success: false, 
        message: "Material no encontrado" 
      }, { status: 404 })
    }
    
    // No permitir eliminar materiales principales (2ª llave o ficha técnica)
    if (material.material_type === "second_key" || material.material_type === "technical_sheet") {
      return NextResponse.json({ 
        success: false, 
        message: "No se puede eliminar el material principal" 
      }, { status: 400 })
    }
    
    // Eliminar el material
    const { error: deleteError } = await supabase
      .from("docuware_request_materials")
      .delete()
      .eq("id", materialId)
    
    if (deleteError) {
      console.error("❌ Error eliminando material:", deleteError)
      return NextResponse.json({ 
        success: false, 
        message: "Error eliminando material" 
      }, { status: 500 })
    }
    
    console.log("✅ Material eliminado correctamente")
    
    return NextResponse.json({
      success: true,
      message: "Material eliminado correctamente"
    })
    
  } catch (error: any) {
    console.error("❌ Error crítico eliminando material:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Error interno del servidor",
      error: error.message
    }, { status: 500 })
  }
} 