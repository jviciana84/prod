# DOCUMENTACIÓN: LÓGICA DEL SISTEMA DE VEHÍCULOS RESERVADOS

## 📋 RESUMEN DEL PROBLEMA

**Problema**: Los coches marcados como "RESERVADO" en el CSV del scraper aparecen como "disponible" y "pendiente" en la tabla stock.

**Causa raíz**: El trigger de sincronización no funciona correctamente para vehículos que se insertan ya marcados como "RESERVADO".

---

## 🔄 FLUJO DE DATOS

### 1. SCRAPER → CSV → DUC_SCRAPER
```
Scraper automático → Descarga CSV → API /api/import-csv → Tabla duc_scraper
```

### 2. DUC_SCRAPER → STOCK (SINCRONIZACIÓN)
```
duc_scraper → Trigger → stock (is_sold = true) + fotos (estado_pintura = 'vendido')
```

### 3. STOCK → INTERFAZ
```
stock (is_sold = true) → Aparece en pestaña "Vendido"
stock (is_sold = false/null) → Aparece en pestañas "Disponible", "Pendiente", etc.
```

---

## 🚨 PROBLEMAS IDENTIFICADOS

### Problema 1: Trigger solo funciona en UPDATE
- **Situación**: Trigger configurado solo para `AFTER UPDATE`
- **Problema**: Vehículos que se insertan ya como "RESERVADO" no se procesan
- **Solución**: Cambiar a `AFTER INSERT OR UPDATE`

### Problema 2: Vehículos no existen en stock/fotos
- **Situación**: 39 vehículos reservados no están en stock
- **Causa**: Vehículos que aparecen en CSV pero nunca se procesaron en el sistema
- **Solución**: Verificar por qué no están en stock

### Problema 3: Diferencia en matrículas
- **Situación**: Posibles diferencias de formato entre CSV y tablas
- **Solución**: Verificar formato de matrículas

---

## 🛠️ SCRIPTS CREADOS

### Scripts de Verificación
1. `verificar_estado_actual_reservados.sql` - Estado inicial
2. `verificar_vehiculos_faltantes.sql` - Vehículos que no existen en stock/fotos
3. `verificar_solucion_reservados.sql` - Verificación final

### Scripts de Corrección
1. `arreglar_trigger_reservados_simple.sql` - Arreglar trigger
2. `procesar_reservados_existentes_simple.sql` - Procesar vehículos existentes

---

## 📊 ESTRUCTURA DE TABLAS

### Tabla: duc_scraper
```sql
- "Matrícula" (VARCHAR) - Matrícula del vehículo
- "Disponibilidad" (VARCHAR) - "RESERVADO", "Disponible", etc.
- "Modelo" (VARCHAR) - Modelo del vehículo
- "Concesionario" (VARCHAR) - Concesionario
- last_seen_date (TIMESTAMP) - Última vez visto
```

### Tabla: stock
```sql
- license_plate (VARCHAR) - Matrícula del vehículo
- is_sold (BOOLEAN) - true = vendido, false/null = disponible
- paint_status (VARCHAR) - Estado de pintura
- body_status (VARCHAR) - Estado de carrocería
- mechanical_status (VARCHAR) - Estado mecánico
```

### Tabla: fotos
```sql
- license_plate (VARCHAR) - Matrícula del vehículo
- estado_pintura (VARCHAR) - "vendido", "apto", "no_apto", etc.
- photos_completed (BOOLEAN) - Fotos completadas
```

---

## 🔧 TRIGGER ACTUAL

### Función: handle_availability_change()
```sql
-- Se activa cuando: INSERT OR UPDATE en duc_scraper
-- Condición: NEW."Disponibilidad" ILIKE '%reservado%'

-- Acciones:
1. UPDATE stock SET is_sold = true WHERE license_plate = NEW."Matrícula"
2. UPDATE fotos SET estado_pintura = 'vendido' WHERE license_plate = NEW."Matrícula"
```

---

## 🎯 LÓGICA DE FILTRADO EN INTERFAZ

### Pestaña "Disponible"
```typescript
filtered = filtered.filter((item) => !item.is_sold)
```

### Pestaña "Vendido"
```typescript
filtered = filtered.filter((item) => item.is_sold === true)
```

### Pestaña "Pendiente"
```typescript
filtered = filtered.filter((item) => {
  if (item.is_sold === true) return false  // NO mostrar vendidos
  // Resto de lógica de pendientes...
})
```

---

## 📈 ESTADÍSTICAS ACTUALES

### Resultados del procesamiento:
- **60 vehículos reservados** en CSV
- **21 marcados como vendidos** en stock
- **17 marcados como vendidos** en fotos

### Vehículos con problemas:
- **39 vehículos** (60 - 21) no están en stock
- **43 vehículos** (60 - 17) no están en fotos

---

## 🔍 PRÓXIMOS PASOS

### 1. Ejecutar verificación de vehículos faltantes
```sql
-- Ejecutar: verificar_vehiculos_faltantes.sql
-- Objetivo: Identificar exactamente cuáles vehículos no existen en stock/fotos
```

### 2. Analizar por qué no están en stock
- ¿Son vehículos muy recientes?
- ¿Hay diferencias en formato de matrículas?
- ¿Son vehículos que nunca se procesaron?

### 3. Decidir estrategia
- **Opción A**: Crear registros en stock para vehículos faltantes
- **Opción B**: Ignorar vehículos que no están en stock
- **Opción C**: Investigar por qué no están en stock

---

## 📝 NOTAS IMPORTANTES

### ✅ Lo que SÍ funciona:
- Trigger funciona para vehículos que cambian de "Disponible" a "Reservado"
- Interfaz filtra correctamente por `is_sold`
- Scripts procesan vehículos existentes correctamente

### ❌ Lo que NO funciona:
- Trigger no se activa para INSERT de vehículos ya reservados
- Vehículos que no existen en stock no se pueden marcar como vendidos

### 🔄 Estado actual:
- **Trigger corregido** para INSERT y UPDATE
- **21 vehículos procesados** correctamente
- **39 vehículos pendientes** de análisis

---

## 🎯 OBJETIVO FINAL

**Meta**: Todos los vehículos marcados como "RESERVADO" en duc_scraper deben aparecer en la pestaña "Vendido" de la interfaz.

**Criterio de éxito**: 
- `duc_scraper."Disponibilidad" = 'RESERVADO'` 
- → `stock.is_sold = true` 
- → Aparece en pestaña "Vendido" 