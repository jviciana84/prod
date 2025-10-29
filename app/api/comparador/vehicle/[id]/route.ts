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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const vehicleId = params.id
    
    // Obtener vehículo específico desde duc_scraper
    const { data: ducVehiculo, error: vehiculoError } = await supabase
      .from('duc_scraper')
      .select('"ID Anuncio", "Matrícula", "Modelo", "Versión", "Fecha primera matriculación", "KM", "Precio", "Precio vehículo nuevo", "URL"')
      .eq('"ID Anuncio"', vehicleId)
      .single()
    
    if (vehiculoError || !ducVehiculo) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado', details: vehiculoError },
        { status: 404 }
      )
    }
    
    // Transformar datos de DUC
    const year = parseSpanishDate(ducVehiculo['Fecha primera matriculación'])
    
    // Combinar Modelo + Versión
    let modeloCompleto = ducVehiculo['Modelo']
    if (ducVehiculo['Versión']) {
      const versionMatch = ducVehiculo['Versión'].match(/([ex]?Drive\d+|M\d+|\d{3}[a-z]+)/i)
      if (versionMatch) {
        modeloCompleto = `${ducVehiculo['Modelo']} ${versionMatch[1]}`
      } else {
        modeloCompleto = `${ducVehiculo['Modelo']} ${ducVehiculo['Versión'].split(' ')[0]}`
      }
    }
    
    const vehiculo = {
      id: ducVehiculo['ID Anuncio'],
      license_plate: ducVehiculo['Matrícula'],
      model: modeloCompleto,
      year: year ? year.toString() : null,
      km: ducVehiculo['KM'],
      price: ducVehiculo['Precio'],
      original_new_price: ducVehiculo['Precio vehículo nuevo'],
      duc_url: ducVehiculo['URL'],
      cms_url: null
    }

    // Obtener TODOS los competidores similares - CARGAR TODOS (sin límite de 1000)
    let allComparadorData: any[] = []
    let offset = 0
    const batchSize = 1000
    
    while (true) {
      const { data: batch, error } = await supabase
        .from('comparador_scraper')
        .select('id, source, id_anuncio, modelo, año, km, precio, precio_nuevo, precio_nuevo_original, concesionario, url, dias_publicado, estado_anuncio')
        .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado', 'precio_subido'])
        .range(offset, offset + batchSize - 1)
      
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

    // Buscar competidores similares con matching exacto (mismo algoritmo que /analisis)
    // NOTA: NO excluimos Quadis - se manejan en el frontend
    const modeloNuestro = vehiculo.model?.toLowerCase() || ''
    
    const competidoresSimilares = comparadorData.filter((comp: any) => {
      if (!comp.modelo) return false
      
      const modeloComp = comp.modelo?.toLowerCase() || ''
      
      // Normalizar modelos para comparación exacta
      const normalizeModel = (modelo: string) => {
        let normalized = modelo.trim().toLowerCase()
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
        // Detectar Serie X - muy flexible
        else if (/s[ei]?rie?\s*\d/.test(normalized)) {
          const match = normalized.match(/s[ei]?rie?\s*(\d+)\s*(\d{3}[a-z]*)?\s*(gran\s*coupe|coupe|touring|cabrio|compact)?/i)
          if (match) {
            base = `serie ${match[1]}`
            const motor = match[2] || ''
            const carroceria = match[3] ? ` ${match[3].replace(/\s+/g, ' ')}` : ''
            variant = (motor + carroceria).trim().toLowerCase()
          }
        }
        // Detectar X1, X2, X3, etc
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
          // MINI Cooper (solo, sin puertas)
          else if (/cooper/.test(normalized)) {
            base = 'mini cooper'
            if (/cooper\s*se/.test(normalized)) variant = 'se'
            else if (/cooper\s*s\b/.test(normalized)) variant = 's'
            else if (/john\s*cooper\s*works|jcw/.test(normalized)) variant = 'jcw'
            else variant = ''
          }
        }
        
        // Si no se detectó nada, usar modelo completo
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
      
      // Base debe coincidir exactamente
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
      
      // Año debe ser similar (±1 año)
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

    // Obtener historial de precios de los competidores
    const idsCompetidores = competidoresSimilares.map((c: any) => `${c.source}-${c.id_anuncio}`)
    
    let historial: any[] = []
    if (idsCompetidores.length > 0) {
      const { data: historialData } = await supabase
        .from('comparador_historial_precios')
        .select('*')
        .in('id_anuncio', competidoresSimilares.map((c: any) => c.id_anuncio))
        .order('fecha_cambio', { ascending: false })
        .limit(50)
      
      historial = historialData || []
    }

    // Calcular estadísticas (EXCLUYENDO Quadis para métricas)
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

    const precioMinimoCompetencia = preciosCompetencia.length > 0
      ? Math.min(...preciosCompetencia)
      : null

    const precioMaximoCompetencia = preciosCompetencia.length > 0
      ? Math.max(...preciosCompetencia)
      : null

    // Calcular descuentos EXCLUYENDO Quadis
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

    const nuestroPrecio = parsePrice(vehiculo.price)
    const precioNuevoNuestro = parsePrice(vehiculo.original_new_price)
    const nuestrosKm = vehiculo.km || vehiculo.mileage || 0
    const nuestroAño = vehiculo.year ? parseInt(vehiculo.year) : new Date().getFullYear()
    
    const descuentoNuestro = precioNuevoNuestro && nuestroPrecio
      ? ((precioNuevoNuestro - nuestroPrecio) / precioNuevoNuestro) * 100
      : null

    // NUEVO: Calcular score normalizado considerando km, año y precio nuevo
    let scoreNuestro = null
    let valorEsperadoNuestro = null
    let scoresMercado: number[] = []
    
    if (nuestroPrecio && precioNuevoNuestro && nuestroAño) {
      const analisisNuestro = calcularScoreValor(nuestroPrecio, precioNuevoNuestro, nuestroAño, nuestrosKm)
      scoreNuestro = analisisNuestro.score
      valorEsperadoNuestro = analisisNuestro.valorEsperado
      
      // Calcular scores de competidores (solo los que tienen precio nuevo)
      scoresMercado = competidoresSinQuadis
        .filter((c: any) => {
          const precioComp = parsePrice(c.precio)
          const precioNuevoComp = c.precio_nuevo_original || parsePrice(c.precio_nuevo)
          const añoComp = c.año ? parseInt(c.año) : null
          const kmComp = parseKm(c.km)
          return precioComp && precioNuevoComp && añoComp && kmComp !== null
        })
        .map((c: any) => {
          const precioComp = parsePrice(c.precio)!
          const precioNuevoComp = c.precio_nuevo_original || parsePrice(c.precio_nuevo)!
          const añoComp = parseInt(c.año)
          const kmComp = parseKm(c.km)!
          
          return calcularScoreValor(precioComp, precioNuevoComp, añoComp, kmComp).score
        })
    }
    
    const scoreMedioMercado = scoresMercado.length > 0
      ? scoresMercado.reduce((sum, s) => sum + s, 0) / scoresMercado.length
      : 0
    
    // Diferencia de scores (cuanto más negativo, mejor nuestro precio)
    const diferenciaScore = scoreNuestro !== null ? scoreNuestro - scoreMedioMercado : null
    
    // Determinar posición competitiva basada en score normalizado
    let posicion = 'justo'
    let recomendacion = ''
    
    if (diferenciaScore !== null) {
      if (diferenciaScore <= -5) {
        posicion = 'competitivo'
        recomendacion = 'Excelente precio considerando km, año y equipamiento'
      } else if (diferenciaScore >= 5) {
        posicion = 'alto'
        recomendacion = 'Precio elevado para km, año y equipamiento'
      } else {
        posicion = 'justo'
        recomendacion = 'Precio equilibrado con el mercado'
      }
    }
    
    // NUEVO: Factor días en stock
    let diasEnStock = 0
    if (vehiculo.purchase_date) {
      const fechaCompra = new Date(vehiculo.purchase_date)
      const hoy = new Date()
      diasEnStock = Math.floor((hoy.getTime() - fechaCompra.getTime()) / (1000 * 60 * 60 * 24))
    }
    
    // Ajustar recomendación si lleva más de 60 días
    if (diasEnStock > 60 && posicion !== 'competitivo') {
      recomendacion += `. ⚠️ Lleva ${diasEnStock} días en stock - considera ajustar precio`
    }
    
    // Calcular diferencia simple para mostrar
    const diferencia = nuestroPrecio && precioMedioCompetencia 
      ? nuestroPrecio - precioMedioCompetencia 
      : null
    
    const porcentajeDif = diferencia && precioMedioCompetencia
      ? (diferencia / precioMedioCompetencia) * 100
      : null

    const response = {
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
      precioMinimoCompetencia,
      precioMaximoCompetencia,
      descuentoMedioCompetencia,
      diferencia,
      porcentajeDif,
      competidores: competidoresSinQuadis.length, // Solo competencia real
      competidoresTotal: competidoresSimilares.length, // Incluye Quadis
      posicion,
      precioSugerido: valorEsperadoNuestro || precioMedioCompetencia,
      
      // NUEVO: Análisis normalizado
      scoreNuestro,
      scoreMedioMercado,
      diferenciaScore,
      valorEsperadoNuestro,
      diasEnStock,
      recomendacion,
      
      // Detalles de TODOS los competidores (incluye Quadis para el gráfico)
      competidoresDetalle: competidoresSimilares.map((comp: any) => ({
        id: comp.id,
        concesionario: normalizeConcesionario(comp.concesionario),
        precio: parsePrice(comp.precio),
        precioNuevo: comp.precio_nuevo_original || parsePrice(comp.precio_nuevo),
        km: parseKm(comp.km),
        dias: comp.dias_publicado || 0,
        url: comp.url,
        año: comp.año
      })),
      
      // Historial de cambios
      historialCambios: historial
    }

    return NextResponse.json({
      success: true,
      data: response
    })
    
  } catch (error: any) {
    console.error('Error en análisis vehículo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

