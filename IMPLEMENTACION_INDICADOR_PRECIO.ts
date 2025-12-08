/**
 * IMPLEMENTACIÓN: Indicador de Precio Competitivo
 * 
 * Sistema completo para calcular indicador de competitividad de precios
 * usando solo: Precio Nuevo, Fecha Matriculación, KM, Modelo
 */

// ============================================
// CONFIGURACIÓN DE SEGMENTOS
// ============================================

interface ConfigSegmento {
  depreciacion_anual: number[]  // Tasa de depreciación por año (años 1-5)
  valor_km: number              // € por km de depreciación
  valor_residual_min: number    // % mínimo del precio nuevo
}

const SEGMENTOS: Record<string, ConfigSegmento> = {
  'premium_luxury': {
    depreciacion_anual: [0.15, 0.12, 0.10, 0.08, 0.08],  // X5, X6, X7, Serie 5+, i7, iX
    valor_km: 0.20,
    valor_residual_min: 0.35
  },
  'premium_medium': {
    depreciacion_anual: [0.18, 0.15, 0.12, 0.10, 0.09],  // X3, X4, Serie 3, Serie 4, i4
    valor_km: 0.15,
    valor_residual_min: 0.30
  },
  'premium_entry': {
    depreciacion_anual: [0.20, 0.17, 0.14, 0.12, 0.10],  // X1, X2, Serie 1, Serie 2, MINI
    valor_km: 0.10,
    valor_residual_min: 0.25
  }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

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

function parseYear(fecha: string | number | null): number | null {
  if (!fecha) return null
  if (typeof fecha === 'number') return fecha
  
  // Intentar extraer año de fecha
  const yearMatch = fecha.match(/\b(19|20)\d{2}\b/)
  if (yearMatch) return parseInt(yearMatch[0])
  
  // Si es solo un número, asumir que es el año
  const num = parseInt(fecha.toString())
  if (num >= 1900 && num <= 2100) return num
  
  return null
}

// ============================================
// IDENTIFICACIÓN DE SEGMENTO
// ============================================

function identificarSegmento(modelo: string): string {
  const modeloLower = modelo.toLowerCase()
  
  // Premium Luxury
  if (modeloLower.includes('x5') || modeloLower.includes('x6') || modeloLower.includes('x7') ||
      modeloLower.includes('serie 5') || modeloLower.includes('serie 6') || 
      modeloLower.includes('serie 7') || modeloLower.includes('serie 8') ||
      /\b(i5|i7|ix)\b/.test(modeloLower)) {
    return 'premium_luxury'
  }
  
  // Premium Medium
  if (modeloLower.includes('x3') || modeloLower.includes('x4') ||
      modeloLower.includes('serie 3') || modeloLower.includes('serie 4') ||
      modeloLower.includes('countryman') || modeloLower.includes('clubman') ||
      /\b(i4|ix3)\b/.test(modeloLower)) {
    return 'premium_medium'
  }
  
  // Premium Entry (por defecto)
  return 'premium_entry'
}

// ============================================
// CÁLCULO DE DEPRECIACIÓN POR ANTIGÜEDAD
// ============================================

function calcularDepreciacionAnual(
  precioNuevo: number,
  añoMatriculacion: number,
  segmento: string
): number {
  const añoActual = new Date().getFullYear()
  const antigüedad = añoActual - añoMatriculacion
  
  if (antigüedad <= 0) return precioNuevo
  
  const config = SEGMENTOS[segmento]
  if (!config) return precioNuevo * 0.70  // Fallback: 30% depreciación
  
  let factorResidual = 1.0
  
  // Aplicar depreciación acumulada año por año
  for (let i = 0; i < Math.min(antigüedad, config.depreciacion_anual.length); i++) {
    factorResidual *= (1 - config.depreciacion_anual[i])
  }
  
  // Para años > 5: depreciación constante del último año
  if (antigüedad > config.depreciacion_anual.length) {
    const ultimaTasa = config.depreciacion_anual[config.depreciacion_anual.length - 1]
    const añosExtra = antigüedad - config.depreciacion_anual.length
    factorResidual *= Math.pow(1 - ultimaTasa, añosExtra)
  }
  
  // Aplicar mínimo residual
  const valorMinimo = precioNuevo * config.valor_residual_min
  const valorPorAntigüedad = precioNuevo * factorResidual
  
  return Math.max(valorPorAntigüedad, valorMinimo)
}

// ============================================
// AJUSTE POR KILOMETRAJE
// ============================================

function calcularAjusteKilometraje(km: number, segmento: string): number {
  const config = SEGMENTOS[segmento]
  if (!config) return 0.85  // Fallback
  
  const valorKmBase = config.valor_km
  let factorKm = 1.0
  
  if (km <= 50000) {
    // Primeros 50k: depreciación estándar
    // Cada 10k km = -2% (premium_luxury), -1.5% (medium), -1% (entry)
    const depreciacionPor10k = valorKmBase * 10  // En porcentaje
    factorKm = 1 - (km / 10000) * (depreciacionPor10k / 100)
  } else if (km <= 100000) {
    // 50k-100k: depreciación moderada
    const kmExtra = km - 50000
    const factor50k = 1 - (50000 / 10000) * (valorKmBase * 10 / 100)
    factorKm = factor50k - (kmExtra / 10000) * (valorKmBase * 8 / 100)
  } else {
    // >100k: depreciación acelerada
    const kmExtra = km - 100000
    const factor100k = 1 - (50000 / 10000) * (valorKmBase * 10 / 100) - 
                       (50000 / 10000) * (valorKmBase * 8 / 100)
    factorKm = factor100k - (kmExtra / 10000) * (valorKmBase * 12 / 100)
  }
  
  // Mínimo: 60% del valor por km
  return Math.max(factorKm, 0.60)
}

// ============================================
// VALOR TEÓRICO ESPERADO
// ============================================

interface ValorTeorico {
  valorTeorico: number
  depreciacionAntigüedad: number
  depreciacionKm: number
  factorKm: number
  segmento: string
}

function calcularValorTeoricoEsperado(
  precioNuevo: number,
  añoMatriculacion: number,
  km: number,
  modelo: string
): ValorTeorico {
  const segmento = identificarSegmento(modelo)
  const valorPorAntigüedad = calcularDepreciacionAnual(precioNuevo, añoMatriculacion, segmento)
  const factorKm = calcularAjusteKilometraje(km, segmento)
  
  const valorTeorico = valorPorAntigüedad * factorKm
  const valorMinimo = precioNuevo * SEGMENTOS[segmento].valor_residual_min
  
  return {
    valorTeorico: Math.max(valorTeorico, valorMinimo),
    depreciacionAntigüedad: precioNuevo - valorPorAntigüedad,
    depreciacionKm: valorPorAntigüedad * (1 - factorKm),
    factorKm,
    segmento
  }
}

// ============================================
// BÚSQUEDA DE COMPETIDORES
// ============================================

interface Competidor {
  id: string
  modelo: string
  año: number | null
  km: number | null
  precio: number | null
  precioNuevo: number | null
}

function extraerModeloBase(modelo: string): string {
  const modeloLower = modelo.toLowerCase()
  
  // Extraer base del modelo (sin variantes)
  if (/\bx\d+\b/.test(modeloLower)) {
    const match = modeloLower.match(/\b(x\d+)\b/)
    return match ? match[1] : modeloLower
  }
  
  if (/serie\s*\d+/.test(modeloLower)) {
    const match = modeloLower.match(/serie\s*(\d+)/)
    return match ? `serie ${match[1]}` : modeloLower
  }
  
  if (/mini/.test(modeloLower)) {
    if (/countryman/.test(modeloLower)) return 'mini countryman'
    if (/clubman/.test(modeloLower)) return 'mini clubman'
    return 'mini'
  }
  
  return modeloLower.split(' ')[0] + ' ' + modeloLower.split(' ')[1] || modeloLower
}

function buscarCompetidoresComparables(
  modelo: string,
  añoMatriculacion: number,
  km: number,
  competidores: Competidor[],
  toleranciaAño: number = 2,
  toleranciaKm: number = 30000
): Competidor[] {
  const modeloBase = extraerModeloBase(modelo)
  
  return competidores.filter(c => {
    const modeloCompBase = extraerModeloBase(c.modelo)
    
    // Matching de modelo base
    if (modeloCompBase !== modeloBase) return false
    
    // Tolerancia de año
    if (c.año && Math.abs(c.año - añoMatriculacion) > toleranciaAño) return false
    
    // Tolerancia de km
    if (c.km && Math.abs(c.km - km) > toleranciaKm) return false
    
    return true
  })
}

// ============================================
// MÉTRICAS DE MERCADO
// ============================================

interface MetricasMercado {
  precioMedio: number | null
  precioMediano: number | null
  precioMinimo: number | null
  precioMaximo: number | null
  percentil25: number | null
  percentil75: number | null
  desviacionEstandar: number | null
  count: number
}

function calcularMetricasMercado(competidores: Competidor[]): MetricasMercado {
  const precios = competidores
    .map(c => c.precio)
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b)
  
  if (precios.length === 0) {
    return {
      precioMedio: null,
      precioMediano: null,
      precioMinimo: null,
      precioMaximo: null,
      percentil25: null,
      percentil75: null,
      desviacionEstandar: null,
      count: 0
    }
  }
  
  const suma = precios.reduce((a, b) => a + b, 0)
  const media = suma / precios.length
  const mediana = precios[Math.floor(precios.length / 2)]
  const percentil25 = precios[Math.floor(precios.length * 0.25)]
  const percentil75 = precios[Math.floor(precios.length * 0.75)]
  
  // Desviación estándar
  const varianza = precios.reduce((acc, p) => acc + Math.pow(p - media, 2), 0) / precios.length
  const desviacionEstandar = Math.sqrt(varianza)
  
  return {
    precioMedio: media,
    precioMediano: mediana,
    precioMinimo: precios[0],
    precioMaximo: precios[precios.length - 1],
    percentil25,
    percentil75,
    desviacionEstandar,
    count: precios.length
  }
}

// ============================================
// CÁLCULO DE PERCENTIL
// ============================================

function calcularPercentil(precio: number, metricas: MetricasMercado): number {
  if (!metricas.percentil25 || !metricas.percentil75 || !metricas.precioMinimo || !metricas.precioMaximo) {
    return 50  // Fallback
  }
  
  if (precio <= metricas.percentil25) {
    const rango = metricas.percentil25 - metricas.precioMinimo
    if (rango === 0) return 0
    return ((precio - metricas.precioMinimo) / rango) * 25
  } else if (precio <= metricas.percentil75) {
    const rango = metricas.percentil75 - metricas.percentil25
    if (rango === 0) return 50
    return 25 + ((precio - metricas.percentil25) / rango) * 50
  } else {
    const rango = metricas.precioMaximo - metricas.percentil75
    if (rango === 0) return 100
    return 75 + ((precio - metricas.percentil75) / rango) * 25
  }
}

// ============================================
// PRECIO RECOMENDADO
// ============================================

function calcularPrecioRecomendado(
  metricas: MetricasMercado,
  valorTeorico: number
): number {
  if (!metricas.precioMedio) return valorTeorico
  
  // Estrategia: estar en percentil 25-30 del mercado
  const precioObjetivo = metricas.percentil25 
    ? metricas.percentil25 * 1.02  // 2% por encima del percentil 25
    : metricas.precioMedio * 0.95   // 5% por debajo de la media
  
  // No bajar del valor teórico mínimo
  return Math.max(precioObjetivo, valorTeorico)
}

// ============================================
// GENERACIÓN DE RECOMENDACIONES
// ============================================

function generarRecomendacion(
  precioActual: number,
  valorTeorico: number,
  metricas: MetricasMercado,
  score: number,
  nivel: string
): string {
  const diferenciaMercado = precioActual - (metricas.precioMedio || 0)
  const diferenciaPorcentaje = metricas.precioMedio 
    ? (diferenciaMercado / metricas.precioMedio) * 100
    : 0
  
  if (nivel === 'excelente') {
    return `✅ Precio muy competitivo. Estás ${Math.abs(diferenciaPorcentaje).toFixed(1)}% por debajo de la media del mercado.`
  }
  
  if (nivel === 'bueno') {
    return `✅ Precio competitivo. Considera mantener o subir ligeramente hasta ${metricas.percentil75?.toLocaleString('es-ES')}€.`
  }
  
  if (nivel === 'justo') {
    const precioRec = metricas.percentil25 || metricas.precioMedio! * 0.95
    return `⚠️ Precio en rango justo. Para ser más competitivo, considera bajar a ${precioRec.toLocaleString('es-ES')}€ (${diferenciaPorcentaje > 0 ? diferenciaPorcentaje.toFixed(1) : Math.abs(diferenciaPorcentaje).toFixed(1)}% ${diferenciaPorcentaje > 0 ? 'menos' : 'más'}).`
  }
  
  if (nivel === 'alto') {
    const precioRec = metricas.percentil25 || metricas.precioMedio! * 0.90
    return `🔴 Precio elevado. Recomendado: ${precioRec.toLocaleString('es-ES')}€ (${diferenciaPorcentaje.toFixed(1)}% menos).`
  }
  
  // muy_alto
  const precioRec = metricas.precioMinimo || metricas.precioMedio! * 0.85
  return `🚨 Precio muy elevado. Necesitas bajar significativamente a ${precioRec.toLocaleString('es-ES')}€ (${diferenciaPorcentaje.toFixed(1)}% menos) para ser competitivo.`
}

// ============================================
// INDICADOR DE COMPETITIVIDAD PRINCIPAL
// ============================================

interface IndicadorPrecioCompetitivo {
  // Datos del vehículo
  modelo: string
  precioNuevo: number
  añoMatriculacion: number
  km: number
  precioActual: number
  
  // Análisis teórico
  valorTeoricoEsperado: number
  depreciacionAntigüedad: number
  depreciacionKm: number
  segmento: string
  
  // Análisis de mercado
  competidoresEncontrados: number
  precioMedioMercado: number | null
  precioMedianoMercado: number | null
  precioMinimoMercado: number | null
  precioMaximoMercado: number | null
  percentil25Mercado: number | null
  percentil75Mercado: number | null
  
  // Indicador de competitividad
  score: number  // 0-100
  nivel: 'excelente' | 'bueno' | 'justo' | 'alto' | 'muy_alto'
  posicionPercentil: number  // 0-100
  
  // Recomendaciones
  precioRecomendado: number
  diferenciaMercado: number
  diferenciaTeorico: number
  recomendacion: string
  
  // Metadatos
  confianza: 'alta' | 'media' | 'baja'
  fechaCalculo: string
}

export function calcularIndicadorCompetitividad(
  precioActual: number,
  precioNuevo: number,
  añoMatriculacion: number,
  km: number,
  modelo: string,
  competidores: Competidor[]
): IndicadorPrecioCompetitivo {
  
  // 1. Calcular valor teórico
  const valorTeorico = calcularValorTeoricoEsperado(precioNuevo, añoMatriculacion, km, modelo)
  
  // 2. Buscar competidores comparables
  const competidoresComparables = buscarCompetidoresComparables(
    modelo,
    añoMatriculacion,
    km,
    competidores
  )
  
  // 3. Calcular métricas de mercado
  const metricasMercado = calcularMetricasMercado(competidoresComparables)
  
  // 4. Calcular indicador
  let score: number
  let nivel: 'excelente' | 'bueno' | 'justo' | 'alto' | 'muy_alto'
  let posicionPercentil: number
  
  if (!metricasMercado.precioMedio) {
    // Sin datos de mercado: usar solo valor teórico
    const ratioTeorico = precioActual / valorTeorico.valorTeorico
    score = ratioTeorico <= 1.0 ? 100 : Math.max(0, 100 - (ratioTeorico - 1) * 50)
    nivel = ratioTeorico <= 1.0 ? 'excelente' : ratioTeorico <= 1.1 ? 'bueno' : 'alto'
    posicionPercentil = 50  // Sin datos, asumir medio
  } else {
    // Con datos de mercado: combinar teórico + mercado
    posicionPercentil = calcularPercentil(precioActual, metricasMercado)
    const scoreMercado = (1 - posicionPercentil / 100) * 100
    const ratioTeorico = precioActual / valorTeorico.valorTeorico
    const scoreTeorico = ratioTeorico <= 1.0 ? 100 : Math.max(0, 100 - (ratioTeorico - 1) * 100)
    
    score = (scoreMercado * 0.6) + (scoreTeorico * 0.4)
    
    if (score >= 80) nivel = 'excelente'
    else if (score >= 60) nivel = 'bueno'
    else if (score >= 40) nivel = 'justo'
    else if (score >= 20) nivel = 'alto'
    else nivel = 'muy_alto'
  }
  
  // 5. Calcular precio recomendado
  const precioRecomendado = calcularPrecioRecomendado(metricasMercado, valorTeorico.valorTeorico)
  
  // 6. Generar recomendación
  const recomendacion = generarRecomendacion(
    precioActual,
    valorTeorico.valorTeorico,
    metricasMercado,
    score,
    nivel
  )
  
  // 7. Determinar confianza
  const confianza: 'alta' | 'media' | 'baja' = 
    metricasMercado.count >= 10 ? 'alta' :
    metricasMercado.count >= 5 ? 'media' : 'baja'
  
  return {
    modelo,
    precioNuevo,
    añoMatriculacion,
    km,
    precioActual,
    valorTeoricoEsperado: valorTeorico.valorTeorico,
    depreciacionAntigüedad: valorTeorico.depreciacionAntigüedad,
    depreciacionKm: valorTeorico.depreciacionKm,
    segmento: valorTeorico.segmento,
    competidoresEncontrados: competidoresComparables.length,
    precioMedioMercado: metricasMercado.precioMedio,
    precioMedianoMercado: metricasMercado.precioMediano,
    precioMinimoMercado: metricasMercado.precioMinimo,
    precioMaximoMercado: metricasMercado.precioMaximo,
    percentil25Mercado: metricasMercado.percentil25,
    percentil75Mercado: metricasMercado.percentil75,
    score: Math.round(score),
    nivel,
    posicionPercentil: Math.round(posicionPercentil),
    precioRecomendado,
    diferenciaMercado: precioActual - (metricasMercado.precioMedio || 0),
    diferenciaTeorico: precioActual - valorTeorico.valorTeorico,
    recomendacion,
    confianza,
    fechaCalculo: new Date().toISOString()
  }
}

// ============================================
// EJEMPLO DE USO
// ============================================

/*
const ejemplo = calcularIndicadorCompetitividad(
  69990,           // precioActual
  95000,           // precioNuevo
  2022,            // añoMatriculacion
  45000,           // km
  'BMW X5',        // modelo
  competidores     // Array de competidores
)

console.log(ejemplo)
// {
//   score: 45,
//   nivel: 'justo',
//   precioRecomendado: 66300,
//   recomendacion: '⚠️ Precio en rango justo...'
// }
*/

