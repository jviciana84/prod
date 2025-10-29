const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const MATRICULA = process.argv[2] || '8495MVX'

function parsePrice(precio) {
  if (!precio) return null
  const cleaned = precio.toString().replace(/[€.\s]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseSpanishDate(fecha) {
  if (!fecha) return null
  
  try {
    if (fecha.includes('-')) {
      const year = parseInt(fecha.split('-')[0])
      return isNaN(year) ? null : year
    }
    
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

function normalizeModel(modelo) {
  let normalized = modelo.trim().toLowerCase()
  let base = ''
  let variant = ''
  
  // Detectar BMW eléctricos
  if (/\bi[xX]\d+/.test(normalized)) {
    const match = normalized.match(/\b(i[xX]\d+)\s*([ex]?drive\d+|m\d+)?/i)
    if (match) {
      base = match[1].toLowerCase()
      variant = match[2] ? match[2].toLowerCase() : ''
    }
  }
  else if (/\bi[xX]\b/.test(normalized)) {
    const match = normalized.match(/\b(i[xX])\s*([ex]?drive\d+|m\d+)?/i)
    if (match) {
      base = match[1].toLowerCase()
      variant = match[2] ? match[2].toLowerCase() : ''
    }
  }
  else if (/\bi\d+/.test(normalized)) {
    const match = normalized.match(/\b(i\d+)\s*([ex]?drive\d+|m\d+)?/i)
    if (match) {
      base = match[1].toLowerCase()
      variant = match[2] ? match[2].toLowerCase() : ''
    }
  }
  else if (/s[ei]rie?\s*\d/.test(normalized)) {
    const match = normalized.match(/s[ei]rie?\s*(\d+)\s*(\d{3}[a-z]*)?\s*(gran\s*coupe|coupe|touring|cabrio|compact)?/i)
    if (match) {
      base = `serie ${match[1]}`
      const motor = match[2] || ''
      const carroceria = match[3] ? ` ${match[3].replace(/\s+/g, ' ')}` : ''
      variant = (motor + carroceria).trim().toLowerCase()
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
    // MINI 3 Puertas, 5 Puertas (ANTES de Cooper)
    if (/\b(\d+)\s*puertas?\b/.test(normalized)) {
      const match = normalized.match(/\b(\d+)\s*puertas?\b/i)
      if (match) {
        base = `mini ${match[1]} puertas`
        // Extraer variante si existe
        if (/cooper\s*se/i.test(normalized)) variant = 'cooper se'
        else if (/cooper\s*s\b/i.test(normalized)) variant = 'cooper s'
        else if (/john\s*cooper\s*works|jcw/i.test(normalized)) variant = 'jcw'
        else if (/cooper\s*c\b/i.test(normalized)) variant = 'cooper c'
        else if (/cooper/i.test(normalized)) variant = 'cooper'
      }
    }
    // Countryman, Clubman, Paceman
    else if (/\b(countryman|clubman|paceman)\b/.test(normalized)) {
      const match = normalized.match(/\b(countryman|clubman|paceman)\s*([sd]|jcw|cooper)?/i)
      if (match) {
        base = `mini ${match[1]}`
        variant = match[2] || ''
      }
    }
    // MINI Aceman
    else if (/aceman/.test(normalized)) {
      base = 'mini aceman'
      if (/aceman\s*se/.test(normalized)) variant = 'se'
      else if (/aceman\s*e\b/.test(normalized)) variant = 'e'
    }
    // MINI Cabrio
    else if (/cabrio/.test(normalized)) {
      base = 'mini cabrio'
      variant = ''
    }
    // MINI Cooper (solo, sin puertas ni otros identificadores)
    else if (/cooper/.test(normalized)) {
      base = 'mini cooper'
      if (/cooper\s*se/.test(normalized)) variant = 'se'
      else if (/cooper\s*s\b/.test(normalized)) variant = 's'
      else if (/john\s*cooper\s*works|jcw/.test(normalized)) variant = 'jcw'
      else variant = ''
    }
  }
  
  if (!base && normalized.length > 0) {
    base = normalized
  }
  
  return { base, variant: variant.toLowerCase() }
}

async function main() {
  console.log(`🔍 Analizando vehículo: ${MATRICULA}\n`)

  try {
    // Buscar el vehículo
  const { data: vehiculo, error: vError } = await supabase
    .from('duc_scraper')
    .select('"ID Anuncio", "Matrícula", "Modelo", "Versión", "Fecha primera matriculación", "KM", "Precio", "Precio vehículo nuevo", "URL"')
    .eq('"Matrícula"', MATRICULA)
    .single()

  if (vError || !vehiculo) {
    console.error('❌ Vehículo no encontrado en duc_scraper')
    return
  }

  // Combinar Modelo + Versión (igual que la API)
  let modeloCompleto = vehiculo['Modelo']
  if (vehiculo['Versión']) {
    const versionMatch = vehiculo['Versión'].match(/([ex]?Drive\d+|M\d+|\d{3}[a-z]+)/i)
    if (versionMatch) {
      modeloCompleto = `${vehiculo['Modelo']} ${versionMatch[1]}`
    } else {
      modeloCompleto = `${vehiculo['Modelo']} ${vehiculo['Versión'].split(' ')[0]}`
    }
  }

  const year = parseSpanishDate(vehiculo['Fecha primera matriculación'])
  
  console.log('📋 DATOS DEL VEHÍCULO:')
  console.log(`   Matrícula: ${vehiculo['Matrícula']}`)
  console.log(`   Modelo original: ${vehiculo['Modelo']}`)
  console.log(`   Versión: ${vehiculo['Versión']}`)
  console.log(`   → Modelo completo: ${modeloCompleto}`)
  console.log(`   Año: ${year || 'N/A'}`)
  console.log(`   KM: ${vehiculo['KM']}`)
  console.log(`   Precio: ${vehiculo['Precio']}`)
  console.log(`   Precio nuevo: ${vehiculo['Precio vehículo nuevo']}`)
  console.log(`   URL: ${vehiculo['URL'] || 'N/A'}`)

  const nuestroNorm = normalizeModel(modeloCompleto || '')
    console.log(`\n🔧 MODELO NORMALIZADO:`)
    console.log(`   Base: "${nuestroNorm.base}"`)
    console.log(`   Variante: "${nuestroNorm.variant}"`)

    // Buscar competidores (cargar TODOS sin límite)
    console.log('\n🔍 BUSCANDO COMPETIDORES...')
    
    // Hacer múltiples queries si es necesario para cargar todos
    let allData = []
    let offset = 0
    const limit = 1000
    
    while (true) {
      const { data: batch } = await supabase
        .from('comparador_scraper')
        .select('id, source, modelo, año, km, precio, precio_nuevo_original, concesionario, url, dias_publicado, estado_anuncio')
        .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado', 'precio_subido'])
        .range(offset, offset + limit - 1)
      
      if (!batch || batch.length === 0) break
      
      allData = allData.concat(batch)
      
      if (batch.length < limit) break
      offset += limit
    }
    
    const comparadorData = allData
    console.log(`   Total anuncios cargados: ${comparadorData?.length || 0}`)

    // Contar cuántos iX1 hay en total antes de filtrar
    const ix1Total = comparadorData.filter(c => c.modelo && c.modelo.toLowerCase().includes('ix1'))
    console.log(`   iX1 en total: ${ix1Total.length}`)
    const ix1Edrive20 = ix1Total.filter(c => c.modelo.toLowerCase().includes('edrive20'))
    console.log(`   iX1 eDrive20: ${ix1Edrive20.length}`)
    
    let debugCount = 0
    let ix1DebugCount = 0
    const competidores = comparadorData.filter((comp) => {
      if (!comp.modelo) return false
      
      // EXCLUIR nuestros propios vehículos (Quadis)
      if (comp.concesionario) {
        const concesionarioLower = comp.concesionario.toLowerCase()
        if (concesionarioLower.includes('quadis') || concesionarioLower.includes('duc')) {
          return false
        }
      }
      
      const modeloComp = comp.modelo?.toLowerCase() || ''
      const compNorm = normalizeModel(modeloComp)
      
      // Debug para iX1 eDrive20 específicamente
      if (ix1DebugCount < 5 && modeloComp.includes('ix1') && modeloComp.includes('edrive20')) {
        console.log(`\n  🔍 DEBUG iX1 #${ix1DebugCount + 1}: ${comp.modelo}`)
        console.log(`     Base: "${compNorm.base}", Variante: "${compNorm.variant}"`)
        console.log(`     Nuestro - Base: "${nuestroNorm.base}", Variante: "${nuestroNorm.variant}"`)
        console.log(`     Año: ${comp.año} vs ${year}`)
        console.log(`     Base match: ${nuestroNorm.base === compNorm.base}`)
        console.log(`     Variante match: ${!nuestroNorm.variant || !compNorm.variant || nuestroNorm.variant === compNorm.variant}`)
        if (year && comp.año) {
          const añoComp = parseInt(comp.año)
          const diferencia = Math.abs(year - añoComp)
          console.log(`     Año match: diferencia ${diferencia} años (debe ser ≤1)`)
        }
        ix1DebugCount++
      }
      
      // Si alguna base está vacía, no hay match
      if (!nuestroNorm.base || !compNorm.base) {
        return false
      }
      
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
      
      // Año (±1 año)
      if (year && comp.año) {
        const añoComp = parseInt(comp.año)
        
        if (!isNaN(añoComp)) {
          const diferenciaAños = Math.abs(year - añoComp)
          if (diferenciaAños > 1) {
            return false
          }
        }
      }
      
      return true
    })

    console.log(`\n📊 COMPETIDORES ENCONTRADOS: ${competidores.length}`)
    
    if (competidores.length > 0) {
      console.log('\n🔵 LISTA DE COMPETIDORES:')
      competidores.forEach((comp, idx) => {
        const compNorm = normalizeModel(comp.modelo)
        console.log(`\n${idx + 1}. [${comp.source}] ${comp.modelo}`)
        console.log(`   Año: ${comp.año}`)
        console.log(`   Base: "${compNorm.base}", Variante: "${compNorm.variant}"`)
        console.log(`   Precio: ${comp.precio}`)
        console.log(`   Precio nuevo: ${comp.precio_nuevo_original || 'N/A'}`)
        console.log(`   KM: ${comp.km}`)
        console.log(`   Días publicado: ${comp.dias_publicado || 'N/A'}`)
        console.log(`   Concesionario: ${comp.concesionario || 'N/A'}`)
      })

      // Calcular estadísticas
      const precios = competidores.map(c => parsePrice(c.precio)).filter(p => p !== null)
      if (precios.length > 0) {
        const precioMedio = precios.reduce((a, b) => a + b, 0) / precios.length
        const precioMin = Math.min(...precios)
        const precioMax = Math.max(...precios)
        
        console.log(`\n📈 ESTADÍSTICAS:`)
        console.log(`   Precio medio: ${precioMedio.toFixed(2)}€`)
        console.log(`   Precio mínimo: ${precioMin.toFixed(2)}€`)
        console.log(`   Precio máximo: ${precioMax.toFixed(2)}€`)
        
        const nuestroPrecio = parsePrice(vehiculo['Precio'])
        if (nuestroPrecio) {
          const diferencia = nuestroPrecio - precioMedio
          const porcentaje = (diferencia / precioMedio) * 100
          
          console.log(`\n💰 COMPARACIÓN:`)
          console.log(`   Nuestro precio: ${nuestroPrecio.toFixed(2)}€`)
          console.log(`   vs Mercado: ${precioMedio.toFixed(2)}€`)
          console.log(`   Diferencia: ${diferencia > 0 ? '+' : ''}${diferencia.toFixed(2)}€ (${porcentaje > 0 ? '+' : ''}${porcentaje.toFixed(2)}%)`)
          
          if (porcentaje <= -3) {
            console.log(`   Estado: 🟢 COMPETITIVO (precio bajo)`)
          } else if (porcentaje >= 3) {
            console.log(`   Estado: 🔴 ALTO (precio alto)`)
          } else {
            console.log(`   Estado: 🟡 JUSTO (precio en línea)`)
          }
        }
      }
    } else {
      console.log('\n⚠️  No se encontraron competidores')
      console.log('\nPosibles razones:')
      console.log(`   - No hay ${nuestroNorm.base} en comparador_scraper`)
      console.log(`   - No hay del año ${year} (±1 año)`)
      console.log('   - El modelo no se normalizó correctamente')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main()

