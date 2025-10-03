import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log("🚗 INICIANDO BARRIDO SIMPLE DE VEHÍCULOS VENDIDOS")
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false,
        error: "Variables de entorno no configuradas",
        message: "Variables de entorno no configuradas"
      }, { status: 500 })
    }
    
    // Crear cliente
    const supabase = createServiceClient(supabaseUrl, supabaseKey)
    console.log("✅ Cliente de Supabase creado")

    // PASO 1: Obtener resumen simple
    console.log("🔍 PASO 1: Obteniendo resumen...")
    
    const { data: allStock, error: stockError } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold')
    
    if (stockError) {
      console.error("❌ Error obteniendo stock:", stockError)
      return NextResponse.json({ 
        success: false,
        error: "Error obteniendo stock",
        message: stockError.message,
        details: stockError.message
      }, { status: 500 })
    }
    
    if (!allStock) {
      return NextResponse.json({ 
        success: false,
        error: "No se obtuvieron datos",
        message: "No se obtuvieron datos del stock"
      }, { status: 500 })
    }
    
    // Calcular estadísticas
    const total = allStock.length
    const vendidos = allStock.filter(v => v.is_sold === true).length
    const disponibles = allStock.filter(v => v.is_sold === false || v.is_sold === null).length
    
    // Verificar cuántos ya están en entregas
    const { data: entregasData } = await supabase
      .from('entregas')
      .select('matricula')
    
    const entregados = entregasData?.length || 0
    
    console.log("📊 RESUMEN:")
    console.log(`   Total: ${total}`)
    console.log(`   Vendidos: ${vendidos}`)
    console.log(`   Disponibles: ${disponibles}`)
    console.log(`   Entregados: ${entregados}`)

    // PASO 2: Identificar vehículos vendidos que no están en entregas
    const soldInStock = allStock.filter(v => v.is_sold === true)
    
    console.log(`🚨 Vehículos vendidos en stock: ${soldInStock.length}`)
    
    if (soldInStock.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay vehículos vendidos en stock para limpiar",
        summary: {
          total,
          vendidos,
          disponibles,
          entregados,
          soldInStock: 0
        },
        processing: {
          total: 0,
          processed: 0,
          errors: 0
        }
      })
    }

    // PASO 3: Procesar vehículos vendidos
    console.log("🧹 PASO 3: Procesando vehículos vendidos...")
    
    let processed = 0
    let errors = 0
    const processedVehicles = []

    for (const vehicle of soldInStock) {
      try {
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
            asesor: 'Sistema',
            stock_id: vehicle.id
          })
        
        if (entregaError) {
          console.error(`❌ Error creando entrega para ${vehicle.license_plate}:`, entregaError)
          errors++
        } else {
          // Eliminar del stock
          const { error: deleteError } = await supabase
            .from('stock')
            .delete()
            .eq('id', vehicle.id)
          
          if (deleteError) {
            console.error(`❌ Error eliminando ${vehicle.license_plate} del stock:`, deleteError)
            errors++
          } else {
            console.log(`✅ ${vehicle.license_plate} movido a entregas y eliminado del stock`)
            processed++
            processedVehicles.push({
              license_plate: vehicle.license_plate,
              model: vehicle.model || 'N/A',
              source,
              fecha_entrega: fechaEntrega
            })
          }
        }
        
      } catch (error) {
        console.error(`❌ Error procesando vehículo:`, error)
        errors++
      }
    }

    // PASO 4: Verificar resultado
    console.log("🔍 PASO 4: Verificando resultado...")
    
    const { data: finalStock, error: finalError } = await supabase
      .from('stock')
      .select('id, is_sold')
    
    if (finalError) {
      console.error("❌ Error verificando resultado:", finalError)
    }

    const finalTotal = finalStock?.length || 0
    const finalVendidos = finalStock?.filter(v => v.is_sold === true).length || 0
    const finalDisponibles = finalStock?.filter(v => v.is_sold === false || v.is_sold === null).length || 0
    
    // Contar entregas
    const { data: finalEntregas } = await supabase
      .from('entregas')
      .select('id')
    
    const finalEntregados = finalEntregas?.length || 0

    // Verificar que no quedan vendidos en stock
    const remainingSold = finalStock?.filter(v => v.is_sold === true) || []
    const success = remainingSold.length === 0

    console.log("📊 RESULTADO FINAL:")
    console.log(`   Total: ${finalTotal}`)
    console.log(`   Vendidos en stock: ${finalVendidos}`)
    console.log(`   Disponibles: ${finalDisponibles}`)
    console.log(`   Entregados: ${finalEntregados}`)
    console.log(`   Pendientes: ${remainingSold.length}`)

    return NextResponse.json({
      success,
      message: success 
        ? "Barrido completado exitosamente" 
        : `Barrido completado con ${remainingSold.length} vehículos pendientes`,
      summary: {
        initial: { total, vendidos, disponibles, entregados },
        final: { total: finalTotal, vendidos: finalVendidos, disponibles: finalDisponibles, entregados: finalEntregados }
      },
      processing: {
        total: soldInStock.length,
        processed,
        errors,
        processedVehicles: processedVehicles.slice(0, 10)
      },
      remaining: remainingSold.length
    })

  } catch (error) {
    console.error("💥 Error crítico:", error)
    return NextResponse.json({ 
      success: false,
      error: "Error crítico",
      message: error.message,
      details: error.message
    }, { status: 500 })
  }
}
