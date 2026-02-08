import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ========== FUNCIONES COMPARTIDAS (del API de análisis) ==========

function parsePrice(precio: string | number | null): number | null {
  if (!precio) return null
  if (typeof precio === 'number') return precio
  const cleaned = precio.toString().replace(/[€.\s]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseKm(km: string | number | null): number | null {
  if (!km) return null
  if (typeof km === 'number') return km
  const cleaned = km.toString().replace(/\s*km\s*/i, '').replace(/\./g, '').trim()
  const num = parseInt(cleaned)
  return isNaN(num) ? null : num
}

function identificarGama(modelo: string): 'basica' | 'media' | 'alta' {
  const modeloLower = modelo.toLowerCase()
  if (modeloLower.includes('x5') || modeloLower.includes('x6') || modeloLower.includes('x7') ||
      modeloLower.includes('serie 5') || modeloLower.includes('serie 6') || modeloLower.includes('serie 7') ||
      modeloLower.includes('serie 8') || /\b(i5|i7|ix)\b/.test(modeloLower)) {
    return 'alta'
  }
  if (modeloLower.includes('x3') || modeloLower.includes('x4') || 
      modeloLower.includes('serie 3') || modeloLower.includes('serie 4') ||
      modeloLower.includes('countryman') || modeloLower.includes('clubman') ||
      /\b(i4|ix3)\b/.test(modeloLower)) {
    return 'media'
  }
  return 'basica'
}

type PercentilesEquipamiento = {
  p25: number
  p50: number
  p75: number
  count: number
}

type PercentilesPorGama = Record<'basica' | 'media' | 'alta', PercentilesEquipamiento>

const FALLBACK_PRECIOS_BASE: Record<'basica' | 'media' | 'alta', number> = {
  basica: 35000,
  media: 55000,
  alta: 105000
}

const DESCUENTO_EXTRA_ZOMBIE = 1
const VENTAJA_KM_SIGNIFICATIVA = 15000
const VENTAJA_ANIO_SIGNIFICATIVA = 1
const VALOR_ANIO_VENTAJA = 1000

function identificarEquipamiento(
  modelo: string,
  precioNuevo: number,
  percentilesPorGama?: PercentilesPorGama
): 'basico' | 'medio' | 'premium' {
  const gama = identificarGama(modelo)
  const percentiles = percentilesPorGama?.[gama]

  if (percentiles && percentiles.count >= 4) {
    if (precioNuevo <= percentiles.p25) return 'basico'
    if (precioNuevo >= percentiles.p75) return 'premium'
    return 'medio'
  }

  const precioReferencia = percentiles?.p50 || FALLBACK_PRECIOS_BASE[gama]
  if (!precioReferencia) return 'medio'

  const desviacion = (precioNuevo - precioReferencia) / precioReferencia
  if (desviacion <= -0.1) return 'basico'
  if (desviacion >= 0.1) return 'premium'
  return 'medio'
}

function valorKmPorGama(gama: 'basica' | 'media' | 'alta'): number {
  const valores = {
    'basica': 0.10,
    'media': 0.15,
    'alta': 0.20
  }
  return valores[gama]
}

function obtenerPercentil(valoresOrdenados: number[], percentil: number): number {
  if (valoresOrdenados.length === 0) return 0
  if (valoresOrdenados.length === 1) return valoresOrdenados[0]

  const indice = (percentil / 100) * (valoresOrdenados.length - 1)
  const inferior = Math.floor(indice)
  const superior = Math.ceil(indice)

  if (inferior === superior) {
    return valoresOrdenados[inferior]
  }

  const pesoSuperior = indice - inferior
  return valoresOrdenados[inferior] + (valoresOrdenados[superior] - valoresOrdenados[inferior]) * pesoSuperior
}

function calcularPercentiles(valores: number[]): PercentilesEquipamiento | null {
  if (valores.length === 0) return null
  const ordenados = [...valores].sort((a, b) => a - b)
  return {
    p25: obtenerPercentil(ordenados, 25),
    p50: obtenerPercentil(ordenados, 50),
    p75: obtenerPercentil(ordenados, 75),
    count: ordenados.length
  }
}

function calcularPercentilPosicion(precio: number, metricas: {
  precioMinimo: number | null
  precioMaximo: number | null
  percentil25: number | null
  percentil75: number | null
}): number {
  if (!metricas.precioMinimo || !metricas.precioMaximo || !metricas.percentil25 || !metricas.percentil75) {
    return 50
  }

  const { precioMinimo, precioMaximo, percentil25, percentil75 } = metricas

  if (precio <= percentil25) {
    const rango = percentil25 - precioMinimo
    if (rango === 0) return 0
    return ((precio - precioMinimo) / rango) * 25
  } else if (precio <= percentil75) {
    const rango = percentil75 - percentil25
    if (rango === 0) return 50
    return 25 + ((precio - percentil25) / rango) * 50
  } else {
    const rango = precioMaximo - percentil75
    if (rango === 0) return 100
    return 75 + ((precio - percentil75) / rango) * 25
  }
}

function calcularNivelConfianza(metricas: {
  count: number
  desviacionEstandar: number | null
  precioMedio: number | null
}): 'alta' | 'media' | 'baja' {
  const { count, desviacionEstandar, precioMedio } = metricas

  if (!precioMedio || !desviacionEstandar || count === 0) return 'baja'

  let score = 0

  if (count >= 15) score += 40
  else if (count >= 8) score += 25
  else if (count >= 4) score += 15
  else score += 5

  const cv = (desviacionEstandar / precioMedio) * 100
  if (cv < 10) score += 30
  else if (cv < 20) score += 20
  else score += 10

  if (score >= 60) return 'alta'
  if (score >= 40) return 'media'
  return 'baja'
}

function calcularScoreCompetitividad(
  precioActual: number,
  valorTeorico: number | null,
  metricasMercado: {
    precioMedio: number | null
    precioMinimo: number | null
    precioMaximo: number | null
    percentil25: number | null
    percentil75: number | null
    desviacionEstandar: number | null
    count: number
  }
): { score: number; nivel: 'excelente' | 'bueno' | 'justo' | 'alto' | 'muy_alto'; posicionPercentil: number; confianza: 'alta' | 'media' | 'baja' } {
  const confianza = calcularNivelConfianza(metricasMercado)

  if (!metricasMercado.precioMedio || !valorTeorico) {
    const ratioTeorico = precioActual / (valorTeorico || precioActual)
    const scoreTeorico = ratioTeorico <= 1.0
      ? 100
      : Math.max(0, 100 - (ratioTeorico - 1) * 50)

    const nivel: 'excelente' | 'bueno' | 'justo' | 'alto' | 'muy_alto' =
      scoreTeorico >= 80 ? 'excelente' :
      scoreTeorico >= 60 ? 'bueno' :
      scoreTeorico >= 40 ? 'justo' :
      scoreTeorico >= 20 ? 'alto' :
      'muy_alto'

    return {
      score: Math.round(scoreTeorico),
      nivel,
      posicionPercentil: 50,
      confianza: 'baja'
    }
  }

  const posicionPercentil = calcularPercentilPosicion(precioActual, metricasMercado)
  const ratioTeorico = valorTeorico ? precioActual / valorTeorico : 1.0

  let scoreTeorico = ratioTeorico <= 1.0
    ? 100
    : Math.max(0, 100 - (ratioTeorico - 1) * 100)

  const scoreMercado = 100 - posicionPercentil

  let pesoMercado = 0.6
  let pesoTeorico = 0.4

  if (confianza === 'alta') {
    pesoMercado = 0.7
    pesoTeorico = 0.3
  } else if (confianza === 'baja') {
    pesoMercado = 0.4
    pesoTeorico = 0.6
  }

  const scoreFinal = scoreMercado * pesoMercado + scoreTeorico * pesoTeorico

  let nivel: 'excelente' | 'bueno' | 'justo' | 'alto' | 'muy_alto'
  if (scoreFinal >= 80) nivel = 'excelente'
  else if (scoreFinal >= 60) nivel = 'bueno'
  else if (scoreFinal >= 40) nivel = 'justo'
  else if (scoreFinal >= 20) nivel = 'alto'
  else nivel = 'muy_alto'

  return {
    score: Math.round(scoreFinal),
    nivel,
    posicionPercentil: Math.round(posicionPercentil),
    confianza
  }
}

function calcularValorEsperado(precioNuevo: number, año: number, km: number): number {
  const añoActual = new Date().getFullYear()
  const antigüedad = añoActual - año
  
  let factorAño = 1.0
  if (antigüedad === 0) {
    factorAño = 0.85
  } else if (antigüedad === 1) {
    factorAño = 0.75
  } else if (antigüedad === 2) {
    factorAño = 0.67
  } else {
    factorAño = 0.67 - (antigüedad - 2) * 0.10
    if (factorAño < 0.30) factorAño = 0.30
  }
  
  const depreciacionKm = km * 0.15
  
  let valorEsperado = (precioNuevo * factorAño) - depreciacionKm
  
  if (valorEsperado < precioNuevo * 0.20) {
    valorEsperado = precioNuevo * 0.20
  }
  
  return valorEsperado
}

// ========== API ENDPOINT ==========

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Recalcular Precios Avanzado] Iniciando recálculo...')
    
    const supabase = await createServerClient(await cookies())
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ [Recalcular] Usuario no autenticado')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    console.log('✅ [Recalcular] Usuario autenticado:', user.id)
    
    // Obtener todos los vehículos del Excel con datos necesarios
    const { data: vehiculos, error: vehiculosError } = await supabase
      .from('vehiculos_excel_comparador')
      .select('id, modelo, serie, marca, fecha_matriculacion, km, precio_nuevo_bruto')
    
    if (vehiculosError) {
      return NextResponse.json({ error: 'Error cargando vehículos', details: vehiculosError.message }, { status: 500 })
    }
    
    if (!vehiculos || vehiculos.length === 0) {
      return NextResponse.json({ error: 'No hay vehículos para procesar' }, { status: 400 })
    }
    
    console.log(`📊 [Recalcular] Procesando ${vehiculos.length} vehículos...`)
    
    // Obtener percentiles de equipamiento desde DUC (para comparar)
    const { data: stockData } = await supabaseService
      .from('duc_scraper')
      .select('"Modelo", "Precio vehículo nuevo"')
      .eq('"Disponibilidad"', 'DISPONIBLE')
      .not('"Precio vehículo nuevo"', 'is', null)
    
    const percentilesPorGama: PercentilesPorGama = {
      basica: { p25: FALLBACK_PRECIOS_BASE.basica * 0.85, p50: FALLBACK_PRECIOS_BASE.basica, p75: FALLBACK_PRECIOS_BASE.basica * 1.15, count: 0 },
      media: { p25: FALLBACK_PRECIOS_BASE.media * 0.85, p50: FALLBACK_PRECIOS_BASE.media, p75: FALLBACK_PRECIOS_BASE.media * 1.15, count: 0 },
      alta: { p25: FALLBACK_PRECIOS_BASE.alta * 0.85, p50: FALLBACK_PRECIOS_BASE.alta, p75: FALLBACK_PRECIOS_BASE.alta * 1.15, count: 0 }
    }
    
    if (stockData) {
      const preciosPorGama: Record<'basica' | 'media' | 'alta', number[]> = {
        basica: [],
        media: [],
        alta: []
      }
      
      for (const item of stockData) {
        const modelo = item['Modelo'] || ''
        const precioNuevo = parsePrice(item['Precio vehículo nuevo'])
        if (!precioNuevo) continue
        const gama = identificarGama(modelo)
        preciosPorGama[gama].push(precioNuevo)
      }
      
      for (const [gama, valores] of Object.entries(preciosPorGama)) {
        const clave = gama as 'basica' | 'media' | 'alta'
        const percentiles = calcularPercentiles(valores)
        if (percentiles) {
          percentilesPorGama[clave] = percentiles
        }
      }
    }
    
    let actualizados = 0
    let sinDatos = 0
    const stats = { exactas: 0, parciales: 0, noEncontrados: 0 }
    
    for (const vehiculo of vehiculos) {
      try {
        if (!vehiculo.modelo) continue
        
        const añoVehiculo = vehiculo.fecha_matriculacion 
          ? new Date(vehiculo.fecha_matriculacion).getFullYear()
          : null
        const kmVehiculo = vehiculo.km || 0
        const precioNuevoVehiculo = vehiculo.precio_nuevo_bruto || null
        
        // Identificar gama y equipamiento
        const gamaVehiculo = identificarGama(vehiculo.modelo)
        const equipamientoVehiculo = precioNuevoVehiculo
          ? identificarEquipamiento(vehiculo.modelo, precioNuevoVehiculo, percentilesPorGama)
          : 'basico'
        
        // Buscar competidores
        let competidores: any[] = []
        let tipoCoincidencia = 'exacta'
        
        // ESTRATEGIA 1: Búsqueda por modelo completo
        let query = supabaseService
          .from('comparador_scraper')
          .select('precio, km, año, modelo, precio_nuevo_original, dias_publicado, numero_bajadas_precio, concesionario')
          .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado'])
          .ilike('modelo', `%${vehiculo.modelo}%`)
        
        if (añoVehiculo) {
          query = query.gte('año', (añoVehiculo - 2).toString())
          query = query.lte('año', (añoVehiculo + 2).toString())
        }
        
        if (kmVehiculo) {
          const kmMin = Math.max(0, kmVehiculo - 30000)
          const kmMax = kmVehiculo + 30000
          query = query.gte('km', kmMin.toString())
          query = query.lte('km', kmMax.toString())
        }
        
        const { data: data1 } = await query
        
        if (data1 && data1.length >= 3) {
          competidores = data1
          stats.exactas++
        } else if (data1 && data1.length > 0) {
          competidores = data1
          tipoCoincidencia = 'parcial'
          stats.parciales++
        }
        
        // ESTRATEGIA 2: Búsqueda por versión específica si no hay suficientes
        if (competidores.length < 3 && vehiculo.modelo) {
          const partesModelo = vehiculo.modelo.match(/\b[M]?\d{2,3}[a-z]+\b/gi)
          if (partesModelo && partesModelo.length > 0) {
            const versionEspecifica = partesModelo[0]
            let query2 = supabaseService
              .from('comparador_scraper')
              .select('precio, km, año, modelo, precio_nuevo_original, dias_publicado, numero_bajadas_precio, concesionario')
              .in('estado_anuncio', ['activo', 'nuevo', 'precio_bajado'])
              .ilike('modelo', `%${versionEspecifica}%`)
            
            if (añoVehiculo) {
              query2 = query2.gte('año', (añoVehiculo - 2).toString())
              query2 = query2.lte('año', (añoVehiculo + 2).toString())
            }
            
            if (kmVehiculo) {
              const kmMin = Math.max(0, kmVehiculo - 30000)
              const kmMax = kmVehiculo + 30000
              query2 = query2.gte('km', kmMin.toString())
              query2 = query2.lte('km', kmMax.toString())
            }
            
            if (vehiculo.serie) {
              const serieLimpia = vehiculo.serie.replace(/serie/i, '').trim()
              query2 = query2.ilike('modelo', `%${serieLimpia}%`)
            }
            
            const { data: data2 } = await query2
            
            if (data2 && data2.length > 0) {
              competidores = data2
              tipoCoincidencia = 'parcial'
              stats.parciales++
            }
          }
        }
        
        // Filtrar competidores comparables (excluir Quadis, mismo equipamiento)
        const competidoresSinQuadis = competidores.filter((c: any) => {
          if (!c.concesionario) return true
          const concesionarioLower = c.concesionario.toLowerCase()
          return !concesionarioLower.includes('quadis') && 
                 !concesionarioLower.includes('motor munich') &&
                 !concesionarioLower.includes('munich') &&
                 !concesionarioLower.includes('duc')
        })
        
        // Segmentar por equipamiento similar (±10k€)
        let competidoresComparables = competidoresSinQuadis
        if (precioNuevoVehiculo) {
          const margenEquipamiento = 10000
          competidoresComparables = competidoresSinQuadis.filter((c: any) => {
            const precioNuevoComp = c.precio_nuevo_original || parsePrice(c.precio_nuevo)
            if (!precioNuevoComp) return true
            return Math.abs(precioNuevoComp - precioNuevoVehiculo) <= margenEquipamiento
          })
          
          if (competidoresComparables.length < 3) {
            competidoresComparables = competidoresSinQuadis
          }
        }
        
        // Procesar precios
        if (competidoresComparables.length > 0) {
          const preciosCompetencia = competidoresComparables
            .map((c: any) => parsePrice(c.precio))
            .filter((p): p is number => p !== null)
            .sort((a, b) => a - b)
          
          if (preciosCompetencia.length > 0) {
            const precioMedio = preciosCompetencia.reduce((sum, p) => sum + p, 0) / preciosCompetencia.length
            const precioMinimo = preciosCompetencia[0]
            const precioMaximo = preciosCompetencia[preciosCompetencia.length - 1]
            const percentil25Index = Math.floor(preciosCompetencia.length * 0.25)
            const percentil75Index = Math.floor(preciosCompetencia.length * 0.75)
            const precioPercentil25 = preciosCompetencia[Math.max(0, percentil25Index)]
            const precioPercentil75 = preciosCompetencia[Math.max(0, percentil75Index)]
            
            // Calcular desviación estándar
            const desviacionEstandar = Math.sqrt(
              preciosCompetencia.reduce((acc, p) => acc + Math.pow(p - precioMedio, 2), 0) / preciosCompetencia.length
            )
            
            // Calcular KM medio y año medio de competencia
            const kmsCompetencia = competidoresComparables
              .map((c: any) => parseKm(c.km))
              .filter((km): km is number => km !== null)
            const kmMedioCompetencia = kmsCompetencia.length > 0
              ? kmsCompetencia.reduce((sum, km) => sum + km, 0) / kmsCompetencia.length
              : kmVehiculo
            
            const anosCompetencia = competidoresComparables
              .map((c: any) => (c.año ? parseInt(c.año) : null))
              .filter((a): a is number => a !== null && !isNaN(a))
            const promedioAnioCompetencia = anosCompetencia.length > 0
              ? anosCompetencia.reduce((sum, año) => sum + año, 0) / anosCompetencia.length
              : null
            
            // Calcular valor teórico esperado
            let valorTeoricoEsperado: number | null = null
            if (precioNuevoVehiculo && añoVehiculo) {
              valorTeoricoEsperado = calcularValorEsperado(precioNuevoVehiculo, añoVehiculo, kmVehiculo)
            }
            
            // Determinar precio base según gama y equipamiento
            let precioBaseCompetencia = precioMedio
            let metodoPrecioBase: 'sin_datos' | 'percentil25' | 'promedio' = 'promedio'
            
            if (gamaVehiculo === 'alta' && equipamientoVehiculo === 'basico') {
              precioBaseCompetencia = precioPercentil25
              metodoPrecioBase = 'percentil25'
            }
            
            // Calcular precio competitivo (precio recomendado de venta en la red)
            const valorKmGama = valorKmPorGama(gamaVehiculo)
            const diferenciaKm = kmVehiculo - kmMedioCompetencia
            const ajustePorKm = diferenciaKm * valorKmGama
            let precioRecomendado = precioBaseCompetencia - ajustePorKm
            
            // Aplicar límites
            if (precioRecomendado < precioBaseCompetencia * 0.8) {
              precioRecomendado = precioBaseCompetencia * 0.8
            }
            if (precioRecomendado > precioBaseCompetencia * 1.1) {
              precioRecomendado = precioBaseCompetencia * 1.1
            }
            
            // Detectar competidores "zombies" (>60 días + >2 bajadas)
            const competidoresConBajadas = competidoresComparables.filter((c: any) => {
              return c.dias_publicado && c.dias_publicado > 60 && c.numero_bajadas_precio && c.numero_bajadas_precio > 2
            })
            
            let descuentoMinimoRequerido: number | null = null
            let maxDescuentoZombie: number | null = null
            
            if (competidoresConBajadas.length > 0 && precioNuevoVehiculo) {
              const descuentosRechazados = competidoresConBajadas
                .map((c: any) => {
                  const precioComp = parsePrice(c.precio)
                  const precioNuevoComp = c.precio_nuevo_original || parsePrice(c.precio_nuevo)
                  if (precioComp && precioNuevoComp) {
                    return ((precioNuevoComp - precioComp) / precioNuevoComp) * 100
                  }
                  return null
                })
                .filter((d): d is number => d !== null)
              
              if (descuentosRechazados.length > 0) {
                maxDescuentoZombie = Math.max(...descuentosRechazados)
                descuentoMinimoRequerido = maxDescuentoZombie + DESCUENTO_EXTRA_ZOMBIE
                
                // Aplicar descuento mínimo si es necesario
                const precioMaximoPermitido = precioNuevoVehiculo * (1 - descuentoMinimoRequerido / 100)
                if (precioRecomendado > precioMaximoPermitido) {
                  precioRecomendado = precioMaximoPermitido
                }
              }
            }
            
            // Calcular diferencia ajustada (precio competitivo vs precio recomendado)
            const diferenciaAjustada = precioBaseCompetencia - precioRecomendado
            const porcentajeDifAjustado = precioBaseCompetencia > 0
              ? (diferenciaAjustada / precioBaseCompetencia) * 100
              : 0
            
            // Calcular score de competitividad
            const metricasParaScore = {
              precioMedio: precioBaseCompetencia,
              precioMinimo,
              precioMaximo,
              percentil25: precioPercentil25,
              percentil75: precioPercentil75,
              desviacionEstandar,
              count: competidoresComparables.length
            }
            
            const scoreData = calcularScoreCompetitividad(
              precioRecomendado,
              valorTeoricoEsperado,
              metricasParaScore
            )
            
            // Generar recomendación
            let recomendacionTexto = ''
            if (porcentajeDifAjustado <= -3) {
              recomendacionTexto = `Excelente precio competitivo. Ajustado por KM: ${Math.abs(porcentajeDifAjustado).toFixed(1)}% mejor que la media.`
            } else if (porcentajeDifAjustado >= 3) {
              recomendacionTexto = `Precio competitivo alto. Debería estar en ${precioRecomendado.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€ (${Math.abs(porcentajeDifAjustado).toFixed(1)}% menos).`
            } else {
              recomendacionTexto = `Precio competitivo adecuado considerando ${kmVehiculo.toLocaleString()} km vs ${kmMedioCompetencia.toLocaleString()} km de media.`
            }
            
            if (descuentoMinimoRequerido) {
              recomendacionTexto += ` ⚠️ Competidores con +60 días no vendieron con ${descuentoMinimoRequerido.toFixed(1)}% descuento.`
            }
            
            // Actualizar en base de datos
            await supabase
              .from('vehiculos_excel_comparador')
              .update({
                precio_medio_red: Math.round(precioMedio),
                precio_competitivo: Math.round(precioRecomendado), // Precio competitivo avanzado
                num_competidores: preciosCompetencia.length,
                ultima_busqueda_red: new Date().toISOString(),
                gama: gamaVehiculo,
                equipamiento: equipamientoVehiculo,
                valor_teorico_esperado: valorTeoricoEsperado ? Math.round(valorTeoricoEsperado) : null,
                precio_percentil25_competencia: Math.round(precioPercentil25),
                precio_percentil75_competencia: Math.round(precioPercentil75),
                precio_minimo_competencia: Math.round(precioMinimo),
                precio_maximo_competencia: Math.round(precioMaximo),
                km_medio_competencia: Math.round(kmMedioCompetencia),
                promedio_anio_competencia: promedioAnioCompetencia ? Math.round(promedioAnioCompetencia * 10) / 10 : null,
                descuento_minimo_requerido: descuentoMinimoRequerido,
                max_descuento_zombie: maxDescuentoZombie,
                competidores_estancados: competidoresConBajadas.length,
                score_competitividad: scoreData.score,
                nivel_competitividad: scoreData.nivel,
                posicion_percentil: scoreData.posicionPercentil,
                confianza_analisis: scoreData.confianza,
                precio_recomendado_avanzado: Math.round(precioRecomendado),
                diferencia_ajustada: Math.round(diferenciaAjustada),
                porcentaje_dif_ajustado: Math.round(porcentajeDifAjustado * 10) / 10,
                metodo_precio_base: metodoPrecioBase,
                recomendacion_texto: recomendacionTexto
              })
              .eq('id', vehiculo.id)
            
            actualizados++
            console.log(`✅ [${vehiculo.modelo}] ${preciosCompetencia.length} comp. Score: ${scoreData.score} (${scoreData.nivel})`)
          } else {
            sinDatos++
            stats.noEncontrados++
          }
        } else {
          sinDatos++
          stats.noEncontrados++
          console.log(`⚠️ [${vehiculo.modelo}] Sin competidores`)
        }
      } catch (error: any) {
        console.error(`Error procesando ${vehiculo.id}:`, error)
      }
    }
    
    console.log(`✅ [Recalcular] Completado: ${actualizados} actualizados, ${sinDatos} sin datos`)
    console.log(`🎯 [Recalcular] Exactas=${stats.exactas} | Parciales=${stats.parciales} | No encontrados=${stats.noEncontrados}`)
    
    return NextResponse.json({
      success: true,
      actualizados,
      sinDatos,
      stats
    })
    
  } catch (error: any) {
    console.error('❌ [Recalcular] Error:', error)
    return NextResponse.json({ error: 'Error recalculando precios', details: error.message }, { status: 500 })
  }
}
