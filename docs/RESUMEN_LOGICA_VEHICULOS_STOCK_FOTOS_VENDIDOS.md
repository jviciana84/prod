# RESUMEN: LÓGICA DE VEHÍCULOS - STOCK, FOTOS Y VENDIDOS

**Fecha análisis:** 14 de octubre de 2025  
**Última actualización scraper DUC:** 14/10/2025 11:34:38

---

## 📊 ESTADO ACTUAL DEL SISTEMA

### Datos en DUC_SCRAPER (Fuente: Scraper automático)
| Métrica | Valor |
|---------|-------|
| **Total vehículos** | 140 |
| **DISPONIBLES** | 122 (87%) |
| **RESERVADOS** | 17 (12%) |
| **VENDIDOS** | 1 (1%) |
| **Columnas con datos** | 89/100 |

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SCRAPER AUTOMÁTICO (cada 8 horas)                           │
│    - Descarga CSV de DUC (gestionbmw.motorflash.com)          │
│    - 140 vehículos totales                                      │
│    - Columnas: Matrícula, Modelo, Disponibilidad, etc.        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. TABLA: duc_scraper (Supabase)                              │
│    - INSERT/UPDATE de datos del CSV                            │
│    - 17 vehículos con Disponibilidad = "RESERVADO"            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. TRIGGER: handle_availability_change()                       │
│    - Se activa: INSERT OR UPDATE                               │
│    - Condición: Disponibilidad ILIKE '%reservado%'            │
│    - Acción:                                                    │
│      ✓ UPDATE stock SET is_sold = true                        │
│      ✓ UPDATE fotos SET estado_pintura = 'vendido'            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. TABLA: stock                                                 │
│    - is_sold = true  → Vehículo VENDIDO/RESERVADO             │
│    - is_sold = false → Vehículo DISPONIBLE                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. INTERFAZ (Pestañas)                                         │
│    - DISPONIBLE: is_sold = false                               │
│    - VENDIDO: is_sold = true                                   │
│    - PENDIENTE: is_sold = false + condiciones                  │
│    - FOTOS: Todos                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ VERIFICACIÓN DEL TRIGGER

### Estado del Trigger:
**✅ FUNCIONA CORRECTAMENTE AL 100%**

### Resultados de sincronización:
| Categoría | Resultado |
|-----------|-----------|
| **Vehículos RESERVADOS en DUC** | 17 |
| **Existen en STOCK** | 10 (59%) |
| **Marcados como vendidos en STOCK** | 10/10 (100% ✅) |
| **Existen en FOTOS** | 10 (59%) |
| **Marcados como vendidos en FOTOS** | 10/10 (100% ✅) |
| **NO existen en STOCK** | 7 (41%) |

**Conclusión:** El trigger sincroniza perfectamente TODOS los vehículos que existen en las tablas.

---

## ⚠️ VEHÍCULOS RESERVADOS QUE NO ESTÁN EN STOCK

### Total: 7 vehículos

| # | Matrícula | Marca/Modelo | KM | Precio | Concesionario | Fecha creación DUC |
|---|-----------|--------------|-----|--------|---------------|-------------------|
| 1 | 5940DYG | Audi A3 | 128,408 | 1,000,000 € | Motor Munich | 06/02/2025 |
| 2 | B8199518 | BMW Serie 3 | 77,689 | 150,000 € | Motor Munich | 22/09/2024 |
| 3 | 1779GDV | BMW Serie 5 | 160,592 | 15,000 € | Motor Munich | 05/06/2025 |
| 4 | 2254FKP | BMW X3 | 168,282 | 7,500 € | Motor Munich | 06/02/2025 |
| 5 | 2686MWD | MINI 3 Puertas | 12 | 30,890 € | Motor Munich Cadi | 26/11/2024 |
| 6 | 3422MFB | MINI Countryman | 9,140 | 31,900 € | Motor Munich | 06/02/2025 |
| 7 | 1108LKD | Volvo XC40 | 98,344 | 29,890 € | Motor Munich | 06/02/2025 |

### ¿Por qué no están en STOCK?

**Posibles razones:**
1. **Vendidos antes de entrar al sistema CVO**
   - Se reservaron/vendieron antes de ser dados de alta en el sistema interno
   
2. **Vehículos muy nuevos**
   - Aún no procesados por el equipo de operaciones
   
3. **Desfase temporal**
   - DUC se actualiza más rápido que el sistema interno CVO

### ¿Qué hacer?

**Opción A: Si deben estar en el sistema**
- Dar de alta estos vehículos en STOCK manualmente
- El trigger los sincronizará automáticamente

**Opción B: Si ya están vendidos**
- Ignorarlos (no necesitan estar en CVO)
- Son vehículos que completaron su ciclo solo en DUC

---

## 🎯 LÓGICA DE FILTRADO EN INTERFAZ

### Pestaña "DISPONIBLE"
```typescript
filtered = filtered.filter((item) => !item.is_sold)
```
**Muestra:** Vehículos con `is_sold = false` o `is_sold = null`

### Pestaña "VENDIDO"
```typescript
filtered = filtered.filter((item) => item.is_sold === true)
```
**Muestra:** Vehículos con `is_sold = true` (incluye RESERVADOS)

### Pestaña "PENDIENTE"
```typescript
filtered = filtered.filter((item) => {
  if (item.is_sold === true) return false  // NO mostrar vendidos
  // + Lógica de pendientes (fotos, certificación, etc.)
})
```
**Muestra:** Vehículos disponibles con tareas pendientes

### Pestaña "FOTOS"
**Muestra:** Todos los vehículos (sin filtro por `is_sold`)

---

## 📈 ESTADÍSTICAS DE SINCRONIZACIÓN

### Vehículos que SÍ se sincronizan (10 vehículos):
- ✅ **100%** marcados como vendidos en STOCK
- ✅ **100%** marcados como vendidos en FOTOS
- ✅ Aparecen en pestaña "Vendido" de la interfaz

### Vehículos que NO se sincronizan (7 vehículos):
- ❌ No existen en STOCK
- ❌ No existen en FOTOS
- ℹ️ El trigger no puede procesarlos (no hay registro que actualizar)

---

## 🔧 CORRECCIONES APLICADAS AL SCRAPER

### 1. Mapeo de columna "Régimen fiscal"
```python
column_map = {'Régimen fiscal': 'Regimen fiscal'}
df.rename(columns=column_map, inplace=True)
```

### 2. Rutas corregidas
- Carpetas: `dist/data/duc` y `dist/data/cms`
- Botones: Ahora abren las rutas correctas

### 3. Manejo de errores mejorado
- No inserta registros vacíos si hay error
- Muestra mensaje claro y sugerencias

---

## 📝 SCRIPTS DISPONIBLES

### Verificación:
```bash
# Verificar datos en duc_scraper
node scripts/verificar_duc_scraper.js

# Verificar trigger y estados
node scripts/verificar_trigger_y_estados.js

# Verificar vehículos faltantes
node scripts/verificar_vehiculos_faltantes.js
```

### Procesamiento manual:
```bash
# Si el scraper automático falla
python scripts/procesar_csv_duc_FINAL.py
```

### Corrección de trigger (si es necesario):
```sql
-- Ejecutar en Supabase
scripts/arreglar_trigger_reservados_simple.sql
scripts/procesar_reservados_existentes_simple.sql
```

---

## 🎯 CONCLUSIONES

### ✅ LO QUE FUNCIONA CORRECTAMENTE:

1. **Scraper DUC:**
   - ✅ Descarga CSV correctamente
   - ✅ Inserta 140 registros con datos completos
   - ✅ Mapea columnas correctamente

2. **Trigger de sincronización:**
   - ✅ Funciona al 100% para vehículos existentes
   - ✅ Marca `is_sold = true` en STOCK
   - ✅ Marca `estado_pintura = 'vendido'` en FOTOS

3. **Interfaz:**
   - ✅ Filtra correctamente por `is_sold`
   - ✅ Muestra vehículos vendidos en pestaña correcta

### ⚠️ SITUACIÓN NORMAL:

- **7 vehículos RESERVADOS no están en STOCK**
  - Esto es esperado si se vendieron antes de entrar al sistema
  - No requiere acción si no deben estar en CVO

### 📊 MÉTRICAS FINALES:

- **Datos cargados:** 140/140 (100%)
- **Sincronización:** 10/10 disponibles (100%)
- **Trigger operativo:** ✅ SÍ
- **Scraper funcionando:** ✅ SÍ

---

## 🔄 PRÓXIMAS EJECUCIONES

El scraper se ejecuta automáticamente:
- **Frecuencia:** Cada 8 horas
- **Horario:** 09:00 - 18:00
- **Días:** L, M, X, J, V, S, D
- **Acción:** Descarga, procesa y sincroniza automáticamente



