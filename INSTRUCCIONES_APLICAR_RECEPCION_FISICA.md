# 🚀 INSTRUCCIONES: APLICAR SISTEMA DE RECEPCIÓN FÍSICA

## 📋 ARCHIVOS CREADOS

### Migraciones y Triggers (SQL):
1. ✅ `migrations/add_physical_reception_and_availability.sql` - Columnas nuevas
2. ✅ `triggers/sync_duc_complete_system.sql` - 3 triggers automáticos

### APIs (TypeScript):
3. ✅ `app/api/stock/toggle-availability/route.ts` - Toggle disponibilidad stock
4. ✅ `app/api/fotos/toggle-availability/route.ts` - Toggle disponibilidad fotos

### Utilidades (TypeScript):
5. ✅ `lib/utils/days-calculator.ts` - Funciones de cálculo de días

### Documentación:
6. ✅ `PLAN_IMPLEMENTACION_STOCK_FINAL.md` - Plan completo
7. ✅ `PROPUESTA_HIBRIDA_STOCK.md` - Propuesta híbrida
8. ✅ Este archivo - Instrucciones

---

## 🔧 PASO A PASO

### PASO 1: Ejecutar Migraciones en Supabase

1. **Abre Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/wpjmimbscfsdzcwuwctk/sql/new
   ```

2. **Ejecuta PRIMERO** (migración):
   - Abre: `migrations/add_physical_reception_and_availability.sql`
   - Copia TODO el contenido
   - Pega en SQL Editor
   - Click en "Run"
   - Espera mensaje: ✅ "Migración completada exitosamente"

3. **Ejecuta SEGUNDO** (triggers):
   - Abre: `triggers/sync_duc_complete_system.sql`
   - Copia TODO el contenido
   - Pega en SQL Editor
   - Click en "Run"
   - Espera mensaje: ✅ "Triggers creados exitosamente"

---

### PASO 2: Verificar Instalación

Ejecuta en terminal:
```bash
node scripts/aplicar_sistema_recepcion_fisica.js
```

Deberías ver:
```
✅ Columnas en stock: OK
✅ Columnas en fotos: OK
✅ Está en STOCK: (datos del vehículo de prueba)
```

---

### PASO 3: Commit y Push

```bash
git add .
git commit -m "Sistema de recepción física y disponibilidad automática - Nuevas columnas: physical_reception_date, is_available - Triggers: DUC → stock/fotos con detección de fotos - Backdating de 2 días cuando fotos completadas - Toggle disponibilidad en stock y fotos"
git push
```

---

## 🎯 CÓMO FUNCIONA

### Caso 1: Vehículo NUEVO en DUC CON fotos

```
1. Scraper actualiza duc_scraper
2. Trigger detecta "URL foto 1" con datos
3. Crea automáticamente:
   - nuevas_entradas (is_received = TRUE, reception_date = -2 días)
   - stock (physical_reception_date = -2 días, is_available = TRUE)
   - fotos (photos_completed = TRUE, physical_reception_date = -2 días)
4. Contador empieza desde hace 2 días
5. Aparece en fotos completadas
```

### Caso 2: Vehículo NUEVO en DUC SIN fotos

```
1. Scraper actualiza duc_scraper
2. Trigger NO detecta fotos
3. Crea automáticamente:
   - nuevas_entradas (is_received = FALSE)
   - stock (physical_reception_date = NULL, is_available = FALSE)
   - fotos (photos_completed = FALSE, is_available = FALSE)
4. NO cuenta días (aún no llegó)
5. NO aparece en fotos pendientes
```

### Caso 3: Usuario marca "Recibido" manualmente

```
1. Usuario en nuevas_entradas marca "Recibido"
2. Trigger actualiza:
   - stock.physical_reception_date = HOY
   - stock.is_available = TRUE
   - fotos.physical_reception_date = HOY
   - fotos.is_available = TRUE
3. Contador empieza desde HOY
4. Aparece en fotos pendientes
```

### Caso 4: Fotógrafo completa fotos (PREVALECE)

```
1. Vehículo estaba pendiente
2. Fotógrafo marca photos_completed = TRUE
3. Trigger detecta y actualiza:
   - fotos.physical_reception_date = -2 días (PREVALECE)
   - stock.physical_reception_date = -2 días
   - nuevas_entradas.is_received = TRUE, reception_date = -2 días
4. SOBRESCRIBE cualquier fecha manual anterior
5. Contador muestra desde hace 2 días
```

### Caso 5: Vehículo no disponible temporalmente

```
1. Usuario clickea botón "No disponible"
2. API actualiza:
   - stock.is_available = FALSE
   - fotos.is_available = FALSE
3. Vehículo desaparece de pendientes
4. Contador sigue corriendo pero no se muestra
5. Puede volver a marcarse disponible con otro click
```

---

## 🔍 VERIFICACIÓN POST-INSTALACIÓN

### Consulta 1: Ver vehículos con recepción física
```sql
SELECT 
  license_plate,
  model,
  physical_reception_date,
  is_available,
  auto_marked_received,
  EXTRACT(DAY FROM (NOW() - physical_reception_date)) as dias_desde_llegada
FROM stock
WHERE physical_reception_date IS NOT NULL
ORDER BY physical_reception_date DESC
LIMIT 10;
```

### Consulta 2: Ver fotos pendientes disponibles
```sql
SELECT 
  license_plate,
  model,
  estado_pintura,
  physical_reception_date,
  is_available,
  photos_completed,
  EXTRACT(DAY FROM (NOW() - physical_reception_date)) as dias_pendiente
FROM fotos
WHERE estado_pintura = 'pendiente'
  AND is_available = TRUE
  AND physical_reception_date IS NOT NULL
ORDER BY physical_reception_date ASC;
```

### Consulta 3: Ver vehículos en tránsito
```sql
SELECT 
  license_plate,
  model,
  is_available,
  physical_reception_date
FROM stock
WHERE physical_reception_date IS NULL
  OR is_available = FALSE
ORDER BY created_at DESC;
```

---

## ⚠️ CONSIDERACIONES

### Datos históricos:
- Se marcan automáticamente como disponibles
- `physical_reception_date` = su `reception_date` o `created_at`
- Solo NUEVOS vehículos usan la lógica de backdating

### Prevalencia de fechas:
1. **Primera prioridad:** Fotos completadas (automático -2 días)
2. **Segunda prioridad:** Manual en nuevas_entradas (hoy)
3. **Última prioridad:** NULL (aún no llegó)

### Toggle disponibilidad:
- Puede cambiar libremente entre TRUE/FALSE
- NO afecta physical_reception_date (fecha permanece)
- Solo controla visibilidad en pendientes

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE ESTO

1. **Actualizar componentes** (Fase 3):
   - `components/vehicles/stock-table.tsx` - Columna disponibilidad + botón
   - `components/fotos/fotos-table.tsx` - Botón disponibilidad
   - Usar `days-calculator.ts` para mostrar días

2. **Actualizar filtros**:
   - Filtrar por `is_available = TRUE` en pendientes
   - Calcular días desde `physical_reception_date`

3. **Testing completo**:
   - Probar cada caso de uso
   - Verificar contadores
   - Validar backdating

---

## 📊 IMPACTO ESPERADO

**Antes:**
- 76 en DUC
- Solo 66 en stock (10 perdidos/sin marcar)
- DEMOS no aparecen en fotos pendientes

**Después:**
- 76 en DUC
- 76 en stock (todos sincronizados automáticamente)
- DEMOS aparecen correctamente con -2 días
- Contador de días preciso
- Control manual de disponibilidad

---

✅ **Todo listo para ejecutar PASO 1**

