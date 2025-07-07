export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    console.log("=== DIAGNÓSTICO DE TABLAS ===")

    // Verificar estructura de pdf_extracted_data - obtener una fila para ver las columnas
    const { data: pdfSample, error: pdfError } = await supabase.from("pdf_extracted_data").select("*").limit(1).single()

    // Verificar estructura de sales_vehicles - obtener una fila para ver las columnas
    const { data: salesSample, error: salesError } = await supabase.from("sales_vehicles").select("*").limit(1).single()

    // Obtener nombres de columnas de las muestras
    const pdfColumns = pdfSample
      ? Object.keys(pdfSample).map((key) => ({
          column_name: key,
          data_type: typeof pdfSample[key],
          is_nullable: "unknown",
        }))
      : []

    const salesColumns = salesSample
      ? Object.keys(salesSample).map((key) => ({
          column_name: key,
          data_type: typeof salesSample[key],
          is_nullable: "unknown",
        }))
      : []

    // Contar registros en ambas tablas
    const { count: pdfCount, error: pdfCountError } = await supabase
      .from("pdf_extracted_data")
      .select("*", { count: "exact", head: true })

    const { count: salesCount, error: salesCountError } = await supabase
      .from("sales_vehicles")
      .select("*", { count: "exact", head: true })

    // Obtener últimos 5 registros de cada tabla
    const { data: lastPdfRecords, error: lastPdfError } = await supabase
      .from("pdf_extracted_data")
      .select("id, numero_pedido, matricula, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    const { data: lastSalesRecords, error: lastSalesError } = await supabase
      .from("sales_vehicles")
      .select("id, license_plate, client_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5)

    const diagnostico = {
      timestamp: new Date().toISOString(),
      pdf_extracted_data: {
        columns: pdfColumns || [],
        columnsError: pdfError?.message || null,
        recordCount: pdfCount || 0,
        countError: pdfCountError?.message || null,
        lastRecords: lastPdfRecords || [],
        lastRecordsError: lastPdfError?.message || null,
      },
      sales_vehicles: {
        columns: salesColumns || [],
        columnsError: salesError?.message || null,
        recordCount: salesCount || 0,
        countError: salesCountError?.message || null,
        lastRecords: lastSalesRecords || [],
        lastRecordsError: lastSalesError?.message || null,
      },
    }

    console.log("Diagnóstico completo:", JSON.stringify(diagnostico, null, 2))

    return NextResponse.json(diagnostico)
  } catch (error) {
    console.error("Error en diagnóstico:", error)
    return NextResponse.json(
      {
        error: "Error ejecutando diagnóstico",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
