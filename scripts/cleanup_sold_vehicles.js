const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Configurar cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function identifySoldVehicles() {
  console.log('🔍 PASO 1: Identificando vehículos vendidos en stock...')
  
  try {
    // 1. Resumen general
    const { data: summary, error: summaryError } = await supabase
      .from('stock')
      .select('id, is_sold, estado')
    
    if (summaryError) {
      console.error('❌ Error obteniendo resumen:', summaryError)
      return
    }
    
    const total = summary.length
    const vendidos = summary.filter(v => v.is_sold === true).length
    const disponibles = summary.filter(v => v.is_sold === false || v.is_sold === null).length
    const entregados = summary.filter(v => v.estado === 'entregado').length
    
    console.log('📊 RESUMEN GENERAL:')
    console.log(`   Total vehículos en stock: ${total}`)
    console.log(`   Vendidos en stock: ${vendidos}`)
    console.log(`   Disponibles en stock: ${disponibles}`)
    console.log(`   Entregados en stock: ${entregados}`)
    
    // 2. Vehículos vendidos que aún están en stock
    const { data: soldInStock, error: soldError } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold, estado, created_at, updated_at')
      .eq('is_sold', true)
      .neq('estado', 'entregado')
      .order('updated_at', { ascending: false })
      .limit(20)
    
    if (soldError) {
      console.error('❌ Error obteniendo vehículos vendidos:', soldError)
      return
    }
    
    console.log(`\n🚨 PROBLEMA: ${soldInStock.length} vehículos vendidos aún están en stock:`)
    soldInStock.forEach((vehicle, index) => {
      console.log(`   ${index + 1}. ${vehicle.license_plate} - ${vehicle.model} (${vehicle.estado})`)
    })
    
    return soldInStock
    
  } catch (error) {
    console.error('💥 Error inesperado:', error)
  }
}

async function cleanupSoldVehicles(vehiclesToCleanup) {
  console.log('\n🧹 PASO 2: Ejecutando limpieza...')
  
  if (!vehiclesToCleanup || vehiclesToCleanup.length === 0) {
    console.log('✅ No hay vehículos para limpiar')
    return
  }
  
  try {
    let processed = 0
    let errors = 0
    
    for (const vehicle of vehiclesToCleanup) {
      try {
        // Buscar fecha de entrega o venta
        let fechaEntrega = new Date().toISOString()
        
        // Buscar en entregas
        const { data: entrega } = await supabase
          .from('entregas')
          .select('fecha_entrega')
          .eq('matricula', vehicle.license_plate)
          .single()
        
        if (entrega?.fecha_entrega) {
          fechaEntrega = entrega.fecha_entrega
        } else {
          // Buscar en sales_vehicles
          const { data: venta } = await supabase
            .from('sales_vehicles')
            .select('sale_date')
            .eq('license_plate', vehicle.license_plate)
            .single()
          
          if (venta?.sale_date) {
            fechaEntrega = venta.sale_date
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
          console.log(`✅ ${vehicle.license_plate} marcado como entregado`)
          processed++
        }
        
      } catch (error) {
        console.error(`❌ Error procesando ${vehicle.license_plate}:`, error)
        errors++
      }
    }
    
    console.log(`\n📊 RESULTADO DE LIMPIEZA:`)
    console.log(`   Procesados: ${processed}`)
    console.log(`   Errores: ${errors}`)
    
  } catch (error) {
    console.error('💥 Error inesperado en limpieza:', error)
  }
}

async function verifyCleanup() {
  console.log('\n🔍 PASO 3: Verificando resultado...')
  
  try {
    // Verificar que no quedan vendidos en stock
    const { data: remainingSold, error: remainingError } = await supabase
      .from('stock')
      .select('id, license_plate, model')
      .eq('is_sold', true)
      .neq('estado', 'entregado')
    
    if (remainingError) {
      console.error('❌ Error verificando:', remainingError)
      return
    }
    
    if (remainingSold.length === 0) {
      console.log('✅ ÉXITO: No quedan vehículos vendidos en stock')
    } else {
      console.log(`❌ PROBLEMA: Aún quedan ${remainingSold.length} vehículos vendidos en stock`)
      remainingSold.forEach(v => console.log(`   - ${v.license_plate} - ${v.model}`))
    }
    
    // Resumen final
    const { data: finalSummary, error: finalError } = await supabase
      .from('stock')
      .select('id, is_sold, estado')
    
    if (finalError) {
      console.error('❌ Error obteniendo resumen final:', finalError)
      return
    }
    
    const total = finalSummary.length
    const vendidos = finalSummary.filter(v => v.is_sold === true).length
    const disponibles = finalSummary.filter(v => v.is_sold === false || v.is_sold === null).length
    const entregados = finalSummary.filter(v => v.estado === 'entregado').length
    
    console.log('\n📊 RESUMEN FINAL:')
    console.log(`   Total vehículos: ${total}`)
    console.log(`   Vendidos en stock: ${vendidos}`)
    console.log(`   Disponibles en stock: ${disponibles}`)
    console.log(`   Entregados: ${entregados}`)
    
  } catch (error) {
    console.error('💥 Error inesperado en verificación:', error)
  }
}

async function main() {
  console.log('🚗 INICIANDO BARRIDO DE VEHÍCULOS VENDIDOS DEL STOCK')
  console.log('=================================================')
  
  try {
    // Paso 1: Identificar
    const vehiclesToCleanup = await identifySoldVehicles()
    
    if (vehiclesToCleanup && vehiclesToCleanup.length > 0) {
      // Paso 2: Limpiar
      await cleanupSoldVehicles(vehiclesToCleanup)
      
      // Paso 3: Verificar
      await verifyCleanup()
    } else {
      console.log('✅ No hay vehículos vendidos en stock para limpiar')
    }
    
    console.log('\n🎉 BARRIDO COMPLETADO')
    
  } catch (error) {
    console.error('💥 Error crítico:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
}

module.exports = { identifySoldVehicles, cleanupSoldVehicles, verifyCleanup }
