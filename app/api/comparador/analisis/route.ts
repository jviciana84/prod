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

// Función para identificar la gama del modelo
function identificarGama(modelo: string): 'basica' | 'media' | 'alta' {
  const modeloLower = modelo.toLowerCase()
  
  // Gama Alta
  if (modeloLower.includes('x5') || modeloLower.includes('x6') || modeloLower.includes('x7') ||
      modeloLower.includes('serie 5') || modeloLower.includes('serie 6') || modeloLower.includes('serie 7') ||
      modeloLower.includes('serie 8') || /\b(i5|i7|ix)\b/.test(modeloLower)) {
    return 'alta'
  }
  
  // Gama Media
  if (modeloLower.includes('x3') || modeloLower.includes('x4') || 
      modeloLower.includes('serie 3') || modeloLower.includes('serie 4') ||
      modeloLower.includes('countryman') || modeloLower.includes('clubman') ||
      /\b(i4|ix3)\b/.test(modeloLower)) {
    return 'media'
  }
  
  // Gama Básica (por defecto)
  return 'basica'
}

// Función para identificar nivel de equipamiento según precio nuevo
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

const DESCUENTO_EXTRA_ZOMBIE = 1 // puntos porcentuales extra para ser competitivos
const VENTAJA_KM_SIGNIFICATIVA = 15000 // km de ventaja para considerar bonus
const VENTAJA_ANIO_SIGNIFICATIVA = 1 // años de ventaja para considerar bonus
const VALOR_ANIO_VENTAJA = 1000 // € por año de ventaja (gama alta)

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

// Función para calcular valor de KM según gama
function valorKmPorGama(gama: 'basica' | 'media' | 'alta'): number {
  // Valor en € por cada km de diferencia
  const valores = {
    'basica': 0.10,   // +1.000€ por cada 10k km
    'media': 0.15,    // +1.500€ por cada 10k km
    'alta': 0.20      // +2.000€ por cada 10k km
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

function calcularPercentilesPorGama(stockData: any[]): PercentilesPorGama {
  const preciosPorGama: Record<'basica' | 'media' | 'alta', number[]> = {
    basica: [],
    media: [],
    alta: []
  }

  for (const item of stockData) {
    const modelo = item.model || ''
    const precioNuevo =
      typeof item.original_new_price === 'number'
        ? item.original_new_price
        : parsePrice(item.original_new_price)

    if (!precioNuevo) continue

    const gama = identificarGama(modelo)
    preciosPorGama[gama].push(precioNuevo)
  }

  const percentilesPorGama: PercentilesPorGama = {
    basica: {
      p25: FALLBACK_PRECIOS_BASE.basica * 0.85,
      p50: FALLBACK_PRECIOS_BASE.basica,
      p75: FALLBACK_PRECIOS_BASE.basica * 1.15,
      count: 0
    },
    media: {
      p25: FALLBACK_PRECIOS_BASE.media * 0.85,
      p50: FALLBACK_PRECIOS_BASE.media,
      p75: FALLBACK_PRECIOS_BASE.media * 1.15,
      count: 0
    },
    alta: {
      p25: FALLBACK_PRECIOS_BASE.alta * 0.85,
      p50: FALLBACK_PRECIOS_BASE.alta,
      p75: FALLBACK_PRECIOS_BASE.alta * 1.15,
      count: 0
    }
  }

  for (const [gama, valores] of Object.entries(preciosPorGama)) {
    const clave = gama as 'basica' | 'media' | 'alta'
    const percentiles = calcularPercentiles(valores)
    if (percentiles) {
      percentilesPorGama[clave] = percentiles
    }
  }

  return percentilesPorGama
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
    
    // Leer tolerancias configurables (con valores por defecto)
    const toleranciaCv = parseInt(searchParams.get('toleranciaCv') || '20') // ±20 CV por defecto
    const toleranciaAño = parseFloat(searchParams.get('toleranciaAño') || '2') // 🎯 CORREGIDO: ±2 años por defecto para mercado completo
    
    // Obtener vehículos de nuestro stock desde duc_scraper (DUC es nuestra fuente de verdad)
    let ducQuery = supabase
      .from('duc_scraper')
      .select('"ID Anuncio", "Matrícula", "Modelo", "Versión", "Fecha primera matriculación", "Fecha primera publicación", "KM", "Precio", "Precio vehículo nuevo", "Disponibilidad", "URL"')
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
      
      // Calcular días en stock desde "Fecha primera publicación"
      let diasEnStock = null
      if (v['Fecha primera publicación']) {
        const fechaPublicacion = parseSpanishDate(v['Fecha primera publicación'])
        if (fechaPublicacion) {
          const hoy = new Date()
          const fechaPub = new Date(fechaPublicacion, 0, 1) // Año parseado
          // Si tenemos la fecha completa (DD / MM / YYYY), parsearla correctamente
          if (v['Fecha primera publicación'].includes('/')) {
            const partes = v['Fecha primera publicación'].split('/').map((p: string) => p.trim())
            if (partes.length === 3) {
              fechaPub.setFullYear(parseInt(partes[2]))
              fechaPub.setMonth(parseInt(partes[1]) - 1)
              fechaPub.setDate(parseInt(partes[0]))
            }
          }
          diasEnStock = Math.floor((hoy.getTime() - fechaPub.getTime()) / (1000 * 60 * 60 * 24))
        }
      }
      
      // Combinar Modelo + Versión + Potencia (CV) para tener modelo completo
      // Ejemplo: "iX1" + "xDrive30 230 kW (313 CV)" → "iX1 xDrive30 313"
      let modeloCompleto = v['Modelo']
      if (v['Versión']) {
        const modeloLower = v['Modelo'].toLowerCase()
        const versionLower = v['Versión'].toLowerCase()
        
        // Extraer potencia (CV) de la versión - PRIORIDAD: CV sobre kW
        const cvMatch = v['Versión'].match(/\((\d+)\s*CV\)/)
        const kwMatch = v['Versión'].match(/(\d+)\s*kW/)
        
        // Usar CV si existe, sino convertir kW a CV (1 kW = 1.36 CV)
        let potenciaCv = null
        if (cvMatch) {
          potenciaCv = cvMatch[1]
        } else if (kwMatch && !cvMatch) {
          potenciaCv = Math.round(parseInt(kwMatch[1]) * 1.36).toString()
        } else if (v['Potencia Cv']) {
          potenciaCv = v['Potencia Cv'].toString()
        }
        
        // Para MINI: capturar variantes completas (Cooper E, Cooper SE, Cooper S, JCW, etc.) + CV
        if (modeloLower.includes('mini')) {
          // Detectar variantes MINI específicas (orden importante: más específico primero)
          if (/john\s*cooper\s*works|jcw/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} John Cooper Works`
          } else if (/cooper\s*se\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} Cooper SE`
          } else if (/cooper\s*s\s*e\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} Cooper S E`
          } else if (/cooper\s*sd\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} Cooper SD`
          } else if (/cooper\s*s\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} Cooper S`
          } else if (/cooper\s*e\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} Cooper E`
          } else if (/cooper\s*d\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} Cooper D`
          } else if (/cooper\s*c\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} Cooper C`
          } else if (/cooper/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} Cooper`
          } else if (/\bone\s*d\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} One D`
          } else if (/\bone\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} One`
          } else if (/\bs\s*all4/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} S ALL4`
          } else if (/\bse\s*all4/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} SE ALL4`
          } else if (/\bs\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} S`
          } else if (/\be\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} E`
          } else if (/\bd\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} D`
          } else if (/\bc\b/i.test(v['Versión'])) {
            modeloCompleto = `${v['Modelo']} C`
          }
          
          // Añadir CV al modelo MINI
          if (potenciaCv) {
            modeloCompleto = `${modeloCompleto} ${potenciaCv}`
          }
        } 
        // Para BMW: extraer variante técnica (xDrive30d, eDrive40, M50d, 320d, etc.) + CV
        else {
          // ✅ CORREGIDO: Ahora captura letras después del número (d, i, e, etc.)
          const versionMatch = v['Versión'].match(/([ex]?Drive\d+[a-z]*|M\d+[a-z]*|\d{3}[a-z]+)/i)
          if (versionMatch) {
            modeloCompleto = `${v['Modelo']} ${versionMatch[1]}`
          } else {
            modeloCompleto = `${v['Modelo']} ${v['Versión'].split(' ')[0]}`
          }
          
          // Añadir CV al modelo BMW
          if (potenciaCv) {
            modeloCompleto = `${modeloCompleto} ${potenciaCv}`
          }
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
        dias_en_stock: diasEnStock,
        duc_url: v['URL'],
        cms_url: null,
        fecha_matriculacion: v['Fecha primera matriculación'] || null // Fecha del DUC
      }
    })

    const percentilesEquipamientoPorGama = calcularPercentilesPorGama(stockDataTransformed)

    // Obtener datos del comparador (competencia) - CARGAR TODOS (sin límite de 1000)
    let allComparadorData: any[] = []
    let offset = 0
    const batchSize = 1000
    
    while (true) {
      let query = supabase
        .from('comparador_scraper')
        .select('id, source, id_anuncio, modelo, año, km, precio, precio_anterior, precio_nuevo, precio_nuevo_original, concesionario, url, dias_publicado, primera_deteccion, fecha_primera_matriculacion, estado_anuncio, numero_bajadas_precio, importe_total_bajado')
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
        
        // Normalizar modelos para comparación exacta incluyendo potencia (CV)
        const normalizeModel = (modelo: string, modeloOriginal?: string) => {
          // Remover espacios extra y normalizar
          let normalized = modelo.trim().toLowerCase()
          
          // Extraer potencia (CV) - PRIORIDAD: del modelo original sin procesar
          // Ejemplo: "MINI Countryman Cooper 100 kW (136 CV)" -> cv = 136
          let cv = null
          
          // 1. Intentar extraer del modelo original (competencia sin procesar)
          if (modeloOriginal) {
            const cvMatchOriginal = modeloOriginal.match(/\((\d+)\s*CV\)/)
            if (cvMatchOriginal) {
              cv = parseInt(cvMatchOriginal[1])
            }
          }
          
          // 2. Si no, intentar del modelo procesado (nuestro modelo con CV al final)
          if (!cv) {
            const cvMatch = modelo.match(/\s(\d+)$/)
            cv = cvMatch ? parseInt(cvMatch[1]) : null
          }
          
          // Remover los CV del string normalizado para procesar el modelo base
          if (cv) {
            normalized = normalized.replace(/\s\d+$/, '').trim()
          }
          
          // Extraer componentes principales
          // Ejemplos: "i4 40" -> { base: "i4", variant: "40", cv: null }
          //           "BMW Serie 1 118d" -> { base: "serie 1", variant: "118d", cv: null }
          //           "BMW X3 xDrive20d 204" -> { base: "x3", variant: "xdrive20d", cv: 204 }
          
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
          
          return { base, variant: variant.toLowerCase(), cv }
        }
        
        const nuestroNorm = normalizeModel(modeloNuestro) // Nuestro modelo ya procesado con CV
        const compNorm = normalizeModel(modeloComp, comp.modelo) // Modelo competencia + modelo original
        
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
        
        // Comparar potencia (CV) con tolerancia configurable
        // Si AMBOS tienen CV especificados, deben estar dentro de la tolerancia
        if (nuestroNorm.cv && compNorm.cv) {
          const diferenciaCv = Math.abs(nuestroNorm.cv - compNorm.cv)
          
          if (diferenciaCv > toleranciaCv) {
            // Potencias muy diferentes, no comparar
            return false
          }
        }
        // Si solo uno tiene CV especificado, permitir el match (más flexible)
        
        // Verificar año con tolerancia configurable (por defecto ±1, pero puede ser ±2 para mercado amplio)
        if (vehiculo.year && comp.año) {
          const añoNuestro = parseInt(vehiculo.year)
          const añoComp = parseInt(comp.año)
          
          if (!isNaN(añoNuestro) && !isNaN(añoComp)) {
            const diferenciaAños = Math.abs(añoNuestro - añoComp)
            if (diferenciaAños > toleranciaAño) {
              return false
            }
          }
        }
        
        return true
      })

      // Obtener nuestro precio PRIMERO (lo necesitamos para filtrar)
      const nuestroPrecio = parsePrice(vehiculo.price)
      const precioNuevoNuestro = parsePrice(vehiculo.original_new_price)
      const nuestrosKm = vehiculo.km || vehiculo.mileage || 0
      const nuestroAño = vehiculo.year ? parseInt(vehiculo.year) : new Date().getFullYear()
      
      // 🎯 Identificar gama y equipamiento
      const gamaVehiculo = identificarGama(vehiculo.model || '')
      const equipamientoVehiculo = precioNuevoNuestro 
        ? identificarEquipamiento(vehiculo.model || '', precioNuevoNuestro, percentilesEquipamientoPorGama)
        : 'basico'
      const percentilesGamaActual = percentilesEquipamientoPorGama[gamaVehiculo]
      
      // 🐛 DEBUG para 9853MKL
      if (vehiculo.license_plate === '9853MKL') {
        console.log('\n🔍 DEBUG 9853MKL:')
        console.log('  Modelo:', vehiculo.model)
        console.log('  Precio nuevo:', precioNuevoNuestro)
        console.log('  Gama:', gamaVehiculo)
        console.log('  Equipamiento:', equipamientoVehiculo)
        console.log('  KM:', nuestrosKm)
      }

      // 🚨 IDENTIFICAR coches con muchas bajadas (para calcular DESCUENTO MÍNIMO)
      // Coches con >60 días + >2 bajadas = mercado rechazó ese % de descuento
      // NO excluir, sino usar como PISO MÍNIMO (su descuento + margen extra configurable)
      // Por ahora incluimos todos (cuando tengamos dias_publicado y numero_bajadas_precio completos)
      const competidoresValidos = competidoresSimilares

      // Calcular precio medio de competencia (EXCLUYENDO Quadis/Motor Munich/DUC para la métrica - somos nosotros)
      const competidoresSinQuadis = competidoresValidos.filter((c: any) => {
        if (!c.concesionario) return true
        const concesionarioLower = c.concesionario.toLowerCase()
        return !concesionarioLower.includes('quadis') && 
               !concesionarioLower.includes('motor munich') &&
               !concesionarioLower.includes('munich') &&
               !concesionarioLower.includes('duc')
      })
      
      // 🎯 SEGMENTAR por equipamiento SIMILAR (±10k€ precio nuevo) para comparación justa
      let competidoresComparables = competidoresSinQuadis
      if (precioNuevoNuestro) {
        const margenEquipamiento = 10000 // ±10k€
        competidoresComparables = competidoresSinQuadis.filter((c: any) => {
          const precioNuevoComp = c.precio_nuevo_original || parsePrice(c.precio_nuevo)
          if (!precioNuevoComp) return true // Incluir si no tiene precio nuevo
          return Math.abs(precioNuevoComp - precioNuevoNuestro) <= margenEquipamiento
        })
        
        // 🎯 Para gama alta + básico: filtrar también por precio de venta
        // No comparar con coches que tienen precio de venta mucho más alto
        if (gamaVehiculo === 'alta' && equipamientoVehiculo === 'basico' && nuestroPrecio) {
          // Solo incluir coches con precio de venta MENOR o similar (±5k€ del nuestro)
          // Esto evita comparar con coches bien equipados que tienen precios altos
          const margenPrecioVenta = 5000 // ±5k€ (más estricto)
          competidoresComparables = competidoresComparables.filter((c: any) => {
            const precioVentaComp = parsePrice(c.precio)
            if (!precioVentaComp) return true // Incluir si no tiene precio
            // Incluir si está dentro del margen o es MÁS BARATO (competidores directos)
            return precioVentaComp <= (nuestroPrecio + margenPrecioVenta) || 
                   Math.abs(precioVentaComp - nuestroPrecio) <= margenPrecioVenta
          })
        }
        
        // Si no hay suficientes comparables (mínimo 3), usar todos
        if (competidoresComparables.length < 3) {
          competidoresComparables = competidoresSinQuadis
        }
      }
      
      const preciosCompetencia = competidoresComparables
        .map((c: any) => parsePrice(c.precio))
        .filter((p: number | null): p is number => p !== null)
        .sort((a, b) => a - b) // Ordenar de menor a mayor
      
      const precioMinimoCompetencia = preciosCompetencia.length > 0 ? preciosCompetencia[0] : null
      const precioMaximoCompetencia = preciosCompetencia.length > 0 ? preciosCompetencia[preciosCompetencia.length - 1] : null
      const precioPromedioCompetenciaGeneral = preciosCompetencia.length > 0
        ? preciosCompetencia.reduce((sum, p) => sum + p, 0) / preciosCompetencia.length
        : null
      let precioPercentil25Competencia: number | null = null
      let metodoPrecioBase: 'sin_datos' | 'percentil25' | 'promedio' = 'sin_datos'
      
      // 🐛 DEBUG para 9853MKL
      if (vehiculo.license_plate === '9853MKL') {
        console.log('  Competidores comparables:', competidoresComparables.length)
        console.log('  Precios ordenados:', preciosCompetencia.slice(0, 5).map(p => p.toLocaleString()))
      }
      
      // 🎯 Para gama alta + básico: usar precio MÁS BAJO (percentil 25), no el promedio
      // El promedio incluye coches muy equipados que inflan el precio
      let precioMedioCompetencia = null
      if (preciosCompetencia.length > 0) {
        if (gamaVehiculo === 'alta' && equipamientoVehiculo === 'basico') {
          // Usar el percentil 25 (25% más barato) o el precio mínimo si hay pocos
          const percentil25 = Math.floor(preciosCompetencia.length * 0.25)
          const indiceReferencia = Math.max(0, percentil25)
          precioPercentil25Competencia = preciosCompetencia[indiceReferencia]
          precioMedioCompetencia = precioPercentil25Competencia
          metodoPrecioBase = 'percentil25'
          
          // 🐛 DEBUG para 9853MKL
          if (vehiculo.license_plate === '9853MKL') {
            console.log('  ✅ LÓGICA GAMA ALTA + BÁSICO ACTIVADA')
            console.log('  Percentil 25 índice:', indiceReferencia)
            console.log('  Precio base (Percentil 25):', precioMedioCompetencia?.toLocaleString())
          }
        } else {
          // Para otros casos: usar promedio
          precioMedioCompetencia = precioPromedioCompetenciaGeneral
          metodoPrecioBase = 'promedio'
        }
      }

      // Calcular descuento promedio de competencia comparables (mismo equipamiento)
      const descuentosCompetencia = competidoresComparables
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
      
      // Calcular nuestro descuento (ya tenemos nuestroPrecio y precioNuevoNuestro definidos arriba)
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
      
      // Calcular KM medio de competidores COMPARABLES (mismo equipamiento) para ajuste
      const kmsCompetencia = competidoresComparables
        .map((c: any) => parseKm(c.km))
        .filter((km): km is number => km !== null)
      
      const kmMedioCompetencia = kmsCompetencia.length > 0
        ? kmsCompetencia.reduce((sum, km) => sum + km, 0) / kmsCompetencia.length
        : nuestrosKm
      
      let promedioAnioCompetencia: number | null = null
      const anosCompetencia = competidoresComparables
        .map((c: any) => (c.año ? parseInt(c.año) : null))
        .filter((a): a is number => a !== null && !isNaN(a))

      if (anosCompetencia.length > 0) {
        promedioAnioCompetencia = anosCompetencia.reduce((sum, año) => sum + año, 0) / anosCompetencia.length
      }
      
      // 🎯 CALCULAR DESCUENTO MÍNIMO si hay competidores con muchas bajadas
      let maxDescuentoRechazado: number | null = null
      const competidoresConBajadas = competidoresComparables.filter((c: any) => {
        // Cuando tengamos los datos completos, usar:
        // return c.dias_publicado > 60 && c.numero_bajadas_precio > 2
        // Por ahora usamos dias_publicado si está disponible
        return c.dias_publicado && c.dias_publicado > 60
      })
      
      let descuentoMinimoRequerido = null
      if (competidoresConBajadas.length > 0 && precioNuevoNuestro) {
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
          maxDescuentoRechazado = Math.max(...descuentosRechazados)
          // TU descuento debe ser al menos ligeramente mayor que el rechazado
          descuentoMinimoRequerido = maxDescuentoRechazado + DESCUENTO_EXTRA_ZOMBIE
        }
      }
      
      // NUEVA LÓGICA: Ajustar precio recomendado por diferencia de KM según GAMA
      let precioRecomendado = precioMedioCompetencia
      const valorKmGama = valorKmPorGama(gamaVehiculo)
      let diferenciaKm: number | null = null
      let valorKmAplicado: number | null = null
      let ajusteKmAplicado = 0
      let ajusteAgresivoAplicado = 0
      let precioRecomendadoBase: number | null = null
      let precioRecomendadoPostZombie: number | null = null
      let precioRecomendadoPostUrgencia: number | null = null
      let precioMaximoPermitidoZombie: number | null = null
      let bonusKmAplicado = 0
      let bonusAniosAplicado = 0
      let ventajaKmBruta: number | null = null
      let ventajaKmSignificativa = false
      let ventajaAnios = 0
      let ventajaAniosSignificativa = false
      let patitoFeoModo: 'bonus' | 'agresivo' | 'neutral' | null = null
      let precioBaseMinimoPatitoFeo: number | null = null
      
      // 🐛 DEBUG para 9853MKL
      if (vehiculo.license_plate === '9853MKL') {
        console.log('  KM medio competencia:', Math.round(kmMedioCompetencia).toLocaleString())
        console.log('  Diferencia KM:', (nuestrosKm - kmMedioCompetencia).toLocaleString())
      }
      
      if (precioMedioCompetencia && kmMedioCompetencia) {
        // Calcular diferencia de KM
        diferenciaKm = nuestrosKm - kmMedioCompetencia
        valorKmAplicado = valorKmGama

        // 🎯 LÓGICA ESPECIAL para Gama Alta + Básico
        if (gamaVehiculo === 'alta' && equipamientoVehiculo === 'basico') {
          const precioBaseMinimo = precioMinimoCompetencia ?? precioMedioCompetencia ?? 0
          const valorKm = valorKmAplicado
          precioBaseMinimoPatitoFeo = precioBaseMinimo

          ventajaKmBruta = kmMedioCompetencia - nuestrosKm
          const tieneVentajaKm = (ventajaKmBruta ?? 0) > 0
          ventajaKmSignificativa = (ventajaKmBruta ?? 0) > VENTAJA_KM_SIGNIFICATIVA
          const bonusKm = tieneVentajaKm ? (ventajaKmBruta ?? 0) * valorKm : 0

          const diferenciaAniosBruta = promedioAnioCompetencia && nuestroAño
            ? nuestroAño - promedioAnioCompetencia
            : null
          ventajaAnios = diferenciaAniosBruta && diferenciaAniosBruta > 0 ? diferenciaAniosBruta : 0
          ventajaAniosSignificativa = ventajaAnios >= VENTAJA_ANIO_SIGNIFICATIVA
          const bonusAnios = ventajaAnios > 0 ? ventajaAnios * VALOR_ANIO_VENTAJA : 0

          const aplicarBonos = (ventajaKmSignificativa && bonusKm > 0) || (ventajaAniosSignificativa && bonusAnios > 0)

          if (aplicarBonos) {
            bonusKmAplicado = bonusKm
            bonusAniosAplicado = bonusAnios
            precioRecomendado = precioBaseMinimo + bonusKm + bonusAnios
            ajusteKmAplicado = -bonusKm
            ajusteAgresivoAplicado = 0
            patitoFeoModo = 'bonus'
          } else {
            patitoFeoModo = 'agresivo'
            const ajusteAgresivo = precioBaseMinimo * 0.03 // -3% mínimo del mínimo

            if (diferenciaKm < 0) {
              const ajustePorVentajaKm = precioBaseMinimo * 0.01
              ajusteKmAplicado = ajustePorVentajaKm
              precioRecomendado = precioBaseMinimo * 0.99
            } else {
              const ajustePorKm = diferenciaKm * valorKm
              ajusteKmAplicado = ajustePorKm
              ajusteAgresivoAplicado = ajusteAgresivo
              precioRecomendado = precioBaseMinimo - ajustePorKm - ajusteAgresivo
            }

            const limiteInferior = nuestroPrecio * 0.65
            if (precioRecomendado < limiteInferior) {
              precioRecomendado = limiteInferior
            }

            if (precioMinimoCompetencia && precioRecomendado >= precioMinimoCompetencia) {
              precioRecomendado = precioMinimoCompetencia * 0.97
            }
          }
        } else {
          // Para otros casos: lógica normal
          const valorKm = valorKmAplicado
          const ajustePorKm = diferenciaKm * valorKm
          ajusteKmAplicado = ajustePorKm
          
          // Precio recomendado = precio medio mercado - ajuste por tus KM extras
          precioRecomendado = precioMedioCompetencia - ajustePorKm
          
          // 🎯 Aplicar límites FLEXIBLES según gama + equipamiento
          const limiteInferior = gamaVehiculo === 'media' && equipamientoVehiculo === 'basico'
            ? nuestroPrecio * 0.75  // Gama media básica: permitir hasta -25% de bajada
            : nuestroPrecio * 0.80  // Resto: hasta -20% de bajada
          
          if (precioRecomendado < limiteInferior) {
            precioRecomendado = limiteInferior
          }
          if (precioRecomendado > precioMedioCompetencia * 1.1) {
            precioRecomendado = precioMedioCompetencia * 1.1 // No recomendar más de 10% de subida
          }
        }
      }
      
      if (precioRecomendado !== null) {
        precioRecomendadoBase = precioRecomendado
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
      
      // 🎯 APLICAR DESCUENTO MÍNIMO si hay competidores estancados
      if (descuentoMinimoRequerido && descuentoNuestro !== null && precioNuevoNuestro) {
        if (descuentoNuestro < descuentoMinimoRequerido) {
          // Tu descuento es insuficiente
          precioMaximoPermitidoZombie = precioNuevoNuestro * (1 - descuentoMinimoRequerido / 100)
          if (precioRecomendado > precioMaximoPermitidoZombie) {
            precioRecomendado = precioMaximoPermitidoZombie
            precioRecomendadoPostZombie = precioMaximoPermitidoZombie
          }
        }
      }
      
      if (precioRecomendadoPostZombie === null) {
        precioRecomendadoPostZombie = precioRecomendado
      }
      
      // Determinar posición basada en precio AJUSTADO por KM
      let posicion = 'justo'
      let recomendacion = ''
      
      if (porcentajeDifAjustado !== null) {
        const diferenciaKmTexto = nuestrosKm > kmMedioCompetencia 
          ? `${(nuestrosKm - kmMedioCompetencia).toLocaleString()} km más` 
          : `${(kmMedioCompetencia - nuestrosKm).toLocaleString()} km menos`
        
        // 🎯 Añadir contexto de gama + equipamiento a la recomendación
        const contextoGama = gamaVehiculo === 'alta' && equipamientoVehiculo === 'basico'
          ? ` ⚠️ Gama Alta con equipamiento básico: mercado limitado.`
          : ''
        
        if (porcentajeDifAjustado <= -3) {
          // Precio competitivo considerando TUS KM
          posicion = 'competitivo'
          recomendacion = `Excelente precio. Tienes ${diferenciaKmTexto} que la competencia, tu precio ajustado es ${Math.abs(porcentajeDifAjustado).toFixed(1)}% mejor. Puedes mantener o subir hasta ${precioRecomendado.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€${contextoGama}`
        } else if (porcentajeDifAjustado >= 3) {
          // Precio alto considerando TUS KM
          posicion = 'alto'
          recomendacion = `Precio elevado. Con ${diferenciaKmTexto} que la competencia, deberías estar en ${precioRecomendado.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€ (${Math.abs(porcentajeDifAjustado).toFixed(1)}% menos)${contextoGama}`
        } else {
          // Precio justo
          posicion = 'justo'
          recomendacion = `Precio adecuado considerando tus ${nuestrosKm.toLocaleString()} km vs ${kmMedioCompetencia.toLocaleString()} km de media del mercado${contextoGama}`
        }
        
        // 🚨 Añadir advertencia si hay descuento mínimo requerido
        if (descuentoMinimoRequerido && descuentoNuestro !== null) {
          if (descuentoNuestro < descuentoMinimoRequerido) {
            recomendacion += ` 🚨 ALERTA: Competidores con +60 días no vendieron con ${descuentoMinimoRequerido.toFixed(1)}% descuento. Tu descuento actual (${descuentoNuestro.toFixed(1)}%) es insuficiente.`
          }
        }
      }
      
      // Ajustar recomendación si lleva más de 60 días en stock
      const diasEnStockActual = vehiculo.dias_en_stock || 0
      if (diasEnStockActual > 60 && posicion !== 'competitivo') {
        const descuentoUrgente = precioRecomendado * 0.95 // 5% adicional
        recomendacion += `. ⚠️ URGENTE: Lleva ${diasEnStockActual} días sin vender. Considera ${descuentoUrgente.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€ para venta rápida`
        precioRecomendadoPostUrgencia = descuentoUrgente
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

      const precioRecomendadoFinal = precioRecomendado

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
        fechaPrimeraMatriculacion: vehiculo.fecha_matriculacion || null, // Del DUC
        
        // 🎯 NUEVA LÓGICA: Clasificación automática
        gama: gamaVehiculo, // 'basica' | 'media' | 'alta'
        equipamiento: equipamientoVehiculo, // 'basico' | 'medio' | 'premium'
        descuentoMinimoRequerido, // null o % mínimo si hay competidores estancados
        maxDescuentoZombie: maxDescuentoRechazado,
        descuentoExtraZombie: DESCUENTO_EXTRA_ZOMBIE,
        competidoresEstancados: competidoresConBajadas.length, // Cuántos tienen >60 días
        ventajaKmBruta,
        ventajaKmSignificativa,
        ventajaKmUmbral: VENTAJA_KM_SIGNIFICATIVA,
        bonusKmAplicado,
        ventajaAnios,
        ventajaAniosSignificativa,
        ventajaAniosUmbral: VENTAJA_ANIO_SIGNIFICATIVA,
        bonusAniosAplicado,
        valorAnioVentaja: VALOR_ANIO_VENTAJA,
        promedioAnioCompetencia,
        patitoFeoModo,
        precioBaseMinimoPatitoFeo,
        
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
        precioRecomendado: precioRecomendadoFinal, // Lo que recomendamos cobrar (AJUSTADO por tus KM)
        precioRecomendadoBase,
        precioRecomendadoPostZombie,
        precioRecomendadoPostUrgencia,
        precioMaximoPermitidoZombie,
        diferenciaAjustada, // Diferencia vs precio ajustado
        porcentajeDifAjustado, // % diferencia vs ajustado
        ajusteKm, // Cuánto resta el kilometraje (depreciación)
        ajusteAño, // Cuánto resta la antigüedad (depreciación)
        diasEnStock: diasEnStockActual,
        recomendacion,
        analisisMercado, // Si el mercado está inflado/deflactado
        percentilesEquipamiento: percentilesGamaActual,
        precioMinimoCompetencia,
        precioMaximoCompetencia,
        precioPromedioCompetenciaGeneral,
        precioPercentil25Competencia,
        metodoPrecioBase,
        diferenciaKm,
        valorKmAplicado,
        ajusteKmAplicado,
        ajusteAgresivoAplicado,
        
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
          
          // Calcular días publicado desde primera_deteccion
          let diasPublicado = 0
          if (comp.primera_deteccion) {
            const hoy = new Date()
            const primeraDeteccion = new Date(comp.primera_deteccion)
            diasPublicado = Math.floor((hoy.getTime() - primeraDeteccion.getTime()) / (1000 * 60 * 60 * 24))
          }
          
          // Procesar modelo de competencia para añadir CV al final
          let modeloCompProcesado = comp.modelo
          if (comp.modelo) {
            // Extraer CV del modelo: "MINI 3 Puertas Cooper E 135 kW (184 CV)" -> CV = 184
            const cvMatchComp = comp.modelo.match(/\((\d+)\s*CV\)/)
            if (cvMatchComp) {
              const cv = cvMatchComp[1]
              // Añadir CV al final si no está ya
              if (!/\s\d+$/.test(modeloCompProcesado)) {
                modeloCompProcesado = `${modeloCompProcesado} ${cv}`
              }
            }
          }
          
          // Usar directamente las columnas del scraper (ya están pobladas)
          const numeroBajadasFallback = comp.numero_bajadas_precio ?? 0
          const importeTotalBajadoFallback = comp.importe_total_bajado ?? 0

          return {
            id: comp.id,
            concesionario: normalizeConcesionario(comp.concesionario),
            modelo: modeloCompProcesado, // Modelo procesado con CV al final
            precio: precioComp,
            precioNuevo: precioNuevoComp,
            km: kmComp,
            dias: diasPublicado,
            url: comp.url,
            año: comp.año,
            score: scoreComp, // Score normalizado (negativo = buen precio)
            fechaPrimeraMatriculacion: comp.fecha_primera_matriculacion || null, // Hard scraping
            numeroBajadas: numeroBajadasFallback || 0,
            importeTotalBajado: importeTotalBajadoFallback || 0
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

