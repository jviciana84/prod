# 🔢 FÓRMULA MATEMÁTICA EXACTA - Cálculo del Precio Objetivo

## 🎯 PROCESO PASO A PASO

### **PASO 1: Identificar el Vehículo**

```javascript
// Entrada
modelo = "X5"
precioNuevo = 86.799€
precioActual = 69.990€
km = 21.068
año = 2023
```

---

### **PASO 2: Clasificar Automáticamente**

```javascript
// 2.1 Identificar GAMA
if (modelo.includes('X5' | 'X6' | 'Serie 5+')) {
  gama = 'ALTA'
} else if (modelo.includes('X3' | 'Serie 3')) {
  gama = 'MEDIA'
} else {
  gama = 'BASICA'
}

// Para X5:
gama = 'ALTA' ✓


// 2.2 Identificar EQUIPAMIENTO
precioBase[gama='ALTA'] = 80.000€

if (precioNuevo < precioBase + 5.000€) {
  equipamiento = 'BASICO'
} else if (precioNuevo < precioBase + 15.000€) {
  equipamiento = 'MEDIO'
} else {
  equipamiento = 'PREMIUM'
}

// Para 86.799€:
86.799€ < 80.000€ + 5.000€ (85.000€) = NO
86.799€ < 80.000€ + 15.000€ (95.000€) = SÍ
equipamiento = 'BASICO' ✓
```

---

### **PASO 3: Buscar Competencia FILTRADA**

```javascript
// 3.1 Buscar en base de datos
competidores = buscar({
  modelo: 'X5 xDrive30d',
  años: 2023 ± 2 = [2021, 2022, 2023, 2024, 2025],
  estado: ['activo', 'nuevo', 'precio_bajado']
})
// Resultado: 48 competidores


// 3.2 Excluir nosotros mismos
competidores = competidores.filter(c => 
  !c.concesionario.includes('Quadis') &&
  !c.concesionario.includes('Motor Munich') &&
  !c.concesionario.includes('munich')
)
// Resultado: 47 competidores


// 3.3 Segmentar por equipamiento SIMILAR (±10k€)
margen = 10.000€
competidoresComparables = competidores.filter(c =>
  Math.abs(c.precioNuevo - 86.799€) <= 10.000€
)
// Solo coches con precio nuevo entre 76.799€ y 96.799€

// Para X5 9853MKL:
Incluye:
  ✓ 88.119€ (Movilnorte - básico)
  ✓ 86.984€ (Movitransa - básico)
  ✓ 92.670€ (Murcia - medio)
  ✓ 95.455€ (Hispamovil - medio)
  
Excluye:
  ✗ 109.590€ (Murcia - premium)
  ✗ 103.105€ (Móvil - premium)
  ✗ 109.135€ (Bernesga - premium)

// Si hay <3 comparables, usa TODOS
if (competidoresComparables.length < 3) {
  competidoresComparables = competidores // Todos
}
```

---

### **PASO 4: Calcular Precio Medio de Competencia**

```javascript
// 4.1 Extraer precios
precios = competidoresComparables.map(c => c.precio)
// Ejemplo: [56.995€, 63.900€, 65.500€, 69.900€, ...]

// 4.2 Calcular media
precioMedioCompetencia = suma(precios) / cantidad(precios)

// Para X5 con equipamiento similar (76k-96k nuevo):
precioMedioCompetencia ≈ 65.000€ - 68.000€
```

---

### **PASO 5: Calcular KM Medio de Competencia**

```javascript
kms = competidoresComparables.map(c => c.km)
// Ejemplo: [85.989, 45.863, 28.850, 53.471, ...]

kmMedioCompetencia = suma(kms) / cantidad(kms)
// Ejemplo: ≈ 45.000 km
```

---

### **PASO 6: Ajustar Precio por Diferencia de KM (según GAMA)**

```javascript
// 6.1 Calcular diferencia de KM
diferenciaKm = tuKm - kmMedioCompetencia
// = 21.068 - 45.000 = -23.932 km (TIENES MENOS)

// 6.2 Obtener valor de KM según GAMA
valorKmPorGama = {
  'BASICA': 0.10€/km,
  'MEDIA': 0.15€/km,
  'ALTA': 0.20€/km
}

valorKm = valorKmPorGama['ALTA'] = 0.20€/km

// 6.3 Calcular ajuste
ajustePorKm = diferenciaKm × valorKm
// = -23.932 km × 0.20€/km
// = -4.786€

// Interpretación:
// Negativo = tienes MENOS km = precio SUBE
// Por tanto: -(-4.786€) = +4.786€ a tu favor
```

---

### **PASO 7: Calcular Precio Recomendado BASE**

```javascript
precioRecomendado = precioMedioCompetencia - ajustePorKm

// Con valores ejemplo:
precioRecomendado = 66.000€ - (-4.786€)
                  = 66.000€ + 4.786€
                  = 70.786€

// ❌ PROBLEMA: Esto da MAYOR que tu precio actual!
// Indica que con tu KM bajo, podrías SUBIR precio
```

---

### **PASO 8: Aplicar DESCUENTO MÍNIMO (si hay estancados)**

```javascript
// 8.1 Detectar competidores estancados
competidoresEstancados = competencia.filter(c =>
  c.dias_publicado > 60 && c.numero_bajadas_precio > 2
)

// 8.2 Calcular sus descuentos
if (competidoresEstancados.length > 0) {
  descuentosRechazados = competidoresEstancados.map(c =>
    ((c.precioNuevo - c.precio) / c.precioNuevo) * 100
  )
  
  maxDescuentoRechazado = Math.max(...descuentosRechazados)
  // Ejemplo: 28%
  
  descuentoMinimoRequerido = maxDescuentoRechazado + 5%
  // = 28% + 5% = 33%
  
  // 8.3 Calcular precio máximo permitido
  precioMaximoPermitido = precioNuevo × (1 - descuentoMinimo/100)
  // = 86.799€ × (1 - 0.33)
  // = 86.799€ × 0.67
  // = 58.155€
  
  // 8.4 Ajustar si recomendado es mayor
  if (precioRecomendado > precioMaximoPermitido) {
    precioRecomendado = precioMaximoPermitido
  }
}
```

---

### **PASO 9: Aplicar Límites por Gama + Equipamiento**

```javascript
// 9.1 Calcular límite inferior según perfil
if (gama === 'ALTA' && equipamiento === 'BASICO') {
  limiteInferior = precioActual × 0.65  // Permitir hasta -35%
} else if (gama === 'MEDIA' && equipamiento === 'BASICO') {
  limiteInferior = precioActual × 0.75  // Permitir hasta -25%
} else {
  limiteInferior = precioActual × 0.80  // Permitir hasta -20%
}

// Para X5 ALTA + BASICO:
limiteInferior = 69.990€ × 0.65 = 45.494€


// 9.2 Aplicar límite inferior
if (precioRecomendado < limiteInferior) {
  precioRecomendado = limiteInferior
}

// 9.3 Aplicar límite superior
if (precioRecomendado > precioMedioCompetencia × 1.1) {
  precioRecomendado = precioMedioCompetencia × 1.1
}
```

---

### **PASO 10: Calcular Descuento Resultante**

```javascript
descuentoFinal = ((precioNuevo - precioRecomendado) / precioNuevo) × 100

// Ejemplo con precio recomendado 58.155€:
descuentoFinal = ((86.799€ - 58.155€) / 86.799€) × 100
               = (28.644€ / 86.799€) × 100
               = 33%
```

---

## 🧮 EJEMPLO COMPLETO: BMW X5 9853MKL

### **DATOS DE ENTRADA:**

```
modelo: X5 xDrive30d
precioNuevo: 86.799€
precioActual: 69.990€
km: 21.068
año: 2023
```

### **CÁLCULO PASO A PASO:**

```
1️⃣ Gama = ALTA ✓

2️⃣ Equipamiento = BASICO ✓ (86.799€ < 95.000€)

3️⃣ Buscar competencia:
   - Total: 48 vehículos
   - Sin Quadis/Munich: 47
   - Equip similar (76k-96k nuevo): ~15 vehículos

4️⃣ Precio medio competencia (equipamiento similar):
   precioMedio = (56.995 + 63.900 + 65.500 + 69.900 + ...) / n
   precioMedio ≈ 66.000€

5️⃣ KM medio competencia:
   kmMedio ≈ 45.000 km

6️⃣ Ajuste por KM (gama ALTA = 0.20€/km):
   diferenciaKm = 21.068 - 45.000 = -23.932 km
   ajuste = -23.932 × 0.20€ = -4.786€
   
   Interpretación: Tienes 24k km MENOS
   Tu precio puede ser +4.786€ mayor

7️⃣ Precio recomendado BASE:
   precioRecomendado = 66.000€ - (-4.786€)
                     = 66.000€ + 4.786€
                     = 70.786€
   
   ❌ PROBLEMA: Recomienda SUBIR precio!

8️⃣ Aplicar descuento mínimo (si hay estancados):
   (Por ahora no tenemos datos completos)

9️⃣ Aplicar límites (gama ALTA + BASICO):
   límiteInferior = 69.990€ × 0.65 = 45.494€
   límiteSuperior = 66.000€ × 1.1 = 72.600€
   
   70.786€ > 72.600€? NO
   70.786€ < 45.494€? NO
   
   precioFinal = 70.786€

🔟 Descuento resultante:
   ((86.799 - 70.786) / 86.799) × 100 = 18,45%
```

---

## 🚨 **PROBLEMA DETECTADO**

El cálculo actual **NO funciona correctamente** porque:

1. ❌ Calcula precio medio de competidores MEJOR equipados
2. ❌ Ajusta HACIA ARRIBA por KM bajos
3. ❌ Recomienda precio SIMILAR o MAYOR al actual
4. ❌ NO considera que equipamiento básico en gama alta necesita DESCUENTO BRUTAL

---

## ✅ **FÓRMULA CORRECTA (La que debería usar)**

### **Para Gama Alta + Equipamiento Básico:**

```javascript
// Método 1: Precio del competidor que te GANA
competidorClave = encontrarMejorCompetidor({
  criterio: 'equipamiento MEJOR + precio MENOR + características aceptables'
})

// Hispamovil: 65.500€, 95k€ nuevo (MEDIO), 28.850 km, 2022
precioObjetivo = competidorClave.precio - margenParaGanar

// Para ganar a Hispamovil:
precioObjetivo = 65.500€ - 1.500€ = 64.000€


// Método 2: Descuento mínimo del mercado + ajuste
descuentoPromedioComparables = 26,74%  // De equipamiento similar
descuentoMinimoNecesario = descuentoPromedioComparables + 3%
                         = 26,74% + 3%
                         = 29,74%

precioObjetivo = precioNuevo × (1 - descuentoMinimo)
               = 86.799€ × (1 - 0.2974)
               = 86.799€ × 0.7026
               = 60.984€

// Ajustar por KM excepcionales (+2k€)
precioObjetivo = 60.984€ + 2.000€ = 62.984€


// Método 3: Precio mínimo de básicos + ajuste KM
precioMinimoPatitosFeos = 56.995€  // Movilnorte
kmDiferencia = 85.989 - 21.068 = 64.921 km (tienes MENOS)
ajusteKm = (64.921 / 10.000) × 2.000€ = 12.984€

precioObjetivo = 56.995€ + 12.984€ = 69.979€

❌ PROBLEMA: Este método da precio similar al actual!
```

---

## 🎯 **FÓRMULA CORRECTA DEFINITIVA**

Para **Gama Alta + Equipamiento Básico**, usar:

```javascript
// PASO A: Segmentar competencia por equipamiento
competidoresBasicos = precioNuevo < 90k€
competidoresMedios = precioNuevo 90k-100k€
competidoresPremium = precioNuevo > 100k€

// PASO B: Encontrar el competidor MEDIO más barato
competidorMedioMasBarato = min(competidoresMedios.precio)
// Hispamovil: 65.500€

// PASO C: Precio objetivo para GANAR
precioObjetivo = competidorMedioMasBarato - (1.000€ a 2.000€)
// = 65.500€ - 1.500€
// = 64.000€

// PASO D: Validar descuento resultante
descuentoFinal = ((86.799 - 64.000) / 86.799) × 100 = 26,25%

// PASO E: Comparar con básicos del mercado
if (precioObjetivo < precioMinimoBasicos) {
  // Eres más barato que TODOS
  esperanzaVenta = '7-15 días'
} else if (precioObjetivo < competidorMedioMasBarato) {
  // Eres más barato que MEDIOS (tu objetivo)
  esperanzaVenta = '15-30 días'
} else {
  // NO eres competitivo
  esperanzaVenta = '45-60+ días'
}
```

---

## 📊 **PESOS Y PRIORIDADES**

### **Peso 1: EQUIPAMIENTO (40% del valor)**

```
Equipamiento MEJOR vale más que:
- 1 año de diferencia (vale 1.000€)
- 10.000 km de diferencia (vale 2.000€ en gama alta)
- 5% más de descuento

Cliente piensa:
"Por 5.000€ más tengo 10.000€ de extras → LO PAGO"
```

### **Peso 2: PRECIO ABSOLUTO (30% del valor)**

```
En gama alta, diferencias de 5-10k€ son ACEPTABLES
si el equipamiento lo justifica.

Pero diferencias >15k€ ya son demasiado.
```

### **Peso 3: DESCUENTO % (20% del valor)**

```
Descuento alto = sensación de "buena compra"
Pero NO compensa equipamiento pobre.

Cliente NO piensa:
"Este básico tiene 30% descuento, lo compro"

Cliente SÍ piensa:
"Este premium tiene 30% descuento, LO COMPRO"
```

### **Peso 4: KM (10% del valor)**

```
KM bajos en gama alta:
- 10k km menos = +2.000€ valor
- 20k km menos = +4.000€ valor
- 30k km menos = +6.000€ valor

Pero NO compensa 10.000€ de diferencia en equipamiento
```

---

## ✅ **APLICACIÓN CORRECTA A TU X5**

### **Datos:**
```
Gama: ALTA
Equipamiento: BÁSICO (86.799€)
KM: 21.068
Año: 2023
```

### **Competidor que te GANA:**
```
Hispamovil 2022:
- Precio: 65.500€
- Equip: MEDIO (95.455€ = +9.000€ extras)
- KM: 28.850 (+7.782 km)
- Año: 2022 (-1 año)
```

### **Cálculo de tu precio:**

```
MÉTODO CORRECTO:

Precio Hispamovil:         65.500€
Equipamiento (ellos mejor): -2.000€  (debes ser más barato)
Año (tú mejor):            +1.000€  (tú 1 año más nuevo)
KM (tú mejor):             +1.500€  (7.782 km menos × 0.20€)

PRECIO OBJETIVO = 65.500€ - 2.000€ + 1.000€ + 1.500€
                = 66.000€

PERO cliente elegirá Hispamovil si precios similares
Por tanto: -2.000€ adicional

PRECIO FINAL = 64.000€
```

---

## 🔥 **POR QUÉ 69.990€ NO FUNCIONA**

```
Tu descuento:          17% ❌
Descuento necesario:   26-30% ✓

Competidores premium (109k nuevo):
- Descuento: 30%
- Generan DESEO
- Cliente los prefiere

TÚ (86k nuevo):
- Descuento: 17%
- NO generas deseo
- Cliente te ignora

SOLUCIÓN: Descuento >26% mínimo
         = Precio <64.000€
```

---

**El sistema DEBE recomendar 64.000€, NO 69.990€** 

Voy a revisar el servidor - necesitas **reiniciar** para que los cambios se apliquen. ¿Quieres que lo haga? 🔧


