// Script para probar el sistema automático de limpieza
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Cargar variables de entorno
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          process.env[key.trim()] = value
        }
      }
    })
  }
}

loadEnvFile()

async function testAutomaticCleanup() {
  console.log('🧪 PROBANDO SISTEMA AUTOMÁTICO DE LIMPIEZA')
  console.log('==========================================')
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables de entorno no configuradas')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. Verificar estado actual
    console.log('\n📊 ESTADO ACTUAL:')
    const { data: stockData } = await supabase
      .from('stock')
      .select('id, license_plate, model, is_sold')
    
    const total = stockData?.length || 0
    const vendidos = stockData?.filter(v => v.is_sold === true).length || 0
    const disponibles = stockData?.filter(v => v.is_sold === false || v.is_sold === null).length || 0
    
    console.log(`   Total vehículos en stock: ${total}`)
    console.log(`   Vendidos en stock: ${vendidos}`)
    console.log(`   Disponibles en stock: ${disponibles}`)
    
    // 2. Verificar triggers
    console.log('\n🔧 VERIFICANDO TRIGGERS:')
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_timing')
      .eq('event_object_table', 'stock')
      .like('trigger_name', '%vehicle_sold_cleanup%')
    
    if (triggers && triggers.length > 0) {
      console.log('   ✅ Triggers encontrados:')
      triggers.forEach(trigger => {
        console.log(`      - ${trigger.trigger_name} (${trigger.event_manipulation})`)
      })
    } else {
      console.log('   ❌ No se encontraron triggers automáticos')
      console.log('   💡 Ejecuta: node scripts/install-automatic-cleanup.ps1')
      return
    }
    
    // 3. Simular marcado de vehículo como vendido
    if (disponibles > 0) {
      const vehicleToTest = stockData?.find(v => v.is_sold === false || v.is_sold === null)
      
      if (vehicleToTest) {
        console.log(`\n🧪 PROBANDO CON VEHÍCULO: ${vehicleToTest.license_plate}`)
        
        // Marcar como vendido
        const { error: updateError } = await supabase
          .from('stock')
          .update({ is_sold: true })
          .eq('id', vehicleToTest.id)
        
        if (updateError) {
          console.error('❌ Error marcando como vendido:', updateError)
          return
        }
        
        console.log('✅ Vehículo marcado como vendido')
        
        // Esperar un momento para que se procese
        console.log('⏳ Esperando procesamiento automático...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Verificar si fue procesado automáticamente
        const { data: updatedStock } = await supabase
          .from('stock')
          .select('id, license_plate, is_sold')
          .eq('id', vehicleToTest.id)
        
        if (!updatedStock || updatedStock.length === 0) {
          console.log('✅ ¡ÉXITO! El vehículo fue eliminado automáticamente del stock')
          
          // Verificar si aparece en entregas
          const { data: entrega } = await supabase
            .from('entregas')
            .select('matricula, modelo, fecha_entrega, asesor')
            .eq('matricula', vehicleToTest.license_plate)
          
          if (entrega && entrega.length > 0) {
            console.log('✅ ¡ÉXITO! El vehículo aparece en entregas:')
            console.log(`      Matrícula: ${entrega[0].matricula}`)
            console.log(`      Modelo: ${entrega[0].modelo}`)
            console.log(`      Fecha: ${entrega[0].fecha_entrega}`)
            console.log(`      Asesor: ${entrega[0].asesor}`)
          } else {
            console.log('⚠️ El vehículo fue eliminado del stock pero no aparece en entregas')
          }
        } else {
          console.log('❌ El vehículo sigue en el stock - el sistema automático no funcionó')
        }
      }
    } else {
      console.log('\n⚠️ No hay vehículos disponibles para probar')
    }
    
    // 4. Estado final
    console.log('\n📊 ESTADO FINAL:')
    const { data: finalStock } = await supabase
      .from('stock')
      .select('id, license_plate, is_sold')
    
    const finalTotal = finalStock?.length || 0
    const finalVendidos = finalStock?.filter(v => v.is_sold === true).length || 0
    const finalDisponibles = finalStock?.filter(v => v.is_sold === false || v.is_sold === null).length || 0
    
    console.log(`   Total vehículos en stock: ${finalTotal}`)
    console.log(`   Vendidos en stock: ${finalVendidos}`)
    console.log(`   Disponibles en stock: ${finalDisponibles}`)
    
    if (finalVendidos === 0) {
      console.log('\n🎉 ¡SISTEMA AUTOMÁTICO FUNCIONANDO CORRECTAMENTE!')
      console.log('   ✅ No hay vehículos vendidos en el stock')
      console.log('   ✅ El sistema procesa automáticamente los vehículos vendidos')
    } else {
      console.log('\n⚠️ Aún hay vehículos vendidos en el stock')
      console.log('   💡 El sistema automático puede no estar funcionando correctamente')
    }
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testAutomaticCleanup()
}

module.exports = { testAutomaticCleanup }
