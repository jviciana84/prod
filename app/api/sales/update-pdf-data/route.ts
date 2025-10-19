import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { pdfExtractionId, pdfData, vehicleId, salesData } = body

    if (!pdfExtractionId || !vehicleId) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
    }

    // 1. Actualizar pdf_extracted_data
    if (pdfData) {
      const { error: pdfError } = await supabase
        .from("pdf_extracted_data")
        .update(pdfData)
        .eq("id", pdfExtractionId)

      if (pdfError) {
        console.error("❌ [API] Error updating PDF data:", pdfError)
        return NextResponse.json({ error: pdfError.message }, { status: 500 })
      }
    }

    // 2. Actualizar sales_vehicles
    if (salesData) {
      const { error: salesError } = await supabase
        .from("sales_vehicles")
        .update(salesData)
        .eq("id", vehicleId)

      if (salesError) {
        console.error("❌ [API] Error updating sales vehicle:", salesError)
        return NextResponse.json({ error: salesError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ [API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

