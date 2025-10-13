require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function corregirDisponibles() {
  console.log('\n🔧 CORRECCIÓN DE VEHÍCULOS DISPONIBLES MAL MARCADOS\n')
  console.log('='.repeat(80))
  
  // 1. Obtener vehículos DISPONIBLES en CSV
  const { data: disponibles } = await supabase
    .from('duc_scraper')
    .select('"Matrícula", "Modelo", "Disponibilidad"')
    .ilike('"Disponibilidad"', '%disponible%')
    .not('"Matrícula"', 'is', null)
  
  console.log(`\n1️⃣ Vehículos DISPONIBLES en CSV: ${disponibles?.length || 0}`)
  
  // 2. Obtener stock
  const { data: stockData } = await supabase
    .from('stock')
    .select('id, license_plate, is_sold')
  
  // Crear mapa de stock
  const stockMap = new Map()
  stockData?.forEach(s => {
    const matricula = s.license_plate?.toUpperCase().replace(/\s+/g, '').trim()
    if (matricula) {
      stockMap.set(matricula, s)
    }
  })
  
  // 3. Encontrar vehículos DISPONIBLES pero con is_sold = true
  const malMarcados = []
  
  for (const v of disponibles || []) {
    const matricula = v['Matrícula']?.toUpperCase().replace(/\s+/g, '').trim()
    const stockItem = stockMap.get(matricula)
    
    if (stockItem && stockItem.is_sold === true) {
      malMarcados.push({
        stockId: stockItem.id,
        matricula: v['Matrícula'],
        modelo: v['Modelo'],
        currentIsSold: stockItem.is_sold
      })
    }
  }
  
  console.log(`\n2️⃣ Vehículos DISPONIBLES pero marcados como vendidos: ${malMarcados.length}`)
  
  if (malMarcados.length === 0) {
    console.log('\n✅ No hay vehículos para corregir. Todo está sincronizado.\n')
    return
  }
  
  // 4. Mostrar vehículos a corregir
  console.log('\n📝 VEHÍCULOS A CORREGIR:')
  console.log('='.repeat(80))
  malMarcados.forEach((v, i) => {
    console.log(`${i + 1}. ${v.matricula} - ${v.modelo} (is_sold: ${v.currentIsSold} → false)`)
  })
  
  // 5. Corregir cada vehículo
  console.log('\n\n🔧 CORRIGIENDO...')
  console.log('='.repeat(80))
  
  let corregidos = 0
  let errores = 0
  
  for (const vehiculo of malMarcados) {
    console.log(`\n• ${vehiculo.matricula}`)
    
    // Actualizar stock
    const { error: stockError } = await supabase
      .from('stock')
      .update({ is_sold: false })
      .eq('id', vehiculo.stockId)
    
    if (stockError) {
      console.log(`  ❌ Error en stock: ${stockError.message}`)
      errores++
      continue
    }
    
    console.log(`  ✅ Stock actualizado: is_sold = false`)
    
    // Actualizar fotos si existe (marcar como pendiente)
    const { error: fotosError } = await supabase
      .from('fotos')
      .update({ estado_pintura: 'pendiente' })
      .eq('license_plate', vehiculo.matricula)
    
    if (fotosError) {
      console.log(`  ⚠️  Fotos: ${fotosError.message}`)
    } else {
      console.log(`  ✅ Fotos actualizadas: estado_pintura = pendiente`)
    }
    
    corregidos++
  }
  
  // 6. Resumen
  console.log('\n\n📊 RESUMEN:')
  console.log('='.repeat(80))
  console.log(`Total corregidos: ${corregidos}`)
  console.log(`Errores: ${errores}`)
  
  // 7. Verificación final
  if (corregidos > 0) {
    console.log('\n🔍 VERIFICACIÓN FINAL:')
    for (const vehiculo of malMarcados) {
      const { data: verificacion } = await supabase
        .from('stock')
        .select('license_plate, is_sold')
        .eq('id', vehiculo.stockId)
        .single()
      
      if (verificacion) {
        console.log(`✅ ${verificacion.license_plate}: is_sold = ${verificacion.is_sold}`)
      }
    }
  }
  
  console.log('\n')
}

corregirDisponibles().catch(console.error)

