import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Añadiendo material a solicitud Docuware")
    
    const body = await request.json()
    const { requestId, materialType, materialLabel } = body
    
    if (!requestId || !materialType || !materialLabel) {
      return NextResponse.json({ 
        success: false, 
        message: "Faltan datos requeridos" 
      }, { status: 400 })
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verificar que la solicitud existe
    const { data: existingRequest, error: requestError } = await supabase
      .from("docuware_requests")
      .select("id")
      .eq("id", requestId)
      .single()
    
    if (requestError || !existingRequest) {
      console.error("❌ Solicitud no encontrada:", requestError)
      return NextResponse.json({ 
        success: false, 
        message: "Solicitud no encontrada" 
      }, { status: 404 })
    }
    
    // Verificar si ya existe este material para esta solicitud
    const { data: existingMaterial, error: checkError } = await supabase
      .from("docuware_request_materials")
      .select("id")
      .eq("docuware_request_id", requestId)
      .eq("material_type", materialType)
      .single()
    
    if (existingMaterial) {
      console.log("⚠️ Material ya existe para esta solicitud")
      return NextResponse.json({ 
        success: false, 
        message: "Este material ya existe para esta solicitud" 
      }, { status: 409 })
    }
    
    // Añadir el nuevo material
    const { data: newMaterial, error: insertError } = await supabase
      .from("docuware_request_materials")
      .insert({
        docuware_request_id: requestId,
        material_type: materialType,
        material_label: materialLabel,
        selected: true,
        observations: ""
      })
      .select()
      .single()
    
    if (insertError) {
      console.error("❌ Error añadiendo material:", insertError)
      return NextResponse.json({ 
        success: false, 
        message: "Error añadiendo material" 
      }, { status: 500 })
    }
    
    console.log("✅ Material añadido correctamente:", newMaterial.id)
    
    return NextResponse.json({
      success: true,
      message: "Material añadido correctamente",
      material: newMaterial
    })
    
  } catch (error: any) {
    console.error("❌ Error crítico añadiendo material:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Error interno del servidor",
      error: error.message
    }, { status: 500 })
  }
} 