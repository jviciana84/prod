require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function parsePrice(priceStr) {
  if (!priceStr) return null
  const cleanStr = String(priceStr).replace(/[^\d,.-]/g, '').replace(',', '.')
  const num = parseFloat(cleanStr)
  return isNaN(num) ? null : num
}

function parseKm(kmStr) {
  if (!kmStr) return null
  const cleanStr = String(kmStr).replace(/[^\d]/g, '')
  const num = parseInt(cleanStr)
  return isNaN(num) ? null : num
}

function identificarGama(modelo) {
  const modeloLower = modelo.toLowerCase()
  
  // Gama Alta
  if (modeloLower.includes('x5') || modeloLower.includes('x6') || modeloLower.includes('x7') ||
      modeloLower.includes('serie 5') || modeloLower.includes('serie 7') || modeloLower.includes('serie 8')) {
    return 'alta'
  }
  
  // Gama Media
  if (modeloLower.includes('x3') || modeloLower.includes('x4') || modeloLower.includes('serie 3') || 
      modeloLower.includes('serie 4')) {
    return 'media'
  }
  
  // Gama Básica (por defecto)
  return 'basica'
}

function identificarEquipamiento(modelo, precioNuevo) {
  const gama = identificarGama(modelo)
  
  // Precios base aproximados por gama
  const preciosBase = {
    'alta': 105000,    // X5/Serie 5 base ~105k€
    'media': 55000,    // X3/Serie 3 base ~55k€
    'basica': 35000    // X1/Serie 1/MINI base ~35k€
  }
  
  const precioBase = preciosBase[gama]
  const diferencia = precioNuevo - precioBase
  
  if (diferencia < -10000) return 'basico'    // Muy por debajo (configuración mínima)
  if (diferencia < 10000) return 'medio'      // Cerca del base
  return 'premium'                             // Por encima (bien equipado)
}

function valorKmPorGama(gama) {
  const valores = {
    'basica': 0.10,  // +1.000€ por cada 10.000 km
    'media': 0.15,   // +1.500€ por cada 10.000 km
    'alta': 0.20     // +2.000€ por cada 10.000 km
  }
  return valores[gama] || 0.15
}

async function diagnosticar() {
  console.log('═'.repeat(80))
  console.log('🔍 DIAGNÓSTICO PRECIO 9853MKL')
  console.log('═'.repeat(80))
  console.log('')
  
  // 1. Obtener el vehículo 9853MKL (buscar en duc_scraper)
  const { data: vehiculo, error } = await supabase
    .from('duc_scraper')
    .select('*')
    .eq('Matrícula', '9853MKL')
    .single()
  
  if (!vehiculo || error) {
    console.log('❌ No se encontró el vehículo 9853MKL en duc_scraper')
    console.log(`Error: ${error?.message}`)
    return
  }
  
  console.log('✅ DATOS DEL VEHÍCULO:')
  console.log(`   Modelo: ${vehiculo['Modelo']}`)
  console.log(`   Año: ${vehiculo['Año 1ª Matriculación']}`)
  console.log(`   KM: ${parseKm(vehiculo['Kilometraje'])?.toLocaleString()}`)
  console.log(`   Precio actual: ${parsePrice(vehiculo['Precio'])?.toLocaleString()}€`)
  console.log(`   Precio nuevo original: ${parsePrice(vehiculo['precio_nuevo_original'])?.toLocaleString()}€`)
  console.log('')
  
  const nuestrosKm = parseKm(vehiculo['Kilometraje']) || 0
  const nuestroPrecio = parsePrice(vehiculo['Precio'])
  const precioNuevoNuestro = parsePrice(vehiculo['precio_nuevo_original'])
  const nuestroAño = parseInt(vehiculo['Año 1ª Matriculación'])
  
  const gamaVehiculo = identificarGama(vehiculo['Modelo'])
  const equipamientoVehiculo = precioNuevoNuestro 
    ? identificarEquipamiento(vehiculo.model, precioNuevoNuestro)
    : 'basico'
  
  console.log('✅ CLASIFICACIÓN:')
  console.log(`   Gama: ${gamaVehiculo.toUpperCase()}`)
  console.log(`   Equipamiento: ${equipamientoVehiculo.toUpperCase()}`)
  console.log('')
  
  // 2. Buscar competidores
  const { data: competidores } = await supabase
    .from('comparador_scraper')
    .select('*')
    .ilike('modelo', '%x5%')
    .gte('año', nuestroAño - 2)
    .lte('año', nuestroAño + 2)
  
  console.log(`✅ COMPETIDORES ENCONTRADOS: ${competidores?.length || 0}`)
  console.log('')
  
  // 3. Filtrar sin Quadis/Munich
  const competidoresSinQuadis = competidores.filter(c => {
    if (!c.concesionario) return true
    const concesionarioLower = c.concesionario.toLowerCase()
    return !concesionarioLower.includes('quadis') && 
           !concesionarioLower.includes('motor munich') &&
           !concesionarioLower.includes('munich') &&
           !concesionarioLower.includes('duc')
  })
  
  console.log(`✅ COMPETIDORES SIN QUADIS/MUNICH: ${competidoresSinQuadis.length}`)
  console.log('')
  
  // 4. Segmentar por equipamiento
  let competidoresComparables = competidoresSinQuadis
  if (precioNuevoNuestro) {
    const margenEquipamiento = 10000
    competidoresComparables = competidoresSinQuadis.filter(c => {
      const precioNuevoComp = c.precio_nuevo_original || parsePrice(c.precio_nuevo)
      if (!precioNuevoComp) return true
      return Math.abs(precioNuevoComp - precioNuevoNuestro) <= margenEquipamiento
    })
    
    console.log(`✅ FILTRO POR EQUIPAMIENTO (${precioNuevoNuestro.toLocaleString()}€ ±10k€):`)
    console.log(`   Comparables: ${competidoresComparables.length}`)
    console.log('')
    
    // Filtro adicional para gama alta + básico
    if (gamaVehiculo === 'alta' && equipamientoVehiculo === 'basico' && nuestroPrecio) {
      const margenPrecioVenta = 5000
      const antesFiltroPrecio = competidoresComparables.length
      competidoresComparables = competidoresComparables.filter(c => {
        const precioVentaComp = parsePrice(c.precio)
        if (!precioVentaComp) return true
        return precioVentaComp <= (nuestroPrecio + margenPrecioVenta) || 
               Math.abs(precioVentaComp - nuestroPrecio) <= margenPrecioVenta
      })
      console.log(`✅ FILTRO ADICIONAL POR PRECIO VENTA (${nuestroPrecio.toLocaleString()}€ ±5k€):`)
      console.log(`   Antes: ${antesFiltroPrecio}`)
      console.log(`   Después: ${competidoresComparables.length}`)
      console.log('')
    }
    
    if (competidoresComparables.length < 3) {
      competidoresComparables = competidoresSinQuadis
      console.log(`⚠️  Muy pocos comparables, usando todos (${competidoresComparables.length})`)
      console.log('')
    }
  }
  
  // 5. Calcular precios
  const preciosCompetencia = competidoresComparables
    .map(c => parsePrice(c.precio))
    .filter(p => p !== null)
    .sort((a, b) => a - b)
  
  console.log(`✅ PRECIOS DE COMPETENCIA (ordenados):`)
  console.log(`   Mínimo: ${preciosCompetencia[0]?.toLocaleString()}€`)
  console.log(`   Percentil 25: ${preciosCompetencia[Math.floor(preciosCompetencia.length * 0.25)]?.toLocaleString()}€`)
  console.log(`   Promedio: ${(preciosCompetencia.reduce((sum, p) => sum + p, 0) / preciosCompetencia.length).toLocaleString()}€`)
  console.log(`   Máximo: ${preciosCompetencia[preciosCompetencia.length - 1]?.toLocaleString()}€`)
  console.log('')
  
  // 6. Determinar base
  let precioMedioCompetencia = null
  if (preciosCompetencia.length > 0) {
    if (gamaVehiculo === 'alta' && equipamientoVehiculo === 'basico') {
      const percentil25 = Math.floor(preciosCompetencia.length * 0.25)
      precioMedioCompetencia = preciosCompetencia[percentil25]
      console.log(`✅ BASE UTILIZADA (Gama Alta + Básico):`)
      console.log(`   Percentil 25: ${precioMedioCompetencia.toLocaleString()}€`)
    } else {
      precioMedioCompetencia = preciosCompetencia.reduce((sum, p) => sum + p, 0) / preciosCompetencia.length
      console.log(`✅ BASE UTILIZADA (Promedio):`)
      console.log(`   ${precioMedioCompetencia.toLocaleString()}€`)
    }
  }
  console.log('')
  
  // 7. Calcular KM medio
  const kmsCompetencia = competidoresComparables
    .map(c => parseKm(c.km))
    .filter(km => km !== null)
  
  const kmMedioCompetencia = kmsCompetencia.length > 0
    ? kmsCompetencia.reduce((sum, km) => sum + km, 0) / kmsCompetencia.length
    : nuestrosKm
  
  console.log(`✅ KILOMETRAJE:`)
  console.log(`   Nuestro: ${nuestrosKm.toLocaleString()} km`)
  console.log(`   Promedio competencia: ${Math.round(kmMedioCompetencia).toLocaleString()} km`)
  console.log(`   Diferencia: ${(nuestrosKm - kmMedioCompetencia).toLocaleString()} km`)
  console.log('')
  
  // 8. Calcular precio recomendado
  let precioRecomendado = precioMedioCompetencia
  
  if (precioMedioCompetencia && kmMedioCompetencia) {
    const diferenciaKm = nuestrosKm - kmMedioCompetencia
    
    console.log(`✅ CÁLCULO PRECIO RECOMENDADO:`)
    console.log(`   Base: ${precioMedioCompetencia.toLocaleString()}€`)
    
    if (gamaVehiculo === 'alta' && equipamientoVehiculo === 'basico') {
      const precioMinimoCompetencia = preciosCompetencia[0]
      console.log(`   Precio mínimo competencia: ${precioMinimoCompetencia.toLocaleString()}€`)
      
      const valorKm = valorKmPorGama(gamaVehiculo)
      const ajusteAgresivo = precioMinimoCompetencia * 0.03
      
      if (diferenciaKm < 0) {
        precioRecomendado = precioMinimoCompetencia * 0.99
        console.log(`   Tenemos MENOS KM → Precio = Mínimo × 0.99`)
        console.log(`   ${precioMinimoCompetencia.toLocaleString()}€ × 0.99 = ${precioRecomendado.toLocaleString()}€`)
      } else {
        const ajustePorKm = diferenciaKm * valorKm
        precioRecomendado = precioMinimoCompetencia - ajustePorKm - ajusteAgresivo
        console.log(`   Tenemos MÁS KM → Precio = Mínimo - AjusteKM - 3%`)
        console.log(`   AjusteKM: ${diferenciaKm.toLocaleString()} × ${valorKm}€ = ${ajustePorKm.toLocaleString()}€`)
        console.log(`   Ajuste Agresivo (3%): ${ajusteAgresivo.toLocaleString()}€`)
        console.log(`   ${precioMinimoCompetencia.toLocaleString()}€ - ${ajustePorKm.toLocaleString()}€ - ${ajusteAgresivo.toLocaleString()}€ = ${precioRecomendado.toLocaleString()}€`)
      }
      
      const limiteInferior = nuestroPrecio * 0.65
      if (precioRecomendado < limiteInferior) {
        console.log(`   ⚠️  Por debajo del límite inferior (${limiteInferior.toLocaleString()}€), ajustando...`)
        precioRecomendado = limiteInferior
      }
      
      if (precioRecomendado >= precioMinimoCompetencia) {
        console.log(`   ⚠️  Por encima del mínimo, ajustando a -3%...`)
        precioRecomendado = precioMinimoCompetencia * 0.97
      }
    } else {
      const valorKm = valorKmPorGama(gamaVehiculo)
      const ajustePorKm = diferenciaKm * valorKm
      precioRecomendado = precioMedioCompetencia - ajustePorKm
      
      console.log(`   Valor KM (${gamaVehiculo}): ${valorKm}€/km`)
      console.log(`   Ajuste KM: ${diferenciaKm.toLocaleString()} × ${valorKm}€ = ${ajustePorKm.toLocaleString()}€`)
      console.log(`   ${precioMedioCompetencia.toLocaleString()}€ - ${ajustePorKm.toLocaleString()}€ = ${precioRecomendado.toLocaleString()}€`)
    }
  }
  
  console.log('')
  console.log('═'.repeat(80))
  console.log(`🎯 PRECIO RECOMENDADO FINAL: ${Math.round(precioRecomendado).toLocaleString()}€`)
  console.log('═'.repeat(80))
  console.log('')
  console.log(`   Precio actual: ${nuestroPrecio.toLocaleString()}€`)
  console.log(`   Diferencia: ${(nuestroPrecio - precioRecomendado).toLocaleString()}€ (${((nuestroPrecio - precioRecomendado) / precioRecomendado * 100).toFixed(1)}%)`)
  console.log('')
}

diagnosticar().then(() => process.exit(0))

