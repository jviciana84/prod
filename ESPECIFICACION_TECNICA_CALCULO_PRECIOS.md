# 📋 ESPECIFICACIÓN TÉCNICA: Cálculo de Precio Competitivo

## 🎯 OBJETIVO

Calcular un **Indicador de Precio Competitivo** para vehículos BMW Premium Selection usando únicamente estos datos:

- `precio_nuevo_original`: Precio cuando el vehículo era 0km
- `fecha_matriculacion`: Año de primera matriculación
- `km`: Kilometraje actual
- `modelo`: Identificación del modelo (BMW X5, Serie 3, MINI, etc.)
- `precio_actual`: Precio al que se ofrece actualmente

---

## 📊 METODOLOGÍA COMPLETA

### **FASE 1: Segmentación del Vehículo**

#### 1.1 Identificación de Segmento

```typescript
type SegmentoBase = 'premium_luxury' | 'premium_medium' | 'premium_entry'

const SEGMENTOS = {
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
```

**Lógica de identificación:**
- Si modelo incluye: `x5`, `x6`, `x7`, `serie 5`, `serie 6`, `serie 7`, `serie 8`, `i7`, `ix` → `premium_luxury`
- Si modelo incluye: `x3`, `x4`, `serie 3`, `serie 4`, `i4`, `countryman`, `clubman` → `premium_medium`
- Resto → `premium_entry`

---

### **FASE 2: Cálculo del Valor Teórico Esperado (VTE)**

#### 2.1 Depreciación por Antigüedad

**Fórmula:**
```
factorResidual = 1.0

Para cada año desde matriculación hasta actual:
  factorResidual *= (1 - tasa_depreciacion_año)

Si años > 5:
  factorResidual *= (1 - ultima_tasa) ^ años_extra

valorPorAntigüedad = precioNuevo × factorResidual
valorPorAntigüedad = MAX(valorPorAntigüedad, precioNuevo × valor_residual_min)
```

**Ejemplo BMW X5 2022 (premium_luxury):**
- Precio nuevo: 95.000€
- Año actual: 2025
- Antigüedad: 3 años
- Factor año 1: 1.0 × (1 - 0.15) = 0.85
- Factor año 2: 0.85 × (1 - 0.12) = 0.748
- Factor año 3: 0.748 × (1 - 0.10) = 0.673
- Valor por antigüedad: 95.000 × 0.673 = **63.935€**
- Mínimo: 95.000 × 0.35 = 33.250€
- **Resultado: 63.935€** (mayor que mínimo)

---

#### 2.2 Ajuste por Kilometraje (Contextualizado)

**Paso 1: Factor KM Base (según tramos)**

```typescript
if (km <= 50000) {
  factorKmBase = 1 - (km × valor_km / 10000)
} else if (km <= 100000) {
  factorKmBase = 0.90 - ((km - 50000) × valor_km × 0.8 / 10000)
} else {
  factorKmBase = 0.82 - ((km - 100000) × valor_km × 1.2 / 10000)
}

factorKmBase = MAX(factorKmBase, 0.60)  // Mínimo 60%
```

**Paso 2: Contextualización por Uso Esperado**

```typescript
kmEsperadosAnual = 12000  // km/año estándar
kmEsperados = kmEsperadosAnual × MAX(antigüedad, 1)
ratioUso = km / kmEsperados

if (ratioUso <= 0.75) {
  factorUso = 1.0 + (0.75 - ratioUso) × 0.1  // Bonificación hasta +7.5%
} else if (ratioUso <= 1.25) {
  factorUso = 1.0  // Uso normal
} else {
  factorUso = 1.0 - MIN((ratioUso - 1.25) × 0.15, 0.25)  // Penalización hasta -25%
}

factorKmTotal = factorKmBase × factorUso
factorKmTotal = CLAMP(factorKmTotal, 0.60, 1.10)  // Entre 60% y 110%
```

**Ejemplo BMW X5 2022, 45.000 km:**
- Antigüedad: 3 años
- Segmento: premium_luxury (valor_km = 0.20)
- **Paso 1 - Factor KM Base:**
  - km = 45.000 (≤ 50.000)
  - factorKmBase = 1 - (45.000 × 0.20 / 10.000) = 1 - 0.90 = **0.10** ❌
  - **Corrección:** La fórmula debe ser: `1 - (km / 10000) × (valor_km × 10)`
  - factorKmBase = 1 - (45.000 / 10.000) × (0.20 × 10) = 1 - 4.5 × 2 = 1 - 9 = -8 ❌
  
  **Fórmula corregida:**
  - factorKmBase = 1 - (45.000 / 10.000) × 0.02 = 1 - 0.09 = **0.91**
  
- **Paso 2 - Contextualización:**
  - kmEsperados = 12.000 × 3 = 36.000 km
  - ratioUso = 45.000 / 36.000 = 1.25
  - factorUso = 1.0 (uso normal)
  
- **Resultado:**
  - factorKmTotal = 0.91 × 1.0 = **0.91**

---

#### 2.3 Valor Teórico Esperado Final

```typescript
valorTeoricoBruto = valorPorAntigüedad × factorKmTotal
valorTeoricoMinimo = precioNuevo × valor_residual_min
valorTeorico = MAX(valorTeoricoBruto, valorTeoricoMinimo)
```

**Ejemplo completo:**
- Valor por antigüedad: 63.935€
- Factor KM total: 0.91
- Valor teórico bruto: 63.935 × 0.91 = **58.181€**
- Valor mínimo: 95.000 × 0.35 = 33.250€
- **Valor Teórico Esperado: 58.181€**

---

### **FASE 3: Búsqueda de Competidores Comparables**

#### 3.1 Criterios de Búsqueda

```typescript
competidoresComparables = competidores.filter(c => {
  // 1. Mismo modelo base
  modeloBase(c.modelo) === modeloBase(nuestro.modelo)
  
  // 2. Año: ±2 años
  Math.abs(c.año - nuestro.año) <= 2
  
  // 3. Kilometraje: ±30.000 km
  Math.abs(c.km - nuestro.km) <= 30000
  
  // 4. Excluir nuestros concesionarios
  !c.concesionario.includes('quadis') &&
  !c.concesionario.includes('motor munich') &&
  !c.concesionario.includes('munich') &&
  !c.concesionario.includes('duc')
})
```

#### 3.2 Segmentación por Equipamiento (Opcional)

Si hay `precio_nuevo_original` disponible:

```typescript
// Filtrar por equipamiento similar (±10k€ precio nuevo)
if (precioNuevoNuestro) {
  competidoresComparables = competidoresComparables.filter(c => {
    precioNuevoComp = c.precio_nuevo_original || parsePrice(c.precio_nuevo)
    if (!precioNuevoComp) return true
    return Math.abs(precioNuevoComp - precioNuevoNuestro) <= 10000
  })
  
  // Si no hay suficientes (mínimo 3), usar todos
  if (competidoresComparables.length < 3) {
    competidoresComparables = competidoresSinQuadis
  }
}
```

**Caso especial: Gama Alta + Equipamiento Básico**

```typescript
if (gama === 'alta' && equipamiento === 'basico' && nuestroPrecio) {
  // Filtrar también por precio de venta (±5k€)
  competidoresComparables = competidoresComparables.filter(c => {
    precioVentaComp = parsePrice(c.precio)
    if (!precioVentaComp) return true
    return precioVentaComp <= (nuestroPrecio + 5000) || 
           Math.abs(precioVentaComp - nuestroPrecio) <= 5000
  })
}
```

---

### **FASE 4: Métricas de Mercado**

#### 4.1 Cálculo de Estadísticas

```typescript
precios = competidoresComparables
  .map(c => parsePrice(c.precio))
  .filter(p => p !== null)
  .sort((a, b) => a - b)

if (precios.length === 0) {
  return todas_null
}

count = precios.length
precioMedio = SUM(precios) / count
precioMediano = precios[Math.floor(count / 2)]
precioMinimo = precios[0]
precioMaximo = precios[count - 1]
percentil25 = precios[Math.floor(count × 0.25)]
percentil75 = precios[Math.floor(count × 0.75)]

varianza = SUM((precio - precioMedio)²) / count
desviacionEstandar = SQRT(varianza)
```

#### 4.2 Selección del Precio Base de Referencia

```typescript
if (gama === 'alta' && equipamiento === 'basico') {
  // Usar percentil 25 (más bajo) para evitar inflación por coches premium
  precioBaseReferencia = percentil25 || precioMedio
  metodoPrecioBase = 'percentil25'
} else {
  // Usar promedio para el resto
  precioBaseReferencia = precioMedio
  metodoPrecioBase = 'promedio'
}
```

---

### **FASE 5: Indicador de Competitividad**

#### 5.1 Cálculo de Percentil de Posición

```typescript
function calcularPercentil(precio: number, metricas: MetricasMercado): number {
  if (precio <= percentil25) {
    rango = percentil25 - precioMinimo
    if (rango === 0) return 0
    return ((precio - precioMinimo) / rango) × 25
  } else if (precio <= percentil75) {
    rango = percentil75 - percentil25
    if (rango === 0) return 50
    return 25 + ((precio - percentil25) / rango) × 50
  } else {
    rango = precioMaximo - percentil75
    if (rango === 0) return 100
    return 75 + ((precio - percentil75) / rango) × 25
  }
}
```

**Interpretación:**
- 0-25: Más barato que el 75% del mercado (excelente)
- 25-50: En el cuartil inferior (bueno)
- 50-75: En el cuartil superior (justo)
- 75-100: Más caro que el 75% del mercado (alto)

---

#### 5.2 Nivel de Confianza

```typescript
function calcularNivelConfianza(metricas: MetricasMercado): 'alta' | 'media' | 'baja' {
  score = 0
  
  // Cantidad de competidores
  if (count >= 15) score += 40
  else if (count >= 8) score += 25
  else if (count >= 4) score += 15
  else score += 5
  
  // Consistencia (coeficiente de variación)
  cv = (desviacionEstandar / precioMedio) × 100
  if (cv < 10) score += 30
  else if (cv < 20) score += 20
  else score += 10
  
  if (score >= 60) return 'alta'
  if (score >= 40) return 'media'
  return 'baja'
}
```

---

#### 5.3 Score de Competitividad (0-100)

**Caso 1: Sin datos de mercado**

```typescript
ratioTeorico = precioActual / valorTeorico
scoreTeorico = ratioTeorico <= 1.0 
  ? 100 
  : MAX(0, 100 - (ratioTeorico - 1) × 50)

scoreFinal = scoreTeorico
```

**Caso 2: Con datos de mercado**

```typescript
posicionPercentil = calcularPercentil(precioActual, metricas)
ratioTeorico = precioActual / valorTeorico

scoreTeorico = ratioTeorico <= 1.0 
  ? 100 
  : MAX(0, 100 - (ratioTeorico - 1) × 100)

scoreMercado = 100 - posicionPercentil  // 0 (más caro) → 0 puntos; 100 (más barato) → 100 puntos

// Ponderación según confianza
if (confianza === 'alta') {
  pesoMercado = 0.7
  pesoTeorico = 0.3
} else if (confianza === 'baja') {
  pesoMercado = 0.4
  pesoTeorico = 0.6
} else {
  pesoMercado = 0.6
  pesoTeorico = 0.4
}

scoreFinal = scoreMercado × pesoMercado + scoreTeorico × pesoTeorico
```

**Niveles:**
- `excelente`: score ≥ 80
- `bueno`: score ≥ 60
- `justo`: score ≥ 40
- `alto`: score ≥ 20
- `muy_alto`: score < 20

---

#### 5.4 Precio Recomendado

```typescript
function calcularPrecioRecomendado(metricas: MetricasMercado, valorTeorico: number): number {
  if (!metricas.precioMedio) return valorTeorico
  
  precioObjetivo = metricas.percentil25 
    ? metricas.percentil25 × 1.02  // 2% por encima del P25
    : metricas.precioMedio × 0.95   // 5% por debajo de la media
  
  // No bajar del valor teórico mínimo
  return MAX(precioObjetivo, valorTeorico)
}
```

---

### **FASE 6: Ajustes Especiales**

#### 6.1 Competidores Estancados (Descuento Mínimo)

```typescript
competidoresEstancados = competidoresComparables.filter(c => {
  return c.dias_publicado > 60 && c.numero_bajadas_precio > 2
})

if (competidoresEstancados.length > 0 && precioNuevoNuestro) {
  descuentosRechazados = competidoresEstancados.map(c => {
    precioComp = parsePrice(c.precio)
    precioNuevoComp = c.precio_nuevo_original || parsePrice(c.precio_nuevo)
    return ((precioNuevoComp - precioComp) / precioNuevoComp) × 100
  })
  
  maxDescuentoRechazado = MAX(descuentosRechazados)
  descuentoMinimoRequerido = maxDescuentoRechazado + 1  // +1% adicional
  
  // Ajustar precio recomendado si necesario
  precioMaximoPermitido = precioNuevoNuestro × (1 - descuentoMinimoRequerido / 100)
  if (precioRecomendado > precioMaximoPermitido) {
    precioRecomendado = precioMaximoPermitido
  }
}
```

**Lógica:** Si un competidor lleva >60 días con >2 bajadas y sigue sin venderse, su descuento actual NO funcionó. Necesitamos un descuento mayor.

---

#### 6.2 Días en Stock (Urgencia)

```typescript
if (diasEnStock > 60 && nivel !== 'competitivo') {
  descuentoUrgente = precioRecomendado × 0.95  // 5% adicional
  precioRecomendado = descuentoUrgente
  recomendacion += `. ⚠️ URGENTE: Lleva ${diasEnStock} días sin vender.`
}
```

---

## 📊 ESTRUCTURA DE DATOS DE SALIDA

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
  segmento: SegmentoBase
  factorKm: number
  ratioUso: number
  
  // Análisis de mercado
  competidoresEncontrados: number
  precioMedioMercado: number | null
  precioMedianoMercado: number | null
  precioMinimoMercado: number | null
  precioMaximoMercado: number | null
  percentil25Mercado: number | null
  percentil75Mercado: number | null
  metodoPrecioBase: 'percentil25' | 'promedio' | 'sin_datos'
  
  // Indicador de competitividad
  score: number        // 0-100
  nivel: 'excelente' | 'bueno' | 'justo' | 'alto' | 'muy_alto'
  posicionPercentil: number // 0-100
  
  // Recomendaciones
  precioRecomendado: number
  diferenciaMercado: number | null
  diferenciaTeorico: number
  recomendacion: string
  
  // Metadatos
  confianza: 'alta' | 'media' | 'baja'
  fechaCalculo: string
}
```

---

## 🔄 FLUJO COMPLETO DE CÁLCULO

```
1. Obtener datos del vehículo
   ├─ precioNuevo, añoMatriculacion, km, modelo, precioActual
   ↓
2. Identificar segmento (premium_luxury/medium/entry)
   ↓
3. Calcular valor teórico esperado
   ├─ Depreciación por antigüedad (curva anual)
   ├─ Factor KM base (tramos: 0-50k, 50-100k, >100k)
   ├─ Contextualización por uso esperado (ratioUso)
   └─ Valor teórico = valorAntigüedad × factorKmTotal
   ↓
4. Buscar competidores comparables
   ├─ Mismo modelo base
   ├─ ±2 años
   ├─ ±30k km
   ├─ Excluir Quadis/Motor Munich
   └─ (Opcional) Filtrar por equipamiento similar
   ↓
5. Calcular métricas de mercado
   ├─ Media, mediana, min, max
   ├─ Percentiles 25, 75
   ├─ Desviación estándar
   └─ Seleccionar precio base (percentil25 si gama alta+básico, sino promedio)
   ↓
6. Calcular nivel de confianza
   ├─ Cantidad de competidores
   └─ Consistencia (coeficiente de variación)
   ↓
7. Calcular indicador de competitividad
   ├─ Percentil de posición
   ├─ Score teórico (ratio vs VTE)
   ├─ Score mercado (100 - percentil)
   ├─ Score final (ponderado según confianza)
   └─ Nivel (excelente/bueno/justo/alto/muy_alto)
   ↓
8. Calcular precio recomendado
   ├─ Base: percentil25 × 1.02 o promedio × 0.95
   ├─ Ajuste por competidores estancados (si aplica)
   ├─ Ajuste por días en stock (si >60 días)
   └─ No bajar del valor teórico mínimo
   ↓
9. Generar recomendación textual
   └─ Mensaje explicativo según nivel y diferencias
```

---

## ✅ VALIDACIONES Y LÍMITES

1. **Valor teórico mínimo:** Nunca menos del `valor_residual_min` del segmento
2. **Factor KM:** Clamp entre 0.60 y 1.10
3. **Competidores mínimos:** Si hay <3 comparables, usar todos sin filtrar equipamiento
4. **Confianza baja:** Aumentar peso del modelo teórico (60% vs 40% mercado)
5. **Precio recomendado:** No puede ser menor al valor teórico mínimo

---

## 📝 NOTAS DE IMPLEMENTACIÓN

1. **Fórmula KM corregida:** El cálculo del factor KM base debe usar la fórmula correcta:
   ```typescript
   // INCORRECTO (puede dar negativos):
   factorKm = 1 - (km * valor_km / 10000)
   
   // CORRECTO:
   factorKm = 1 - ((km / 10000) * (valor_km * 10 / 100))
   // O más simple:
   factorKm = 1 - (km * valor_km / 1000)  // Cada 10k km = -2% para premium_luxury
   ```

2. **Matching de modelos:** Mantener la lógica actual que incluye CV y variantes para mayor precisión.

3. **Gama alta + básico:** Siempre usar percentil 25 como referencia, no el promedio.

4. **Competidores estancados:** Son indicadores críticos de precio mínimo requerido, no excluirlos del análisis.

---

## 🎯 EJEMPLO COMPLETO

**Vehículo:** BMW X5 2022, 95.000€ nuevo, 45.000 km, precio actual: 69.990€

**Paso 1 - Segmentación:**
- Segmento: `premium_luxury`
- Config: depreciación [0.15, 0.12, 0.10, 0.08, 0.08], valor_km = 0.20, residual_min = 0.35

**Paso 2 - Valor Teórico:**
- Antigüedad: 3 años
- Factor antigüedad: 0.673 → Valor: 63.935€
- Factor KM base: 0.91 (45k km en tramo 0-50k)
- Ratio uso: 45.000 / 36.000 = 1.25 → Factor uso: 1.0
- Factor KM total: 0.91
- **Valor teórico: 63.935 × 0.91 = 58.181€**

**Paso 3 - Competidores:**
- Encontrados: 12 comparables
- Precio medio: 68.500€
- Percentil 25: 65.000€
- Percentil 75: 72.000€

**Paso 4 - Indicador:**
- Posición percentil: 60 (más caro que el 60% del mercado)
- Score mercado: 100 - 60 = 40
- Ratio teórico: 69.990 / 58.181 = 1.20
- Score teórico: 100 - (1.20 - 1) × 100 = 80
- Confianza: alta (12 competidores, CV < 10%)
- Score final: 40 × 0.7 + 80 × 0.3 = 28 + 24 = **52**
- Nivel: `justo`

**Paso 5 - Precio Recomendado:**
- Base: 65.000 × 1.02 = 66.300€
- Valor teórico: 58.181€
- **Precio recomendado: 66.300€** (mayor que teórico)

**Resultado Final:**
- Score: 52
- Nivel: `justo`
- Precio recomendado: 66.300€
- Recomendación: "⚠️ Precio en rango justo. Para ser más competitivo, considera ajustar hacia unos 66.300€ para acercarte al percentil 25 del mercado."

