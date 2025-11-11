# 🔧 FIX CRÍTICO: Precio Recomendado 9853MKL

## 🐛 PROBLEMA
El sistema recomendaba **71.000€** cuando debería recomendar **~63.000€-64.000€**.

---

## ✅ SOLUCIONES APLICADAS

### **1. Usar Precio MÍNIMO (no promedio) para Gama Alta + Básico**

**Antes:**
```typescript
precioMedioCompetencia = promedio(todos los precios)
```

**Ahora:**
```typescript
// Para gama alta + básico: usar percentil 25 (más barato)
if (gama === 'alta' && equipamiento === 'basico') {
  precioMedioCompetencia = precios[percentil25] // 25% más barato
} else {
  precioMedioCompetencia = promedio // Lógica normal
}
```

**Razón:** El promedio incluye coches muy equipados (109k€ nuevo → 72k€ venta) que inflan el precio. Necesitamos comparar con los MÁS BARATOS.

---

### **2. Filtro Adicional por Precio de Venta**

**Agregado:**
```typescript
// Para gama alta + básico: filtrar también por precio de venta
if (gama === 'alta' && equipamiento === 'basico') {
  // Solo incluir coches con precio ±5k€ del nuestro
  // Evita comparar con coches bien equipados (72k€)
  competidoresComparables = filtrar(precioVenta <= nuestroPrecio + 5k)
}
```

**Razón:** Un coche puede tener precio nuevo similar (±10k€) pero precio de venta mucho más alto (72k€ vs 69k€). No son comparables.

---

### **3. Lógica Especial para Gama Alta + Básico**

**Antes:**
```typescript
precioRecomendado = precioMedio - ajustePorKm
// Si medio = 66k€, ajuste = -4.8k€ → 70.8k€ ❌
```

**Ahora:**
```typescript
if (gama === 'alta' && equipamiento === 'basico') {
  precioMinimo = min(preciosComparables) // 63.000€
  
  if (tenemosMenosKM) {
    // Podemos estar casi igual al mínimo
    precioRecomendado = precioMinimo * 0.99 // -1% = 62.370€
  } else {
    // Debemos estar por debajo
    precioRecomendado = precioMinimo - ajustePorKm - 3%
  }
  
  // SIEMPRE por debajo del mínimo
  if (precioRecomendado >= precioMinimo) {
    precioRecomendado = precioMinimo * 0.97 // -3% del mínimo
  }
}
```

**Razón:** Para gama alta + básico, DEBES ser el MÁS BARATO, independientemente de los KM.

---

## 📊 EJEMPLO PARA 9853MKL

### **Datos:**
- Precio actual: **69.990€**
- Precio nuevo: **86.799€**
- Gama: **ALTA** (X5)
- Equipamiento: **BÁSICO** (86k€ vs 105k€ base)
- KM: **21.000 km** (vs 45.000 km medio)

### **Proceso:**
1. ✅ Filtra por equipamiento: 76k-96k€ nuevo
2. ✅ Filtra por precio de venta: ≤74.990€ (±5k€)
3. ✅ Encuentra ~10-15 comparables (básicos)
4. ✅ Precio mínimo: **63.000€**
5. ✅ Percentil 25: **63.500€**
6. ✅ Usa percentil 25 como referencia
7. ✅ Tenemos menos KM: ajuste -1% = **62.865€**
8. ✅ **PRECIO RECOMENDADO: ~63.000€** ✅

---

## 🎯 CAMBIOS EN EL CÓDIGO

### **Archivo:** `app/api/comparador/analisis/route.ts`

1. **Líneas 660-678:** Cálculo de precio medio usando percentil 25 para gama alta + básico
2. **Líneas 654-667:** Filtro adicional por precio de venta para gama alta + básico
3. **Líneas 757-788:** Lógica especial de pricing para gama alta + básico

---

## 🚀 PRÓXIMO PASO

**REINICIA el servidor:**
```bash
npm run dev
```

**Luego prueba el comparador con 9853MKL. Deberías ver:**
- ✅ Precio recomendado: **~63.000€** (NO 71.000€)
- ✅ Advertencia: "⚠️ Gama Alta con equipamiento básico"
- ✅ Competidores comparables: ~10-15 (básicos similares)
- ✅ Precio mínimo de competencia: ~63.000€

---

**Estado:** ✅ Código corregido  
**Pendiente:** Reiniciar servidor y probar



