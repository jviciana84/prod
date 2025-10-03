import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log("🤖 INICIANDO LIMPIEZA AUTOMÁTICA DE VEHÍCULO VENDIDO")
    
    const body = await request.json()
    const { vehicleId, licensePlate, model } = body
    
    if (!vehicleId) {
      return NextResponse.json({ 
        success: false,
        error: "vehicleId es requerido",
        message: "ID del vehículo es requerido"
      }, { status: 400 })
    }
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false,
        error: "Variables de entorno no configuradas",
        message: "Variables de entorno no configuradas"
      }, { status: 500 })
    }
    
    // Crear cliente
    const supabase = createServiceClient(supabaseUrl, supabaseKey)
    console.log("✅ Cliente de Supabase configurado")

    // Obtener datos del vehículo
    const { data: vehicle, error: vehicleError } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold')
      .eq('id', vehicleId)
      .single()
    
    if (vehicleError || !vehicle) {
      console.error("❌ Error obteniendo vehículo:", vehicleError)
      return NextResponse.json({ 
        success: false,
        error: "Vehículo no encontrado",
        message: vehicleError?.message || "Vehículo no encontrado"
      }, { status: 404 })
    }
    
    // Verificar que el vehículo está marcado como vendido
    if (!vehicle.is_sold) {
      return NextResponse.json({ 
        success: false,
        error: "Vehículo no está marcado como vendido",
        message: "El vehículo no está marcado como vendido"
      }, { status: 400 })
    }
    
    console.log(`🔄 Procesando vehículo vendido: ${vehicle.license_plate}`)

    // Buscar fecha de entrega o venta
    let fechaEntrega = new Date().toISOString()
    let source = 'fecha_actual'

    // Buscar en entregas
    const { data: entrega } = await supabase
      .from('entregas')
      .select('fecha_entrega')
      .eq('matricula', vehicle.license_plate)
      .single()
    
    if (entrega?.fecha_entrega) {
      fechaEntrega = entrega.fecha_entrega
      source = 'entregas'
    } else {
      // Buscar en sales_vehicles
      const { data: venta } = await supabase
        .from('sales_vehicles')
        .select('sale_date')
        .eq('license_plate', vehicle.license_plate)
        .single()
      
      if (venta?.sale_date) {
        fechaEntrega = venta.sale_date
        source = 'sales_vehicles'
      }
    }
    
    // Crear registro en entregas
    const { error: entregaError } = await supabase
      .from('entregas')
      .insert({
        matricula: vehicle.license_plate,
        modelo: vehicle.model,
        fecha_entrega: fechaEntrega,
        asesor: 'Sistema Automático',
        stock_id: vehicle.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (entregaError) {
      console.error(`❌ Error creando entrega para ${vehicle.license_plate}:`, entregaError)
      return NextResponse.json({ 
        success: false,
        error: "Error creando entrega",
        message: entregaError.message
      }, { status: 500 })
    }
    
    // Eliminar del stock
    const { error: deleteError } = await supabase
      .from('stock')
      .delete()
      .eq('id', vehicle.id)
    
    if (deleteError) {
      console.error(`❌ Error eliminando ${vehicle.license_plate} del stock:`, deleteError)
      return NextResponse.json({ 
        success: false,
        error: "Error eliminando del stock",
        message: deleteError.message
      }, { status: 500 })
    }
    
    console.log(`✅ ${vehicle.license_plate} procesado automáticamente (fuente: ${source})`)

    return NextResponse.json({
      success: true,
      message: `Vehículo ${vehicle.license_plate} procesado automáticamente`,
      vehicle: {
        license_plate: vehicle.license_plate,
        model: vehicle.model,
        source,
        fecha_entrega: fechaEntrega
      }
    })

  } catch (error) {
    console.error("💥 Error crítico en limpieza automática:", error)
    return NextResponse.json({ 
      success: false,
      error: "Error crítico",
      message: error.message,
      details: error.message
    }, { status: 500 })
  }
}
