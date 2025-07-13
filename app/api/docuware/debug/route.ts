import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("=== DEBUG DOCUWARE TABLES ===")
    
    const supabase = createClient()
    
    // Verificar si las tablas existen
    const { data: requests, error: requestsError } = await supabase
      .from('docuware_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    const { data: materials, error: materialsError } = await supabase
      .from('docuware_request_materials')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Verificar emails recibidos para material@controlvo.ovh
    const { data: receivedEmails, error: emailsError } = await supabase
      .from('received_emails')
      .select('*')
      .ilike('to_email', '%material@controlvo.ovh%')
      .order('received_at', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      success: true,
      tables: {
        docuware_requests: {
          count: requests?.length || 0,
          data: requests,
          error: requestsError?.message
        },
        docuware_request_materials: {
          count: materials?.length || 0,
          data: materials,
          error: materialsError?.message
        },
        received_emails_material: {
          count: receivedEmails?.length || 0,
          data: receivedEmails,
          error: emailsError?.message
        }
      }
    })
    
  } catch (error: any) {
    console.error("Error en debug Docuware:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Error interno del servidor",
      error: error.message
    }, { status: 500 })
  }
} 