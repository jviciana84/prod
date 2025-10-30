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
    
    // Leer tolerancias configurables (con valores por defecto)
    const { searchParams } = new URL(request.url)
    const toleranciaCv = parseInt(searchParams.get('toleranciaCv') || '20') // ±20 CV por defecto
    const toleranciaAño = parseFloat(searchParams.get('toleranciaAño') || '1') // Puede ser fraccionario (0.25, 0.5, etc.)
    
    // Obtener vehículo específico desde duc_scraper
    const { data: ducVehiculo, error: vehiculoError } = await supabase
      .from('duc_scraper')
      .select('"ID Anuncio", "Matrícula", "Modelo", "Versión", "Fecha primera matriculación", "Fecha primera publicación", "KM", "Precio", "Precio vehículo nuevo", "URL"')
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
    
    // Calcular días en stock desde "Fecha primera publicación"
    let diasEnStock = null
    if (ducVehiculo['Fecha primera publicación']) {
      const fechaPublicacion = parseSpanishDate(ducVehiculo['Fecha primera publicación'])
      if (fechaPublicacion) {
        const hoy = new Date()
        const fechaPub = new Date(fechaPublicacion, 0, 1)
        // Si tenemos la fecha completa (DD / MM / YYYY), parsearla correctamente
        if (ducVehiculo['Fecha primera publicación'].includes('/')) {
          const partes = ducVehiculo['Fecha primera publicación'].split('/').map((p: string) => p.trim())
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
    let modeloCompleto = ducVehiculo['Modelo']
    if (ducVehiculo['Versión']) {
      const modeloLower = ducVehiculo['Modelo'].toLowerCase()
      const versionLower = ducVehiculo['Versión'].toLowerCase()
      
      // Extraer potencia (CV) de la versión - PRIORIDAD: CV sobre kW
      const cvMatch = ducVehiculo['Versión'].match(/\((\d+)\s*CV\)/)
      const kwMatch = ducVehiculo['Versión'].match(/(\d+)\s*kW/)
      
      // Usar CV si existe, sino convertir kW a CV (1 kW = 1.36 CV)
      let potenciaCv = null
      if (cvMatch) {
        potenciaCv = cvMatch[1]
      } else if (kwMatch && !cvMatch) {
        potenciaCv = Math.round(parseInt(kwMatch[1]) * 1.36).toString()
      } else if (ducVehiculo['Potencia Cv']) {
        potenciaCv = ducVehiculo['Potencia Cv'].toString()
      }
      
      // Para MINI: capturar variantes completas (Cooper E, Cooper SE, Cooper S, JCW, etc.) + CV
      if (modeloLower.includes('mini')) {
        // Detectar variantes MINI específicas (orden importante: más específico primero)
        if (/john\s*cooper\s*works|jcw/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} John Cooper Works`
        } else if (/cooper\s*se\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} Cooper SE`
        } else if (/cooper\s*s\s*e\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} Cooper S E`
        } else if (/cooper\s*sd\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} Cooper SD`
        } else if (/cooper\s*s\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} Cooper S`
        } else if (/cooper\s*e\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} Cooper E`
        } else if (/cooper\s*d\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} Cooper D`
        } else if (/cooper\s*c\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} Cooper C`
        } else if (/cooper/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} Cooper`
        } else if (/\bone\s*d\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} One D`
        } else if (/\bone\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} One`
        } else if (/\bs\s*all4/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} S ALL4`
        } else if (/\bse\s*all4/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} SE ALL4`
        } else if (/\bs\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} S`
        } else if (/\be\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} E`
        } else if (/\bd\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} D`
        } else if (/\bc\b/i.test(ducVehiculo['Versión'])) {
          modeloCompleto = `${ducVehiculo['Modelo']} C`
        }
        
        // Añadir CV al modelo MINI
        if (potenciaCv) {
          modeloCompleto = `${modeloCompleto} ${potenciaCv}`
        }
      } 
      // Para BMW: extraer variante técnica (xDrive30, eDrive40, M50, 320d, etc.) + CV
      else {
        const versionMatch = ducVehiculo['Versión'].match(/([ex]?Drive\d+|M\d+|\d{3}[a-z]+)/i)
        if (versionMatch) {
          modeloCompleto = `${ducVehiculo['Modelo']} ${versionMatch[1]}`
        } else {
          modeloCompleto = `${ducVehiculo['Modelo']} ${ducVehiculo['Versión'].split(' ')[0]}`
        }
        
        // Añadir CV al modelo BMW
        if (potenciaCv) {
          modeloCompleto = `${modeloCompleto} ${potenciaCv}`
        }
      }
    }
    
    const vehiculo = {
      id: ducVehiculo['ID Anuncio'],
      license_plate: ducVehiculo['Matrícula'],
      model: modeloCompleto,
      fecha_matriculacion: ducVehiculo['Fecha primera matriculación'] || null, // Fecha del DUC
      year: year ? year.toString() : null,
      km: ducVehiculo['KM'],
      price: ducVehiculo['Precio'],
      original_new_price: ducVehiculo['Precio vehículo nuevo'],
      dias_en_stock: diasEnStock,
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
        .select('id, source, id_anuncio, modelo, año, km, precio, precio_anterior, precio_nuevo, precio_nuevo_original, concesionario, url, dias_publicado, primera_deteccion, fecha_primera_matriculacion, estado_anuncio, numero_bajadas_precio, importe_total_bajado')
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
      
      // Normalizar modelos para comparación exacta incluyendo potencia (CV)
      const normalizeModel = (modelo: string, modeloOriginal?: string) => {
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
              // Extraer variante si existe (orden importante: más específico primero)
              if (/john\s*cooper\s*works|jcw/i.test(normalized)) variant = 'jcw'
              else if (/cooper\s*se\b/i.test(normalized)) variant = 'cooper se'
              else if (/cooper\s*s\s*e\b/i.test(normalized)) variant = 'cooper s e'
              else if (/cooper\s*sd\b/i.test(normalized)) variant = 'cooper sd'
              else if (/cooper\s*s\b/i.test(normalized)) variant = 'cooper s'
              else if (/cooper\s*e\b/i.test(normalized)) variant = 'cooper e'
              else if (/cooper\s*d\b/i.test(normalized)) variant = 'cooper d'
              else if (/cooper\s*c\b/i.test(normalized)) variant = 'cooper c'
              else if (/cooper/i.test(normalized)) variant = 'cooper'
              else if (/\bone\s*d\b/i.test(normalized)) variant = 'one d'
              else if (/\bone\b/i.test(normalized)) variant = 'one'
            }
          }
          // Countryman, Clubman, Paceman
          else if (/\b(countryman|clubman|paceman)\b/.test(normalized)) {
            const match = normalized.match(/\b(countryman|clubman|paceman)\b/i)
            if (match) {
              base = `mini ${match[1]}`
              // Detectar variante más específica
              if (/john\s*cooper\s*works|jcw/i.test(normalized)) variant = 'jcw'
              else if (/cooper\s*se/i.test(normalized)) variant = 'cooper se'
              else if (/cooper\s*s\s*e\b/i.test(normalized)) variant = 'cooper s e'
              else if (/cooper\s*sd\b/i.test(normalized)) variant = 'cooper sd'
              else if (/cooper\s*s\b/i.test(normalized)) variant = 'cooper s'
              else if (/cooper\s*d\b/i.test(normalized)) variant = 'cooper d'
              else if (/cooper\s*c\b/i.test(normalized)) variant = 'cooper c'
              else if (/cooper\s*e\b/i.test(normalized)) variant = 'cooper e'
              else if (/\bs\s*all4/i.test(normalized)) variant = 's all4'
              else if (/\bse\s*all4/i.test(normalized)) variant = 'se all4'
              else if (/\bone\s*d\b/i.test(normalized)) variant = 'one d'
              else if (/\bs\b/i.test(normalized)) variant = 's'
              else if (/\be\b/i.test(normalized)) variant = 'e'
              else if (/\bd\b/i.test(normalized)) variant = 'd'
              else if (/\bc\b/i.test(normalized)) variant = 'c'
              else if (/cooper/i.test(normalized)) variant = 'cooper'
            }
          }
          // MINI Aceman
          else if (/aceman/.test(normalized)) {
            base = 'mini aceman'
            if (/john\s*cooper\s*works|jcw/i.test(normalized)) variant = 'jcw'
            else if (/aceman\s*se/.test(normalized)) variant = 'se'
            else if (/aceman\s*e\b/.test(normalized)) variant = 'e'
          }
          // MINI Cabrio
          else if (/cabrio/.test(normalized)) {
            base = 'mini cabrio'
            if (/john\s*cooper\s*works|jcw/i.test(normalized)) variant = 'jcw'
            else if (/cooper\s*s\b/.test(normalized)) variant = 'cooper s'
            else if (/cooper/i.test(normalized)) variant = 'cooper'
          }
          // MINI Cooper (solo, sin puertas)
          else if (/cooper/.test(normalized)) {
            base = 'mini cooper'
            if (/john\s*cooper\s*works|jcw/i.test(normalized)) variant = 'jcw'
            else if (/cooper\s*se/.test(normalized)) variant = 'se'
            else if (/cooper\s*s\b/.test(normalized)) variant = 's'
            else variant = ''
          }
        }
        
        // Si no se detectó nada, usar modelo completo
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
    
    // Ajustar recomendación si lleva más de 60 días en stock
    const diasEnStockActual = vehiculo.dias_en_stock || 0
    if (diasEnStockActual > 60 && posicion !== 'competitivo') {
      const descuentoUrgente = precioRecomendado * 0.95 // 5% adicional
      recomendacion += `. ⚠️ URGENTE: Lleva ${diasEnStockActual} días sin vender. Considera ${descuentoUrgente.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€ para venta rápida`
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
      fechaPrimeraMatriculacion: vehiculo.fecha_matriculacion || null, // Del DUC
      
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
      diasEnStock: diasEnStockActual,
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
        
        // Fallback para bajadas si el scraper aún no pobló las nuevas columnas
        const precioAnteriorNum = parsePrice(comp.precio_anterior)
        const numeroBajadasFallback = (comp.numero_bajadas_precio || 0) > 0
          ? comp.numero_bajadas_precio
          : (comp.estado_anuncio === 'precio_bajado' && precioAnteriorNum && precioComp && precioAnteriorNum > precioComp ? 1 : 0)
        const importeTotalBajadoFallback = (comp.importe_total_bajado || 0) > 0
          ? comp.importe_total_bajado
          : (numeroBajadasFallback && precioAnteriorNum && precioComp ? (precioAnteriorNum - precioComp) : 0)

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
      }),
      
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

