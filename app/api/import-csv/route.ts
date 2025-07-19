import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente de Supabase con rol de servicio para operaciones administrativas
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// API Key para autenticación (deberías usar una más segura en producción)
const VALID_API_KEY = process.env.CVO_SCRAPER_API_KEY || "cvo-scraper-2024"

export async function POST(request: Request) {
  try {
    console.log("🚀 API Import CSV - Iniciando procesamiento...")
    
    // Obtener datos del request
    const body = await request.json()
    const { csv_data, file_name, api_key } = body
    
    // Verificar API key
    if (api_key !== VALID_API_KEY) {
      console.error("❌ API Key inválida")
      return NextResponse.json({ 
        success: false, 
        error: "API Key inválida" 
      }, { status: 401 })
    }
    
    console.log("✅ API Key válida")
    console.log("📁 Archivo:", file_name)
    console.log("📊 Datos recibidos:", typeof csv_data)
    
    // Verificar que csv_data existe
    if (!csv_data) {
      console.error("❌ No se recibieron datos CSV")
      return NextResponse.json({ 
        success: false, 
        error: "No se recibieron datos CSV" 
      }, { status: 400 })
    }
    
    // Si csv_data es un array, procesar múltiples registros
    if (Array.isArray(csv_data)) {
      console.log(`📦 Procesando ${csv_data.length} registros...`)
      
      // Debug: mostrar las columnas del primer registro
      if (csv_data.length > 0) {
        console.log("🔍 Columnas del primer registro:")
        console.log(Object.keys(csv_data[0]))
        console.log("📄 Muestra del primer registro:")
        console.log(Object.entries(csv_data[0]).slice(0, 5))
      }
      
      return await processMultipleRecords(csv_data, file_name)
    } else {
      // Si es un objeto, procesar un solo registro
      console.log("📄 Procesando registro único...")
      console.log("🔍 Columnas del registro:")
      console.log(Object.keys(csv_data))
      return await processSingleRecord(csv_data, file_name)
    }
    
  } catch (error: any) {
    console.error("❌ Error general en API:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

async function processSingleRecord(csv_data: any, file_name: string) {
  try {
    console.log("🔍 Procesando registro único...")
    
    // Preparar datos para duc_scraper con TODAS las columnas
    const duc_data = {
      "ID Anuncio": csv_data["ID Anuncio"] || null,
      "Anuncio": csv_data["Anuncio"] || null,
      "BPS / NEXT": csv_data["BPS / NEXT"] || null,
      "Cambio": csv_data["Cambio"] || null,
      "Certificado": csv_data["Certificado"] || null,
      "Chasis": csv_data["Chasis"] || null,
      "Color Carrocería": csv_data["Color Carrocería"] || null,
      "Color tapizado": csv_data["Color tapizado"] || null,
      "Combustible": csv_data["Combustible"] || null,
      "Concesionario": csv_data["Concesionario"] || null,
      "Creado con": csv_data["Creado con"] || null,
      "Destino": csv_data["Destino"] || null,
      "Disponibilidad": csv_data["Disponibilidad"] || null,
      "Distintivo ambiental": csv_data["Distintivo ambiental"] || null,
      "Días creado": csv_data["Días creado"] || null,
      "Días desde compra DMS": csv_data["Días desde compra DMS"] || null,
      "Días desde matriculación": csv_data["Días desde matriculación"] || null,
      "Días publicado": csv_data["Días publicado"] || null,
      "e-code": csv_data["e-code"] || null,
      "El precio es": csv_data["El precio es"] || null,
      "En uso": csv_data["En uso"] || null,
      "Fecha compra DMS": csv_data["Fecha compra DMS"] || null,
      "Fecha creación": csv_data["Fecha creación"] || null,
      "Fecha disponibilidad": csv_data["Fecha disponibilidad"] || null,
      "Fecha entrada VO": csv_data["Fecha entrada VO"] || null,
      "Fecha fabricación": csv_data["Fecha fabricación"] || null,
      "Fecha modificación": csv_data["Fecha modificación"] || null,
      "Fecha primera matriculación": csv_data["Fecha primera matriculación"] || null,
      "Fecha primera publicación": csv_data["Fecha primera publicación"] || null,
      "Garantía": csv_data["Garantía"] || null,
      "KM": csv_data["KM"] || null,
      "Libre de siniestros": csv_data["Libre de siniestros"] || null,
      "Marca": csv_data["Marca"] || null,
      "Moneda": csv_data["Moneda"] || null,
      "No completados": csv_data["No completados"] || null,
      "Nota interna": csv_data["Nota interna"] || null,
      "Observaciones": csv_data["Observaciones"] || null,
      "Origen": csv_data["Origen"] || null,
      "Origenes unificados": csv_data["Origenes unificados"] || null,
      "País origen": csv_data["País origen"] || null,
      "Potencia Cv": csv_data["Potencia Cv"] || null,
      "Precio": csv_data["Precio"] || null,
      "Precio compra": csv_data["Precio compra"] || null,
      "Precio cuota alquiler": csv_data["Precio cuota alquiler"] || null,
      "Precio cuota renting": csv_data["Precio cuota renting"] || null,
      "Precio estimado medio": csv_data["Precio estimado medio"] || null,
      "Precio exportación": csv_data["Precio exportación"] || null,
      "Precio financiado": csv_data["Precio financiado"] || null,
      "Precio vehículo nuevo": csv_data["Precio vehículo nuevo"] || null,
      "Precio profesional": csv_data["Precio profesional"] || null,
      "Proveedor": csv_data["Proveedor"] || null,
      "Referencia": csv_data["Referencia"] || null,
      "Referencia interna": csv_data["Referencia interna"] || null,
      "Regimen fiscal": csv_data["Regimen fiscal"] || null,
      "Tienda": csv_data["Tienda"] || null,
      "Tipo de distribución": csv_data["Tipo de distribución"] || null,
      "Tipo motor": csv_data["Tipo motor"] || null,
      "Trancha 1": csv_data["Trancha 1"] || null,
      "Trancha 2": csv_data["Trancha 2"] || null,
      "Trancha 3": csv_data["Trancha 3"] || null,
      "Trancha 4": csv_data["Trancha 4"] || null,
      "Trancha Combustible": csv_data["Trancha Combustible"] || null,
      "Trancha YUC": csv_data["Trancha YUC"] || null,
      "Ubicación tienda": csv_data["Ubicación tienda"] || null,
      "URL": csv_data["URL"] || null,
      "URL foto 1": csv_data["URL foto 1"] || null,
      "URL foto 2": csv_data["URL foto 2"] || null,
      "URL foto 3": csv_data["URL foto 3"] || null,
      "URL foto 4": csv_data["URL foto 4"] || null,
      "URL foto 5": csv_data["URL foto 5"] || null,
      "URL foto 6": csv_data["URL foto 6"] || null,
      "URL foto 7": csv_data["URL foto 7"] || null,
      "URL foto 8": csv_data["URL foto 8"] || null,
      "URL foto 9": csv_data["URL foto 9"] || null,
      "URL foto 10": csv_data["URL foto 10"] || null,
      "URL foto 11": csv_data["URL foto 11"] || null,
      "URL foto 12": csv_data["URL foto 12"] || null,
      "URL foto 13": csv_data["URL foto 13"] || null,
      "URL foto 14": csv_data["URL foto 14"] || null,
      "URL foto 15": csv_data["URL foto 15"] || null,
      "Válido para certificado": csv_data["Válido para certificado"] || null,
      "Valor existencia": csv_data["Valor existencia"] || null,
      "Vehículo importado": csv_data["Vehículo importado"] || null,
      "Versión": csv_data["Versión"] || null,
      "Extras": csv_data["Extras"] || null,
      "BuNo": csv_data["BuNo"] || null,
      "Código INT": csv_data["Código INT"] || null,
      "Código fabricante": csv_data["Código fabricante"] || null,
      "Equipamiento de serie": csv_data["Equipamiento de serie"] || null,
      "Estado": csv_data["Estado"] || null,
      "Carrocería": csv_data["Carrocería"] || null,
      "Días stock": csv_data["Días stock"] || null,
      "Matrícula": csv_data["Matrícula"] || null,
      "Modelo": csv_data["Modelo"] || null,
      file_name: file_name,
      import_date: new Date().toISOString(),
      last_seen_date: new Date().toISOString()
    }
    
    // Verificar si ya existe (mismo ID Anuncio)
    if (duc_data["ID Anuncio"]) {
      const { data: existing } = await supabaseAdmin
        .from("duc_scraper")
        .select("id, last_seen_date")
        .eq("ID Anuncio", duc_data["ID Anuncio"])
        .single()
      
      if (existing) {
        // Actualizar registro existente
        console.log("🔄 Actualizando registro existente...")
        const { data, error } = await supabaseAdmin
          .from("duc_scraper")
          .update(duc_data)
          .eq("ID Anuncio", duc_data["ID Anuncio"])
          .select()
        
        if (error) {
          console.error("❌ Error actualizando registro:", error)
          return NextResponse.json({ 
            success: false, 
            error: error.message 
          }, { status: 500 })
        }
        
        console.log("✅ Registro actualizado correctamente")
        return NextResponse.json({ 
          success: true, 
          action: "updated",
          record_id: data[0]?.id,
          message: "Registro actualizado correctamente",
          summary: {
            total_processed: 1,
            inserted: 0,
            updated: 1,
            errors: 0,
            deleted: 0
          }
        })
      }
    }
    
    // Insertar nuevo registro
    console.log("➕ Insertando nuevo registro...")
    const { data, error } = await supabaseAdmin
      .from("duc_scraper")
      .insert(duc_data)
      .select()
    
    if (error) {
      console.error("❌ Error insertando registro:", error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    console.log("✅ Registro insertado correctamente")
    return NextResponse.json({ 
      success: true, 
      action: "inserted",
      record_id: data[0]?.id,
      message: "Registro insertado correctamente",
      summary: {
        total_processed: 1,
        inserted: 1,
        updated: 0,
        errors: 0,
        deleted: 0
      }
    })
    
  } catch (error: any) {
    console.error("❌ Error procesando registro único:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

async function processMultipleRecords(csv_data: any[], file_name: string) {
  try {
    console.log(`📦 Procesando ${csv_data.length} registros...`)
    
    let inserted = 0
    let updated = 0
    let errors = 0
    const error_details = []
    const processed_ids = new Set()
    
    // Procesar cada registro
    for (let i = 0; i < csv_data.length; i++) {
      try {
        const record = csv_data[i]
        console.log(`📄 Procesando registro ${i + 1}/${csv_data.length}...`)
        
        // Preparar datos (misma lógica que processSingleRecord)
        const duc_data = {
          "ID Anuncio": record["ID Anuncio"] || null,
          "Anuncio": record["Anuncio"] || null,
          "BPS / NEXT": record["BPS / NEXT"] || null,
          "Cambio": record["Cambio"] || null,
          "Certificado": record["Certificado"] || null,
          "Chasis": record["Chasis"] || null,
          "Color Carrocería": record["Color Carrocería"] || null,
          "Color tapizado": record["Color tapizado"] || null,
          "Combustible": record["Combustible"] || null,
          "Concesionario": record["Concesionario"] || null,
          "Creado con": record["Creado con"] || null,
          "Destino": record["Destino"] || null,
          "Disponibilidad": record["Disponibilidad"] || null,
          "Distintivo ambiental": record["Distintivo ambiental"] || null,
          "Días creado": record["Días creado"] || null,
          "Días desde compra DMS": record["Días desde compra DMS"] || null,
          "Días desde matriculación": record["Días desde matriculación"] || null,
          "Días publicado": record["Días publicado"] || null,
          "e-code": record["e-code"] || null,
          "El precio es": record["El precio es"] || null,
          "En uso": record["En uso"] || null,
          "Fecha compra DMS": record["Fecha compra DMS"] || null,
          "Fecha creación": record["Fecha creación"] || null,
          "Fecha disponibilidad": record["Fecha disponibilidad"] || null,
          "Fecha entrada VO": record["Fecha entrada VO"] || null,
          "Fecha fabricación": record["Fecha fabricación"] || null,
          "Fecha modificación": record["Fecha modificación"] || null,
          "Fecha primera matriculación": record["Fecha primera matriculación"] || null,
          "Fecha primera publicación": record["Fecha primera publicación"] || null,
          "Garantía": record["Garantía"] || null,
          "KM": record["KM"] || null,
          "Libre de siniestros": record["Libre de siniestros"] || null,
          "Marca": record["Marca"] || null,
          "Moneda": record["Moneda"] || null,
          "No completados": record["No completados"] || null,
          "Nota interna": record["Nota interna"] || null,
          "Observaciones": record["Observaciones"] || null,
          "Origen": record["Origen"] || null,
          "Origenes unificados": record["Origenes unificados"] || null,
          "País origen": record["País origen"] || null,
          "Potencia Cv": record["Potencia Cv"] || null,
          "Precio": record["Precio"] || null,
          "Precio compra": record["Precio compra"] || null,
          "Precio cuota alquiler": record["Precio cuota alquiler"] || null,
          "Precio cuota renting": record["Precio cuota renting"] || null,
          "Precio estimado medio": record["Precio estimado medio"] || null,
          "Precio exportación": record["Precio exportación"] || null,
          "Precio financiado": record["Precio financiado"] || null,
          "Precio vehículo nuevo": record["Precio vehículo nuevo"] || null,
          "Precio profesional": record["Precio profesional"] || null,
          "Proveedor": record["Proveedor"] || null,
          "Referencia": record["Referencia"] || null,
          "Referencia interna": record["Referencia interna"] || null,
          "Regimen fiscal": record["Regimen fiscal"] || null,
          "Tienda": record["Tienda"] || null,
          "Tipo de distribución": record["Tipo de distribución"] || null,
          "Tipo motor": record["Tipo motor"] || null,
          "Trancha 1": record["Trancha 1"] || null,
          "Trancha 2": record["Trancha 2"] || null,
          "Trancha 3": record["Trancha 3"] || null,
          "Trancha 4": record["Trancha 4"] || null,
          "Trancha Combustible": record["Trancha Combustible"] || null,
          "Trancha YUC": record["Trancha YUC"] || null,
          "Ubicación tienda": record["Ubicación tienda"] || null,
          "URL": record["URL"] || null,
          "URL foto 1": record["URL foto 1"] || null,
          "URL foto 2": record["URL foto 2"] || null,
          "URL foto 3": record["URL foto 3"] || null,
          "URL foto 4": record["URL foto 4"] || null,
          "URL foto 5": record["URL foto 5"] || null,
          "URL foto 6": record["URL foto 6"] || null,
          "URL foto 7": record["URL foto 7"] || null,
          "URL foto 8": record["URL foto 8"] || null,
          "URL foto 9": record["URL foto 9"] || null,
          "URL foto 10": record["URL foto 10"] || null,
          "URL foto 11": record["URL foto 11"] || null,
          "URL foto 12": record["URL foto 12"] || null,
          "URL foto 13": record["URL foto 13"] || null,
          "URL foto 14": record["URL foto 14"] || null,
          "URL foto 15": record["URL foto 15"] || null,
          "Válido para certificado": record["Válido para certificado"] || null,
          "Valor existencia": record["Valor existencia"] || null,
          "Vehículo importado": record["Vehículo importado"] || null,
          "Versión": record["Versión"] || null,
          "Extras": record["Extras"] || null,
          "BuNo": record["BuNo"] || null,
          "Código INT": record["Código INT"] || null,
          "Código fabricante": record["Código fabricante"] || null,
          "Equipamiento de serie": record["Equipamiento de serie"] || null,
          "Estado": record["Estado"] || null,
          "Carrocería": record["Carrocería"] || null,
          "Días stock": record["Días stock"] || null,
          "Matrícula": record["Matrícula"] || null,
          "Modelo": record["Modelo"] || null,
          file_name: file_name,
          import_date: new Date().toISOString(),
          last_seen_date: new Date().toISOString()
        }
        
        // Marcar este ID como procesado
        if (duc_data["ID Anuncio"]) {
          processed_ids.add(duc_data["ID Anuncio"])
        }
        
        // Verificar si ya existe
        if (duc_data["ID Anuncio"]) {
          const { data: existing } = await supabaseAdmin
            .from("duc_scraper")
            .select("id")
            .eq("ID Anuncio", duc_data["ID Anuncio"])
            .single()
          
          if (existing) {
            // Actualizar
            const { error: updateError } = await supabaseAdmin
              .from("duc_scraper")
              .update(duc_data)
              .eq("ID Anuncio", duc_data["ID Anuncio"])
            
            if (updateError) {
              console.error(`❌ Error actualizando registro ${i + 1}:`, updateError)
              errors += 1
              error_details.push(`Registro ${i + 1} (update): ${updateError.message}`)
            } else {
              updated += 1
              console.log(`✅ Registro ${i + 1} actualizado correctamente`)
            }
          } else {
            // Insertar
            const { error: insertError } = await supabaseAdmin
              .from("duc_scraper")
              .insert(duc_data)
            
            if (insertError) {
              console.error(`❌ Error insertando registro ${i + 1}:`, insertError)
              errors += 1
              error_details.push(`Registro ${i + 1} (insert): ${insertError.message}`)
            } else {
              inserted += 1
              console.log(`✅ Registro ${i + 1} insertado correctamente`)
            }
          }
        } else {
          // Insertar sin ID Anuncio
          const { error: insertError } = await supabaseAdmin
            .from("duc_scraper")
            .insert(duc_data)
          
          if (insertError) {
            console.error(`❌ Error insertando registro ${i + 1}:`, insertError)
            errors += 1
            error_details.push(`Registro ${i + 1} (insert): ${insertError.message}`)
          } else {
            inserted += 1
            console.log(`✅ Registro ${i + 1} insertado correctamente`)
          }
        }
        
      } catch (error: any) {
        errors += 1
        error_details.push(`Registro ${i + 1}: ${error.message}`)
        console.error(`❌ Error en registro ${i + 1}:`, error)
      }
    }
    
    console.log(`✅ Procesamiento completado: ${inserted} insertados, ${updated} actualizados, ${errors} errores`)
    
    return NextResponse.json({ 
      success: true, 
      summary: {
        total_processed: csv_data.length,
        inserted,
        updated,
        errors
      },
      error_details: error_details.length > 0 ? error_details : undefined,
      message: `Procesados ${csv_data.length} registros: ${inserted} insertados, ${updated} actualizados, ${errors} errores`
    })
    
  } catch (error: any) {
    console.error("❌ Error procesando múltiples registros:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// Endpoint GET para verificar que la API funciona
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "CVO Scraper API funcionando correctamente",
    endpoint: "/api/import-csv",
    method: "POST",
    required_fields: ["csv_data", "file_name", "api_key"]
  })
} 