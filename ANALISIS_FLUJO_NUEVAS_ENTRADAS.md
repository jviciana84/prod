# 📊 ANÁLISIS COMPLETO: Flujo de Vehículos desde DUC hasta Fotos

**Fecha:** 29 Octubre 2025  
**Consulta:** ¿Por qué no hay vehículos en nuevas entradas?

---

## 🎯 RESUMEN EJECUTIVO

✅ **EL SISTEMA ESTÁ FUNCIONANDO CORRECTAMENTE**

**Estado actual:**
- 📦 **80 vehículos** en DUC (origen)
- 🚚 **198 vehículos** en nuevas_entradas
  - ✅ 193 ya recibidos (pasaron a stock/fotos)
  - ⏳ 5 pendientes de recibir
- 📋 **80 vehículos** en stock
- 📸 **222 vehículos** en fotos

**Conclusión:** Los vehículos SÍ están llegando a nuevas_entradas, pero la mayoría ya fueron procesados y están en stock/fotos.

---

## 🔄 FLUJO COMPLETO: Cómo llega un coche de DUC a Fotos

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: SCRAPER DUC (cada 8 horas)                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
    🤖 Scraper descarga CSV de DUC
    📥 Inserta/actualiza en duc_scraper
    
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: TRIGGER AUTOMÁTICO (sync_duc_to_all_tables)        │
└─────────────────────────────────────────────────────────────┘
                           ↓
    ⚡ Detecta si tiene FOTOS REALES (foto 9 o superior)
    
    ¿Tiene foto 9, 10, 11, 12, 13, 14 o 15?
    
    ┌─────────────┐                    ┌─────────────┐
    │   SÍ        │                    │   NO        │
    └─────────────┘                    └─────────────┘
         ↓                                  ↓
    Crea/actualiza:                    Crea/actualiza:
    • nuevas_entradas                  • nuevas_entradas
      is_received = TRUE                 is_received = FALSE
      reception_date = -2 días           reception_date = NULL
    • stock                            • stock
      physical_reception_date = -2d      physical_reception_date = NULL
      is_available = TRUE                is_available = FALSE
    • fotos                            • fotos
      photos_completed = TRUE            estado_pintura = 'pendiente'
      estado_pintura = 'completado'      photos_completed = FALSE
         ↓                                  ↓
    ✅ AUTOMÁTICO                       ⏳ ESPERA ACCIÓN MANUAL
    Ya en stock y fotos                Visible en "nuevas-entradas"

┌─────────────────────────────────────────────────────────────┐
│ PASO 3: ACCIÓN MANUAL (si no tiene fotos)                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
    👤 Usuario va a /dashboard/nuevas-entradas
    🔘 Marca vehículo como "Recibido"
    
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: TRIGGER MANUAL (sync_received_status)              │
└─────────────────────────────────────────────────────────────┘
                           ↓
    ⚡ is_received cambia a TRUE
    📥 Actualiza stock: is_available = TRUE
    📥 Actualiza fotos: estado_pintura = 'pendiente'
         ↓
    ✅ Ya en stock y fotos pendientes

┌─────────────────────────────────────────────────────────────┐
│ PASO 5: VISIBLE EN FOTOGRAFÍA                               │
└─────────────────────────────────────────────────────────────┘
    📍 Aparece en /dashboard/photos
    📸 Fotógrafo puede asignar y completar
```

---

## 📋 ESTADO ACTUAL (29 Oct 2025)

### Vehículos en DUC_SCRAPER: **80 total**

**Ejemplos:**
| Matrícula | Modelo | Disponibilidad | Fotos 9+ | Estado |
|-----------|--------|----------------|----------|--------|
| 3805MBL | i3 | DISPONIBLE | ❌ No | Sin fotos |
| 9488MZZ | i4 | DISPONIBLE | ✅ Sí | Con fotos |
| 2801MYZ | i4 | DISPONIBLE | ✅ Sí | Con fotos |
| 2941MVJ | i7 | DISPONIBLE | ✅ Sí | Con fotos |
| 1218LXC | iX | DISPONIBLE | ✅ Sí | Con fotos |

### Vehículos en NUEVAS_ENTRADAS: **198 total**

**Distribución:**
- ✅ **193 recibidos** → Ya pasaron a stock/fotos
- ⏳ **5 pendientes** → Esperando ser marcados como recibidos

### Los 5 Vehículos Pendientes (NO recibidos):

#### 1. **8307LMS** - Serie 3 320i Touring
- 📅 Creado: 28/10/2025
- 🏪 Tienda: Quadis Munich
- 🔍 Estado en DUC: DISPONIBLE
- 📸 Fotos reales (9+): **NO**
- ✅ **Comportamiento correcto:** Sin fotos → espera marcado manual

#### 2. **TEST1761218776955** - Test Backdating
- 📅 Creado: 23/10/2025
- 🔍 Estado en DUC: **No encontrado** (creado manualmente)
- ✅ **Comportamiento correcto:** Creación manual → espera marcado manual

#### 3. **0508HYR** - Scudo
- 📅 Creado: 23/10/2025
- 🏪 Tienda: Quadis Munich (San Fruitós)
- 🔍 Estado en DUC: RESERVADO
- 📸 Fotos reales (9+): **NO**
- ✅ **Comportamiento correcto:** Sin fotos → espera marcado manual

#### 4. **9937KFV** - Dokker
- 📅 Creado: 23/10/2025
- 🏪 Tienda: Quadis Munich (San Fruitós)
- 🔍 Estado en DUC: RESERVADO
- 📸 Fotos reales (9+): **NO**
- ✅ **Comportamiento correcto:** Sin fotos → espera marcado manual

#### 5. **1105JKB** - Dokker
- 📅 Creado: 23/10/2025
- 🏪 Tienda: Quadis Munich (San Fruitós)
- 🔍 Estado en DUC: RESERVADO
- 📸 Fotos reales (9+): **NO**
- ✅ **Comportamiento correcto:** Sin fotos → espera marcado manual

---

## ✅ DIAGNÓSTICO FINAL

### El sistema está funcionando CORRECTAMENTE porque:

1. **Los vehículos CON fotos (9+) se marcan automáticamente como recibidos**
   - Van directamente a stock y fotos
   - NO aparecen como "pendientes" en nuevas-entradas
   - Ya están disponibles para trabajar

2. **Los vehículos SIN fotos (9+) esperan confirmación manual**
   - Aparecen en nuevas-entradas como "pendientes"
   - Usuario debe marcar "recibido" cuando lleguen físicamente
   - Esto previene trabajar con vehículos que aún no están en instalaciones

3. **Hay 193 vehículos que ya fueron recibidos**
   - Por eso "nuevas-entradas" parece "vacía"
   - En realidad tiene 198, pero 193 ya pasaron a stock/fotos
   - Solo quedan 5 pendientes de recibir

---

## 🎯 LÓGICA DE DETECCIÓN DE FOTOS

### Fotos Dummies (NO CUENTAN): Fotos 1-8
- Son fotos genéricas/placeholder de DUC
- NO indican que el vehículo tenga fotos reales

### Fotos Reales (SÍ CUENTAN): Fotos 9-15
- Son fotos reales tomadas del vehículo
- Indican que el vehículo ya está fotografiado
- Trigger detecta cualquiera de estas:
  ```sql
  v_has_photos := (
    NEW."URL foto 9" IS NOT NULL AND NEW."URL foto 9" != '' OR
    NEW."URL foto 10" IS NOT NULL AND NEW."URL foto 10" != '' OR
    NEW."URL foto 11" IS NOT NULL AND NEW."URL foto 11" != '' OR
    NEW."URL foto 12" IS NOT NULL AND NEW."URL foto 12" != '' OR
    NEW."URL foto 13" IS NOT NULL AND NEW."URL foto 13" != '' OR
    NEW."URL foto 14" IS NOT NULL AND NEW."URL foto 14" != '' OR
    NEW."URL foto 15" IS NOT NULL AND NEW."URL foto 15" != ''
  );
  ```

---

## 🚀 QUÉ HACER CON LOS 5 VEHÍCULOS PENDIENTES

### Opción 1: Marcar manualmente como recibidos
1. Ir a `/dashboard/nuevas-entradas`
2. Buscar: 8307LMS, 0508HYR, 9937KFV, 1105JKB
3. Hacer clic en "Marcar como recibido"
4. Automáticamente se crearán en stock y fotos

### Opción 2: Esperar a que tengan fotos
- Cuando DUC agregue fotos 9+ a estos vehículos
- El siguiente scrape (cada 8h) los detectará
- Se marcarán automáticamente como recibidos

### Opción 3: No hacer nada
- Si no han llegado físicamente, dejarlos como están
- Así NO aparecerán en stock ni fotos (comportamiento deseado)
- Cuando lleguen, marcarlos manualmente

---

## 📊 COMPARACIÓN DE NÚMEROS

| Tabla | Total | Explicación |
|-------|-------|-------------|
| duc_scraper | 80 | Vehículos en DUC ahora mismo |
| nuevas_entradas | 198 | Todos los vehículos históricos (desde inicio) |
| nuevas_entradas (no recibidos) | 5 | Los que esperan llegar físicamente |
| stock | 80 | Vehículos en inventario actual |
| fotos | 222 | Histórico de fotos (incluye vendidos) |

**¿Por qué nuevas_entradas (198) > stock (80)?**
- nuevas_entradas guarda TODOS los vehículos que alguna vez entraron
- Muchos ya fueron vendidos y salieron de stock
- nuevas_entradas es tabla histórica, stock es tabla de inventario actual

---

## 🔍 CONCLUSIÓN

**"¿Por qué no hay vehículos en nuevas entradas?"**

**Respuesta:** SÍ los hay (198 total, 5 pendientes), pero:

1. ✅ **193 ya fueron recibidos** → Pasaron a stock/fotos (flujo normal)
2. ⏳ **5 esperan ser recibidos** → Sin fotos 9+ → Esperan marcado manual
3. 🎯 **El flujo es automático para vehículos con fotos**
4. 👤 **El flujo es manual para vehículos sin fotos** (esto es correcto)

**El sistema trabaja como debe.** Los vehículos con fotos pasan automáticamente, los sin fotos esperan confirmación para evitar trabajar con vehículos que no han llegado físicamente.

---

## 📝 ARCHIVOS CLAVE

- **Trigger principal:** `triggers/sync_duc_complete_system.sql`
- **Página nuevas entradas:** `app/dashboard/nuevas-entradas/page.tsx`
- **API de carga:** `app/api/transport/list/route.ts`
- **Script de análisis:** `scripts/analizar_flujo_nuevas_entradas.js`

