import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("=== VERIFICANDO DATOS DE TABLA DOCUWARE_REQUESTS ===")
    
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
    
    // Consultar datos actuales
    const { data: currentData, error: dataError } = await supabase
      .from('docuware_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (dataError) {
      console.error("Error consultando datos:", dataError)
      return NextResponse.json({
        success: false,
        message: "Error consultando datos",
        error: dataError.message
      })
    }
    
    // Verificar si hay duplicados por email_subject o messageId
    const subjects = currentData?.map(r => r.email_subject) || []
    const uniqueSubjects = [...new Set(subjects)]
    
    const messageIds = currentData?.map(r => r.message_id).filter(id => id) || []
    const uniqueMessageIds = [...new Set(messageIds)]
    
    return NextResponse.json({
      success: true,
      message: "Datos consultados correctamente",
      data: {
        totalRecords: currentData?.length || 0,
        uniqueSubjects: uniqueSubjects.length,
        uniqueMessageIds: uniqueMessageIds.length,
        records: currentData,
        duplicateAnalysis: {
          hasSubjectDuplicates: subjects.length !== uniqueSubjects.length,
          hasMessageIdDuplicates: messageIds.length !== uniqueMessageIds.length,
          subjects: subjects,
          messageIds: messageIds
        }
      }
    })
    
  } catch (error: any) {
    console.error("Error verificando datos:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno",
      error: error.message
    })
  }
} 