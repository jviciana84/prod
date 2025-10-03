import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    console.log("🚗 INICIANDO BARRIDO DE VEHÍCULOS VENDIDOS DEL STOCK")
    
    // Usar cliente de servicio para evitar problemas de autenticación
    const supabase = createServiceClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log("✅ Cliente de Supabase configurado")

    // PASO 1: Identificar vehículos vendidos en stock
    console.log("🔍 PASO 1: Identificando vehículos vendidos en stock...")
    
    const { data: summary, error: summaryError } = await supabase
      .from('stock')
      .select('id, is_sold, estado')
    
    if (summaryError) {
      console.error("❌ Error obteniendo resumen:", summaryError)
      console.error("❌ Detalles del error:", {
        message: summaryError.message,
        details: summaryError.details,
        hint: summaryError.hint,
        code: summaryError.code
      })
      return NextResponse.json({ 
        success: false,
        error: "Error obteniendo resumen", 
        message: summaryError.message,
        details: summaryError.message,
        code: summaryError.code
      }, { status: 500 })
    }
    
    if (!summary) {
      console.error("❌ No se obtuvieron datos del resumen")
      return NextResponse.json({ error: "No se obtuvieron datos del resumen" }, { status: 500 })
    }
    
    const total = summary.length
    const vendidos = summary.filter(v => v.is_sold === true).length
    const disponibles = summary.filter(v => v.is_sold === false || v.is_sold === null).length
    const entregados = summary.filter(v => v.estado === 'entregado').length
    
    console.log("📊 RESUMEN GENERAL:")
    console.log(`   Total vehículos en stock: ${total}`)
    console.log(`   Vendidos en stock: ${vendidos}`)
    console.log(`   Disponibles en stock: ${disponibles}`)
    console.log(`   Entregados en stock: ${entregados}`)

    // Obtener vehículos vendidos que aún están en stock
    const { data: soldInStock, error: soldError } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold, estado, created_at, updated_at')
      .eq('is_sold', true)
      .neq('estado', 'entregado')
      .order('updated_at', { ascending: false })
    
    if (soldError) {
      console.error("❌ Error obteniendo vehículos vendidos:", soldError)
      return NextResponse.json({ error: "Error obteniendo vehículos vendidos" }, { status: 500 })
    }
    
    console.log(`🚨 PROBLEMA: ${soldInStock.length} vehículos vendidos aún están en stock`)

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
        }
      })
    }

    // PASO 2: Limpiar vehículos vendidos
    console.log("🧹 PASO 2: Ejecutando limpieza...")
    
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
        
        // Actualizar vehículo
        const { error: updateError } = await supabase
          .from('stock')
          .update({
            estado: 'entregado',
            fecha_entrega: fechaEntrega,
            updated_at: new Date().toISOString()
          })
          .eq('id', vehicle.id)
        
        if (updateError) {
          console.error(`❌ Error actualizando ${vehicle.license_plate}:`, updateError)
          errors++
        } else {
          console.log(`✅ ${vehicle.license_plate} marcado como entregado (fuente: ${source})`)
          processed++
          processedVehicles.push({
            license_plate: vehicle.license_plate,
            model: vehicle.model,
            source,
            fecha_entrega: fechaEntrega
          })
        }
        
      } catch (error) {
        console.error(`❌ Error procesando ${vehicle.license_plate}:`, error)
        errors++
      }
    }

    // PASO 3: Verificar resultado
    console.log("🔍 PASO 3: Verificando resultado...")
    
    const { data: remainingSold, error: remainingError } = await supabase
      .from('stock')
      .select('id, license_plate, model')
      .eq('is_sold', true)
      .neq('estado', 'entregado')
    
    if (remainingError) {
      console.error("❌ Error verificando:", remainingError)
    }

    // Resumen final
    const { data: finalSummary, error: finalError } = await supabase
      .from('stock')
      .select('id, is_sold, estado')
    
    if (finalError) {
      console.error("❌ Error obteniendo resumen final:", finalError)
    }

    const finalTotal = finalSummary?.length || 0
    const finalVendidos = finalSummary?.filter(v => v.is_sold === true).length || 0
    const finalDisponibles = finalSummary?.filter(v => v.is_sold === false || v.is_sold === null).length || 0
    const finalEntregados = finalSummary?.filter(v => v.estado === 'entregado').length || 0

    console.log("📊 RESUMEN FINAL:")
    console.log(`   Total vehículos: ${finalTotal}`)
    console.log(`   Vendidos en stock: ${finalVendidos}`)
    console.log(`   Disponibles en stock: ${finalDisponibles}`)
    console.log(`   Entregados: ${finalEntregados}`)

    const success = remainingSold?.length === 0

    console.log(success ? "✅ ÉXITO: No quedan vehículos vendidos en stock" : `❌ PROBLEMA: Aún quedan ${remainingSold?.length || 0} vehículos vendidos en stock`)
    console.log("🎉 BARRIDO COMPLETADO")

    return NextResponse.json({
      success,
      message: success 
        ? "Barrido completado exitosamente" 
        : `Barrido completado con ${remainingSold?.length || 0} vehículos pendientes`,
      summary: {
        initial: { total, vendidos, disponibles, entregados },
        final: { total: finalTotal, vendidos: finalVendidos, disponibles: finalDisponibles, entregados: finalEntregados }
      },
      processing: {
        total: soldInStock.length,
        processed,
        errors,
        processedVehicles: processedVehicles.slice(0, 10) // Mostrar solo los primeros 10
      },
      remaining: remainingSold?.length || 0
    })

  } catch (error) {
    console.error("💥 Error crítico:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    )
  }
}
