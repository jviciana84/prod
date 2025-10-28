import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import { parseBMWMiniPDF } from "@/utils/pdf-parser"

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ 
        message: "No se proporcionaron archivos" 
      }, { status: 400 })
    }

    const results = []

    for (const file of files) {
      // Validar que sea PDF
      if (file.type !== "application/pdf") {
        results.push({
          filename: file.name,
          success: false,
          error: "Solo se permiten archivos PDF"
        })
        continue
      }

      // El nombre del archivo debe ser el VIN
      const vinFromFilename = file.name.replace(".pdf", "").trim()
      
      if (!vinFromFilename) {
        results.push({
          filename: file.name,
          success: false,
          error: "El nombre del archivo debe ser el VIN"
        })
        continue
      }

      try {
        // Convertir File a Buffer para parsear
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Parsear PDF automáticamente
        let parsedData
        try {
          console.log(`🔍 Parseando PDF: ${file.name}`)
          parsedData = await parseBMWMiniPDF(buffer)
          console.log(`✅ Parseado ${file.name}:`, {
            vin: parsedData.vin,
            marca: parsedData.marca,
            modelo: parsedData.modelo?.substring(0, 50),
            color: parsedData.color,
            tapiceria: parsedData.tapiceria?.substring(0, 50),
            equipacion_count: parsedData.equipacion.length
          })
        } catch (parseError: any) {
          console.error(`❌ Error parseando PDF ${file.name}:`, parseError.message)
          console.error(parseError.stack)
          // Si falla el parsing, continuar con datos básicos
          parsedData = {
            vin: vinFromFilename,
            marca: '',
            modelo: '',
            version: '',
            color: '',
            tapiceria: '',
            equipacion: []
          }
        }

        // Usar VIN del PDF si está disponible, si no usar el del nombre del archivo
        const finalVin = parsedData.vin || vinFromFilename

        // Verificar si el vehículo ya existe y eliminarlo
        const { data: existingVehicle } = await supabase
          .from("comparador_vehiculos")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("vin", finalVin)
          .maybeSingle()

        if (existingVehicle) {
          // Eliminar vehículo existente
          await supabase
            .from("comparador_vehiculos")
            .delete()
            .eq("id", existingVehicle.id)
        }

        // Subir PDF a Vercel Blob con sufijo aleatorio para evitar colisiones
        const blob = await put(`comparador/${session.user.id}/${vinFromFilename}.pdf`, file, {
          access: "public",
          addRandomSuffix: true,
        })

        // Guardar en base de datos con datos parseados
        const { data, error } = await supabase
          .from("comparador_vehiculos")
          .insert({
            user_id: session.user.id,
            vin: finalVin,
            pdf_url: blob.url,
            pdf_filename: file.name,
            marca: parsedData.marca || null,
            modelo: parsedData.modelo || null,
            version: parsedData.version || null,
            color: parsedData.color || null,
            tapiceria: parsedData.tapiceria || null,
            equipacion: parsedData.equipacion || []
          })
          .select()
          .single()

        if (error) throw error

        results.push({
          filename: file.name,
          success: true,
          data: data,
          parsed: {
            equipacion_count: parsedData.equipacion?.length || 0,
            has_color: !!parsedData.color,
            has_tapiceria: !!parsedData.tapiceria
          }
        })
      } catch (error: any) {
        results.push({
          filename: file.name,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({ results })

  } catch (error: any) {
    console.error("Error subiendo archivos:", error.message)
    return NextResponse.json({ 
      message: "Error al subir archivos", 
      error: error.message 
    }, { status: 500 })
  }
}

