<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 🧠 Metodología de Indicador de Precio Competitivo para BMW Premium Selection (sin historiales ni garantía)

A continuación va un texto completo, coherente y compacto para pegar en Cursor y usar como base de implementación / revisión.

***

## 🎯 Objetivo

Diseñar un **Indicador de Precio Competitivo** para vehículos BMW Premium Selection usando solo estos datos por vehículo:

- `precio_nuevo_original` (precio nuevo de catálogo cuando era 0km)
- `fecha_matriculacion` (año/mes de primera matriculación)
- `km` (kilometraje actual)
- `modelo` (ej: BMW X5, Serie 3, MINI, etc.)
- `precio_actual` (precio al que se ofrece ahora en el concesionario)

Restricciones reales de BPS:

- No hay **outliers extremos** (solo concesionarios oficiales BMW).
- No hay acceso a **historial de mantenimiento** ni **accidentes**.
- La **garantía es homogénea** (2 años para todos) ⇒ no se usa como variable diferencial.

***

## 🧩 Enfoque General

1. Clasificar cada vehículo en un **segmento de mercado** según modelo (premium_luxury, premium_medium, premium_entry).
2. Calcular un **Valor Teórico Esperado (VTE)** en base a:
    - Depreciación por antigüedad (curva anual).
    - Ajuste por kilometraje (no lineal, contextualizado).
3. Buscar **competidores comparables** (mismo modelo base, años y km similares) en los datos de `comparador_scraper`.
4. Calcular **métricas de mercado** (media, mediana, percentiles, etc.).
5. Calcular un **score de competitividad 0‑100**, combinando:
    - Valor teórico (modelo de depreciación).
    - Posición real en el mercado (percentiles vs otros).
6. Generar **recomendación de precio** y texto explicativo.

***

## 1. Segmentación por Tipo de Vehículo

Los BMW no se deprecian igual según el segmento. Se define una configuración base:

```typescript
type SegmentoBase = 'premium_luxury' | 'premium_medium' | 'premium_entry'

interface ConfigSegmento {
  depreciacion_anual: number[]   // tasas de depreciación año a año (primeros 5 años)
  valor_km: number               // intensidad de impacto de los km
  valor_residual_min: number     // mínimo valor residual [% del precio nuevo]
}

const SEGMENTOS: Record<SegmentoBase, ConfigSegmento> = {
  premium_luxury: {   // X5, X6, X7, Serie 5+, i7, iX
    depreciacion_anual: [0.15, 0.12, 0.10, 0.08, 0.08],
    valor_km: 0.20,
    valor_residual_min: 0.35
  },
  premium_medium: {   // X3, X4, Serie 3, Serie 4, i4
    depreciacion_anual: [0.18, 0.15, 0.12, 0.10, 0.09],
    valor_km: 0.15,
    valor_residual_min: 0.30
  },
  premium_entry: {    // X1, X2, Serie 1, Serie 2, MINI
    depreciacion_anual: [0.20, 0.17, 0.14, 0.12, 0.10],
    valor_km: 0.10,
    valor_residual_min: 0.25
  }
}

// Mapeo modelo → segmento
function identificarSegmento(modelo: string): SegmentoBase {
  const m = modelo.toLowerCase()

  if (m.includes('x5') || m.includes('x6') || m.includes('x7') ||
      m.includes('serie 5') || m.includes('serie 6') || m.includes('serie 7') ||
      m.includes('i7') || m.includes('ix')) {
    return 'premium_luxury'
  }

  if (m.includes('x3') || m.includes('x4') ||
      m.includes('serie 3') || m.includes('serie 4') || m.includes('i4')) {
    return 'premium_medium'
  }

  // Resto: Serie 1, Serie 2, X1, X2, MINI, etc.
  return 'premium_entry'
}
```


***

## 2. Valor Teórico Esperado

### 2.1 Depreciación por Antigüedad (Curva Anual)

Se aplica una curva de depreciación acumulada año a año (exponencial, no lineal):

```typescript
function calcularDepreciacionAntiguedad(
  precioNuevo: number,
  anioMatriculacion: number,
  segmento: SegmentoBase,
  anioActual: number = new Date().getFullYear()
): { valorPorAntiguedad: number; factorResidual: number } {
  const antiguedad = Math.max(0, anioActual - anioMatriculacion)
  const config = SEGMENTOS[segmento]

  if (antiguedad === 0) {
    return { valorPorAntiguedad: precioNuevo, factorResidual: 1.0 }
  }

  let factorResidual = 1.0

  // Aplicar tasas año a año
  for (let i = 0; i < Math.min(antiguedad, config.depreciacion_anual.length); i++) {
    factorResidual *= (1 - config.depreciacion_anual[i])
  }

  // Años > longitud del array: usar última tasa como constante
  if (antiguedad > config.depreciacion_anual.length) {
    const ultimaTasa = config.depreciacion_anual[config.depreciacion_anual.length - 1]
    const aniosExtra = antiguedad - config.depreciacion_anual.length
    factorResidual *= Math.pow(1 - ultimaTasa, aniosExtra)
  }

  const valorMinimo = precioNuevo * config.valor_residual_min
  const valorPorAntiguedad = Math.max(precioNuevo * factorResidual, valorMinimo)

  return { valorPorAntiguedad, factorResidual }
}
```


***

### 2.2 Ajuste por Kilometraje (No Lineal + Contextual)

El impacto del kilometraje es mayor en los primeros km, pero además se contextualiza por **km esperados según antigüedad**.

```typescript
function calcularFactorKmBase(km: number, segmento: SegmentoBase): number {
  const config = SEGMENTOS[segmento]
  const valorKmBase = config.valor_km

  let factorKm = 1.0

  if (km <= 50000) {
    // Primeros 50k: depreciación estándar
    factorKm = 1 - (km * valorKmBase / 10000) // cada 10k km penaliza algo según segmento
  } else if (km <= 100000) {
    // 50k–100k: depreciación moderada
    const kmExtra = km - 50000
    factorKm = 0.90 - (kmExtra * valorKmBase * 0.8 / 10000)
  } else {
    // >100k: depreciación acelerada
    const kmExtra = km - 100000
    factorKm = 0.82 - (kmExtra * valorKmBase * 1.2 / 10000)
  }

  // Mínimo de 60% del valor por km (no bajamos más por este lado)
  return Math.max(factorKm, 0.60)
}

function calcularAjusteKilometraje(
  km: number,
  antiguedad: number,
  segmento: SegmentoBase
): number {
  const factorKmBase = calcularFactorKmBase(km, segmento)

  // Contexto: km esperados por antigüedad (ej: 12k km/año)
  const kmEsperadosAnual = 12000
  const kmEsperados = Math.max(kmEsperadosAnual * Math.max(antiguedad, 1), 1) // evitar 0
  const ratioUso = km / kmEsperados

  let factorUso = 1.0

  if (ratioUso <= 0.75) {
    // Poco uso relativo: ligera bonificación
    factorUso = 1.0 + (0.75 - ratioUso) * 0.1 // hasta +7.5% aprox
  } else if (ratioUso <= 1.25) {
    // Uso razonable
    factorUso = 1.0
  } else {
    // Uso alto: penalización moderada
    const exceso = ratioUso - 1.25
    factorUso = 1.0 - Math.min(exceso * 0.15, 0.25) // penalización máxima -25%
  }

  const factorKmTotal = factorKmBase * factorUso

  // Clamp para evitar extremos
  return Math.min(Math.max(factorKmTotal, 0.60), 1.10)
}
```


***

### 2.3 Valor Teórico Esperado (VTE)

Combina antigüedad + km:

```typescript
interface ResultadoValorTeorico {
  valorTeorico: number
  valorPorAntiguedad: number
  depreciacionAntiguedad: number
  depreciacionKm: number
  factorKm: number
  segmento: SegmentoBase
}

function calcularValorTeoricoEsperado(
  precioNuevo: number,
  anioMatriculacion: number,
  km: number,
  modelo: string,
  anioActual: number = new Date().getFullYear()
): ResultadoValorTeorico {
  const segmento = identificarSegmento(modelo)

  const { valorPorAntiguedad } = calcularDepreciacionAntiguedad(
    precioNuevo,
    anioMatriculacion,
    segmento,
    anioActual
  )

  const antiguedad = Math.max(0, anioActual - anioMatriculacion)
  const factorKm = calcularAjusteKilometraje(km, antiguedad, segmento)

  const valorTeoricoBruto = valorPorAntiguedad * factorKm
  const valorTeoricoMinimo = precioNuevo * SEGMENTOS[segmento].valor_residual_min
  const valorTeorico = Math.max(valorTeoricoBruto, valorTeoricoMinimo)

  return {
    valorTeorico,
    valorPorAntiguedad,
    depreciacionAntiguedad: precioNuevo - valorPorAntiguedad,
    depreciacionKm: valorPorAntiguedad * (1 - factorKm),
    factorKm,
    segmento
  }
}
```


***

## 3. Búsqueda de Competidores Comparables

Se usan datos de `comparador_scraper` (otros BPS/portales oficiales). Idea:

- Mismo **modelo base** (X5, Serie 3, MINI, etc.).
- Año matriculación: ±2 años.
- Kilometraje: ±30.000 km.
- Sin necesidad de filtrar outliers extremos, dado que en BPS ya hay filtrado natural.

```typescript
interface Competidor {
  modelo: string
  anio: number
  km: number
  precio: number
}

function extraerModeloBase(modelo: string): string {
  const m = modelo.toLowerCase()

  if (m.includes('x5')) return 'x5'
  if (m.includes('x6')) return 'x6'
  if (m.includes('x7')) return 'x7'
  if (m.includes('x3')) return 'x3'
  if (m.includes('x4')) return 'x4'
  if (m.includes('x1')) return 'x1'
  if (m.includes('x2')) return 'x2'
  if (m.includes('serie 1')) return 'serie 1'
  if (m.includes('serie 2')) return 'serie 2'
  if (m.includes('serie 3')) return 'serie 3'
  if (m.includes('serie 4')) return 'serie 4'
  if (m.includes('serie 5')) return 'serie 5'
  if (m.includes('mini')) return 'mini'

  return modelo.toLowerCase()
}

function buscarCompetidoresComparables(
  modelo: string,
  anioMatriculacion: number,
  km: number,
  competidores: Competidor[],
  toleranciaAnio = 2,
  toleranciaKm = 30000
): Competidor[] {
  const modeloBase = extraerModeloBase(modelo)

  return competidores.filter(c => {
    const modeloCompBase = extraerModeloBase(c.modelo)
    if (modeloCompBase !== modeloBase) return false

    const diferenciaAnio = Math.abs(c.anio - anioMatriculacion)
    if (diferenciaAnio > toleranciaAnio) return false

    const diferenciaKm = Math.abs(c.km - km)
    if (diferenciaKm > toleranciaKm) return false

    return true
  })
}
```


***

## 4. Métricas de Mercado

A partir de los competidores comparables se calculan estadísticas:

```typescript
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
    .filter(p => typeof p === 'number' && !Number.isNaN(p))
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

  const count = precios.length
  const suma = precios.reduce((a, b) => a + b, 0)
  const media = suma / count
  const mediana = precios[Math.floor(count / 2)]
  const percentil25 = precios[Math.floor(count * 0.25)]
  const percentil75 = precios[Math.floor(count * 0.75)]
  const precioMinimo = precios[0]
  const precioMaximo = precios[count - 1]

  const varianza = precios.reduce((acc, p) => acc + Math.pow(p - media, 2), 0) / count
  const desviacionEstandar = Math.sqrt(varianza)

  return {
    precioMedio: media,
    precioMediano: mediana,
    precioMinimo,
    precioMaximo,
    percentil25,
    percentil75,
    desviacionEstandar,
    count
  }
}
```


***

## 5. Indicador de Competitividad

### 5.1 Percentil de Posición en Mercado

```typescript
function calcularPercentil(precio: number, metricas: MetricasMercado): number {
  if (
    metricas.precioMinimo == null ||
    metricas.precioMaximo == null ||
    metricas.percentil25 == null ||
    metricas.percentil75 == null
  ) {
    return 50 // neutro si faltan datos
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
```


***

### 5.2 Nivel de Confianza

Basado solo en cantidad y consistencia (sin historiales ni garantía):

```typescript
type NivelConfianza = 'alta' | 'media' | 'baja'

function calcularNivelConfianza(
  metricas: MetricasMercado
): NivelConfianza {
  const { count, desviacionEstandar, precioMedio } = metricas

  if (!precioMedio || !desviacionEstandar || count === 0) return 'baja'

  let score = 0

  // Cantidad de competidores
  if (count >= 15) score += 40
  else if (count >= 8) score += 25
  else if (count >= 4) score += 15
  else score += 5

  // Consistencia de precios (coeficiente de variación)
  const cv = (desviacionEstandar / precioMedio) * 100
  if (cv < 10) score += 30
  else if (cv < 20) score += 20
  else score += 10

  if (score >= 60) return 'alta'
  if (score >= 40) return 'media'
  return 'baja'
}
```


***

### 5.3 Score de Competitividad (0‑100)

Combina modelo teórico + mercado, ajustado por nivel de confianza en los datos reales:

```typescript
type Nivel = 'excelente' | 'bueno' | 'justo' | 'alto' | 'muy_alto'

interface IndicadorCompetitividad {
  score: number
  nivel: Nivel
  precioRecomendado: number
  diferenciaMercado: number | null
  diferenciaTeorico: number
  posicionPercentil: number
  recomendacion: string
}

function calcularPrecioRecomendado(
  metricas: MetricasMercado,
  valorTeorico: number
): number {
  if (!metricas.precioMedio) return valorTeorico

  const { percentil25, precioMedio } = metricas

  const precioObjetivo = percentil25
    ? percentil25 * 1.02  // 2% por encima del P25
    : precioMedio * 0.95  // 5% por debajo de la media

  return Math.max(precioObjetivo, valorTeorico)
}

function calcularIndicadorCompetitividad(
  precioActual: number,
  valorTeorico: number,
  metricasMercado: MetricasMercado
): IndicadorCompetitividad {
  const confianza = calcularNivelConfianza(metricasMercado)

  // Caso sin mercado: usar solo teoría
  if (!metricasMercado.precioMedio) {
    const ratioTeorico = precioActual / valorTeorico
    const scoreTeorico = ratioTeorico <= 1.0
      ? 100
      : Math.max(0, 100 - (ratioTeorico - 1) * 50)

    const nivel: Nivel =
      scoreTeorico >= 80 ? 'excelente' :
      scoreTeorico >= 60 ? 'bueno' :
      scoreTeorico >= 40 ? 'justo' :
      scoreTeorico >= 20 ? 'alto' :
      'muy_alto'

    const precioRecomendado = valorTeorico

    const diferenciaTeorico = precioActual - valorTeorico

    const recomendacion = generarRecomendacionTexto(
      precioActual,
      valorTeorico,
      metricasMercado,
      scoreTeorico,
      nivel
    )

    return {
      score: Math.round(scoreTeorico),
      nivel,
      precioRecomendado,
      diferenciaMercado: null,
      diferenciaTeorico,
      posicionPercentil: 50,
      recomendacion
    }
  }

  // Con mercado:
  const posicionPercentil = calcularPercentil(precioActual, metricasMercado)
  const ratioTeorico = precioActual / valorTeorico

  let scoreTeorico = ratioTeorico <= 1.0
    ? 100
    : Math.max(0, 100 - (ratioTeorico - 1) * 100)

  const scoreMercado = 100 - posicionPercentil // 0 (más caro) → 0 puntos; 0 (más barato) → 100

  // Ponderación dinámica según confianza
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

  let nivel: Nivel
  if (scoreFinal >= 80) nivel = 'excelente'
  else if (scoreFinal >= 60) nivel = 'bueno'
  else if (scoreFinal >= 40) nivel = 'justo'
  else if (scoreFinal >= 20) nivel = 'alto'
  else nivel = 'muy_alto'

  const precioRecomendado = calcularPrecioRecomendado(metricasMercado, valorTeorico)
  const diferenciaMercado = precioActual - metricasMercado.precioMedio!
  const diferenciaTeorico = precioActual - valorTeorico

  const recomendacion = generarRecomendacionTexto(
    precioActual,
    valorTeorico,
    metricasMercado,
    scoreFinal,
    nivel
  )

  return {
    score: Math.round(scoreFinal),
    nivel,
    precioRecomendado,
    diferenciaMercado,
    diferenciaTeorico,
    posicionPercentil,
    recomendacion
  }
}
```


***

### 5.4 Generación del Texto de Recomendación

```typescript
function generarRecomendacionTexto(
  precioActual: number,
  valorTeorico: number,
  metricas: MetricasMercado,
  score: number,
  nivel: Nivel
): string {
  const precioMedio = metricas.precioMedio
  const p25 = metricas.percentil25
  const p75 = metricas.percentil75

  let diferenciaPorcentaje = 0
  if (precioMedio) {
    diferenciaPorcentaje = ((precioActual - precioMedio) / precioMedio) * 100
  }

  const diferenciaTeorico = precioActual - valorTeorico

  if (!precioMedio) {
    // Solo valor teórico disponible
    if (precioActual <= valorTeorico) {
      return `✅ Precio competitivo según modelo de depreciación. Estás alineado o por debajo del valor teórico esperado.`
    } else {
      const diffPct = ((precioActual - valorTeorico) / valorTeorico) * 100
      return `⚠️ Precio por encima del valor teórico. Considera bajar alrededor de un ${diffPct.toFixed(1)}% para alinearte con la depreciación esperada.`
    }
  }

  // Con mercado:
  if (nivel === 'excelente') {
    return `✅ Precio muy competitivo. Estás aproximadamente un ${Math.abs(diferenciaPorcentaje).toFixed(1)}% por debajo de la media del mercado y alineado con la depreciación esperada.`
  }

  if (nivel === 'bueno') {
    return `✅ Precio competitivo. Estás en buen rango de mercado. Podrías mantener el precio actual o ajustar ligeramente hacia el entorno del percentil 75 si quieres maximizar margen sin perder demasiada competitividad.`
  }

  if (nivel === 'justo') {
    const objetivo = p25 ? p25.toLocaleString('es-ES') : valorTeorico.toLocaleString('es-ES')
    return `⚠️ Precio en rango justo. Para ser más competitivo, considera ajustar hacia unos ${objetivo}€ para acercarte al percentil 25 del mercado y al valor teórico esperado.`
  }

  if (nivel === 'alto') {
    const objetivo = p25
      ? p25.toLocaleString('es-ES')
      : (precioMedio * 0.9).toLocaleString('es-ES')
    return `🔴 Precio elevado respecto al mercado y al valor teórico. Recomendado ajustar el precio hacia unos ${objetivo}€ para mejorar la competitividad.`
  }

  // muy_alto
  const objetivoFinal = (metricas.precioMinimo ?? precioMedio * 0.85).toLocaleString('es-ES')
  return `🚨 Precio muy por encima del mercado. Para entrar en rango competitivo, sería necesario acercarse a aproximadamente ${objetivoFinal}€ según comparables actuales.`
}
```


***

## 6. Estructura del Indicador Final

```typescript
interface IndicadorPrecioCompetitivo {
  // Datos del vehículo
  modelo: string
  precioNuevo: number
  anioMatriculacion: number
  km: number
  precioActual: number

  // Análisis teórico
  valorTeoricoEsperado: number
  depreciacionAntiguedad: number
  depreciacionKm: number
  segmento: SegmentoBase

  // Análisis de mercado
  competidoresEncontrados: number
  precioMedioMercado: number | null
  precioMedianoMercado: number | null
  precioMinimoMercado: number | null
  precioMaximoMercado: number | null
  percentil25Mercado: number | null
  percentil75Mercado: number | null

  // Indicador de competitividad
  score: number        // 0-100
  nivel: Nivel
  posicionPercentil: number // 0-100 (0 = más barato, 100 = más caro)

  // Recomendaciones
  precioRecomendado: number
  diferenciaMercado: number | null
  diferenciaTeorico: number
  recomendacion: string

  // Metadatos
  confianza: NivelConfianza
  fechaCalculo: string
}

function generarIndicadorPrecioCompetitivo(
  dataVehiculo: {
    modelo: string
    precioNuevo: number
    anioMatriculacion: number
    km: number
    precioActual: number
  },
  competidores: Competidor[],
  fechaCalculo: Date = new Date()
): IndicadorPrecioCompetitivo {
  const { modelo, precioNuevo, anioMatriculacion, km, precioActual } = dataVehiculo

  const resultadoTeorico = calcularValorTeoricoEsperado(
    precioNuevo,
    anioMatriculacion,
    km,
    modelo,
    fechaCalculo.getFullYear()
  )

  const comps = buscarCompetidoresComparables(
    modelo,
    anioMatriculacion,
    km,
    competidores
  )

  const metricas = calcularMetricasMercado(comps)
  const confianza = calcularNivelConfianza(metricas)

  const indicador = calcularIndicadorCompetitividad(
    precioActual,
    resultadoTeorico.valorTeorico,
    metricas
  )

  return {
    modelo,
    precioNuevo,
    anioMatriculacion,
    km,
    precioActual,

    valorTeoricoEsperado: resultadoTeorico.valorTeorico,
    depreciacionAntiguedad: resultadoTeorico.depreciacionAntiguedad,
    depreciacionKm: resultadoTeorico.depreciacionKm,
    segmento: resultadoTeorico.segmento,

    competidoresEncontrados: metricas.count,
    precioMedioMercado: metricas.precioMedio,
    precioMedianoMercado: metricas.precioMediano,
    precioMinimoMercado: metricas.precioMinimo,
    precioMaximoMercado: metricas.precioMaximo,
    percentil25Mercado: metricas.percentil25,
    percentil75Mercado: metricas.percentil75,

    score: indicador.score,
    nivel: indicador.nivel,
    posicionPercentil: indicador.posicionPercentil,

    precioRecomendado: indicador.precioRecomendado,
    diferenciaMercado: indicador.diferenciaMercado,
    diferenciaTeorico: indicador.diferenciaTeorico,
    recomendacion: indicador.recomendacion,

    confianza,
    fechaCalculo: fechaCalculo.toISOString()
  }
}
```


***

Este bloque completo lo puedes pegar directamente en Cursor y trabajar sobre él (refactorizar, tipar mejor, mover a módulos, añadir tests, etc.).

