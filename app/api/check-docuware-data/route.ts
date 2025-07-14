import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("=== CONSULTANDO DATOS DE DOCUWARE ===")
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        message: "Variables de entorno de Supabase no definidas"
      })
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    // Consultar solicitudes
    const { data: requests, error: requestsError } = await supabase
      .from('docuware_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (requestsError) {
      return NextResponse.json({
        success: false,
        message: "Error consultando solicitudes",
        error: requestsError.message
      })
    }
    
    // Consultar materiales
    const { data: materials, error: materialsError } = await supabase
      .from('docuware_request_materials')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (materialsError) {
      return NextResponse.json({
        success: false,
        message: "Error consultando materiales",
        error: materialsError.message
      })
    }
    
    return NextResponse.json({
      success: true,
      message: "Datos consultados correctamente",
      requests: {
        count: requests?.length || 0,
        data: requests || []
      },
      materials: {
        count: materials?.length || 0,
        data: materials || []
      }
    })
    
  } catch (error: any) {
    console.error("Error consultando datos:", error)
    return NextResponse.json({
      success: false,
      message: "Error consultando datos",
      error: error.message
    })
  }
} 