import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    console.log("=== DEBUG DOCUWARE TABLES ===")
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
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
    let receivedEmails = null
    let emailsError = null
    
    try {
      const { data, error } = await supabase
        .from('received_emails')
        .select('*')
        .ilike('to_email', '%material@controlvo.ovh%')
        .order('received_at', { ascending: false })
        .limit(10)
      
      receivedEmails = data
      emailsError = error
    } catch (e) {
      emailsError = e
    }
    
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