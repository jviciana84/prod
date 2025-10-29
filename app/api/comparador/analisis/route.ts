import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Función auxiliar para extraer número de precio
function parsePrice(precio: string | null): number | null {
  if (!precio) return null
  const cleaned = precio.replace(/[€.\s]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

// Función auxiliar para parsear kilómetros (formato: "44.986 km" o "500 km")
function parseKm(km: string | number | null): number | null {
  if (!km) return null
  if (typeof km === 'number') return km
  // Quitar " km" y puntos (separadores de miles)
  const cleaned = km.replace(/\s*km\s*/i, '').replace(/\./g, '').trim()
  const num = parseInt(cleaned)
  return isNaN(num) ? null : num
}

// Función para calcular valor esperado normalizado de un vehículo
function calcularValorEsperado(precioNuevo: number, año: number, km: number): number {
  const añoActual = new Date().getFullYear()
  const antigüedad = añoActual - año
  
  // Depreciación por año
  let factorAño = 1.0
  if (antigüedad === 0) {
    factorAño = 0.85 // 15% primer año
  } else if (antigüedad === 1) {
    factorAño = 0.75 // 25% acumulado a los 2 años
  } else if (antigüedad === 2) {
    factorAño = 0.67 // 33% acumulado a los 3 años
  } else {
    // A partir del 3er año: 10% anual adicional
    factorAño = 0.67 - (antigüedad - 2) * 0.10
    if (factorAño < 0.30) factorAño = 0.30 // Mínimo 30% del valor
  }
  
  // Depreciación por kilometraje (€0.15 por km para premium)
  const depreciacionKm = km * 0.15
  
  // Calcular valor esperado
  let valorEsperado = (precioNuevo * factorAño) - depreciacionKm
  
  // Asegurar que no sea negativo
  if (valorEsperado < precioNuevo * 0.20) {
    valorEsperado = precioNuevo * 0.20 // Mínimo 20% del valor nuevo
  }
  
  return valorEsperado
}

// Función para calcular score de valor relativo
function calcularScoreValor(
  precioActual: number,
  precioNuevo: number,
  año: number,
  km: number
): { score: number; valorEsperado: number; ajustePorKm: number; ajustePorAño: number } {
  const valorEsperado = calcularValorEsperado(precioNuevo, año, km)
  
  // Score: qué tan cerca está del valor esperado
  // score > 0 = más caro de lo esperado
  // score < 0 = más barato de lo esperado
  const score = ((precioActual - valorEsperado) / valorEsperado) * 100
  
  return {
    score,
    valorEsperado,
    ajustePorKm: km * 0.15,
    ajustePorAño: precioNuevo * (1 - calcularValorEsperado(precioNuevo, año, 0) / precioNuevo)
  }
}

// Función para normalizar nombres de concesionarios
function normalizeConcesionario(nombre: string | null): string {
  if (!nombre || nombre.trim() === '') return 'Sin Información'
  
  const nombreLower = nombre.toLowerCase().trim()
  
  // Mapeos por orden de prioridad (más específico primero)
  if (nombreLower.includes('barcelona premium')) return 'Barcelona Premium'
  if (nombreLower.includes('barcelona')) return 'Barcelona Premium'
  if (nombreLower.includes('oliva motor')) return 'Oliva Motor'
  if (nombreLower.includes('oliva')) return 'Oliva Motor'
  if (nombreLower.includes('grünblau')) return 'Grünblau Motor'
  if (nombreLower.includes('quadis')) return 'Quadis'
  if (nombreLower.includes('motor munich')) return 'Motor Munich'
  if (nombreLower.includes('movitransa')) return 'Movitransa'
  if (nombreLower.includes('vehinter')) return 'Vehinter'
  if (nombreLower.includes('adler')) return 'Adler Motor'
  if (nombreLower.includes('automoviles') || nombreLower.includes('automóviles')) return 'Automóviles'
  if (nombreLower.includes('celtamotor')) return 'Celtamotor'
  if (nombreLower.includes('proa premium')) return 'Proa Premium'
  if (nombreLower.includes('proa')) return 'Proa'
  if (nombreLower.includes('lugauto')) return 'Lugauto'
  if (nombreLower.includes('bmw fuenteolid') || nombreLower.includes('fuenteolid')) return 'BMW Fuenteolid'
  if (nombreLower.includes('bmw marcos')) return 'BMW Marcos'
  if (nombreLower.includes('enekuri')) return 'Enekuri Motor'
  if (nombreLower.includes('automotor')) return 'Automotor'
  if (nombreLower.includes('momentum')) return 'Momentum'
  if (nombreLower.includes('movilnorte')) return 'Movilnorte'
  if (nombreLower.includes('augusta')) return 'Augusta'
  if (nombreLower.includes('triocar')) return 'Triocar'
  if (nombreLower.includes('san pablo')) return 'San Pablo Motor'
  if (nombreLower.includes('auto premier')) return 'Auto Premier'
  if (nombreLower.includes('hispamovil')) return 'Hispamovil'
  if (nombreLower.includes('bymycar')) return 'BYmyCAR'
  if (nombreLower.includes('caetano')) return 'Caetano'
  if (nombreLower.includes('bernesga')) return 'Bernesga Motor'
  if (nombreLower.includes('maberauto')) return 'Maberauto'
  if (nombreLower.includes('pruna')) return 'Pruna Motor'
  if (nombreLower.includes('tormes')) return 'Tormes Motor'
  if (nombreLower.includes('mandel')) return 'Mandel Motor'
  if (nombreLower.includes('lurauto')) return 'Lurauto'
  if (nombreLower.includes('san rafael')) return 'San Rafael Motor'
  if (nombreLower.includes('amiocar')) return 'Amiocar'
  if (nombreLower.includes('marmotor')) return 'Marmotor'
  if (nombreLower.includes('motor gorbea')) return 'Motor Gorbea'
  if (nombreLower.includes('novomóvil') || nombreLower.includes('novomovil')) return 'Novomóvil'
  if (nombreLower.includes('cabrero')) return 'Cabrero'
  if (nombreLower.includes('lizaga')) return 'Lizaga'
  if (nombreLower.includes('unicars')) return 'Unicars'
  if (nombreLower.includes('burgocar')) return 'Burgocar'
  if (nombreLower.includes('avilcar')) return 'Avilcar'
  if (nombreLower.includes('ilbira')) return 'Ilbira Motor'
  if (nombreLower.includes('carteya')) return 'Carteya Motor'
  if (nombreLower.includes('motri')) return 'Motri Motor'
  if (nombreLower.includes('albamocion')) return 'Albamocion'
  if (nombreLower.includes('ceres')) return 'Ceres Motor'
  if (nombreLower.includes('murcia premium')) return 'Murcia Premium'
  if (nombreLower.includes('cartagena premium')) return 'Cartagena Premium'
  if (nombreLower.includes('mini españa')) return 'MINI España Oficial'
  if (nombreLower.includes('fersan')) return 'Automóviles Fersan'
  
  // Si no hay mapeo, devolver el nombre original limpio
  return nombre.trim()
}

// Función para parsear fechas en formato "DD / MM / YYYY"
function parseSpanishDate(fecha: string | null): number | null {
  if (!fecha) return null
  
  // Formato: "14 / 04 / 2025" o "2024-10-29"
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

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') // 'BPS' o 'MN' o null (todos)
    const modeloFilter = searchParams.get('modelo')
    const estadoFilter = searchParams.get('estado') // competitivo, justo, alto
    
    // Obtener vehículos de nuestro stock desde duc_scraper (DUC es nuestra fuente de verdad)
    let ducQuery = supabase
      .from('duc_scraper')
      .select('"ID Anuncio", "Matrícula", "Modelo", "Versión", "Fecha primera matriculación", "KM", "Precio", "Precio vehículo nuevo", "Disponibilidad", "URL"')
      .eq('"Disponibilidad"', 'DISPONIBLE')
      .not('"Modelo"', 'is', null)
    
    const { data: stockData, error: stockError } = await ducQuery
    
    if (stockError) {
      console.error('Error consultando duc_scraper:', stockError)
      return NextResponse.json(
        { error: 'Error consultando nuestros vehículos', details: stockError },
        { status: 500 }
      )
    }
    
    // Transformar datos de DUC al formato esperado
    const stockDataTransformed = stockData.map((v: any) => {
      const year = parseSpanishDate(v['Fecha primera matriculación'])
      
      // Combinar Modelo + Versión para tener modelo completo
      // Ejemplo: "iX1" + "xDrive30 230 kW (313 CV)" → "iX1 xDrive30"
      let modeloCompleto = v['Modelo']
      if (v['Versión']) {
        // Extraer solo la parte relevante de la versión (eDrive40, xDrive30, etc)
        const versionMatch = v['Versión'].match(/([ex]?Drive\d+|M\d+|\d{3}[a-z]+)/i)
        if (versionMatch) {
          modeloCompleto = `${v['Modelo']} ${versionMatch[1]}`
        } else {
          modeloCompleto = `${v['Modelo']} ${v['Versión'].split(' ')[0]}`
        }
      }
      
      return {
        id: v['ID Anuncio'],
        license_plate: v['Matrícula'],
        model: modeloCompleto,
        year: year ? year.toString() : null,
        km: v['KM'],
        price: v['Precio'],
        original_new_price: v['Precio vehículo nuevo'],
        duc_url: v['URL'],
        cms_url: null
      }
    })

    // Obtener datos del comparador (competencia) - CARGAR TODOS (sin límite de 1000)
    let allComparadorData: any[] = []
    let offset = 0
    const batchSize = 1000
    
    while (true) {
      let query = supabase
        .from('comparador_scraper')
        .select('id, source, id_anuncio, modelo, año, km, precio, precio_nuevo, precio_nuevo_original, concesionario, url, dias_publicado, estado_anuncio')
        .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado', 'precio_subido'])
        .range(offset, offset + batchSize - 1)
      
      if (source) {
        query = query.eq('source', source)
      }
      
      const { data: batch, error } = await query
      
      if (error) {
        console.error('Error cargando batch:', error)
        break
      }
      
      if (!batch || batch.length === 0) break
      
      allComparadorData = allComparadorData.concat(batch)
      
      if (batch.length < batchSize) break
      offset += batchSize
    }
    
    const comparadorData = allComparadorData
    const comparadorError = null
    
    if (comparadorError) {
      console.error('Error consultando comparador:', comparadorError)
      return NextResponse.json(
        { error: 'Error consultando comparador', details: comparadorError },
        { status: 500 }
      )
    }

    // Procesar cada vehículo de nuestro stock
    const vehiculosConAnalisis = stockDataTransformed.map((vehiculo: any) => {
      // Buscar competidores similares con matching exacto
      // NOTA: NO excluimos Quadis aquí - se manejan en el frontend con color diferente
      const competidoresSimilares = comparadorData.filter((comp: any) => {
        if (!comp.modelo) return false
        
        const modeloNuestro = vehiculo.model?.toLowerCase() || ''
        const modeloComp = comp.modelo?.toLowerCase() || ''
        
        // Normalizar modelos para comparación exacta
        const normalizeModel = (modelo: string) => {
          // Remover espacios extra y normalizar
          let normalized = modelo.trim().toLowerCase()
          
          // Extraer componentes principales
          // Ejemplos: "i4 40" -> { base: "i4", variant: "40" }
          //           "BMW Serie 1 118d" -> { base: "serie 1", variant: "118d" }
          //           "BMW X3 xDrive20d" -> { base: "x3", variant: "xdrive20d" }
          
          let base = ''
          let variant = ''
          
          // Detectar BMW eléctricos: i4, i7, iX, iX1, iX2, iX3
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
          // Detectar Serie X (1,2,3,4,5,6,7,8) - muy flexible
          else if (/s[ei]?rie?\s*\d/.test(normalized)) {
            const match = normalized.match(/s[ei]?rie?\s*(\d+)\s*(\d{3}[a-z]*)?\s*(gran\s*coupe|coupe|touring|cabrio|compact)?/i)
            if (match) {
              base = `serie ${match[1]}`
              const motor = match[2] || ''
              const carroceria = match[3] ? ` ${match[3].replace(/\s+/g, ' ')}` : ''
              variant = (motor + carroceria).trim().toLowerCase()
            }
          }
          // Detectar X1, X2, X3, X4, X5, X6, X7
          else if (/\bx\d\b/.test(normalized)) {
            const match = normalized.match(/\b(x\d+)\s*([a-z]*drive\d+[a-z]*)?/i)
            if (match) {
              base = match[1]
              variant = match[2] || ''
            }
          }
          // Detectar Z4
          else if (/\bz\d\b/.test(normalized)) {
            const match = normalized.match(/\b(z\d+)\s*(\d{2,3}[a-z]*)?/i)
            if (match) {
              base = match[1]
              variant = match[2] || ''
            }
          }
          // MINI (varios modelos) - ORDEN IMPORTANTE: más específico primero
          else if (/mini/.test(normalized)) {
            // MINI 3 Puertas, 5 Puertas (ANTES de Cooper)
            if (/\b(\d+)\s*puertas?\b/.test(normalized)) {
              const match = normalized.match(/\b(\d+)\s*puertas?\b/i)
              if (match) {
                base = `mini ${match[1]} puertas`
                // Extraer variante si existe (Cooper SE, Cooper S, John Cooper Works)
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
            // MINI Cooper (solo, sin puertas)
            else if (/cooper/.test(normalized)) {
              base = 'mini cooper'
              if (/cooper\s*se/.test(normalized)) variant = 'se'
              else if (/cooper\s*s\b/.test(normalized)) variant = 's'
              else if (/john\s*cooper\s*works|jcw/.test(normalized)) variant = 'jcw'
              else variant = ''
            }
          }
          
          // Si no se detectó nada, retornar el modelo completo como base
          if (!base && normalized.length > 0) {
            base = normalized
          }
          
          return { base, variant: variant.toLowerCase() }
        }
        
        const nuestroNorm = normalizeModel(modeloNuestro)
        const compNorm = normalizeModel(modeloComp)
        
        // Si alguna base está vacía, no hay match
        if (!nuestroNorm.base || !compNorm.base) {
          return false
        }
        
        // Debe coincidir base exactamente
        if (nuestroNorm.base !== compNorm.base) {
          return false
        }
        
        // Si AMBOS tienen variante, deben coincidir exactamente
        // Si solo uno la tiene, se permite el match (más flexible)
        if (nuestroNorm.variant && compNorm.variant) {
          // Ambos tienen variante: deben coincidir
          if (nuestroNorm.variant !== compNorm.variant) {
            return false
          }
        }
        // Si nuestro vehículo NO tiene variante pero el competidor sí,
        // permitimos el match (ej: "i4" puede compararse con "i4 eDrive40")
        
        // Verificar año (mismo año o ±1 año de tolerancia)
        if (vehiculo.year && comp.año) {
          const añoNuestro = parseInt(vehiculo.year)
          const añoComp = parseInt(comp.año)
          
          if (!isNaN(añoNuestro) && !isNaN(añoComp)) {
            const diferenciaAños = Math.abs(añoNuestro - añoComp)
            if (diferenciaAños > 1) { // Tolerancia de ±1 año
              return false
            }
          }
        }
        
        return true
      })

      // Calcular precio medio de competencia (EXCLUYENDO Quadis para la métrica)
      const competidoresSinQuadis = competidoresSimilares.filter((c: any) => {
        if (!c.concesionario) return true
        const concesionarioLower = c.concesionario.toLowerCase()
        return !concesionarioLower.includes('quadis') && !concesionarioLower.includes('duc')
      })
      
      const preciosCompetencia = competidoresSinQuadis
        .map((c: any) => parsePrice(c.precio))
        .filter((p: number | null): p is number => p !== null)
      
      const precioMedioCompetencia = preciosCompetencia.length > 0
        ? preciosCompetencia.reduce((sum: number, p: number) => sum + p, 0) / preciosCompetencia.length
        : null

    // Calcular descuento promedio de competencia (EXCLUYENDO Quadis)
    const descuentosCompetencia = competidoresSinQuadis
      .filter((c: any) => {
        const precioNuevo = c.precio_nuevo_original || parsePrice(c.precio_nuevo)
        return precioNuevo && parsePrice(c.precio)
      })
      .map((c: any) => {
        const precioActual = parsePrice(c.precio)!
        const precioNuevo = c.precio_nuevo_original || parsePrice(c.precio_nuevo)!
        return ((precioNuevo - precioActual) / precioNuevo) * 100
      })
      
      const descuentoMedioCompetencia = descuentosCompetencia.length > 0
        ? descuentosCompetencia.reduce((sum: number, d: number) => sum + d, 0) / descuentosCompetencia.length
        : null

      // Obtener nuestro precio (de DUC o CMS si existe)
      const nuestroPrecio = parsePrice(vehiculo.price)
      const precioNuevoNuestro = parsePrice(vehiculo.original_new_price)
      const nuestrosKm = vehiculo.km || vehiculo.mileage || 0
      const nuestroAño = vehiculo.year ? parseInt(vehiculo.year) : new Date().getFullYear()
      
      // Calcular nuestro descuento (si tenemos precio nuevo original)
      const descuentoNuestro = precioNuevoNuestro && nuestroPrecio
        ? ((precioNuevoNuestro - nuestroPrecio) / precioNuevoNuestro) * 100
        : null

      // NUEVO: Calcular valor teórico esperado (depreciación)
      let valorEsperadoTeorico = null
      let ajusteKm = 0
      let ajusteAño = 0
      
      if (precioNuevoNuestro && nuestroAño) {
        const analisis = calcularScoreValor(0, precioNuevoNuestro, nuestroAño, nuestrosKm)
        valorEsperadoTeorico = analisis.valorEsperado
        ajusteKm = analisis.ajustePorKm
        ajusteAño = analisis.ajustePorAño
      }
      
      // Calcular KM medio de competidores para ajuste
      const kmsCompetencia = competidoresSinQuadis
        .map((c: any) => parseKm(c.km))
        .filter((km): km is number => km !== null)
      
      const kmMedioCompetencia = kmsCompetencia.length > 0
        ? kmsCompetencia.reduce((sum, km) => sum + km, 0) / kmsCompetencia.length
        : nuestrosKm
      
      // NUEVA LÓGICA: Ajustar precio recomendado por diferencia de KM
      let precioRecomendado = precioMedioCompetencia
      
      if (precioMedioCompetencia && kmMedioCompetencia) {
        // Calcular diferencia de KM
        const diferenciaKm = nuestrosKm - kmMedioCompetencia
        
        // Ajustar precio por diferencia de KM (€0.10/km es más realista para usado)
        const ajustePorKm = diferenciaKm * 0.10
        
        // Precio recomendado = precio medio mercado - ajuste por tus KM extras
        precioRecomendado = precioMedioCompetencia - ajustePorKm
        
        // Aplicar límites razonables
        if (precioRecomendado < nuestroPrecio * 0.8) {
          precioRecomendado = nuestroPrecio * 0.8 // No recomendar más de 20% de bajada
        }
        if (precioRecomendado > precioMedioCompetencia * 1.1) {
          precioRecomendado = precioMedioCompetencia * 1.1 // No recomendar más de 10% de subida
        }
      }
      
      // Calcular diferencia contra mercado REAL
      const diferencia = nuestroPrecio && precioMedioCompetencia 
        ? nuestroPrecio - precioMedioCompetencia 
        : null
      
      const porcentajeDif = diferencia && precioMedioCompetencia
        ? (diferencia / precioMedioCompetencia) * 100
        : null
      
      // Calcular diferencia contra precio AJUSTADO por KM
      const diferenciaAjustada = nuestroPrecio && precioRecomendado
        ? nuestroPrecio - precioRecomendado
        : null
      
      const porcentajeDifAjustado = diferenciaAjustada && precioRecomendado
        ? (diferenciaAjustada / precioRecomendado) * 100
        : null
      
      // Determinar posición basada en precio AJUSTADO por KM
      let posicion = 'justo'
      let recomendacion = ''
      
      if (porcentajeDifAjustado !== null) {
        const diferenciaKmTexto = nuestrosKm > kmMedioCompetencia 
          ? `${(nuestrosKm - kmMedioCompetencia).toLocaleString()} km más` 
          : `${(kmMedioCompetencia - nuestrosKm).toLocaleString()} km menos`
        
        if (porcentajeDifAjustado <= -3) {
          // Precio competitivo considerando TUS KM
          posicion = 'competitivo'
          recomendacion = `Excelente precio. Tienes ${diferenciaKmTexto} que la competencia, tu precio ajustado es ${Math.abs(porcentajeDifAjustado).toFixed(1)}% mejor. Puedes mantener o subir hasta ${precioRecomendado.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€`
        } else if (porcentajeDifAjustado >= 3) {
          // Precio alto considerando TUS KM
          posicion = 'alto'
          recomendacion = `Precio elevado. Con ${diferenciaKmTexto} que la competencia, deberías estar en ${precioRecomendado.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€ (${Math.abs(porcentajeDifAjustado).toFixed(1)}% menos)`
        } else {
          // Precio justo
          posicion = 'justo'
          recomendacion = `Precio adecuado considerando tus ${nuestrosKm.toLocaleString()} km vs ${kmMedioCompetencia.toLocaleString()} km de media del mercado`
        }
      }
      
      // Factor días en stock
      let diasEnStock = 0
      if (vehiculo.purchase_date) {
        const fechaCompra = new Date(vehiculo.purchase_date)
        const hoy = new Date()
        diasEnStock = Math.floor((hoy.getTime() - fechaCompra.getTime()) / (1000 * 60 * 60 * 24))
      }
      
      // Ajustar recomendación si lleva más de 60 días
      if (diasEnStock > 60 && posicion !== 'competitivo') {
        const descuentoUrgente = precioRecomendado * 0.95 // 5% adicional
        recomendacion += `. ⚠️ URGENTE: Lleva ${diasEnStock} días sin vender. Considera ${descuentoUrgente.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€ para venta rápida`
        precioRecomendado = descuentoUrgente
      }
      
      // Análisis del mercado vs depreciación teórica
      let analisisMercado = ''
      if (valorEsperadoTeorico && precioMedioCompetencia) {
        const diferenciaTeoricoReal = precioMedioCompetencia - valorEsperadoTeorico
        const porcTeoricoReal = (diferenciaTeoricoReal / valorEsperadoTeorico) * 100
        
        if (porcTeoricoReal > 20) {
          analisisMercado = `📈 Mercado inflado: Los compradores pagan ${porcTeoricoReal.toFixed(0)}% más del valor teórico. Alta demanda del modelo`
        } else if (porcTeoricoReal < -20) {
          analisisMercado = `📉 Mercado deflactado: Se vende ${Math.abs(porcTeoricoReal).toFixed(0)}% por debajo del valor teórico`
        } else {
          analisisMercado = `📊 Mercado equilibrado: Precios alineados con depreciación esperada`
        }
      }

      return {
        // Datos de nuestro vehículo
        id: vehiculo.id,
        matricula: vehiculo.license_plate,
        modelo: vehiculo.model,
        año: vehiculo.year,
        km: vehiculo.km || vehiculo.mileage,
        nuestroPrecio,
        precioNuevo: precioNuevoNuestro,
        descuentoNuestro,
        enlaceAnuncio: vehiculo.duc_url || vehiculo.cms_url || null,
        
        // Análisis de competencia
        precioMedioCompetencia,
        descuentoMedioCompetencia,
        diferencia,
        porcentajeDif,
        competidores: competidoresSinQuadis.length, // Solo contar competencia real
        competidoresTotal: competidoresSimilares.length, // Incluye Quadis
        posicion,
        precioSugerido: precioRecomendado,
        
        // Análisis detallado (para mostrar en el modal)
        valorEsperadoTeorico,  // Lo que DEBERÍA valer por depreciación
        precioRealMercado: precioMedioCompetencia, // Lo que REALMENTE se vende (medio)
        kmMedioCompetencia, // KM medio de competidores
        precioRecomendado, // Lo que recomendamos cobrar (AJUSTADO por tus KM)
        diferenciaAjustada, // Diferencia vs precio ajustado
        porcentajeDifAjustado, // % diferencia vs ajustado
        ajusteKm, // Cuánto resta el kilometraje (depreciación)
        ajusteAño, // Cuánto resta la antigüedad (depreciación)
        diasEnStock,
        recomendacion,
        analisisMercado, // Si el mercado está inflado/deflactado
        
        // Detalles de TODOS los competidores (incluye Quadis para el gráfico)
        competidoresDetalle: competidoresSimilares.map((comp: any) => {
          const precioComp = parsePrice(comp.precio)
          const precioNuevoComp = comp.precio_nuevo_original || parsePrice(comp.precio_nuevo)
          const kmComp = parseKm(comp.km)
          const añoComp = comp.año ? parseInt(comp.año) : null
          
          // Calcular score normalizado del competidor
          let scoreComp = null
          if (precioComp && precioNuevoComp && añoComp && kmComp !== null) {
            scoreComp = calcularScoreValor(precioComp, precioNuevoComp, añoComp, kmComp).score
          }
          
          return {
            id: comp.id,
            concesionario: normalizeConcesionario(comp.concesionario),
            precio: precioComp,
            precioNuevo: precioNuevoComp,
            km: kmComp,
            dias: comp.dias_publicado || 0,
            url: comp.url,
            año: comp.año,
            score: scoreComp // Score normalizado (negativo = buen precio)
          }
        })
      }
    })

    // Filtrar por modelo si se especificó
    let filtered = vehiculosConAnalisis
    if (modeloFilter && modeloFilter !== 'all') {
      filtered = filtered.filter((v: any) => v.modelo === modeloFilter)
    }

    // Filtrar por posición si se especificó
    if (estadoFilter && estadoFilter !== 'all') {
      filtered = filtered.filter((v: any) => v.posicion === estadoFilter)
    }

    // Calcular estadísticas generales
    const vehiculosConPrecio = filtered.filter((v: any) => v.nuestroPrecio && v.precioMedioCompetencia)
    
    const precioMedioNuestro = vehiculosConPrecio.length > 0
      ? vehiculosConPrecio.reduce((sum: number, v: any) => sum + v.nuestroPrecio, 0) / vehiculosConPrecio.length
      : 0
    
    const precioMedioGeneral = vehiculosConPrecio.length > 0
      ? vehiculosConPrecio.reduce((sum: number, v: any) => sum + v.precioMedioCompetencia, 0) / vehiculosConPrecio.length
      : 0
    
    const posicionGeneral = precioMedioGeneral > 0
      ? ((precioMedioNuestro - precioMedioGeneral) / precioMedioGeneral) * 100
      : 0
    
    const oportunidades = filtered.filter((v: any) => v.posicion === 'alto').length

    const stats = {
      posicionGeneral: Math.round(posicionGeneral * 10) / 10,
      precioMedioNuestro: Math.round(precioMedioNuestro),
      precioMedioCompetencia: Math.round(precioMedioGeneral),
      oportunidades,
      totalComparables: filtered.length
    }

    return NextResponse.json({
      success: true,
      stats,
      vehiculos: filtered,
      count: filtered.length
    })
    
  } catch (error: any) {
    console.error('Error en análisis comparador:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

