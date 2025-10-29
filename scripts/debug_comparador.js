/**
 * Script de Debug para el Comparador de Precios
 * Ayuda a diagnosticar por qué no se muestran datos
 * 
 * Ejecutar: node scripts/debug_comparador.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🔍 Diagnóstico del Comparador de Precios\n')

  try {
    // 1. Verificar duc_scraper (nuestros vehículos)
    console.log('1️⃣ VERIFICANDO NUESTROS VEHÍCULOS (DUC_SCRAPER)...')
    const { data: ducData, error: ducError } = await supabase
      .from('duc_scraper')
      .select('"ID Anuncio", "Matrícula", "Modelo", "Fecha primera matriculación", "KM", "Precio", "Precio vehículo nuevo", "Disponibilidad"')
      .eq('"Disponibilidad"', 'DISPONIBLE')
      .not('"Modelo"', 'is', null)
      .limit(10)

    // Función para parsear fechas en formato "DD / MM / YYYY"
    const parseSpanishDate = (fecha) => {
      if (!fecha) return null
      
      try {
        // Si ya es formato ISO (YYYY-MM-DD)
        if (fecha.includes('-')) {
          const year = parseInt(fecha.split('-')[0])
          return isNaN(year) ? null : year
        }
        
        // Formato DD / MM / YYYY
        const parts = fecha.split('/').map(p => p.trim())
        if (parts.length === 3) {
          const year = parseInt(parts[2])
          return isNaN(year) ? null : year
        }
        
        return null
      } catch {
        return null
      }
    }

    let stockData = []
    if (ducError) {
      console.error('   ❌ Error consultando duc_scraper:', ducError.message)
    } else {
      stockData = ducData.map(v => {
        const year = parseSpanishDate(v['Fecha primera matriculación'])
        return {
          id: v['ID Anuncio'],
          license_plate: v['Matrícula'],
          model: v['Modelo'],
          year: year ? year.toString() : null,
          km: v['KM'],
          price: v['Precio'],
          original_new_price: v['Precio vehículo nuevo']
        }
      })
      
      console.log(`   ✅ Vehículos disponibles: ${stockData.length}\n`)
      
      if (stockData.length > 0) {
        console.log('   📋 Ejemplos de nuestros vehículos:')
        stockData.slice(0, 3).forEach((v, i) => {
          console.log(`   ${i + 1}. ${v.license_plate} - ${v.model}`)
          console.log(`      Año: ${v.year || 'N/A'}`)
          console.log(`      KM: ${v.km || 'N/A'}`)
          console.log(`      Precio: ${v.price || 'SIN PRECIO'}`)
          console.log(`      Precio nuevo: ${v.original_new_price || 'NO DEFINIDO'}`)
        })
      } else {
        console.log('   ⚠️  No hay vehículos disponibles en DUC')
      }
    }

    console.log('\n')

    // 2. Verificar comparador_scraper
    console.log('2️⃣ VERIFICANDO COMPARADOR_SCRAPER...')
    const { data: comparadorData, error: comparadorError } = await supabase
      .from('comparador_scraper')
      .select('id, source, modelo, año, km, precio, precio_nuevo_original, estado_anuncio')
      .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado', 'precio_subido'])
      .limit(10)

    if (comparadorError) {
      console.error('   ❌ Error consultando comparador:', comparadorError.message)
    } else {
      console.log(`   ✅ Competidores disponibles: ${comparadorData.length} anuncios\n`)
      
      if (comparadorData.length > 0) {
        console.log('   📋 Ejemplos de competidores:')
        
        // Agrupar por source
        const porSource = comparadorData.reduce((acc, item) => {
          acc[item.source] = (acc[item.source] || 0) + 1
          return acc
        }, {})
        
        console.log('   Por fuente:')
        Object.entries(porSource).forEach(([source, count]) => {
          console.log(`      ${source}: ${count} anuncios`)
        })
        
        console.log('\n   Primeros 3 anuncios:')
        comparadorData.slice(0, 3).forEach((c, i) => {
          console.log(`   ${i + 1}. [${c.source}] ${c.modelo}`)
          console.log(`      Precio: ${c.precio}`)
          console.log(`      Precio nuevo original: ${c.precio_nuevo_original || 'NO DEFINIDO'}`)
        })
      } else {
        console.log('   ⚠️  No hay competidores activos en comparador_scraper')
      }
    }

    console.log('\n')

    // 3. Intentar hacer match
    if (stockData && stockData.length > 0 && comparadorData && comparadorData.length > 0) {
      console.log('3️⃣ INTENTANDO HACER MATCH...')
      
      // Usar el mismo algoritmo que la API actualizada
      const normalizeModel = (modelo) => {
        let normalized = modelo.trim().toLowerCase()
        let base = ''
        let variant = ''
        
        if (/\bi\d\b/.test(normalized)) {
          const match = normalized.match(/\b(i\d+)\s*(\d+|edrive\d+)?/i)
          if (match) {
            base = match[1]
            variant = match[2] || ''
          }
        }
        else if (/serie\s*\d/.test(normalized)) {
          const match = normalized.match(/serie\s*(\d+)\s*(\d{3}[a-z]*)?/i)
          if (match) {
            base = `serie ${match[1]}`
            variant = match[2] || ''
          }
        }
        else if (/\bx\d\b/.test(normalized)) {
          const match = normalized.match(/\b(x\d+)\s*([a-z]*drive\d+[a-z]*)?/i)
          if (match) {
            base = match[1]
            variant = match[2] || ''
          }
        }
        else if (/\bz\d\b/.test(normalized)) {
          const match = normalized.match(/\b(z\d+)\s*(\d{2,3}[a-z]*)?/i)
          if (match) {
            base = match[1]
            variant = match[2] || ''
          }
        }
        else if (/mini/.test(normalized)) {
          const match = normalized.match(/\b(cooper|countryman|clubman|paceman)\s*([sd]|jcw)?/i)
          if (match) {
            base = match[1]
            variant = match[2] || ''
          }
        }
        
        return { base, variant: variant.toLowerCase() }
      }

      let totalMatches = 0
      
      stockData.forEach((vehiculo, idx) => {
        const modeloNuestro = vehiculo.model?.toLowerCase() || ''
        
        const matches = comparadorData.filter((comp) => {
          if (!comp.modelo) return false
          
          const modeloComp = comp.modelo?.toLowerCase() || ''
          
          const nuestroNorm = normalizeModel(modeloNuestro)
          const compNorm = normalizeModel(modeloComp)
          
          // Base debe coincidir
          if (nuestroNorm.base !== compNorm.base) {
            return false
          }
          
          // Si AMBOS tienen variante, deben coincidir
          if (nuestroNorm.variant && compNorm.variant) {
            if (nuestroNorm.variant !== compNorm.variant) {
              return false
            }
          }
          
          // Verificar año (±1 año)
          if (vehiculo.year && comp.año) {
            const añoNuestro = parseInt(vehiculo.year)
            const añoComp = parseInt(comp.año)
            
            if (!isNaN(añoNuestro) && !isNaN(añoComp)) {
              const diferenciaAños = Math.abs(añoNuestro - añoComp)
              if (diferenciaAños > 1) {
                return false
              }
            }
          }
          
          return true
        })

        if (matches.length > 0) {
          totalMatches++
          if (idx === 0) {
            console.log(`\n   Ejemplo de match para: ${vehiculo.model}`)
            console.log(`   Competidores encontrados: ${matches.length}`)
            matches.slice(0, 2).forEach((m, i) => {
              console.log(`      ${i + 1}. ${m.modelo} (${m.source})`)
            })
          }
        }
      })

      console.log(`\n   📊 Resultado: ${totalMatches}/${stockData.length} vehículos tienen competidores`)
      
      if (totalMatches === 0) {
        console.log('\n   ⚠️  PROBLEMA: No se encontraron matches')
        console.log('   Posibles causas:')
        console.log('   - Los modelos en stock no coinciden con los del scraper')
        console.log('   - El algoritmo de matching es muy estricto')
        console.log('\n   Sugerencia: Verifica que los nombres de modelos sean compatibles')
      }
    }

    console.log('\n')

    // 4. Verificar precios
    console.log('4️⃣ VERIFICANDO PRECIOS...')
    
    const stockConPrecio = stockData?.filter(v => v.price) || []
    const stockConPrecioNuevo = stockData?.filter(v => v.original_new_price) || []
    
    console.log(`   Stock con precio: ${stockConPrecio.length}/${stockData?.length || 0}`)
    console.log(`   Stock con precio_nuevo_original: ${stockConPrecioNuevo.length}/${stockData?.length || 0}`)
    
    const comparadorConPrecioNuevo = comparadorData?.filter(c => c.precio_nuevo_original) || []
    console.log(`   Comparador con precio_nuevo_original: ${comparadorConPrecioNuevo.length}/${comparadorData?.length || 0}`)

    console.log('\n')

    // 5. Resumen
    console.log('📝 RESUMEN Y RECOMENDACIONES:\n')
    
    if (!stockData || stockData.length === 0) {
      console.log('❌ CRÍTICO: No hay vehículos en stock')
      console.log('   Acción: Añade vehículos a la tabla stock con is_sold = false\n')
    }
    
    if (!comparadorData || comparadorData.length === 0) {
      console.log('❌ CRÍTICO: No hay competidores en comparador_scraper')
      console.log('   Acción: Ejecuta el scraper para poblar comparador_scraper\n')
    }
    
    if (stockConPrecio.length === 0) {
      console.log('⚠️  ADVERTENCIA: Los vehículos en stock no tienen precio')
      console.log('   Acción: Actualiza la columna "price" en stock\n')
    }
    
    if (stockConPrecioNuevo.length === 0) {
      console.log('⚠️  ADVERTENCIA: Los vehículos en stock no tienen precio_nuevo_original')
      console.log('   Acción: Actualiza la columna "original_new_price" en stock')
      console.log('   Ejemplo SQL: UPDATE stock SET original_new_price = 52000 WHERE model LIKE \'%Serie 3%\'\n')
    }
    
    if (comparadorConPrecioNuevo.length === 0) {
      console.log('⚠️  ADVERTENCIA: Los competidores no tienen precio_nuevo_original')
      console.log('   Acción: El scraper debe calcular y guardar precio_nuevo_original\n')
    }

    console.log('✅ Diagnóstico completado\n')

  } catch (error) {
    console.error('❌ Error durante diagnóstico:', error.message)
  }
}

main()

