import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("=== VERIFICANDO ESTRUCTURA DE TABLAS ===")
    
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
    
    // Verificar tabla docuware_requests
    const { data: requestsData, error: requestsError } = await supabase
      .from('docuware_requests')
      .select('*')
      .limit(1)
    
    if (requestsError) {
      return NextResponse.json({
        success: false,
        message: "Error accediendo a docuware_requests",
        error: requestsError.message
      })
    }
    
    // Verificar tabla docuware_request_materials
    const { data: materialsData, error: materialsError } = await supabase
      .from('docuware_request_materials')
      .select('*')
      .limit(1)
    
    if (materialsError) {
      return NextResponse.json({
        success: false,
        message: "Error accediendo a docuware_request_materials",
        error: materialsError.message
      })
    }
    
    return NextResponse.json({
      success: true,
      message: "Estructura de tablas verificada",
      docuware_requests: {
        accessible: true,
        sampleData: requestsData,
        columnNames: requestsData && requestsData.length > 0 ? Object.keys(requestsData[0]) : []
      },
      docuware_request_materials: {
        accessible: true,
        sampleData: materialsData,
        columnNames: materialsData && materialsData.length > 0 ? Object.keys(materialsData[0]) : []
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Error verificando tablas",
      error: error.message
    })
  }
} 