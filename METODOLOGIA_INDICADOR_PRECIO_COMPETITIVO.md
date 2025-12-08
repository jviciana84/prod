# 🎯 METODOLOGÍA: Indicador de Precio Competitivo

## 📋 Datos Disponibles

Para cada vehículo tenemos:
- **Precio Nuevo** (`precio_nuevo_original`): Precio cuando el vehículo era 0km
- **Fecha Matriculación**: Año/mes de primera matriculación
- **Kilometraje** (`km`): Kilómetros totales recorridos
- **Modelo**: Identificación del modelo (BMW Serie 3, X5, MINI Cooper, etc.)

---

## 🧮 METODOLOGÍA PROPUESTA

### **FASE 1: Normalización y Segmentación**

#### 1.1 Clasificación por Segmento de Mercado

Basado en el **modelo**, clasificar en segmentos con diferentes comportamientos de depreciación:

```typescript
SEGMENTOS = {
  'premium_luxury': {  // X5, X6, X7, Serie 5+, i7, iX
    depreciacion_anual: [0.15, 0.12, 0.10, 0.08, 0.08],  // Primeros 5 años
    valor_km: 0.20,  // € por km
    valor_residual_min: 0.35  // 35% mínimo del precio nuevo
  },
  'premium_medium': {  // X3, X4, Serie 3, Serie 4, i4
    depreciacion_anual: [0.18, 0.15, 0.12, 0.10, 0.09],
    valor_km: 0.15,
    valor_residual_min: 0.30
  },
  'premium_entry': {  // X1, X2, Serie 1, Serie 2, MINI
    depreciacion_anual: [0.20, 0.17, 0.14, 0.12, 0.10],
    valor_km: 0.10,
    valor_residual_min: 0.25
  }
}
```

**Lógica**: Vehículos premium mantienen mejor valor, deprecian menos por km.

---

### **FASE 2: Cálculo de Valor Teórico Esperado**

#### 2.1 Depreciación por Antigüedad

Fórmula basada en curva exponencial (más realista que lineal):

```typescript
function calcularDepreciacionAnual(precioNuevo: number, añoMatriculacion: number, segmento: string): number {
  const añoActual = new Date().getFullYear()
  const antigüedad = añoActual - añoMatriculacion
  
  if (antigüedad <= 0) return precioNuevo
  
  const config = SEGMENTOS[segmento]
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
```

**Ejemplo**:
- BMW X5 2022 (premium_luxury), precio nuevo: 95.000€
- Año 0: 100% = 95.000€
- Año 1: 85% = 80.750€ (15% depreciación)
- Año 2: 74.8% = 71.060€ (12% adicional)
- Año 3: 67.3% = 63.935€ (10% adicional)

---

#### 2.2 Ajuste por Kilometraje

El kilometraje afecta el valor de forma **no lineal** (más impacto en los primeros km):

```typescript
function calcularAjusteKilometraje(km: number, segmento: string): number {
  const config = SEGMENTOS[segmento]
  const valorKmBase = config.valor_km
  
  // Curva de depreciación por km (más impacto en primeros 50k km)
  let factorKm = 1.0
  
  if (km <= 50000) {
    // Primeros 50k: depreciación estándar
    factorKm = 1 - (km * valorKmBase / 10000)  // Cada 10k km = -2% (premium)
  } else if (km <= 100000) {
    // 50k-100k: depreciación moderada
    const kmExtra = km - 50000
    factorKm = 0.90 - (kmExtra * valorKmBase * 0.8 / 10000)
  } else {
    // >100k: depreciación acelerada
    const kmExtra = km - 100000
    factorKm = 0.82 - (kmExtra * valorKmBase * 1.2 / 10000)
  }
  
  // Mínimo: 60% del valor por km
  return Math.max(factorKm, 0.60)
}
```

**Lógica**: 
- Primeros 50k km: depreciación estándar
- 50k-100k: depreciación moderada (ya está usado)
- >100k: depreciación acelerada (alto desgaste esperado)

---

#### 2.3 Valor Teórico Esperado (VTE)

Combinando antigüedad + kilometraje:

```typescript
function calcularValorTeoricoEsperado(
  precioNuevo: number,
  añoMatriculacion: number,
  km: number,
  modelo: string
): {
  valorTeorico: number,
  depreciacionAntigüedad: number,
  depreciacionKm: number,
  factorKm: number,
  segmento: string
} {
  const segmento = identificarSegmento(modelo)
  const valorPorAntigüedad = calcularDepreciacionAnual(precioNuevo, añoMatriculacion, segmento)
  const factorKm = calcularAjusteKilometraje(km, segmento)
  
  const valorTeorico = valorPorAntigüedad * factorKm
  
  return {
    valorTeorico: Math.max(valorTeorico, precioNuevo * SEGMENTOS[segmento].valor_residual_min),
    depreciacionAntigüedad: precioNuevo - valorPorAntigüedad,
    depreciacionKm: valorPorAntigüedad * (1 - factorKm),
    factorKm,
    segmento
  }
}
```

---

### **FASE 3: Análisis de Mercado Real**

#### 3.1 Búsqueda de Competidores Comparables

Para cada vehículo, buscar en `comparador_scraper`:

```typescript
function buscarCompetidoresComparables(
  modelo: string,
  añoMatriculacion: number,
  km: number,
  toleranciaAño: number = 2,
  toleranciaKm: number = 30000
): Competidor[] {
  // Normalizar modelo (extraer base: "Serie 3", "X5", "MINI Cooper")
  const modeloBase = extraerModeloBase(modelo)
  
  // Buscar en comparador_scraper
  return competidores.filter(c => {
    const modeloCompBase = extraerModeloBase(c.modelo)
    const añoComp = parseInt(c.año)
    const kmComp = parseKm(c.km)
    
    // Matching de modelo base
    if (modeloCompBase !== modeloBase) return false
    
    // Tolerancia de año (±2 años)
    if (Math.abs(añoComp - añoMatriculacion) > toleranciaAño) return false
    
    // Tolerancia de km (±30k km)
    if (kmComp && Math.abs(kmComp - km) > toleranciaKm) return false
    
    return true
  })
}
```

---

#### 3.2 Cálculo de Métricas de Mercado

```typescript
function calcularMetricasMercado(competidores: Competidor[]): MetricasMercado {
  const precios = competidores
    .map(c => parsePrice(c.precio))
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
```

---

### **FASE 4: Indicador de Competitividad**

#### 4.1 Score de Competitividad (0-100)

Combinando valor teórico y mercado real:

```typescript
function calcularIndicadorCompetitividad(
  precioActual: number,
  valorTeorico: number,
  metricasMercado: MetricasMercado
): IndicadorCompetitividad {
  
  // Si no hay datos de mercado, usar solo valor teórico
  if (!metricasMercado.precioMedio) {
    const ratioTeorico = precioActual / valorTeorico
    return {
      score: ratioTeorico <= 1.0 ? 100 : Math.max(0, 100 - (ratioTeorico - 1) * 50),
      nivel: ratioTeorico <= 1.0 ? 'excelente' : ratioTeorico <= 1.1 ? 'bueno' : 'alto',
      recomendacion: ratioTeorico <= 1.0 
        ? 'Precio competitivo según depreciación teórica'
        : `Considera bajar ${((ratioTeorico - 1) * 100).toFixed(1)}% para alinearte con valor teórico`
    }
  }
  
  // Calcular posición relativa en el mercado
  const posicionPercentil = calcularPercentil(precioActual, metricasMercado)
  
  // Comparar con valor teórico
  const ratioTeorico = precioActual / valorTeorico
  const ratioMercado = precioActual / metricasMercado.precioMedio
  
  // Score combinado (60% mercado, 40% teórico)
  const scoreMercado = (1 - posicionPercentil / 100) * 100  // Percentil bajo = mejor
  const scoreTeorico = ratioTeorico <= 1.0 ? 100 : Math.max(0, 100 - (ratioTeorico - 1) * 100)
  
  const scoreFinal = (scoreMercado * 0.6) + (scoreTeorico * 0.4)
  
  // Determinar nivel
  let nivel: 'excelente' | 'bueno' | 'justo' | 'alto' | 'muy_alto'
  if (scoreFinal >= 80) nivel = 'excelente'
  else if (scoreFinal >= 60) nivel = 'bueno'
  else if (scoreFinal >= 40) nivel = 'justo'
  else if (scoreFinal >= 20) nivel = 'alto'
  else nivel = 'muy_alto'
  
  // Recomendación
  const recomendacion = generarRecomendacion(
    precioActual,
    valorTeorico,
    metricasMercado,
    scoreFinal,
    nivel
  )
  
  return {
    score: Math.round(scoreFinal),
    nivel,
    recomendacion,
    precioRecomendado: calcularPrecioRecomendado(metricasMercado, valorTeorico),
    diferenciaMercado: precioActual - metricasMercado.precioMedio,
    diferenciaTeorico: precioActual - valorTeorico,
    posicionPercentil
  }
}
```

---

#### 4.2 Cálculo de Percentil en el Mercado

```typescript
function calcularPercentil(precio: number, metricas: MetricasMercado): number {
  // Usar percentil 25 y 75 para calcular posición
  if (!metricas.percentil25 || !metricas.percentil75) return 50
  
  if (precio <= metricas.percentil25) {
    // Por debajo del percentil 25: calcular posición exacta
    const rango = metricas.percentil25 - metricas.precioMinimo
    if (rango === 0) return 0
    return ((precio - metricas.precioMinimo) / rango) * 25
  } else if (precio <= metricas.percentil75) {
    // Entre percentil 25 y 75: interpolación lineal
    const rango = metricas.percentil75 - metricas.percentil25
    if (rango === 0) return 50
    return 25 + ((precio - metricas.percentil25) / rango) * 50
  } else {
    // Por encima del percentil 75
    const rango = metricas.precioMaximo - metricas.percentil75
    if (rango === 0) return 100
    return 75 + ((precio - metricas.percentil75) / rango) * 25
  }
}
```

---

#### 4.3 Precio Recomendado

```typescript
function calcularPrecioRecomendado(
  metricas: MetricasMercado,
  valorTeorico: number
): number {
  if (!metricas.precioMedio) return valorTeorico
  
  // Estrategia: estar en percentil 25-30 del mercado (competitivo pero no regalado)
  const precioObjetivo = metricas.percentil25 
    ? metricas.percentil25 * 1.02  // 2% por encima del percentil 25
    : metricas.precioMedio * 0.95  // 5% por debajo de la media
  
  // No bajar del valor teórico mínimo
  return Math.max(precioObjetivo, valorTeorico)
}
```

---

### **FASE 5: Generación de Recomendaciones**

```typescript
function generarRecomendacion(
  precioActual: number,
  valorTeorico: number,
  metricas: MetricasMercado,
  score: number,
  nivel: string
): string {
  const diferenciaMercado = precioActual - (metricas.precioMedio || 0)
  const diferenciaTeorico = precioActual - valorTeorico
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
    return `⚠️ Precio en rango justo. Para ser más competitivo, considera bajar a ${metricas.percentil25?.toLocaleString('es-ES')}€ (${diferenciaPorcentaje > 0 ? diferenciaPorcentaje.toFixed(1) : Math.abs(diferenciaPorcentaje).toFixed(1)}% ${diferenciaPorcentaje > 0 ? 'menos' : 'más'}).`
  }
  
  if (nivel === 'alto') {
    const precioRecomendado = metricas.percentil25 || metricas.precioMedio! * 0.90
    return `🔴 Precio elevado. Recomendado: ${precioRecomendado.toLocaleString('es-ES')}€ (${diferenciaPorcentaje.toFixed(1)}% menos).`
  }
  
  // muy_alto
  const precioRecomendado = metricas.precioMinimo || metricas.precioMedio! * 0.85
  return `🚨 Precio muy elevado. Necesitas bajar significativamente a ${precioRecomendado.toLocaleString('es-ES')}€ (${diferenciaPorcentaje.toFixed(1)}% menos) para ser competitivo.`
}
```

---

## 📊 ESTRUCTURA DEL INDICADOR FINAL

```typescript
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
  posicionPercentil: number  // 0-100 (0 = más barato, 100 = más caro)
  
  // Recomendaciones
  precioRecomendado: number
  diferenciaMercado: number
  diferenciaTeorico: number
  recomendacion: string
  
  // Metadatos
  confianza: 'alta' | 'media' | 'baja'  // Basado en cantidad de competidores
  fechaCalculo: string
}
```

---

## 🎯 VENTAJAS DE ESTA METODOLOGÍA

1. **Basada en datos reales**: Usa solo los 4 datos disponibles
2. **Segmentación inteligente**: Diferentes curvas según gama del vehículo
3. **Depreciación realista**: Curva exponencial, no lineal
4. **Ajuste por km no lineal**: Más impacto en primeros km
5. **Combinación teórico + mercado**: 60% mercado, 40% teórico
6. **Percentiles robustos**: No solo promedio, también percentiles 25/75
7. **Recomendaciones accionables**: Precio específico recomendado

---

## 🔄 FLUJO DE CÁLCULO

```
1. Obtener datos del vehículo
   ↓
2. Identificar segmento (premium_luxury/medium/entry)
   ↓
3. Calcular valor teórico esperado
   ├─ Depreciación por antigüedad
   └─ Ajuste por kilometraje
   ↓
4. Buscar competidores comparables
   ├─ Mismo modelo base
   ├─ ±2 años
   └─ ±30k km
   ↓
5. Calcular métricas de mercado
   ├─ Media, mediana, min, max
   ├─ Percentiles 25, 75
   └─ Desviación estándar
   ↓
6. Calcular indicador de competitividad
   ├─ Score 0-100
   ├─ Nivel (excelente/bueno/justo/alto/muy_alto)
   └─ Posición percentil
   ↓
7. Generar recomendación
   ├─ Precio recomendado
   └─ Mensaje explicativo
```

---

## 📈 EJEMPLO PRÁCTICO

**Vehículo**: BMW X5 2022, 95.000€ nuevo, 45.000 km, precio actual: 69.990€

1. **Segmento**: `premium_luxury`
2. **Valor teórico**:
   - Por antigüedad (2 años): 95.000 × 0.748 = 71.060€
   - Factor km (45k): 0.91
   - Valor teórico: 71.060 × 0.91 = **64.665€**
3. **Competidores**: 12 encontrados
4. **Métricas mercado**:
   - Media: 68.500€
   - Percentil 25: 65.000€
   - Percentil 75: 72.000€
5. **Indicador**:
   - Score: 45 (justo)
   - Posición: 60% (más caro que el 60% del mercado)
   - Precio recomendado: **66.300€** (percentil 25 + 2%)
6. **Recomendación**: "⚠️ Precio en rango justo. Para ser más competitivo, considera bajar a 66.300€ (4.8% menos)."

---

## 🚀 IMPLEMENTACIÓN

Esta metodología puede implementarse como:
- **Función SQL** en Supabase (trigger o función)
- **API endpoint** en Next.js
- **Cálculo en tiempo real** en el frontend

¿Quieres que implemente alguna parte específica?

